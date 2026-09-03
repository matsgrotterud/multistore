import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutFinalizationSecret,
  createCheckoutFinalizationToken,
  verifyCheckoutFinalizationToken,
} from "./checkout-finalization";

const SECRET = "s".repeat(32);
const NOW = new Date("2026-08-25T12:00:00.000Z");

test("finalization capability is bound to order, intent and expiry", () => {
  const token = createCheckoutFinalizationToken({
    orderId: "order-1",
    paymentIntentId: "pi_1",
    secret: SECRET,
    now: NOW,
    ttlMs: 60_000,
  });

  assert.equal(
    verifyCheckoutFinalizationToken({
      token,
      orderId: "order-1",
      paymentIntentId: "pi_1",
      secret: SECRET,
      now: new Date(NOW.getTime() + 59_999),
    }),
    true
  );
  for (const attempt of [
    { orderId: "order-2", paymentIntentId: "pi_1", now: NOW },
    { orderId: "order-1", paymentIntentId: "pi_2", now: NOW },
    {
      orderId: "order-1",
      paymentIntentId: "pi_1",
      now: new Date(NOW.getTime() + 60_001),
    },
  ]) {
    assert.equal(
      verifyCheckoutFinalizationToken({ token, secret: SECRET, ...attempt }),
      false
    );
  }
});

test("tampered or malformed capability fails closed", () => {
  const token = createCheckoutFinalizationToken({
    orderId: "order-1",
    paymentIntentId: "pi_1",
    secret: SECRET,
    now: NOW,
  });
  const [encoded, signature] = token.split(".");
  const tamperedPayload = `${encoded.slice(0, -1)}${
    encoded.endsWith("A") ? "B" : "A"
  }.${signature}`;
  for (const candidate of [
    `${token}x`,
    tamperedPayload,
    "not-a-token",
    "",
  ]) {
    assert.equal(
      verifyCheckoutFinalizationToken({
        token: candidate,
        orderId: "order-1",
        paymentIntentId: "pi_1",
        secret: SECRET,
        now: NOW,
      }),
      false
    );
  }
});

test("production refuses a missing or weak finalization secret", () => {
  assert.equal(checkoutFinalizationSecret({ NODE_ENV: "production" }), null);
  assert.equal(
    checkoutFinalizationSecret({
      NODE_ENV: "production",
      CHECKOUT_FINALIZATION_SECRET: "short",
    }),
    null
  );
  assert.equal(
    checkoutFinalizationSecret({
      NODE_ENV: "production",
      CHECKOUT_FINALIZATION_SECRET: SECRET,
    }),
    SECRET
  );
  assert.ok(checkoutFinalizationSecret({ NODE_ENV: "development" }));
});
