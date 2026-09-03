import assert from "node:assert/strict";
import test from "node:test";
import {
  assessCatalogAlignmentV1,
  catalogStorefrontRevisionFingerprintV1,
  parseCatalogAlignmentV1,
  type CatalogCurrentStateV1,
} from "./catalog-alignment";
import { buildSupplierProductSnapshotV1 } from "./catalog-refresh-proposal";
import type { ProviderCapabilities, ProviderHealth } from "../suppliers/providers/types";

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
  affiliateLinks: false,
};

function snapshot(inventory = true) {
  const health: ProviderHealth = {
    key: "ebay",
    name: "Provider",
    status: "OK",
    message: "Ready",
    capabilities: { ...capabilities, inventory },
    defaultFulfillmentMode: "AFFILIATE",
  };
  return buildSupplierProductSnapshotV1({
    requestedProviderKey: "ebay",
    requestedExternalId: "external-1",
    observedAt: new Date("2026-08-29T12:00:00.000Z"),
    health,
    details: {
      providerKey: "ebay",
      externalId: "external-1",
      sourceUrl: "https://supplier.example/p/1?token=volatile",
      title: "Supplier title",
      currency: "USD",
      supplierCost: 10,
      stockStatus: "IN_STOCK",
      shippingDaysMin: 3,
      shippingDaysMax: 7,
      countryOfOrigin: "NO",
      sku: "SKU-1",
      gtin: "12345678",
      specs: [],
      variants: [
        {
          externalVariantId: "variant-1",
          sku: "SKU-V1",
          options: { Color: "Blue" },
          stockStatus: "IN_STOCK",
        },
        {
          externalVariantId: "variant-2",
          sku: "SKU-V2",
          options: { Color: "Red" },
          stockStatus: "LOW_STOCK",
        },
      ],
      media: [
        {
          url: "https://cdn.example/product.jpg?X-Amz-Signature=volatile",
          mediaType: "IMAGE",
          sortOrder: 0,
        },
      ],
      signals: {},
      risk: {},
      fulfillmentMode: "AFFILIATE",
    },
  });
}

function current(overrides: Partial<CatalogCurrentStateV1> = {}): CatalogCurrentStateV1 {
  return {
    fulfillmentMode: "AFFILIATE",
    sourceUrl: "https://supplier.example/p/1?token=old",
    stockStatus: "IN_STOCK",
    shippingDaysMin: 3,
    shippingDaysMax: 7,
    countryOfOrigin: "NO",
    sku: "SKU-1",
    gtin: "12345678",
    variants: [
      {
        externalVariantId: "variant-1",
        sku: "SKU-V1",
        stockStatus: "IN_STOCK",
      },
      {
        externalVariantId: "variant-2",
        sku: "SKU-V2",
        stockStatus: "LOW_STOCK",
      },
    ],
    mediaSourceUrls: ["https://cdn.example/product.jpg?token=old"],
    ...overrides,
  };
}

test("matching operational supplier and storefront facts are aligned", () => {
  const result = assessCatalogAlignmentV1({ snapshot: snapshot(), current: current() });

  assert.equal(result.status, "ALIGNED");
  assert.deepEqual(result.reasonCodes, ["CATALOG_ALIGNED"]);
  assert.deepEqual(result.changes, []);
});

test("existing storefront drift is visible on the first supplier observation", () => {
  const result = assessCatalogAlignmentV1({
    snapshot: snapshot(),
    current: current({
      stockStatus: "OUT_OF_STOCK",
      shippingDaysMax: 14,
      mediaSourceUrls: [],
    }),
  });

  assert.equal(result.status, "DRIFT");
  assert.ok(result.reasonCodes.includes("CATALOG_INVENTORY_DRIFT"));
  assert.ok(result.reasonCodes.includes("CATALOG_SHIPPING_DRIFT"));
  assert.ok(result.reasonCodes.includes("CATALOG_MEDIA_DRIFT"));
  assert.ok(result.changes.some((change) => change.field === "catalog.stockStatus"));
});

test("non-authoritative inventory is skipped instead of creating false stock drift", () => {
  const result = assessCatalogAlignmentV1({
    snapshot: snapshot(false),
    current: current({ stockStatus: "OUT_OF_STOCK" }),
  });

  assert.equal(result.status, "PARTIAL");
  assert.ok(result.skippedFields.includes("catalog.stockStatus"));
  assert.equal(
    result.changes.some((change) => change.field === "catalog.stockStatus"),
    false
  );
});

test("variant order does not create drift", () => {
  const result = assessCatalogAlignmentV1({
    snapshot: snapshot(),
    current: current({ variants: [...current().variants].reverse() }),
  });

  assert.equal(result.status, "ALIGNED");
  assert.equal(
    result.changes.some((change) => change.field === "catalog.variants.manifest"),
    false
  );
});

test("storefront revisions normalize child order and volatile media credentials", () => {
  const baseline = current();
  const reordered = current({
    variants: [...baseline.variants].reverse(),
    mediaSourceUrls: [
      "https://cdn.example/product.jpg?token=reissued",
      "https://cdn.example/product.jpg?token=duplicate",
    ],
  });

  assert.equal(
    catalogStorefrontRevisionFingerprintV1(baseline),
    catalogStorefrontRevisionFingerprintV1(reordered)
  );
  assert.notEqual(
    catalogStorefrontRevisionFingerprintV1(baseline),
    catalogStorefrontRevisionFingerprintV1(
      current({
        variants: baseline.variants.map((variant, index) =>
          index === 0 ? { ...variant, stockStatus: "OUT_OF_STOCK" } : variant
        ),
      })
    )
  );
});

test("missing storefront evidence is reported explicitly", () => {
  const result = assessCatalogAlignmentV1({ snapshot: snapshot() });

  assert.equal(result.status, "NOT_EVALUATED");
  assert.deepEqual(result.reasonCodes, ["CATALOG_ALIGNMENT_NOT_EVALUATED"]);
});

test("alignment contract rejects unknown statuses, fields, and non-finite change values", () => {
  const valid = assessCatalogAlignmentV1({
    snapshot: snapshot(),
    current: current({ stockStatus: "OUT_OF_STOCK" }),
  });
  assert.deepEqual(parseCatalogAlignmentV1(valid), valid);

  assert.equal(
    parseCatalogAlignmentV1({ ...valid, status: "APPROVED" }),
    null
  );
  assert.equal(
    parseCatalogAlignmentV1({ ...valid, unexpected: true }),
    null
  );
  assert.equal(
    parseCatalogAlignmentV1({
      ...valid,
      changes: [{ ...valid.changes[0], next: Number.POSITIVE_INFINITY }],
    }),
    null
  );
});
