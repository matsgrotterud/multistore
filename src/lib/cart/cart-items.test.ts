import assert from "node:assert/strict";
import test from "node:test";
import { hydrateCartItems } from "./cart-items";

test("legacy cart hydration drops supplier and internal catalog fields", () => {
  const items = hydrateCartItems([
    {
      productId: "product-internal-id",
      variantId: "variant-internal-id",
      slug: "safe-product",
      categorySlug: "all-products",
      title: "Safe product",
      variantTitle: "Blue / 38",
      optionSummary: "Blue / 38",
      sku: "SUPPLIER-SKU-SENTINEL",
      externalVariantId: "EXTERNAL-VARIANT-SENTINEL",
      providerKey: "SUPPLIER-PROVIDER-SENTINEL",
      productScore: 99,
      price: 49,
      currency: "NOK",
      imageUrl: "/product.webp",
      imageAlt: "Safe product",
      shippingDaysMin: 5,
      shippingDaysMax: 9,
      quantity: 2,
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.lineId, "product-internal-id:variant-internal-id");
  assert.equal(items[0]?.variantId, "variant-internal-id");
  assert.equal(items[0]?.optionSummary, "Blue / 38");
  assert.equal(items[0]?.quantity, 2);
  const serialized = JSON.stringify(items);
  assert.equal(serialized.includes("SUPPLIER-"), false);
  assert.equal(serialized.includes("EXTERNAL-VARIANT-SENTINEL"), false);
  assert.equal(serialized.includes("productScore"), false);
});
