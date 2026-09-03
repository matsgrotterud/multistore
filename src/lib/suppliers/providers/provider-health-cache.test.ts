import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedProviderHealth,
  resetProviderHealthCacheForTests,
} from "./provider-health-cache";
import type {
  CommerceProvider,
  ProviderCapabilities,
} from "./types";

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: false,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: false,
};

function provider(counter: { calls: number }, reject = false): CommerceProvider {
  return {
    key: "cj",
    name: "CJ test double",
    capabilities,
    defaultFulfillmentMode: "DROPSHIP",
    async getHealth() {
      counter.calls += 1;
      if (reject) throw new Error("canary unavailable");
      return {
        key: "cj",
        name: "CJ test double",
        status: "OK",
        message: "Ready",
        capabilities,
        defaultFulfillmentMode: "DROPSHIP",
      };
    },
    async searchProducts() {
      return [];
    },
    async getProductDetails() {
      throw new Error("not used");
    },
    async getProductMedia() {
      return [];
    },
  };
}

test("provider health calls are coalesced within the bounded TTL", async () => {
  resetProviderHealthCacheForTests();
  const counter = { calls: 0 };
  const adapter = provider(counter);

  const [first, second] = await Promise.all([
    getCachedProviderHealth(adapter, { nowMs: 1_000, ttlMs: 60_000 }),
    getCachedProviderHealth(adapter, { nowMs: 1_000, ttlMs: 60_000 }),
  ]);
  const cached = await getCachedProviderHealth(adapter, {
    nowMs: 60_999,
    ttlMs: 60_000,
  });
  const refreshed = await getCachedProviderHealth(adapter, {
    nowMs: 61_000,
    ttlMs: 60_000,
  });

  assert.equal(first.status, "OK");
  assert.equal(second.status, "OK");
  assert.equal(cached.status, "OK");
  assert.equal(refreshed.status, "OK");
  assert.equal(counter.calls, 2);
});

test("rejected health calls are not cached", async () => {
  resetProviderHealthCacheForTests();
  const counter = { calls: 0 };
  const adapter = provider(counter, true);

  await assert.rejects(
    getCachedProviderHealth(adapter, { nowMs: 1_000 }),
    /canary unavailable/
  );
  await assert.rejects(
    getCachedProviderHealth(adapter, { nowMs: 1_001 }),
    /canary unavailable/
  );
  assert.equal(counter.calls, 2);
});
