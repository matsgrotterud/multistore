import assert from "node:assert/strict";
import test from "node:test";
import { toClientProduct } from "./client-product";

test("client projection strips supplier identifiers and internal ranking", () => {
  const supplierSku = "SUPPLIER-SKU-SENTINEL";
  const externalVariantId = "EXTERNAL-VARIANT-SENTINEL";
  const source = {
    id: "product-internal-id",
    slug: "safe-product",
    category: { slug: "all-products" },
    title: "Safe product",
    subtitle: "Public subtitle",
    brand: "Merchant brand",
    imageUrl: "https://merchant-assets.test/product.webp",
    imageAlt: "Safe product",
    price: 49,
    compareAtPrice: null,
    currency: "NOK",
    stockStatus: "IN_STOCK",
    shippingDaysMin: 5,
    shippingDaysMax: 9,
    countryOfOrigin: "CN",
    useCases: '["indoor"]',
    fulfillmentMode: "DROPSHIP",
    affiliateUrl: null,
    providerKey: "SUPPLIER-PROVIDER-SENTINEL",
    externalId: "SUPPLIER-PRODUCT-SENTINEL",
    productScore: 99,
    cost: 1,
    checkoutAvailable: true,
    variants: [
      {
        id: "variant-internal-id",
        title: supplierSku,
        optionSummary: externalVariantId,
        optionsJson: JSON.stringify({ Size: "38", Internal: supplierSku }),
        sku: supplierSku,
        externalVariantId,
        price: 55,
        compareAtPrice: 65,
        stockStatus: "IN_STOCK",
        imageUrl: `https://supplier.test/${externalVariantId}.jpg`,
        isDefault: true,
      },
    ],
  };

  const projected = toClientProduct(source);
  const serialized = JSON.stringify(projected);
  const productRecord = projected as unknown as Record<string, unknown>;
  const variantRecord = projected.variants[0] as unknown as Record<string, unknown>;

  assert.equal("providerKey" in productRecord, false);
  assert.equal("productScore" in productRecord, false);
  assert.equal("sku" in variantRecord, false);
  assert.equal("externalVariantId" in variantRecord, false);
  assert.equal(serialized.includes("SUPPLIER-"), false);
  assert.equal(serialized.includes("EXTERNAL-VARIANT-SENTINEL"), false);
  assert.deepEqual(projected.variants[0]?.options, { Size: "38" });
  assert.equal(projected.variants[0]?.title, "Option 1");
  assert.equal(projected.variants[0]?.optionSummary, "Option 1");
  assert.equal(projected.variants[0]?.id, "variant-internal-id");
  assert.equal(projected.variants[0]?.imageUrl, source.imageUrl);
  assert.equal(projected.checkoutAvailable, true);
});

test("supplier identifiers embedded in labels and options are redacted", () => {
  const source = {
    id: "product-id",
    slug: "safe-product",
    category: { slug: "all-products" },
    title: "Safe product",
    subtitle: "Public subtitle",
    brand: "Merchant brand",
    imageUrl: "/product.webp",
    imageAlt: "Safe product",
    price: 49,
    compareAtPrice: null,
    currency: "NOK",
    stockStatus: "IN_STOCK",
    shippingDaysMin: 5,
    shippingDaysMax: 9,
    countryOfOrigin: "CN",
    useCases: "[]",
    fulfillmentMode: "DROPSHIP",
    affiliateUrl: null,
    checkoutAvailable: true,
    variants: [{
      id: "variant-id",
      title: "Blue - SKU-SECRET-123",
      optionSummary: "Blue EXTERNAL-VARIANT-123",
      optionsJson: JSON.stringify({
        Color: "Blue SKU-SECRET-123",
        "EXTERNAL-VARIANT-123 code": "Blue",
      }),
      sku: "SKU-SECRET-123",
      externalVariantId: "EXTERNAL-VARIANT-123",
      price: 55,
      compareAtPrice: null,
      stockStatus: "IN_STOCK",
      imageUrl: null,
      isDefault: true,
    }],
  };

  const serialized = JSON.stringify(toClientProduct(source));
  assert.equal(serialized.includes("SKU-SECRET-123"), false);
  assert.equal(serialized.includes("EXTERNAL-VARIANT-123"), false);
  assert.match(serialized, /Blue/);
});
