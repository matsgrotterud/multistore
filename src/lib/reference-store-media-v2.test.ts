import assert from "node:assert/strict";
import test from "node:test";
import { buildReferenceStoreFactoryFixturesV2 } from "./reference-store-factory-v2";
import {
  referenceStoreMediaAssetCountV2,
  resolveReferenceStoreMediaV2,
  selectReferenceStoreMediaV2,
} from "./reference-store-media-v2";

test("the local reference bundle covers every synthetic product primary", () => {
  assert.equal(referenceStoreMediaAssetCountV2, 22);
  const fixtures = buildReferenceStoreFactoryFixturesV2();
  for (const fixture of fixtures) {
    for (const product of fixture.catalog.products) {
      const media = selectReferenceStoreMediaV2(product);
      assert.ok(media, product.productId);
      assert.match(media.src, /^\/reference-store-factory-v2\//);
      assert.equal(media.width, 1254);
      assert.equal(media.height, 1254);
      assert.ok(media.altText.length > 0);
      assert.equal(media.rights, "VERIFIED_SYNTHETIC");
    }
  }
});

test("every apparel variant resolves through its exact media binding", () => {
  const apparel = buildReferenceStoreFactoryFixturesV2().find(
    (fixture) => fixture.key === "apparel"
  );
  assert.ok(apparel);
  for (const product of apparel.catalog.products) {
    for (const variant of product.variants) {
      const selected = selectReferenceStoreMediaV2(product, variant.variantId);
      assert.ok(selected, variant.variantId);
      assert.ok(selected.variantIds.includes(variant.variantId));
      assert.ok(variant.mediaIds.includes(selected.mediaId));
    }
  }
});

test("unreviewed remote media is refused rather than fetched", () => {
  const product = structuredClone(
    buildReferenceStoreFactoryFixturesV2()[0].catalog.products[0]
  );
  product.media[0].mediaId = "media:unreviewed:remote";
  assert.equal(
    resolveReferenceStoreMediaV2(product, product.media[0]),
    null
  );
});
