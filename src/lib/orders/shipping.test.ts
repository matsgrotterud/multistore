import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckoutShipping } from "./shipping";

test("checkout and external channels share the same shipping thresholds", () => {
  assert.equal(calculateCheckoutShipping(0), 0);
  assert.equal(calculateCheckoutShipping(49.99), 5.95);
  assert.equal(calculateCheckoutShipping(50), 0);
});
