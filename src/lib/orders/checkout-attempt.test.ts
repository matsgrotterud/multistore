import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutOrderId,
  isReusableCheckoutPaymentIntentStatus,
} from "./checkout-attempt";

test("checkout attempts are deterministic per store and isolated across stores", () => {
  const first = checkoutOrderId("store-a", "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(
    first,
    checkoutOrderId("store-a", "550e8400-e29b-41d4-a716-446655440000")
  );
  assert.notEqual(
    first,
    checkoutOrderId("store-b", "550e8400-e29b-41d4-a716-446655440000")
  );
  assert.match(first, /^checkout_[a-f0-9]{40}$/);
});

test("only confirmable PaymentIntent states can be reused by checkout POST", () => {
  for (const status of [
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
  ]) {
    assert.equal(isReusableCheckoutPaymentIntentStatus(status), true, status);
  }

  for (const status of [
    "processing",
    "requires_capture",
    "succeeded",
    "canceled",
    "unknown",
  ]) {
    assert.equal(isReusableCheckoutPaymentIntentStatus(status), false, status);
  }
});
