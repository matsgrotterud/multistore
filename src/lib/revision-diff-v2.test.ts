import assert from "node:assert/strict";
import test from "node:test";
import { diffStoreRevisionV2 } from "./revision-diff-v2";

test("revision diff is stable and reports nested additions, removals and changes", () => {
  const result = diffStoreRevisionV2(
    { tokens: { primary: "blue", radius: "soft" }, blocks: ["hero", "grid"] },
    { tokens: { primary: "green", spacing: "airy" }, blocks: ["hero", "faq"] }
  );

  assert.deepEqual(
    result.entries.map((entry) => [entry.path, entry.kind]),
    [
      ["$.blocks[1]", "CHANGED"],
      ["$.tokens.primary", "CHANGED"],
      ["$.tokens.radius", "REMOVED"],
      ["$.tokens.spacing", "ADDED"],
    ]
  );
  assert.equal(result.totalChanges, 4);
  assert.equal(result.truncated, false);
});

test("revision diff reports equality and caps display without losing total", () => {
  assert.deepEqual(diffStoreRevisionV2({ a: 1 }, { a: 1 }), {
    version: "store-revision-diff.v2",
    changed: false,
    totalChanges: 0,
    truncated: false,
    entries: [],
  });

  const capped = diffStoreRevisionV2(
    { a: 1, b: 2, c: 3 },
    { a: 2, b: 3, c: 4 },
    { maxEntries: 2 }
  );
  assert.equal(capped.entries.length, 2);
  assert.equal(capped.totalChanges, 3);
  assert.equal(capped.truncated, true);
});
