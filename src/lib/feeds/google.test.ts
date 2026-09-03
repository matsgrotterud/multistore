import assert from "node:assert/strict";
import test from "node:test";
import { evaluateGoogleFeedEligibility, merchantProductId } from "./google";

test("Google feed identity uses the internal product ID, not supplier SKU", () => {
  const product = {
    id: "merchant-product-id",
    sku: "SUPPLIER-SKU-SENTINEL",
  };

  assert.equal(merchantProductId(product), "merchant-product-id");
  assert.notEqual(merchantProductId(product), product.sku);
});

test("feed fails closed for variants, missing stored media and unavailable checkout", () => {
  const decision = evaluateGoogleFeedEligibility({
    storeLive: true,
    published: true,
    noindex: false,
    commerceEligible: true,
    catalogFresh: true,
    checkoutAvailable: false,
    currencyMatches: true,
    stockStatus: "IN_STOCK",
    variantCount: 2,
    storedImageAvailable: false,
    supplierRouteReady: true,
    shippingWithinLimit: true,
  });
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.reasonCodes, [
    "CHECKOUT_UNAVAILABLE",
    "VARIANT_FEED_NOT_SUPPORTED",
    "STORED_IMAGE_MISSING",
  ]);
});

test("feed excludes products without current supplier and catalog evidence", () => {
  const decision = evaluateGoogleFeedEligibility({
    storeLive: true,
    published: true,
    noindex: false,
    commerceEligible: true,
    catalogFresh: false,
    checkoutAvailable: true,
    currencyMatches: true,
    stockStatus: "IN_STOCK",
    variantCount: 0,
    storedImageAvailable: true,
    supplierRouteReady: true,
    shippingWithinLimit: true,
  });
  assert.deepEqual(decision.reasonCodes, [
    "CATALOG_FRESHNESS_NOT_VERIFIED",
  ]);
});
