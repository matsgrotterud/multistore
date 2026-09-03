import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATION_RESULT_CONTRACT_VERSION,
  GO_LIVE_EVIDENCE_VERSION,
  GO_LIVE_GATE_VERSION,
  canTransitionToLive,
  type GoLiveGateInputV3,
  type VerifiedLaunchEvidenceV3,
} from "./go-live-gate-v3";

const checkedAt = "2026-08-14T09:00:00.000Z";

function verified(ref: string): VerifiedLaunchEvidenceV3 {
  return {
    status: "PASS",
    evidenceRefs: [ref],
    verifiedBy: "launch-audit:test",
    verifiedAt: checkedAt,
  };
}

function passingInput(
  overrides: Partial<GoLiveGateInputV3> = {}
): GoLiveGateInputV3 {
  const input: GoLiveGateInputV3 = {
    currentLaunchStatus: "PREVIEW",
    evidenceVersion: GO_LIVE_EVIDENCE_VERSION,
    generation: {
      contractVersion: GENERATION_RESULT_CONTRACT_VERSION,
      terminalState: "READY_FOR_PREVIEW",
      productClassProfileSource: "STATIC_ONTOLOGY",
      runId: "run_v3_001",
      generatorVersion: "generator-v3.0.0",
      ontologyVersion: "product-ontology.v1",
      evaluatorVersion: "candidate-evaluator.v1",
      completedAt: checkedAt,
    },
    manualReview: {
      required: false,
      status: "NOT_REQUIRED",
      reviewedBy: null,
      reviewedAt: null,
    },
    humanApproval: {
      approved: true,
      approvalKind: "HUMAN",
      approvedBy: "admin_001",
      approvedAt: checkedAt,
    },
    catalog: {
      ...verified("catalog:run_v3_001"),
      minimumProductCount: 6,
      previewVisibleProductCount: 8,
      previewComplete: true,
    },
    relevance: {
      ...verified("relevance:run_v3_001"),
      evaluatedVisibleProductCount: 8,
      failedVisibleProductCount: 0,
      unknownVisibleProductCount: 0,
    },
    media: {
      ...verified("media:run_v3_001"),
      usableVisibleProductCount: 8,
      failedVisibleProductCount: 0,
      unknownVisibleProductCount: 0,
    },
    content: {
      ...verified("content:run_v3_001"),
      grounded: true,
      unverifiedClaimsPresent: false,
    },
    compliance: {
      ...verified("compliance:run_v3_001"),
      policyPagesPresent: true,
      requiredDisclosuresPresent: true,
      unresolvedFlagCount: 0,
    },
    domain: {
      ...verified("domain:shop.example.com"),
      hostname: "shop.example.com",
      ownershipVerified: true,
      dnsReady: true,
      tlsReady: true,
      canonicalConfigured: true,
    },
    commerce: {
      ...verified("commerce:run_v3_001"),
      checkoutReady: true,
      paymentReady: true,
      orderRoutingReady: true,
      fulfillmentReady: true,
      shippingReady: true,
      returnsReady: true,
      taxDecisionRecorded: true,
    },
  };

  return { ...input, ...overrides };
}

function reasonCodes(result: ReturnType<typeof canTransitionToLive>): string[] {
  return result.reasons.map((reason) => reason.code);
}

test("allows only a fully evidenced PREVIEW -> LIVE transition", () => {
  const result = canTransitionToLive(passingInput());

  assert.equal(result.gateVersion, GO_LIVE_GATE_VERSION);
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.allowed, true);
  assert.equal(result.shouldTransition, true);
  assert.deepEqual(result.blockedGates, []);
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.passedGates, [
    "transition",
    "v3-evidence",
    "generation",
    "manual-review",
    "human-approval",
    "catalog",
    "relevance",
    "media",
    "content",
    "compliance",
    "domain",
    "commerce",
  ]);
});

test("runtime-provisional product classes remain preview-only even with otherwise passing evidence", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    generation: {
      ...base.generation!,
      terminalState: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
      productClassProfileSource: "RUNTIME_PROVISIONAL",
    },
    manualReview: {
      required: true,
      status: "APPROVED",
      reviewedBy: "reviewer_001",
      reviewedAt: checkedAt,
    },
  });

  assert.equal(result.decision, "BLOCK");
  assert.equal(result.allowed, false);
  assert.equal(result.shouldTransition, false);
  assert.deepEqual(result.blockedGates, ["generation"]);
  assert.deepEqual(reasonCodes(result), [
    "GENERATION_PRODUCT_CLASS_PREVIEW_ONLY",
  ]);
});

test("static product classes retain the existing go-live behavior", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    generation: {
      ...base.generation!,
      productClassProfileSource: "STATIC_ONTOLOGY",
    },
  });

  assert.equal(result.decision, "ALLOW");
  assert.equal(result.allowed, true);
  assert.equal(result.shouldTransition, true);
});

test("legacy PREVIEW evidence fails closed", () => {
  const result = canTransitionToLive({
    ...passingInput(),
    evidenceVersion: null,
    generation: null,
  });

  assert.equal(result.decision, "BLOCK");
  assert.equal(result.allowed, false);
  assert.equal(result.shouldTransition, false);
  assert.deepEqual(reasonCodes(result), [
    "V3_EVIDENCE_MISSING",
    "GENERATION_EVIDENCE_MISSING",
  ]);
});

test("already LIVE is a no-op and does not demand a retroactive V3 backfill", () => {
  const result = canTransitionToLive({
    ...passingInput(),
    currentLaunchStatus: "LIVE",
    evidenceVersion: null,
    generation: null,
    catalog: null,
  });

  assert.equal(result.decision, "NO_TRANSITION");
  assert.equal(result.allowed, false);
  assert.equal(result.shouldTransition, false);
  assert.deepEqual(reasonCodes(result), ["ALREADY_LIVE_NO_TRANSITION"]);
});

test("does not permit a DRAFT -> LIVE shortcut", () => {
  const result = canTransitionToLive(
    passingInput({ currentLaunchStatus: "DRAFT" })
  );

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), ["CURRENT_STATUS_NOT_PREVIEW"]);
});

test("manual-review generation remains blocked until review is human-approved", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    generation: {
      ...base.generation!,
      terminalState: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    },
    manualReview: {
      required: true,
      status: "PENDING",
      reviewedBy: null,
      reviewedAt: null,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "MANUAL_REVIEW_PENDING",
    "MANUAL_REVIEW_METADATA_INVALID",
  ]);
});

test("approved manual-review generation can pass once every other gate passes", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    generation: {
      ...base.generation!,
      terminalState: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    },
    manualReview: {
      required: true,
      status: "APPROVED",
      reviewedBy: "reviewer_001",
      reviewedAt: checkedAt,
    },
  });

  assert.equal(result.allowed, true);
  assert.equal(result.decision, "ALLOW");
});

test("explicit human approval cannot be inferred or automated", () => {
  const result = canTransitionToLive({
    ...passingInput(),
    humanApproval: {
      approved: true,
      approvalKind: "SYSTEM",
      approvedBy: "generator-v3",
      approvedAt: checkedAt,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), ["HUMAN_APPROVAL_NOT_HUMAN"]);
});

for (const [field, status, expected] of [
  ["catalog", "FAIL", "CATALOG_FAILED"],
  ["relevance", "UNKNOWN", "RELEVANCE_UNKNOWN"],
  ["media", "REVIEW", "MEDIA_REVIEW_REQUIRED"],
  ["content", "FAIL", "CONTENT_FAILED"],
  ["compliance", "UNKNOWN", "COMPLIANCE_UNKNOWN"],
  ["domain", "FAIL", "DOMAIN_FAILED"],
  ["commerce", "UNKNOWN", "COMMERCE_UNKNOWN"],
] as const) {
  test(`${field} ${status} evidence blocks with a concrete reason`, () => {
    const base = passingInput();
    const evidence = base[field]!;
    const result = canTransitionToLive({
      ...base,
      [field]: { ...evidence, status },
    });

    assert.equal(result.allowed, false);
    assert.deepEqual(reasonCodes(result), [expected]);
  });
}

test("a PASS label without provenance is still blocked", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    relevance: {
      ...base.relevance!,
      evidenceRefs: [],
      verifiedBy: null,
      verifiedAt: null,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), ["RELEVANCE_PASS_UNVERIFIED"]);
});

test("catalog minimum and complete-preview flags are independent hard gates", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    catalog: {
      ...base.catalog!,
      minimumProductCount: 6,
      previewVisibleProductCount: 4,
      previewComplete: false,
    },
    relevance: {
      ...base.relevance!,
      evaluatedVisibleProductCount: 4,
    },
    media: {
      ...base.media!,
      usableVisibleProductCount: 4,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "CATALOG_MINIMUM_NOT_MET",
    "PREVIEW_CATALOG_INCOMPLETE",
  ]);
});

test("failed or unknown visible relevance cannot hide behind an aggregate PASS", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    relevance: {
      ...base.relevance!,
      evaluatedVisibleProductCount: 6,
      failedVisibleProductCount: 1,
      unknownVisibleProductCount: 1,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "RELEVANCE_FAILED_VISIBLE_PRODUCTS",
    "RELEVANCE_UNKNOWN_VISIBLE_PRODUCTS",
    "RELEVANCE_COVERAGE_INCOMPLETE",
  ]);
});

test("failed, unknown, or uncovered visible media cannot pass", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    media: {
      ...base.media!,
      usableVisibleProductCount: 5,
      failedVisibleProductCount: 2,
      unknownVisibleProductCount: 1,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "MEDIA_FAILED_VISIBLE_PRODUCTS",
    "MEDIA_UNKNOWN_VISIBLE_PRODUCTS",
    "MEDIA_COVERAGE_INCOMPLETE",
  ]);
});

test("domain sub-gates report every unresolved requirement", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    domain: {
      ...base.domain!,
      hostname: "localhost:3010",
      ownershipVerified: false,
      dnsReady: null,
      tlsReady: false,
      canonicalConfigured: null,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "DOMAIN_HOSTNAME_INVALID",
    "DOMAIN_OWNERSHIP_UNVERIFIED",
    "DOMAIN_DNS_NOT_READY",
    "DOMAIN_TLS_NOT_READY",
    "DOMAIN_CANONICAL_NOT_CONFIGURED",
  ]);
});

test("commerce sub-gates cannot be bypassed by aggregate PASS", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    commerce: {
      ...base.commerce!,
      checkoutReady: true,
      paymentReady: false,
      orderRoutingReady: null,
      fulfillmentReady: false,
      shippingReady: true,
      returnsReady: null,
      taxDecisionRecorded: false,
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), [
    "COMMERCE_PAYMENT_NOT_READY",
    "COMMERCE_ORDER_ROUTING_NOT_READY",
    "COMMERCE_FULFILLMENT_NOT_READY",
    "COMMERCE_RETURNS_NOT_READY",
    "COMMERCE_TAX_DECISION_MISSING",
  ]);
});

test("a failed terminal generation state blocks even when every downstream flag says PASS", () => {
  const base = passingInput();
  const result = canTransitionToLive({
    ...base,
    generation: {
      ...base.generation!,
      terminalState: "PROVIDER_FAILED",
    },
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), ["GENERATION_STATE_NOT_LAUNCHABLE"]);
});

test("missing input fails closed instead of throwing", () => {
  const result = canTransitionToLive(null);

  assert.equal(result.decision, "BLOCK");
  assert.equal(result.allowed, false);
  assert.deepEqual(reasonCodes(result), ["INPUT_MISSING"]);
});

test("reason and gate ordering is stable", () => {
  const base = passingInput();
  const input: GoLiveGateInputV3 = {
    ...base,
    evidenceVersion: null,
    humanApproval: null,
    catalog: null,
    domain: null,
    commerce: null,
  };

  const first = canTransitionToLive(input);
  const second = canTransitionToLive(input);

  assert.deepEqual(first, second);
  assert.deepEqual(first.blockedGates, [
    "v3-evidence",
    "human-approval",
    "catalog",
    "domain",
    "commerce",
  ]);
  assert.deepEqual(reasonCodes(first), [
    "V3_EVIDENCE_MISSING",
    "HUMAN_APPROVAL_MISSING",
    "CATALOG_EVIDENCE_MISSING",
    "DOMAIN_EVIDENCE_MISSING",
    "COMMERCE_EVIDENCE_MISSING",
  ]);
});
