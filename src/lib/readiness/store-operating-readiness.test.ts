import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateStoreOperatingReadiness,
  type StoreOperatingReadinessInput,
} from "./store-operating-readiness";

function input(
  overrides: Partial<StoreOperatingReadinessInput> = {}
): StoreOperatingReadinessInput {
  return {
    store: {
      id: "store_1",
      slug: "foundation-store",
      name: "Foundation Store",
      launchStatus: "PREVIEW",
      isActive: true,
    },
    foundation: {
      persisted: true,
      auditStatus: "PASS",
      inputCurrent: true,
      seoDraftNoindex: true,
    },
    brand: {
      identityFieldsComplete: true,
      supportEmailPresent: true,
      legalNameLooksProvisional: false,
    },
    design: { presentationExplicit: true, textContrastPasses: true },
    content: {
      totalPages: 2,
      publishedPages: 0,
      draftPages: 2,
      malformedSeoPages: 0,
      policyViolationPages: 0,
      nonLivePublishedWithoutNoindex: 0,
      types: ["FAQ", "GUIDE"],
    },
    seo: { defaultOgImagePresent: true, robotsFailClosedForNonLive: true },
    legal: {
      privacyPresent: true,
      termsPresent: true,
      returnsPresent: true,
      shippingDisclosurePresent: true,
      authenticatedReviewerAvailable: false,
    },
    consent: {
      cookiePolicyUrlPresent: true,
      versionedConsentContract: false,
      withdrawalControlAvailable: false,
    },
    domain: {
      intendedHostname: "example.test",
      mappedHostnameCount: 0,
      ownershipVerified: null,
      dnsReady: null,
      tlsReady: null,
    },
    measurement: {
      eventCount: 0,
      hostBoundIngestion: false,
      authenticatedTelemetry: false,
      marketingIdsConfigured: false,
    },
    experimentation: {
      totalExperiments: 0,
      activeExperiments: 0,
      assignmentLedgerAvailable: false,
      orderAttributionAvailable: false,
    },
    ...overrides,
  };
}

test("a complete provider-independent foundation is ready for review but never launch-authorized", () => {
  const result = evaluateStoreOperatingReadiness(input());
  assert.equal(result.preCatalogDecision, "READY_FOR_REVIEW");
  assert.equal(result.launchAuthorized, false);
  assert.equal(
    result.gates.find((gate) => gate.area === "DOMAIN")?.status,
    "UNKNOWN"
  );
  assert.equal(
    result.gates.find((gate) => gate.area === "LEGAL")?.status,
    "REVIEW"
  );
});

test("missing or stale foundation blocks the pre-catalog decision", () => {
  for (const foundation of [
    { persisted: false, auditStatus: "PASS" as const, inputCurrent: true, seoDraftNoindex: true },
    { persisted: true, auditStatus: "REVIEW" as const, inputCurrent: false, seoDraftNoindex: true },
  ]) {
    const result = evaluateStoreOperatingReadiness(input({ foundation }));
    assert.equal(result.preCatalogDecision, "NEEDS_WORK");
    assert.equal(
      result.gates.find((gate) => gate.area === "FOUNDATION")?.status,
      "BLOCKED"
    );
  }
});

test("non-LIVE published content that is not row-level noindex is blocked", () => {
  const result = evaluateStoreOperatingReadiness(
    input({
      content: {
        ...input().content,
        publishedPages: 1,
        draftPages: 1,
        nonLivePublishedWithoutNoindex: 1,
      },
    })
  );
  assert.equal(result.preCatalogDecision, "NEEDS_WORK");
  assert.equal(
    result.gates.find((gate) => gate.area === "CONTENT")?.reasonCode,
    "NONLIVE_CONTENT_ROW_INDEXABLE"
  );
});

test("persisted content that violates the current policy blocks readiness", () => {
  const result = evaluateStoreOperatingReadiness(
    input({
      content: {
        ...input().content,
        policyViolationPages: 2,
      },
    })
  );
  assert.equal(result.preCatalogDecision, "NEEDS_WORK");
  assert.equal(
    result.gates.find((gate) => gate.area === "CONTENT")?.reasonCode,
    "CONTENT_POLICY_VIOLATION"
  );
});

test("active experiments without attribution are blocked", () => {
  const result = evaluateStoreOperatingReadiness(
    input({
      experimentation: {
        totalExperiments: 1,
        activeExperiments: 1,
        assignmentLedgerAvailable: false,
        orderAttributionAvailable: false,
      },
    })
  );
  const experiment = result.gates.find(
    (gate) => gate.area === "EXPERIMENTATION"
  );
  assert.equal(experiment?.status, "BLOCKED");
  assert.equal(experiment?.reasonCode, "UNATTRIBUTABLE_EXPERIMENT_ACTIVE");
  assert.equal(result.launchAuthorized, false);
});

test("large client event counts remain advisory and cannot pass measurement", () => {
  const result = evaluateStoreOperatingReadiness(
    input({
      measurement: {
        eventCount: 1_000_000,
        hostBoundIngestion: false,
        authenticatedTelemetry: false,
        marketingIdsConfigured: true,
      },
    })
  );
  const measurement = result.gates.find((gate) => gate.area === "MEASUREMENT");
  assert.equal(measurement?.status, "REVIEW");
  assert.equal(measurement?.reasonCode, "TELEMETRY_ADVISORY_ONLY");
});

test("legacy LIVE domain rows are not inferred as verified evidence", () => {
  const result = evaluateStoreOperatingReadiness(
    input({
      store: { ...input().store, launchStatus: "LIVE" },
      domain: {
        intendedHostname: "legacy.example",
        mappedHostnameCount: 2,
        ownershipVerified: null,
        dnsReady: null,
        tlsReady: null,
      },
    })
  );
  assert.equal(result.gates.find((gate) => gate.area === "DOMAIN")?.status, "UNKNOWN");
  assert.equal(result.launchAuthorized, false);
});
