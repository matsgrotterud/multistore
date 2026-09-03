import assert from "node:assert/strict";
import test from "node:test";
import { adaptLegacyProductLikeToV2 } from "./index";

const ADAPTED_AT = "2026-02-01T10:30:00.000Z";

function legacyProduct() {
  const supplierProductId = "SUPPLIER-PRODUCT-SENTINEL";
  const supplierSku = "SUPPLIER-SKU-SENTINEL";
  const externalVariantId = "EXTERNAL-VARIANT-SENTINEL";
  return {
    id: "legacy-internal-product-id",
    slug: "legacy-trail-shoe",
    title: `Legacy Trail Shoe ${supplierProductId}`,
    subtitle: "A public subtitle",
    description: `A trail shoe. Internal code ${supplierProductId}.`,
    seoTitle: `Legacy Trail Shoe ${supplierProductId}`,
    seoDescription: `Shop the trail shoe ${supplierProductId}`,
    brand: "Merchant Brand",
    imageUrl: `https://supplier.example.invalid/${supplierProductId}.webp`,
    imageAlt: `Legacy shoe ${supplierProductId}`,
    price: 49.99,
    compareAtPrice: 59.99,
    currency: "nok",
    stockStatus: "IN_STOCK",
    isPublished: true,
    category: { slug: "trail-shoes" },
    specs: JSON.stringify([{ label: "Weight", value: "280 g" }]),
    providerKey: "provider-internal",
    externalId: supplierProductId,
    supplierProductId,
    sku: supplierSku,
    variants: [
      {
        id: "legacy-variant-one",
        title: `Blue ${supplierSku}`,
        optionSummary: externalVariantId,
        optionsJson: JSON.stringify({
          Size: "40",
          Color: "Blue",
          Internal: supplierSku,
        }),
        price: 54.99,
        compareAtPrice: 64.99,
        stockStatus: "IN_STOCK",
        imageUrl: "https://merchant-assets.example.invalid/blue-40.webp",
        isDefault: true,
        sku: supplierSku,
        externalVariantId,
      },
    ],
  };
}

test("legacy adapter converts prices to integer minor units and projects safely", () => {
  const result = adaptLegacyProductLikeToV2(legacyProduct(), {
    adaptedAt: ADAPTED_AT,
    publicImageUrl: "https://merchant-assets.example.invalid/trail-shoe.webp",
    publicImageRightsVerified: true,
  });
  assert.equal(result.status, "ADAPTED");
  if (result.status !== "ADAPTED") return;
  assert.deepEqual(result.revision.price, {
    state: "KNOWN",
    money: { version: "catalog-money.v2", currency: "NOK", amountMinor: 4999 },
  });
  assert.equal(result.storefrontProjection.status, "PROJECTED");
  if (result.storefrontProjection.status !== "PROJECTED") return;
  assert.equal(result.storefrontProjection.product.purchasable, true);
  assert.equal(result.storefrontProjection.product.seoTitle, "Legacy Trail Shoe");
  assert.ok(
    result.storefrontProjection.product.attributes.every(
      (attribute) => !attribute.facetable && !attribute.comparable
    )
  );
});

test("legacy storefront never contains supplier product IDs, SKUs, or provider fields", () => {
  const input = legacyProduct();
  const result = adaptLegacyProductLikeToV2(input, {
    adaptedAt: ADAPTED_AT,
    publicImageUrl: "https://merchant-assets.example.invalid/trail-shoe.webp",
    publicImageRightsVerified: true,
  });
  assert.equal(result.status, "ADAPTED");
  if (result.status !== "ADAPTED") return;
  assert.equal(result.storefrontProjection.status, "PROJECTED");
  if (result.storefrontProjection.status !== "PROJECTED") return;
  const serialized = JSON.stringify(result.storefrontProjection.product);
  for (const sentinel of [
    input.externalId,
    input.sku,
    input.variants[0]!.externalVariantId,
  ]) {
    assert.equal(serialized.includes(sentinel), false);
  }
  assert.doesNotMatch(
    serialized,
    /providerKey|externalVariantId|supplierProductId|supplierName|sourceUrl/
  );
  assert.notEqual(result.storefrontProjection.product.productId, input.id);
  assert.notEqual(
    result.storefrontProjection.product.variants[0]!.variantId,
    input.variants[0]!.id
  );
});

test("legacy adaptation is deterministic because time is caller supplied", () => {
  const options = {
    adaptedAt: ADAPTED_AT,
    publicImageUrl: "https://merchant-assets.example.invalid/trail-shoe.webp",
    publicImageRightsVerified: true,
  };
  assert.deepEqual(
    adaptLegacyProductLikeToV2(legacyProduct(), options),
    adaptLegacyProductLikeToV2(structuredClone(legacyProduct()), options)
  );
});

test("legacy media defaults to rights review and therefore fails closed publicly", () => {
  const result = adaptLegacyProductLikeToV2(legacyProduct(), {
    adaptedAt: ADAPTED_AT,
    publicImageUrl: "https://merchant-assets.example.invalid/trail-shoe.webp",
  });
  assert.equal(result.status, "ADAPTED");
  if (result.status !== "ADAPTED") return;
  assert.ok(
    result.revision.media.every(
      (media) =>
        media.rights.state === "REVIEW_REQUIRED" &&
        media.publicationState === "INTERNAL_ONLY"
    )
  );
  assert.deepEqual(result.storefrontProjection, {
    status: "REFUSED",
    product: null,
    reasonCodes: ["MISSING_PUBLIC_PRIMARY_MEDIA"],
  });
});

test("unknown and legacy-only PREORDER stock map to UNKNOWN and are not sellable", () => {
  for (const stockStatus of ["NOT_A_STATE", "PREORDER"]) {
    const input = { ...legacyProduct(), stockStatus, variants: [] };
    const result = adaptLegacyProductLikeToV2(input, {
      adaptedAt: ADAPTED_AT,
      publicImageUrl: "https://merchant-assets.example.invalid/trail-shoe.webp",
      publicImageRightsVerified: true,
    });
    assert.equal(result.status, "ADAPTED");
    if (result.status !== "ADAPTED") continue;
    assert.equal(result.revision.availability, "UNKNOWN");
    assert.equal(result.storefrontProjection.status, "PROJECTED");
    if (result.storefrontProjection.status === "PROJECTED") {
      assert.equal(result.storefrontProjection.product.purchasable, false);
    }
  }
});

test("invalid legacy records and adapter options refuse without partial output", () => {
  assert.deepEqual(
    adaptLegacyProductLikeToV2({ title: "Incomplete" }, { adaptedAt: ADAPTED_AT }),
    {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_LEGACY_PRODUCT"],
    }
  );
  assert.deepEqual(
    adaptLegacyProductLikeToV2(legacyProduct(), { adaptedAt: "not-a-date" }),
    {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_ADAPTER_OPTIONS"],
    }
  );
  assert.deepEqual(
    adaptLegacyProductLikeToV2(
      { ...legacyProduct(), currency: "not-currency" },
      { adaptedAt: ADAPTED_AT }
    ),
    {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_LEGACY_PRODUCT"],
    }
  );
});

test("a supplier-ID-bearing image URL is never used as storefront media", () => {
  const result = adaptLegacyProductLikeToV2(legacyProduct(), {
    adaptedAt: ADAPTED_AT,
    publicImageRightsVerified: true,
  });
  assert.equal(result.status, "ADAPTED");
  if (result.status !== "ADAPTED") return;
  assert.equal(
    result.revision.media.some((media) =>
      media.publicUrl?.includes("SUPPLIER-PRODUCT-SENTINEL")
    ),
    false
  );
});
