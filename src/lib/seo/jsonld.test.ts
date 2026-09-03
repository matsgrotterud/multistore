import assert from "node:assert/strict";
import test from "node:test";
import { productJsonLd } from "./jsonld";

test("product JSON-LD never exposes a supplier-derived SKU", () => {
  const productWithSupplierSku = {
    slug: "safe-product",
    title: "Safe product",
    shortDescription: "Public description",
    imageUrl: "/safe-product.webp",
    brand: "Safe Store",
    gtin: null,
    price: 49,
    currency: "NOK",
    stockStatus: "IN_STOCK",
    ratingAverage: null,
    ratingCount: 0,
    sku: "SUPPLIER-SKU-SENTINEL",
  };
  const structuredData = productJsonLd(
    {
      slug: "safe-store",
      launchStatus: "PREVIEW",
      primaryDomain: "safe-store.test",
      plannedDomain: "safe-store.test",
      legalName: "Safe Store AS",
    },
    productWithSupplierSku
  );

  const serialized = JSON.stringify(structuredData);
  assert.equal("sku" in structuredData, false);
  assert.equal(serialized.includes("SUPPLIER-SKU-SENTINEL"), false);
});
