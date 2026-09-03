import assert from "node:assert/strict";
import test from "node:test";
import {
  contentPageRequiresNoindex,
  includeNoindexSingletonContent,
} from "./storefront-content-policy";

test("LIVE homepages suppress noindex singleton fragments while previews may show them", () => {
  assert.equal(includeNoindexSingletonContent("LIVE"), false);
  assert.equal(includeNoindexSingletonContent("PREVIEW"), true);
  assert.equal(includeNoindexSingletonContent("DRAFT"), true);
});

test("content route metadata honors persisted publication and noindex state", () => {
  assert.equal(
    contentPageRequiresNoindex({ isPublished: true, noindex: true }),
    true
  );
  assert.equal(
    contentPageRequiresNoindex({ isPublished: false, noindex: false }),
    true
  );
  assert.equal(
    contentPageRequiresNoindex({ isPublished: true, noindex: false }),
    false
  );
  assert.equal(contentPageRequiresNoindex(null), false);
});
