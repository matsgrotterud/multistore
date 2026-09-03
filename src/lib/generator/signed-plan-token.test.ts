import assert from "node:assert/strict";
import test from "node:test";
import {
  fingerprintGeneratorRequest,
  signGeneratorPayload,
  verifyGeneratorPayload,
} from "./signed-plan-token";

const secret = "test-only-generator-secret-123456";

test("signed generator payload round-trips and expires", () => {
  const token = signGeneratorPayload(
    "APPROVED_PLAN",
    { productClass: "custom.cowboy-hats", policy: "MANUAL_REVIEW_REQUIRED" },
    { secret, now: 1_000, ttlMs: 60_000 }
  );
  assert.deepEqual(
    verifyGeneratorPayload(token, "APPROVED_PLAN", { secret, now: 30_000 }),
    { productClass: "custom.cowboy-hats", policy: "MANUAL_REVIEW_REQUIRED" }
  );
  assert.throws(
    () => verifyGeneratorPayload(token, "APPROVED_PLAN", { secret, now: 61_001 }),
    /expired/
  );
});

test("signed generator payload rejects tampering and cross-kind reuse", () => {
  const token = signGeneratorPayload("CLASS_PROPOSAL", { niche: "cowboy hats" }, { secret });
  const [payload, signature] = token.split(".");
  assert.throws(
    () => verifyGeneratorPayload(`${payload}x.${signature}`, "CLASS_PROPOSAL", { secret }),
    /signature/
  );
  assert.throws(
    () => verifyGeneratorPayload(token, "APPROVED_PLAN", { secret }),
    /wrong type/
  );
});

test("production signing rejects development-strength secrets", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  mutableEnv.NODE_ENV = "production";
  try {
    assert.throws(
      () =>
        signGeneratorPayload(
          "APPROVED_PLAN",
          { productClass: "custom.cowboy-hats" },
          { secret: "only-twelve!" }
        ),
      /not configured/
    );
    assert.doesNotThrow(() =>
      signGeneratorPayload(
        "APPROVED_PLAN",
        { productClass: "custom.cowboy-hats" },
        { secret }
      )
    );
  } finally {
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousNodeEnv;
  }
});

test("request fingerprint is stable across object key order and changes with options", () => {
  const first = fingerprintGeneratorRequest({ plan: { b: 2, a: 1 }, demo: false });
  const reordered = fingerprintGeneratorRequest({ demo: false, plan: { a: 1, b: 2 } });
  const changed = fingerprintGeneratorRequest({ plan: { a: 1, b: 2 }, demo: true });
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});
