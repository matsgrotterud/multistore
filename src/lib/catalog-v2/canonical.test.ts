import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeCatalogValue,
  canonicalizeProductRevisionV2,
  digestCatalogValue,
  digestProductRevisionV2,
  droneCatalogFixtureV2,
} from "./index";

test("canonical JSON sorts object keys recursively and preserves array order", () => {
  const left = { z: 3, nested: { b: 2, a: 1 }, list: ["b", "a"] };
  const right = { list: ["b", "a"], nested: { a: 1, b: 2 }, z: 3 };
  assert.equal(
    canonicalizeCatalogValue(left),
    '{"list":["b","a"],"nested":{"a":1,"b":2},"z":3}'
  );
  assert.equal(canonicalizeCatalogValue(left), canonicalizeCatalogValue(right));
  assert.equal(digestCatalogValue(left), digestCatalogValue(right));
  assert.notEqual(digestCatalogValue(["a", "b"]), digestCatalogValue(["b", "a"]));
});

test("digest uses the stable self-describing SHA-256 representation", () => {
  assert.equal(
    digestCatalogValue({ b: 2, a: 1 }),
    "sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
  );
});

test("canonicalization refuses values JSON would erase or coerce", () => {
  assert.throws(() => canonicalizeCatalogValue({ value: undefined }), /undefined/);
  assert.throws(() => canonicalizeCatalogValue(Number.NaN), /non-finite/);
  assert.throws(() => canonicalizeCatalogValue(Number.POSITIVE_INFINITY), /non-finite/);
  assert.throws(() => canonicalizeCatalogValue(new Date()), /non-plain/);
  assert.throws(() => canonicalizeCatalogValue([, "value"]), /sparse arrays/);
  const arrayWithHiddenState = ["value"];
  Object.defineProperty(arrayWithHiddenState, "hidden", { value: "secret" });
  assert.throws(
    () => canonicalizeCatalogValue(arrayWithHiddenState),
    /arrays with extra keys/
  );

  const accessor = {} as { value?: string };
  Object.defineProperty(accessor, "value", {
    enumerable: true,
    get: () => "unstable",
  });
  assert.throws(() => canonicalizeCatalogValue(accessor), /accessors/);

  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.throws(() => canonicalizeCatalogValue(circular), /circular/);
});

test("typed product canonicalization parses the contract before hashing", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  const reordered = Object.fromEntries(Object.entries(revision).reverse());
  assert.equal(
    canonicalizeProductRevisionV2(revision),
    canonicalizeProductRevisionV2(reordered)
  );
  assert.equal(
    digestProductRevisionV2(revision),
    digestProductRevisionV2(reordered)
  );

  const changed = structuredClone(revision);
  assert.equal(changed.price.state, "KNOWN");
  if (changed.price.state === "KNOWN") changed.price.money.amountMinor += 1;
  assert.notEqual(digestProductRevisionV2(revision), digestProductRevisionV2(changed));
});
