import assert from "node:assert/strict";
import test from "node:test";
import { isProductCheckoutAvailable } from "./checkout-availability";

const manualProduct = {
  fulfillmentMode: "MANUAL",
  providerKey: null,
  externalId: null,
};

test("explicit mock checkout makes a manual demo product cart-eligible", () => {
  assert.equal(
    isProductCheckoutAvailable(manualProduct, { MOCK_CHECKOUT: "true" }),
    true
  );
});

test("manual products remain unavailable to live checkout unless explicitly enabled", () => {
  assert.equal(isProductCheckoutAvailable(manualProduct, {}), false);
  assert.equal(
    isProductCheckoutAvailable(manualProduct, {
      MOCK_CHECKOUT: "false",
      MANUAL_FULFILLMENT_ENABLED: "true",
    }),
    true
  );
});

test("affiliate products stay external even while mock checkout is enabled", () => {
  assert.equal(
    isProductCheckoutAvailable(
      { fulfillmentMode: "AFFILIATE", providerKey: "ebay", externalId: "listing-1" },
      { MOCK_CHECKOUT: "true" }
    ),
    false
  );
});

test("mock fulfillment products cannot leak into live payment", () => {
  assert.equal(
    isProductCheckoutAvailable(
      { fulfillmentMode: "MOCK", providerKey: "mock", externalId: "mock-1" },
      { MOCK_CHECKOUT: "false" }
    ),
    false
  );
});

test("CJ dropship checkout requires the complete live order configuration", () => {
  const cjProduct = {
    fulfillmentMode: "DROPSHIP",
    providerKey: "cj",
    externalId: "cj-product-1",
  };

  assert.equal(
    isProductCheckoutAvailable(cjProduct, {
      CJ_ENABLED: "true",
      CJ_ORDER_API_ENABLED: "true",
    }),
    false
  );
  assert.equal(
    isProductCheckoutAvailable(cjProduct, {
      CJ_ENABLED: "true",
      CJ_ORDER_API_ENABLED: "true",
      CJ_API_KEY: "configured",
      CJ_LOGISTIC_NAME: "tracked-route",
      CJ_FROM_COUNTRY_CODE: "CN",
      CJ_ORDER_PAY_TYPE: "3",
    }),
    false
  );
  assert.equal(
    isProductCheckoutAvailable(cjProduct, {
      CJ_ENABLED: "true",
      CJ_ORDER_API_ENABLED: "true",
      CJ_API_KEY: "configured",
      CJ_LOGISTIC_NAME: "tracked-route",
      CJ_FROM_COUNTRY_CODE: "CN",
      CJ_ORDER_PAY_TYPE: "2",
    }),
    true
  );
});
