import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCheckoutCommerceEligibility,
  parseFulfillmentModeStrict,
  type CheckoutCommerceEligibilityInput,
} from "./checkout-eligibility";

function passGate() {
  return {
    state: "PASS",
    reasonCodes: [],
    explanation: "verified",
    evidence: [],
  };
}

function reviewGate(...reasonCodes: string[]) {
  return {
    state: "REVIEW",
    reasonCodes,
    explanation: "manual review required",
    evidence: [],
  };
}

function failGate(...reasonCodes: string[]) {
  return {
    state: "FAIL",
    reasonCodes,
    explanation: "not eligible without an approved review",
    evidence: [],
  };
}

function liveEvidence(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    candidateEvaluationV1: {
      version: "candidate-evaluator.v1",
      evaluatedAt: "2026-08-25T10:00:00.000Z",
      intentVersion: "niche-intent.v1",
      productClass: "slippers",
      relevance: passGate(),
      policy: passGate(),
      supplierEvidence: passGate(),
      mediaReadiness: passGate(),
      variantReadiness: passGate(),
      priceMargin: passGate(),
      shipping: passGate(),
      riskIp: passGate(),
      previewVisibility: passGate(),
      liveCommerceEligibility: passGate(),
      ...overrides,
    },
  });
}

function eligibleInput(): CheckoutCommerceEligibilityInput {
  return {
    mode: "LIVE",
    store: {
      isActive: true,
      launchStatus: "LIVE",
      generation: {
        status: "READY_FOR_PREVIEW",
        liveCommerceAllowed: true,
        manualReviewRequired: false,
        manualReviewStatus: "NOT_REQUIRED",
        humanLaunchApproved: true,
      },
    },
    product: {
      isPublished: true,
      catalogVisible: true,
      mediaStatus: "OK",
      qualityStatus: "READY",
      supplierDataJson: liveEvidence(),
    },
    contributionMarginPercent: 25,
    minimumContributionMarginPercent: 15,
  };
}

test("fulfillment mode parsing rejects unknown values instead of coercing to manual", () => {
  for (const mode of ["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"] as const) {
    assert.equal(parseFulfillmentModeStrict(mode), mode);
  }
  assert.equal(parseFulfillmentModeStrict(""), null);
  assert.equal(parseFulfillmentModeStrict("manual"), null);
  assert.equal(parseFulfillmentModeStrict("UNKNOWN"), null);
});

test("live checkout passes only with current store, catalog, evidence and margin gates", () => {
  assert.deepEqual(evaluateCheckoutCommerceEligibility(eligibleInput()), {
    allowed: true,
    reasonCodes: [],
  });
});

test("live checkout fails closed when store commerce evidence is absent or disallows commerce", () => {
  const missing = eligibleInput();
  missing.store.generation = null;
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(missing).reasonCodes,
    ["STORE_COMMERCE_EVIDENCE_MISSING"]
  );

  const blocked = eligibleInput();
  blocked.store.generation!.liveCommerceAllowed = false;
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(blocked).reasonCodes,
    ["STORE_COMMERCE_NOT_ALLOWED"]
  );
});

test("live checkout requires every persisted candidate gate to pass", () => {
  const input = eligibleInput();
  input.product.supplierDataJson = liveEvidence({
    riskIp: {
      state: "FAIL",
      reasonCodes: ["RISK_HARD_VETO"],
      explanation: "blocked",
      evidence: [],
    },
    // A forged/inconsistent aggregate PASS must not override a failed sub-gate.
    liveCommerceEligibility: passGate(),
  });

  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(input).reasonCodes,
    ["PRODUCT_LIVE_EVIDENCE_NOT_PASS"]
  );
});

test("approved store review narrowly overlays a manual-review-only product policy", () => {
  const input = eligibleInput();
  input.store.generation = {
    status: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    liveCommerceAllowed: true,
    manualReviewRequired: true,
    manualReviewStatus: "APPROVED",
    humanLaunchApproved: true,
  };
  input.product.supplierDataJson = liveEvidence({
    policy: reviewGate("POLICY_MANUAL_REVIEW_REQUIRED"),
    liveCommerceEligibility: failGate("LIVE_COMMERCE_GATE_FAILED"),
  });

  assert.deepEqual(evaluateCheckoutCommerceEligibility(input), {
    allowed: true,
    reasonCodes: [],
  });
});

test("manual-review overlay requires approved store review and live commerce permission", () => {
  const pending = eligibleInput();
  pending.store.generation = {
    status: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    liveCommerceAllowed: true,
    manualReviewRequired: true,
    manualReviewStatus: "PENDING",
    humanLaunchApproved: true,
  };
  pending.product.supplierDataJson = liveEvidence({
    policy: reviewGate("POLICY_MANUAL_REVIEW_REQUIRED"),
    liveCommerceEligibility: failGate("LIVE_COMMERCE_GATE_FAILED"),
  });
  assert.deepEqual(evaluateCheckoutCommerceEligibility(pending).reasonCodes, [
    "STORE_MANUAL_REVIEW_NOT_APPROVED",
    "PRODUCT_LIVE_EVIDENCE_NOT_PASS",
  ]);

  const commerceBlocked = eligibleInput();
  commerceBlocked.store.generation = {
    status: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    liveCommerceAllowed: false,
    manualReviewRequired: true,
    manualReviewStatus: "APPROVED",
    humanLaunchApproved: true,
  };
  commerceBlocked.product.supplierDataJson = pending.product.supplierDataJson;
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(commerceBlocked).reasonCodes,
    ["STORE_COMMERCE_NOT_ALLOWED", "PRODUCT_LIVE_EVIDENCE_NOT_PASS"]
  );
});

test("approved review cannot overlay other policy reasons or failed product gates", () => {
  const unrelatedPolicy = eligibleInput();
  unrelatedPolicy.store.generation = {
    status: "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    liveCommerceAllowed: true,
    manualReviewRequired: true,
    manualReviewStatus: "APPROVED",
    humanLaunchApproved: true,
  };
  unrelatedPolicy.product.supplierDataJson = liveEvidence({
    policy: reviewGate("POLICY_MANUAL_REVIEW_REQUIRED", "POLICY_OTHER_REVIEW"),
    liveCommerceEligibility: failGate("LIVE_COMMERCE_GATE_FAILED"),
  });
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(unrelatedPolicy).reasonCodes,
    ["PRODUCT_LIVE_EVIDENCE_NOT_PASS"]
  );

  const lookalikePolicy = eligibleInput();
  lookalikePolicy.store.generation = unrelatedPolicy.store.generation;
  lookalikePolicy.product.supplierDataJson = liveEvidence({
    policy: reviewGate("NOT_POLICY_MANUAL_REVIEW_REQUIRED_OVERRIDE"),
    liveCommerceEligibility: failGate("LIVE_COMMERCE_GATE_FAILED"),
  });
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(lookalikePolicy).reasonCodes,
    ["PRODUCT_LIVE_EVIDENCE_NOT_PASS"]
  );

  const failedRisk = eligibleInput();
  failedRisk.store.generation = unrelatedPolicy.store.generation;
  failedRisk.product.supplierDataJson = liveEvidence({
    policy: reviewGate("POLICY_MANUAL_REVIEW_REQUIRED"),
    riskIp: failGate("RISK_HARD_VETO"),
    liveCommerceEligibility: failGate("LIVE_COMMERCE_GATE_FAILED"),
  });
  assert.deepEqual(
    evaluateCheckoutCommerceEligibility(failedRisk).reasonCodes,
    ["PRODUCT_LIVE_EVIDENCE_NOT_PASS"]
  );
});

test("missing, malformed and wrong-version product evidence all fail closed", () => {
  for (const [supplierDataJson, expected] of [
    ["{}", "PRODUCT_LIVE_EVIDENCE_MISSING"],
    ["not-json", "PRODUCT_LIVE_EVIDENCE_INVALID"],
    [liveEvidence({ version: "candidate-evaluator.future" }), "PRODUCT_LIVE_EVIDENCE_INVALID"],
  ] as const) {
    const input = eligibleInput();
    input.product.supplierDataJson = supplierDataJson;
    assert.ok(
      evaluateCheckoutCommerceEligibility(input).reasonCodes.includes(expected),
      `${expected} should be reported`
    );
  }
});

test("contribution margin is a hard per-store floor", () => {
  const below = eligibleInput();
  below.contributionMarginPercent = 14.99;
  assert.ok(
    evaluateCheckoutCommerceEligibility(below).reasonCodes.includes(
      "CONTRIBUTION_MARGIN_BELOW_FLOOR"
    )
  );

  const equal = eligibleInput();
  equal.contributionMarginPercent = 15;
  assert.equal(evaluateCheckoutCommerceEligibility(equal).allowed, true);

  const invalid = eligibleInput();
  invalid.contributionMarginPercent = Number.NaN;
  assert.ok(
    evaluateCheckoutCommerceEligibility(invalid).reasonCodes.includes(
      "CONTRIBUTION_MARGIN_INVALID"
    )
  );
});

test("explicit mock mode preserves catalog-safe demo checkout without live evidence or margin", () => {
  const input = eligibleInput();
  input.mode = "MOCK";
  input.store.launchStatus = "PREVIEW";
  input.store.generation = null;
  input.product.mediaStatus = "PENDING";
  input.product.qualityStatus = "NEEDS_REVIEW";
  input.product.supplierDataJson = "{}";
  input.contributionMarginPercent = -100;

  assert.deepEqual(evaluateCheckoutCommerceEligibility(input), {
    allowed: true,
    reasonCodes: [],
  });
});

test("mock mode still requires active, published and catalog-visible records", () => {
  const input = eligibleInput();
  input.mode = "MOCK";
  input.store.isActive = false;
  input.product.isPublished = false;
  input.product.catalogVisible = false;

  assert.deepEqual(evaluateCheckoutCommerceEligibility(input).reasonCodes, [
    "STORE_INACTIVE",
    "PRODUCT_UNPUBLISHED",
    "CATALOG_VISIBILITY_NOT_PASS",
  ]);
});
