import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogRefreshProposalV1,
  buildSourceUnavailableProposalV1,
  buildSupplierProductSnapshotV1,
  parseCatalogRefreshProposalV1,
} from "./catalog-refresh-proposal";
import type {
  ProductDetailsResult,
  ProviderCapabilities,
  ProviderHealth,
} from "../suppliers/providers/types";

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: true,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: true,
};

function health(overrides: Partial<ProviderHealth> = {}): ProviderHealth {
  return {
    key: "ebay",
    name: "Test provider",
    status: "OK",
    message: "Ready",
    capabilities,
    defaultFulfillmentMode: "AFFILIATE",
    ...overrides,
  };
}

function details(
  overrides: Partial<ProductDetailsResult> = {}
): ProductDetailsResult {
  return {
    providerKey: "ebay",
    externalId: "external-1",
    sourceUrl: "https://supplier.example/products/external-1",
    title: "Supplier product",
    description: "Grounded supplier description",
    brand: "Supplier brand",
    price: 29,
    currency: "usd",
    supplierCost: 12,
    shippingCost: 3,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 4,
    shippingDaysMax: 8,
    countryOfOrigin: "NO",
    sku: "SKU-1",
    specs: [],
    variants: [
      {
        externalVariantId: "variant-b",
        sku: "SKU-B",
        title: "Blue",
        options: { Size: "M", Color: "Blue" },
        supplierCost: 13,
        stockStatus: "IN_STOCK",
        inventoryQuantity: 4,
      },
      {
        externalVariantId: "variant-a",
        sku: "SKU-A",
        title: "Red",
        options: { Color: "Red", Size: "S" },
        supplierCost: 12,
        stockStatus: "LOW_STOCK",
        inventoryQuantity: 2,
      },
    ],
    media: [
      {
        url: "https://cdn.example/a.jpg?token=first&width=1200",
        mediaType: "IMAGE",
        sortOrder: 1,
      },
      {
        url: "https://cdn.example/b.jpg",
        mediaType: "IMAGE",
        sortOrder: 0,
      },
    ],
    signals: {},
    risk: {},
    rawData: { secretSentinel: "must-not-be-persisted" },
    fulfillmentMode: "AFFILIATE",
    ...overrides,
  };
}

function snapshot(input: {
  observedAt?: string;
  health?: ProviderHealth;
  details?: ProductDetailsResult;
} = {}) {
  return buildSupplierProductSnapshotV1({
    requestedProviderKey: "ebay",
    requestedExternalId: "external-1",
    observedAt: new Date(input.observedAt ?? "2026-08-29T10:00:00.000Z"),
    health: input.health ?? health(),
    details: input.details ?? details(),
  });
}

test("supplier snapshot is deterministic across ordering and volatile media tokens", () => {
  const first = snapshot();
  const reordered = details({
    variants: [...details().variants].reverse(),
    media: [
      details().media[1],
      {
        ...details().media[0],
        url: "https://cdn.example/a.jpg?token=second&width=1200",
      },
    ],
    rawData: { secretSentinel: "different-and-still-excluded" },
  });
  const second = snapshot({
    observedAt: "2026-08-30T10:00:00.000Z",
    details: reordered,
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.notEqual(first.observedAt, second.observedAt);
  assert.equal(JSON.stringify(first).includes("secretSentinel"), false);
  assert.deepEqual(
    first.variants.map((variant) => variant.externalVariantId),
    ["variant-a", "variant-b"]
  );
});

test("first observation is a baseline and an identical observation is no change", () => {
  const first = snapshot();
  const baseline = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    snapshot: first,
  });
  const unchanged = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    previousSnapshot: first,
    snapshot: snapshot({ observedAt: "2026-08-30T10:00:00.000Z" }),
  });

  assert.equal(baseline.decision, "BASELINE_CAPTURED");
  assert.deepEqual(baseline.reasonCodes, ["FIRST_SUPPLIER_OBSERVATION"]);
  assert.equal(unchanged.decision, "NO_CHANGE");
  assert.deepEqual(unchanged.changes, []);
});

test("inventory is non-authoritative when provider capability is false", () => {
  const result = snapshot({
    health: health({ capabilities: { ...capabilities, inventory: false } }),
    details: details({ stockStatus: "IN_STOCK" }),
  });

  assert.deepEqual(result.facts.stock, {
    status: "UNKNOWN",
    authoritative: false,
  });
  assert.equal(result.completeness.inventory, false);
  assert.equal(
    result.variants.every(
      (variant) =>
        variant.stock.status === "UNKNOWN" && !variant.stock.authoritative
    ),
    true
  );
});

test("supplier currency and cost drift require review without computing a storefront price", () => {
  const previous = snapshot();
  const next = snapshot({
    observedAt: "2026-08-30T10:00:00.000Z",
    details: details({ currency: "EUR", supplierCost: 14 }),
  });
  const proposal = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    previousSnapshot: previous,
    snapshot: next,
  });

  assert.equal(proposal.decision, "REVIEW_REQUIRED");
  assert.ok(proposal.reasonCodes.includes("SUPPLIER_CURRENCY_CHANGED"));
  assert.ok(proposal.reasonCodes.includes("SUPPLIER_PRICE_CHANGED"));
  assert.equal(proposal.changes.some((change) => change.field === "storefront.price"), false);
});

test("a media-only manifest change is proposed but never applied", () => {
  const previous = snapshot();
  const next = snapshot({
    observedAt: "2026-08-30T10:00:00.000Z",
    details: details({
      media: [
        ...details().media,
        {
          url: "https://cdn.example/c.jpg",
          mediaType: "IMAGE",
          sortOrder: 2,
        },
      ],
    }),
  });
  const proposal = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    previousSnapshot: previous,
    snapshot: next,
  });

  assert.equal(proposal.decision, "PROPOSED");
  assert.deepEqual(proposal.reasonCodes, ["MEDIA_MANIFEST_CHANGED"]);
  assert.deepEqual(proposal.changes.map((change) => change.field), ["media.manifest"]);
});

test("supplier identity mismatch and invalid shipping windows fail closed", () => {
  assert.throws(
    () => snapshot({ details: details({ externalId: "wrong-id" }) }),
    /CATALOG_REFRESH_IDENTITY_MISMATCH/
  );
  assert.throws(
    () => snapshot({ details: details({ shippingDaysMin: 12, shippingDaysMax: 4 }) }),
    /CATALOG_REFRESH_INVALID_SHIPPING_WINDOW/
  );
});

test("proposal contract validates the complete nested supplier observation", () => {
  const valid = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    snapshot: snapshot(),
  });
  assert.deepEqual(parseCatalogRefreshProposalV1(valid), valid);

  assert.equal(
    parseCatalogRefreshProposalV1({ ...valid, decision: "AUTOMATICALLY_APPLIED" }),
    null
  );
  assert.equal(
    parseCatalogRefreshProposalV1({
      ...valid,
      proposalFingerprint: "not-a-sha256-fingerprint",
    }),
    null
  );
  assert.equal(
    parseCatalogRefreshProposalV1({
      ...valid,
      storefrontRevisionFingerprint: "not-a-sha256-fingerprint",
    }),
    null
  );
  assert.equal(
    parseCatalogRefreshProposalV1({
      ...valid,
      observedAt: "2026-08-29",
    }),
    null
  );
  assert.equal(
    parseCatalogRefreshProposalV1({
      ...valid,
      snapshot: {
        ...valid.snapshot,
        facts: { ...valid.snapshot?.facts, supplierCost: Number.NaN },
      },
    }),
    null
  );
  assert.equal(parseCatalogRefreshProposalV1({ ...valid, extra: true }), null);
});

test("proposal contract keeps unavailable evidence separate from supplier snapshots", () => {
  const unavailable = buildSourceUnavailableProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    providerKey: "ebay",
    externalId: "external-1",
    observedAt: new Date("2026-08-29T10:00:00.000Z"),
    reasonCode: "PROVIDER_DETAILS_UNAVAILABLE",
  });
  assert.deepEqual(parseCatalogRefreshProposalV1(unavailable), unavailable);
  assert.equal(
    parseCatalogRefreshProposalV1({ ...unavailable, snapshot: snapshot() }),
    null
  );

  const baseline = buildCatalogRefreshProposalV1({
    productId: "product-1",
    productTitle: "Store title",
    snapshot: snapshot(),
  });
  const missingSnapshot: Record<string, unknown> = { ...baseline };
  delete missingSnapshot.snapshot;
  assert.equal(parseCatalogRefreshProposalV1(missingSnapshot), null);
});
