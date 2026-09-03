import assert from "node:assert/strict";
import test from "node:test";
import {
  canApplyStripeAuthorization,
  canApplyStripeCapture,
  canApplyPreFulfillmentPaymentFailure,
  shouldInvokeOrderRouting,
} from "./order-payment-state";

test("confirmed orders enter routing and claimed orders may safely resume", () => {
  assert.equal(shouldInvokeOrderRouting("CONFIRMED"), true);
  assert.equal(shouldInvokeOrderRouting("FULFILLMENT_ROUTING"), true);
  for (const status of [
    "DRAFT",
    "FULFILLMENT_PENDING",
    "SUPPLIER_ORDERED",
    "ERROR",
    "CANCELLED",
  ]) {
    assert.equal(shouldInvokeOrderRouting(status), false);
  }
});

test("payment failures cannot regress captured or fulfillment-started orders", () => {
  assert.equal(
    canApplyPreFulfillmentPaymentFailure({
      orderStatus: "CONFIRMED",
      fulfillmentStatus: "NOT_STARTED",
      paymentStatus: "AUTHORIZED",
    }),
    true
  );
  assert.equal(
    canApplyPreFulfillmentPaymentFailure({
      orderStatus: "CONFIRMED",
      fulfillmentStatus: "NOT_STARTED",
      paymentStatus: "CAPTURED",
    }),
    false
  );
  assert.equal(
    canApplyPreFulfillmentPaymentFailure({
      orderStatus: "FULFILLMENT_ROUTING",
      fulfillmentStatus: "PENDING",
      paymentStatus: "AUTHORIZED",
    }),
    false
  );
});

test("authorization can only advance an unpaid pre-fulfillment order", () => {
  assert.equal(
    canApplyStripeAuthorization({
      orderStatus: "DRAFT",
      fulfillmentStatus: "NOT_STARTED",
      paymentStatus: "UNPAID",
    }),
    true
  );
  assert.equal(
    canApplyStripeAuthorization({
      orderStatus: "FULFILLMENT_ROUTING",
      fulfillmentStatus: "PENDING",
      paymentStatus: "FAILED",
    }),
    false
  );
});

test("capture acknowledgement cannot revive a terminal order", () => {
  assert.equal(
    canApplyStripeCapture({
      orderStatus: "FULFILLMENT_ROUTING",
      paymentStatus: "AUTHORIZED",
    }),
    true
  );
  assert.equal(
    canApplyStripeCapture({
      orderStatus: "ERROR",
      paymentStatus: "FAILED",
    }),
    false
  );
  assert.equal(
    canApplyStripeCapture({
      orderStatus: "CANCELLED",
      paymentStatus: "CANCELLED",
    }),
    false
  );
});
