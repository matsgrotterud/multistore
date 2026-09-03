import assert from "node:assert/strict";
import test from "node:test";
import { canAcceptTrackedTenant } from "./track-tenant";

test("production tracking requires the request host to resolve to the same store", () => {
  assert.equal(
    canAcceptTrackedTenant({
      production: true,
      requestedStoreSlug: "store-a",
      resolvedHostStoreSlug: "store-a",
    }),
    true
  );
  assert.equal(
    canAcceptTrackedTenant({
      production: true,
      requestedStoreSlug: "store-b",
      resolvedHostStoreSlug: "store-a",
    }),
    false
  );
  assert.equal(
    canAcceptTrackedTenant({
      production: true,
      requestedStoreSlug: "store-a",
      resolvedHostStoreSlug: null,
    }),
    false
  );
});

test("development keeps explicit local store previews usable", () => {
  assert.equal(
    canAcceptTrackedTenant({
      production: false,
      requestedStoreSlug: "preview-store",
      resolvedHostStoreSlug: null,
    }),
    true
  );
});
