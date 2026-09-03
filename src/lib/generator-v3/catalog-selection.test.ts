import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_SELECTION_VERSION,
  selectCatalogCandidatesV1,
  type CatalogSelectionCandidateV1,
} from "./catalog-selection";

function candidate(
  id: string,
  overrides: Partial<CatalogSelectionCandidateV1> = {}
): CatalogSelectionCandidateV1 {
  return {
    id,
    providerKey: "cj",
    externalId: `supplier-${id}`,
    title: `Aero ${id} 4K Camera Drone`,
    price: 100,
    currency: "USD",
    shippingCost: 5,
    marginPercent: 35,
    shippingDaysMax: 12,
    stockStatus: "IN_STOCK",
    score: 80,
    mediaCount: 4,
    variantIdentityReady: true,
    relevanceState: "PASS",
    ...overrides,
  };
}

test("selection hard gates cannot be outweighed by price or supplier score", () => {
  const plan = selectCatalogCandidatesV1({
    candidates: [
      candidate("good"),
      candidate("cheap-junk", { price: 1, score: 100, relevanceState: "FAIL" }),
      candidate("sold-out", { price: 2, score: 99, stockStatus: "OUT_OF_STOCK" }),
      candidate("stock-unknown", { price: 2, score: 99, stockStatus: "UNKNOWN" }),
      candidate("too-slow", { price: 2, score: 99, shippingDaysMax: 30 }),
      candidate("no-identity", { price: 2, score: 99, variantIdentityReady: false }),
      candidate("no-media", { price: 3, score: 98, mediaCount: 1 }),
      candidate("no-shipping-cost", { price: 3, score: 98, shippingCost: null }),
    ],
    requestedCount: 8,
    pricePositioning: "budget",
    classConcepts: ["camera drone", "drone"],
  });

  assert.equal(plan.version, CATALOG_SELECTION_VERSION);
  assert.equal(plan.selectedCount, 1);
  assert.equal(plan.selected[0]?.candidateId, "good");
  assert.deepEqual(
    plan.rejected.map((entry) => entry.candidateId),
    [
      "cheap-junk",
      "no-identity",
      "no-media",
      "no-shipping-cost",
      "sold-out",
      "stock-unknown",
      "too-slow",
    ]
  );
});

test("affordability never treats unknown freight as free or compares currencies raw", () => {
  const plan = selectCatalogCandidatesV1({
    candidates: [
      candidate("usd-a", { price: 100, currency: "USD", shippingCost: 9 }),
      candidate("usd-b", { price: 110, currency: "USD", shippingCost: 7 }),
      candidate("nok-cheap-looking", { price: 99, currency: "NOK", shippingCost: 1 }),
      candidate("unknown-freight", { price: 1, currency: "USD", shippingCost: null }),
    ],
    requestedCount: 4,
    pricePositioning: "budget",
    classConcepts: ["camera drone", "drone"],
  });

  assert.equal(plan.comparisonCurrency, "USD");
  assert.deepEqual(
    plan.selected.map((entry) => entry.candidateId).sort(),
    ["usd-a", "usd-b"]
  );
  assert.deepEqual(
    Object.fromEntries(plan.rejected.map((entry) => [entry.candidateId, entry.reasonCodes])),
    {
      "nok-cheap-looking": ["SELECTION_CURRENCY_NOT_COMPARABLE"],
      "unknown-freight": ["SELECTION_SHIPPING_COST_MISSING"],
    }
  );
});

test("budget selection prefers affordable qualified products", () => {
  const plan = selectCatalogCandidatesV1({
    candidates: [
      candidate("budget", { price: 59, score: 82, title: "Aero Mini 1080p Camera Drone" }),
      candidate("mid", { price: 149, score: 84, title: "Aero Fold 4K GPS Camera Drone" }),
      candidate("luxury", { price: 899, score: 87, title: "Aero Cinema Pro Camera Drone" }),
    ],
    requestedCount: 1,
    pricePositioning: "budget",
    classConcepts: ["camera drone", "drone"],
  });

  assert.equal(plan.selected[0]?.candidateId, "budget");
  assert.equal(plan.selected[0]?.priceBand, "BUDGET");
  assert.ok(plan.selected[0]?.reasonCodes.includes("SELECTION_AFFORDABLE"));
});

test("novelty prevents a catalog made only from near-duplicate listings", () => {
  const plan = selectCatalogCandidatesV1({
    candidates: [
      candidate("clone-a", { title: "Aero X1 Foldable 4K Camera Drone", score: 92 }),
      candidate("clone-b", { title: "Aero X1 Foldable 4K Camera Drone Combo", score: 91 }),
      candidate("beginner", { title: "Pocket Mini Beginner Camera Drone", score: 84 }),
      candidate("outdoor", { title: "Rugged Trail GPS Camera Drone", score: 83 }),
    ],
    requestedCount: 3,
    pricePositioning: "value",
    classConcepts: ["camera drone", "drone"],
  });

  const ids = plan.selected.map((entry) => entry.candidateId);
  assert.equal(ids.length, 3);
  assert.ok(ids.includes("beginner"));
  assert.ok(ids.includes("outdoor"));
  assert.equal(ids.filter((id) => id.startsWith("clone")).length, 1);
});

test("selection is deterministic, bounded to 12 and records review risk", () => {
  const candidates = Array.from({ length: 16 }, (_, index) =>
    candidate(`d${index.toString().padStart(2, "0")}`, {
      title: `Model ${index} GPS Camera Drone`,
      price: 80 + index * 10,
      manualReviewTerms: ["drone", "battery"],
    })
  );
  const request = {
    candidates,
    requestedCount: 99,
    pricePositioning: "mixed" as const,
    classConcepts: ["camera drone", "drone"],
  };
  const left = selectCatalogCandidatesV1(request);
  const right = selectCatalogCandidatesV1({ ...request, candidates: [...candidates].reverse() });

  assert.equal(left.selectedCount, 12);
  assert.equal(left.requestedCount, 12);
  assert.deepEqual(left, right);
  assert.ok(
    left.selected.every((entry) =>
      entry.reasonCodes.includes("SELECTION_MANUAL_REVIEW_REQUIRED")
    )
  );
});
