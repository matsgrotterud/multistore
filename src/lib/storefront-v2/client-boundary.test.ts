import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientGraphSources = [
  new URL("./catalog-context.ts", import.meta.url),
  new URL("./generator.ts", import.meta.url),
  new URL("./render-document.ts", import.meta.url),
  new URL("./client-digest.ts", import.meta.url),
  new URL(
    "../../components/storefront-v2/StoreExperienceRenderer.tsx",
    import.meta.url
  ),
  new URL(
    "../../components/storefront-v2/StoreExperienceAdminPreview.tsx",
    import.meta.url
  ),
];

test("client-facing Storefront V2 modules do not import the server catalog barrel", () => {
  for (const sourceUrl of clientGraphSources) {
    const source = readFileSync(sourceUrl, "utf8");
    assert.doesNotMatch(source, /from\s+["']@\/lib\/catalog-v2(?:\/index)?["']/);
    assert.doesNotMatch(source, /from\s+["']@\/lib\/store-factory-v2/);
    assert.doesNotMatch(source, /from\s+["']node:/);
  }
});
