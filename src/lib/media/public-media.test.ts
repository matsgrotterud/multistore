import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCT_IMAGE_FALLBACK,
  isFirstPartyMediaUrl,
  selectPublicProductImage,
} from "./public-media";

test("supplier URLs are never used without stored provenance", () => {
  assert.equal(isFirstPartyMediaUrl("https://supplier.test/id.jpg"), false);
  assert.equal(isFirstPartyMediaUrl("//supplier.test/id.jpg"), false);
  assert.equal(
    selectPublicProductImage({
      productImageUrl: "https://supplier.test/opaque-id.jpg",
    }),
    PRODUCT_IMAGE_FALLBACK
  );
});

test("stored assets win and first-party fallbacks remain available", () => {
  assert.equal(
    selectPublicProductImage({
      productImageUrl: "/catalog/local.webp",
      storedAssetUrls: ["https://merchant-assets.test/product.webp"],
    }),
    "https://merchant-assets.test/product.webp"
  );
  assert.equal(
    selectPublicProductImage({ productImageUrl: "/catalog/local.webp" }),
    "/catalog/local.webp"
  );
});
