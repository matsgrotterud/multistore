import assert from "node:assert/strict";
import test from "node:test";
import { checkoutTenantMatches } from "./checkout-tenant";

test("production checkout is bound to the Host-resolved tenant", () => {
  assert.equal(
    checkoutTenantMatches({
      isProduction: true,
      requestedStoreSlug: "store-a",
      hostStoreSlug: "store-a",
    }),
    true
  );
  assert.equal(
    checkoutTenantMatches({
      isProduction: true,
      requestedStoreSlug: "store-a",
      hostStoreSlug: "store-b",
    }),
    false
  );
  assert.equal(
    checkoutTenantMatches({
      isProduction: true,
      requestedStoreSlug: "store-a",
      hostStoreSlug: null,
    }),
    false
  );
});

test("localhost preview keeps its explicit store-slug workflow", () => {
  assert.equal(
    checkoutTenantMatches({
      isProduction: false,
      requestedStoreSlug: "store-a",
      hostStoreSlug: null,
    }),
    true
  );
});
