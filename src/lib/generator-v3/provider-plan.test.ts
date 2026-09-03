import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveCatalogProviderKeysV1,
  resolveGenerationProviderPlanV1,
} from "./provider-plan";

test("configured generation defaults to CJ and never falls back to mock", () => {
  assert.deepEqual(resolveCatalogProviderKeysV1({}), ["cj"]);
  assert.deepEqual(resolveCatalogProviderKeysV1({ configuredCsv: "" }), ["cj"]);
});

test("explicit demo fixture selection is preserved and deduplicated", () => {
  assert.deepEqual(
    resolveCatalogProviderKeysV1({
      explicit: [" mock ", "mock"],
      configuredCsv: "cj",
    }),
    ["mock"]
  );
  assert.throws(
    () =>
      resolveCatalogProviderKeysV1({
        explicit: ["cj", "mock"],
      }),
    /cannot be mixed with live providers/
  );
});

test("configured providers are normalized but configured mock is rejected", () => {
  assert.deepEqual(
    resolveCatalogProviderKeysV1({ configuredCsv: " CJ, ebay, cj " }),
    ["cj", "ebay"]
  );
  assert.throws(
    () => resolveCatalogProviderKeysV1({ configuredCsv: "cj,mock" }),
    /must be selected explicitly/
  );
});

test("foundation-only mode resolves no provider even when defaults are configured", () => {
  assert.deepEqual(
    resolveGenerationProviderPlanV1({
      importProducts: false,
      useDemoCatalog: true,
      configuredCsv: "cj,ebay",
    }),
    { mode: "FOUNDATION_ONLY", providerKeys: [] }
  );
});

test("catalog generation keeps explicit mock separate from configured providers", () => {
  assert.deepEqual(
    resolveGenerationProviderPlanV1({
      importProducts: true,
      useDemoCatalog: true,
      configuredCsv: "cj,ebay",
    }),
    { mode: "SYNTHETIC_DEMO", providerKeys: ["mock"] }
  );
  assert.deepEqual(
    resolveGenerationProviderPlanV1({
      importProducts: true,
      configuredCsv: "cj,ebay",
    }),
    { mode: "CONFIGURED", providerKeys: ["cj", "ebay"] }
  );
});
