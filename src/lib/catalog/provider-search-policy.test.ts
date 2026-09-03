import assert from "node:assert/strict";
import test from "node:test";
import {
  ProviderSearchFailure,
  classifyProviderSearchError,
  runProviderSearchWithPolicy,
} from "./provider-search-policy";

test("classifies provider failures without turning them into zero results", () => {
  assert.deepEqual(classifyProviderSearchError(new Error("429 rate limit")), {
    status: "RATE_LIMITED",
    code: "PROVIDER_RATE_LIMIT",
    retryable: true,
  });
  assert.equal(classifyProviderSearchError(new Error("authentication failed")).retryable, false);
  assert.equal(classifyProviderSearchError(new Error("request timed out")).status, "TIMEOUT");
});

test("retries a bounded transient failure and preserves attempt evidence", async () => {
  let calls = 0;
  let clock = 1_000_000;
  const result = await runProviderSearchWithPolicy({
    providerKey: "mock",
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
    search: async () => {
      calls += 1;
      if (calls < 3) throw new Error("request timed out");
      return [];
    },
  });

  assert.equal(calls, 3);
  assert.deepEqual(result.attempts.map((attempt) => attempt.status), [
    "TIMEOUT",
    "TIMEOUT",
    "ZERO_RESULTS",
  ]);
});

test("throws typed failure after bounded retries", async () => {
  let calls = 0;
  await assert.rejects(
    runProviderSearchWithPolicy({
      providerKey: "mock",
      maxAttempts: 2,
      sleep: async () => undefined,
      search: async () => {
        calls += 1;
        throw new Error("upstream unavailable");
      },
    }),
    (error) =>
      error instanceof ProviderSearchFailure &&
      error.attempts.length === 2 &&
      error.attempts.every((attempt) => attempt.status === "FAILED")
  );
  assert.equal(calls, 2);
});

test("a hung provider search is bounded and classified as a timeout", async () => {
  await assert.rejects(
    runProviderSearchWithPolicy({
      providerKey: "ebay",
      query: "timeout fixture",
      maxAttempts: 1,
      timeoutMs: 100,
      search: () => new Promise(() => undefined),
    }),
    (error: unknown) =>
      error instanceof ProviderSearchFailure &&
      error.attempts.length === 1 &&
      error.attempts[0].status === "TIMEOUT" &&
      error.attempts[0].errorCode === "PROVIDER_TIMEOUT"
  );
});
