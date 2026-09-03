import assert from "node:assert/strict";
import test from "node:test";
import { AliExpressProvider } from "./aliexpress-provider";
import { CjDropshippingProvider } from "./cj-provider";
import { EbayProvider } from "./ebay-provider";

test("CJ advertises only implemented order capabilities", () => {
  const provider = new CjDropshippingProvider({
    getOrderConfig: () => ({
      enabled: true,
      payType: 2,
      logisticName: "test-logistics",
      fromCountryCode: "CN",
      missingEnv: [],
    }),
  });

  assert.equal(provider.capabilities.checkout, true);
  assert.equal(provider.capabilities.tracking, false);
  assert.equal(provider.capabilities.inventory, false);
});

test("eBay cannot be feature-flagged into an unimplemented checkout", () => {
  const previous = process.env.EBAY_BUY_ORDER_ENABLED;
  process.env.EBAY_BUY_ORDER_ENABLED = "true";
  try {
    const capabilities = new EbayProvider().capabilities;
    assert.equal(capabilities.search, true);
    assert.equal(capabilities.checkout, false);
    assert.equal(capabilities.tracking, false);
    assert.equal(capabilities.inventory, false);
  } finally {
    restoreEnv("EBAY_BUY_ORDER_ENABLED", previous);
  }
});

test("AliExpress never returns hidden fixtures from the live provider key", async () => {
  const provider = new AliExpressProvider();
  assert.equal(provider.capabilities.search, false);
  assert.equal(provider.capabilities.checkout, false);
  await assert.rejects(
    provider.searchProducts({ query: "camera drone" }),
    /not configured|does not support/i
  );
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
