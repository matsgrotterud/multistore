import assert from "node:assert/strict";
import test from "node:test";
import { decideAdminStoreRoutingMutation } from "./store-routing-policy";

test("DRAFT settings cannot activate a tenant or mutate routing authority", () => {
  assert.deepEqual(
    decideAdminStoreRoutingMutation({
      launchStatus: "DRAFT",
      currentPrimaryDomain: "safe.preview.example",
      requestedPrimaryDomain: "attacker.example.com",
      requestedIsActive: true,
      requestedAdditionalDomains: ["also.example.com"],
    }),
    {
      primaryDomain: "safe.preview.example",
      isActive: false,
      mutateDomainRows: false,
      hostnames: [],
    }
  );
});

test("non-DRAFT routing normalizes and deduplicates requested hostnames", () => {
  assert.deepEqual(
    decideAdminStoreRoutingMutation({
      launchStatus: "PREVIEW",
      currentPrimaryDomain: "old.example.com",
      requestedPrimaryDomain: "Shop.Example.com",
      requestedIsActive: true,
      requestedAdditionalDomains: [" shop.example.com ", "ALT.EXAMPLE.COM"],
    }),
    {
      primaryDomain: "shop.example.com",
      isActive: true,
      mutateDomainRows: true,
      hostnames: ["shop.example.com", "alt.example.com"],
    }
  );
});
