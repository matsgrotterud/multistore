import assert from "node:assert/strict";
import test from "node:test";
import {
  decideCatalogVisibilityV3,
  isCatalogCategoryVisibleV3,
  projectVirtualCatalogCategoryV3,
  selectPreviewCatalogCategoryV3,
} from "./catalog-visibility-v3";

const product = {
  title: "Premium product",
  description: "Everyday featured pick",
  supplierDataJson: "{}",
  specs: "[]",
  providerKey: "cj",
  externalId: "x",
  sourceUrl: "https://supplier.test/x",
  mediaStatus: "OK",
  qualityStatus: "PASS",
  price: 25,
  marginPercent: 35,
  shippingDaysMax: 12,
};

function persistedDynamicEvaluation(options?: {
  relevance?: "PASS" | "FAIL";
  policy?: "PASS" | "REVIEW" | "FAIL";
  previewVisibility?: "PASS" | "FAIL";
}) {
  const gate = (state: "PASS" | "FAIL" | "UNKNOWN" | "REVIEW") => ({
    state,
    reasonCodes: state === "PASS" ? [] : [`TEST_${state}`],
    explanation: `test ${state.toLowerCase()}`,
    evidence: [],
  });
  return {
    version: "candidate-evaluator.v1",
    evaluatedAt: "2026-08-26T12:00:00.000Z",
    intentVersion: "niche-intent.v1",
    productClass: "custom.cowboy-hats",
    relevance: gate(options?.relevance ?? "PASS"),
    policy: gate(options?.policy ?? "REVIEW"),
    supplierEvidence: gate("PASS"),
    mediaReadiness: gate("PASS"),
    variantReadiness: gate("PASS"),
    priceMargin: gate("PASS"),
    shipping: gate("PASS"),
    riskIp: gate("PASS"),
    previewVisibility: gate(options?.previewVisibility ?? "PASS"),
    liveCommerceEligibility: gate("FAIL"),
  };
}

test("legacy fluffy-slippers preview quarantines off-class junk", () => {
  const decision = decideCatalogVisibilityV3(
    { niche: "fluffy slippers", launchStatus: "PREVIEW" },
    product
  );
  assert.equal(decision.visible, false);
  assert.equal(decision.mode, "LEGACY_PREVIEW_QUARANTINE");
});

test("legacy preview allows a relevant slipper with stored media", () => {
  const decision = decideCatalogVisibilityV3(
    { niche: "fluffy slippers", launchStatus: "PREVIEW" },
    {
      ...product,
      title: "Women's fluffy house slippers",
      supplierDataJson: JSON.stringify({
        rawTitle: "Women Plush House Slippers",
        rawDescription: "Warm indoor slipper with memory foam",
      }),
    }
  );
  assert.equal(decision.visible, true);
});

test("malformed persisted evaluation fails closed instead of crashing or falling back", () => {
  const decision = decideCatalogVisibilityV3(
    { niche: "fluffy slippers", launchStatus: "PREVIEW" },
    {
      ...product,
      title: "Women's fluffy house slippers",
      supplierDataJson: JSON.stringify({
        candidateEvaluationV1: {
          version: "candidate-evaluator.v1",
          evaluatedAt: new Date().toISOString(),
          intentVersion: "niche-intent.v1",
          relevance: {
            state: "PASS",
            reasonCodes: [],
            explanation: "ok",
            evidence: [],
          },
          previewVisibility: {
            state: "PASS",
            reasonCodes: [],
            explanation: "ok",
            evidence: [],
          },
        },
      }),
    }
  );
  assert.equal(decision.visible, false);
  assert.equal(decision.mode, "V3_PREVIEW");
  assert.deepEqual(decision.reasonCodes, ["PERSISTED_EVALUATION_INVALID"]);
});

test("unknown PREVIEW niche fails closed but LIVE remains compatibility-safe", () => {
  assert.equal(
    decideCatalogVisibilityV3(
      { niche: "quantum lifestyle", launchStatus: "PREVIEW" },
      product
    ).visible,
    false
  );
  assert.equal(
    decideCatalogVisibilityV3(
      { niche: "quantum lifestyle", launchStatus: "LIVE" },
      product
    ).visible,
    true
  );
});

test("unknown static niche accepts a complete persisted V3 preview PASS", () => {
  const decision = decideCatalogVisibilityV3(
    { niche: "cowboy hats adults", launchStatus: "PREVIEW" },
    {
      ...product,
      title: "Adult brown cowboy hat",
      supplierDataJson: JSON.stringify({
        candidateEvaluationV1: persistedDynamicEvaluation(),
      }),
    }
  );

  assert.equal(decision.visible, true);
  assert.equal(decision.mode, "V3_PREVIEW");
  assert.equal(decision.evaluation?.productClass, "custom.cowboy-hats");
  assert.equal(decision.evaluation?.policy.state, "REVIEW");
});

test("persisted dynamic evaluation still hides rejected preview products", () => {
  const decision = decideCatalogVisibilityV3(
    { niche: "cowboy hats adults", launchStatus: "PREVIEW" },
    {
      ...product,
      title: "Cowboy hat keychain",
      supplierDataJson: JSON.stringify({
        candidateEvaluationV1: persistedDynamicEvaluation({
          relevance: "FAIL",
          previewVisibility: "FAIL",
        }),
      }),
    }
  );

  assert.equal(decision.visible, false);
  assert.equal(decision.mode, "V3_PREVIEW");
  assert.deepEqual(decision.reasonCodes, ["TEST_FAIL", "TEST_REVIEW", "TEST_FAIL"]);
});

test("legacy fluffy preview hides generic merchandising categories", () => {
  const store = { niche: "fluffy slippers", launchStatus: "PREVIEW" };
  assert.equal(isCatalogCategoryVisibleV3(store, "Featured Picks"), false);
  assert.equal(isCatalogCategoryVisibleV3(store, "Premium Selection"), false);
  assert.equal(isCatalogCategoryVisibleV3(store, "All slippers"), true);
  assert.equal(isCatalogCategoryVisibleV3(store, "Plush slippers"), true);
});

test("non-LIVE known ontology projects one deterministic Prisma-shaped category", () => {
  const store = { id: "store-fluffy", niche: "fluffy slippers", launchStatus: "PREVIEW" };
  const first = projectVirtualCatalogCategoryV3(store);
  const second = projectVirtualCatalogCategoryV3(store);

  assert.deepEqual(first, second);
  assert.deepEqual(first, {
    id: "virtual-category-v3:store-fluffy:all-slippers",
    storeId: "store-fluffy",
    slug: "all-slippers",
    name: "All slippers",
    description: "Slippers and house shoes that passed the catalog relevance checks.",
    seoTitle: "All slippers",
    seoDescription: "Slippers and house shoes that passed the catalog relevance checks.",
    heroTitle: "All slippers",
    heroSubtitle: "Slippers and house shoes that passed the catalog relevance checks.",
    sortOrder: 0,
  });
});

test("virtual category projection is tenant-scoped", () => {
  const first = projectVirtualCatalogCategoryV3({
    id: "store-one",
    niche: "fluffy slippers",
    launchStatus: "DRAFT",
  });
  const second = projectVirtualCatalogCategoryV3({
    id: "store-two",
    niche: "fluffy slippers",
    launchStatus: "DRAFT",
  });

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.id, second.id);
  assert.equal(first.storeId, "store-one");
  assert.equal(second.storeId, "store-two");
});

test("virtual category projection fails closed for unknown previews and defers LIVE", () => {
  assert.equal(
    projectVirtualCatalogCategoryV3({
      id: "store-unknown",
      niche: "quantum lifestyle",
      launchStatus: "PREVIEW",
    }),
    null
  );
  assert.equal(
    projectVirtualCatalogCategoryV3({
      id: "store-live",
      niche: "fluffy slippers",
      launchStatus: "LIVE",
    }),
    null
  );
});

test("dynamic preview category fallback requires visible V3 evidence and tenant ownership", () => {
  const store = {
    id: "store-cowboy",
    niche: "cowboy hats adults",
    launchStatus: "PREVIEW",
  };
  const category = {
    id: "category-cowboy",
    storeId: "store-cowboy",
    slug: "cowboy-hats",
    name: "Cowboy hats",
    description: "Adult cowboy hats with persisted supplier evidence.",
    seoTitle: "Cowboy hats",
    seoDescription: "Adult cowboy hats with persisted supplier evidence.",
    heroTitle: "Cowboy hats",
    heroSubtitle: "Adult cowboy hats",
    sortOrder: 0,
  };

  assert.equal(selectPreviewCatalogCategoryV3(store, category, false), null);
  assert.equal(
    selectPreviewCatalogCategoryV3(
      store,
      { ...category, storeId: "another-store" },
      true
    ),
    null
  );
  assert.deepEqual(selectPreviewCatalogCategoryV3(store, category, true), category);
  assert.equal(
    selectPreviewCatalogCategoryV3(
      { ...store, launchStatus: "LIVE" },
      category,
      true
    ),
    null
  );
});
