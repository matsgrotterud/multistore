import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStoreFactoryV2PreviewSearchParams,
  parseStoreFactoryV2PreviewUrl,
} from "./preview-query";

test("reference preview accepts only its exact optional-mode query shape", () => {
  assert.deepEqual(
    parseStoreFactoryV2PreviewUrl(
      "/admin-preview/store-factory-v2?fixture=drones&revision=reference-drones-revision-1"
    ),
    {
      mode: "reference",
      fixture: "drones",
      revisionId: "reference-drones-revision-1",
    }
  );
  assert.deepEqual(
    parseStoreFactoryV2PreviewSearchParams({
      mode: "reference",
      fixture: "apparel",
    }),
    { mode: "reference", fixture: "apparel" }
  );
  assert.equal(
    parseStoreFactoryV2PreviewUrl(
      "/admin-preview/store-factory-v2?fixture=drones&store=foreign-store"
    ),
    null
  );
  assert.equal(
    parseStoreFactoryV2PreviewSearchParams({
      mode: "unexpected",
      fixture: "drones",
    }),
    null
  );
});

test("persisted preview requires store and revision and rejects branch extras", () => {
  assert.deepEqual(
    parseStoreFactoryV2PreviewUrl(
      "/admin-preview/store-factory-v2?mode=persisted&store=bamboo-haven&revision=revision-2"
    ),
    {
      mode: "persisted",
      storeSlug: "bamboo-haven",
      revisionId: "revision-2",
    }
  );
  assert.equal(
    parseStoreFactoryV2PreviewUrl(
      "/admin-preview/store-factory-v2?mode=persisted&store=bamboo-haven"
    ),
    null
  );
  assert.equal(
    parseStoreFactoryV2PreviewSearchParams({
      mode: "persisted",
      store: "bamboo-haven",
      revision: "revision-2",
      fixture: "drones",
    }),
    null
  );
});

test("duplicates, extra keys, fragments, external URLs and unsafe identifiers fail closed", () => {
  for (const value of [
    "/admin-preview/store-factory-v2?fixture=drones&fixture=apparel",
    "/admin-preview/store-factory-v2?fixture=drones&next=/api/checkout",
    "/admin-preview/store-factory-v2?fixture=drones#revision-2",
    "/admin-preview/store-factory-v2?fixture=unknown",
    "/admin-preview/store-factory-v2?fixture=drones&revision=../../escape",
    "https://example.com/admin-preview/store-factory-v2?fixture=drones",
    "//example.com/admin-preview/store-factory-v2?fixture=drones",
    "/api/checkout?fixture=drones",
  ]) {
    assert.equal(parseStoreFactoryV2PreviewUrl(value), null, value);
  }
  assert.equal(
    parseStoreFactoryV2PreviewSearchParams({
      fixture: ["drones", "apparel"],
    }),
    null
  );
  assert.equal(
    parseStoreFactoryV2PreviewSearchParams({
      mode: "persisted",
      store: "Bamboo Haven",
      revision: "revision-2",
    }),
    null
  );
});
