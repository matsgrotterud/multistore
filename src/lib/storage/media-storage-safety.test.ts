import assert from "node:assert/strict";
import test from "node:test";
import { isStoredMediaUrlUsable } from "./media-storage-safety";

test("Blob-backed imports reject legacy local asset URLs", () => {
  assert.equal(
    isStoredMediaUrlUsable("/uploads/dev-media/legacy-image.webp", "vercel-blob"),
    false
  );
  assert.equal(isStoredMediaUrlUsable("/api/placeholder?label=Legacy", "vercel-blob"), false);
});

test("Blob-backed imports accept durable absolute asset URLs", () => {
  assert.equal(
    isStoredMediaUrlUsable(
      "https://store.public.blob.vercel-storage.com/media/image.webp",
      "vercel-blob"
    ),
    true
  );
});

test("local development may reuse local assets but never an empty URL", () => {
  assert.equal(isStoredMediaUrlUsable("/uploads/dev-media/image.webp", "local"), true);
  assert.equal(isStoredMediaUrlUsable(null, "local"), false);
  assert.equal(isStoredMediaUrlUsable("", "vercel-blob"), false);
});
