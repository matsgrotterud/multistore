import assert from "node:assert/strict";
import test from "node:test";
import {
  CatalogProjectionV2Schema,
  buildCatalogProjectionV2,
  catalogReferenceFixturesV2,
  digestCatalogValue,
  droneCatalogFixtureV2,
} from "./index";

function build(input: unknown) {
  const result = buildCatalogProjectionV2(input);
  assert.equal(result.status, "PROJECTED");
  if (result.status !== "PROJECTED") throw new Error("Expected catalog projection");
  return result.projection;
}

function keysDeep(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  return Object.entries(value).flatMap(([key, child]) => [key, ...keysDeep(child)]);
}

test("all reference fixtures build strict aggregate CatalogProjectionV2 snapshots", () => {
  const expectedCounts = [10, 4, 4];
  catalogReferenceFixturesV2.forEach((fixture, index) => {
    const projection = build(fixture);
    assert.equal(CatalogProjectionV2Schema.safeParse(projection).success, true);
    assert.equal(projection.products.length, expectedCounts[index]);
    assert.match(projection.projectionRef, /^catalog-projection:sha256:[a-f0-9]{64}$/);
  });
});

test("aggregate projection is sanitized and excludes all supplier/evidence/rights state", () => {
  const projection = build(droneCatalogFixtureV2);
  const forbidden = keysDeep(projection).find((key) =>
    /supplier|provider|external|source|evidence|cost|rights|internal|publication/i.test(
      key
    )
  );
  assert.equal(forbidden, undefined);
  assert.equal(JSON.stringify(projection).includes("source-offer:"), false);
});

test("projection ref is deterministic and content-addressed", () => {
  const first = build(droneCatalogFixtureV2);
  const second = build(structuredClone(droneCatalogFixtureV2));
  assert.deepEqual(second, first);

  const content = {
    version: first.version,
    generatedAt: first.generatedAt,
    taxonomy: first.taxonomy,
    collections: first.collections,
    attributeDefinitions: first.attributeDefinitions,
    products: first.products,
  };
  assert.equal(first.projectionRef, `catalog-projection:${digestCatalogValue(content)}`);

  const tampered = structuredClone(first);
  tampered.products[0]!.title = "Tampered title";
  assert.equal(CatalogProjectionV2Schema.safeParse(tampered).success, false);
});

test("invalid taxonomy and collection references refuse the whole build", () => {
  const taxonomyMismatch = structuredClone(droneCatalogFixtureV2);
  taxonomyMismatch.productRevisions[0]!.taxonomyNodeIds = ["taxonomy:missing"];
  assert.deepEqual(buildCatalogProjectionV2(taxonomyMismatch), {
    status: "REFUSED",
    projection: null,
    reasonCodes: ["INVALID_REFERENCE_FIXTURE"],
  });

  const collectionMismatch = structuredClone(droneCatalogFixtureV2);
  collectionMismatch.productRevisions[0]!.collectionMemberships[0]!.collectionId =
    "collection:missing";
  assert.deepEqual(buildCatalogProjectionV2(collectionMismatch), {
    status: "REFUSED",
    projection: null,
    reasonCodes: ["INVALID_REFERENCE_FIXTURE"],
  });
});

test("only public collections and storefront-visible definitions survive", () => {
  const fixture = structuredClone(droneCatalogFixtureV2);
  const hiddenCollectionId = fixture.collections[0]!.collectionId;
  fixture.collections[0]!.publicationState = "INTERNAL";
  const hiddenDefinitionId =
    fixture.productRevisions[0]!.attributeDefinitions[0]!.attributeDefinitionId;
  fixture.productRevisions.forEach((revision) => {
    const definition = revision.attributeDefinitions.find(
      (candidate) => candidate.attributeDefinitionId === hiddenDefinitionId
    );
    if (definition) definition.storefrontVisible = false;
  });
  const projection = build(fixture);
  assert.equal(
    projection.collections.some(
      (collection) => collection.collectionId === hiddenCollectionId
    ),
    false
  );
  assert.equal(
    projection.products.some((product) =>
      product.collections.some(
        (membership) => membership.collectionId === hiddenCollectionId
      )
    ),
    false
  );
  assert.equal(
    projection.attributeDefinitions.some(
      (definition) => definition.attributeDefinitionId === hiddenDefinitionId
    ),
    false
  );
});

test("conflicting definitions with the same stable ID refuse the snapshot", () => {
  const fixture = structuredClone(droneCatalogFixtureV2);
  fixture.productRevisions[1]!.attributeDefinitions[0]!.label =
    "Conflicting flight duration";
  assert.deepEqual(buildCatalogProjectionV2(fixture), {
    status: "REFUSED",
    projection: null,
    reasonCodes: ["CONFLICTING_ATTRIBUTE_DEFINITION"],
  });
});

test("latest published revision is selected deterministically per product", () => {
  const fixture = structuredClone(droneCatalogFixtureV2);
  const newer = structuredClone(fixture.productRevisions[0]!);
  newer.revisionId = `${newer.revisionId}-2`;
  newer.revisionNumber = 2;
  newer.title = "Scout Mini Revision Two";
  newer.seoTitle = "Scout Mini Revision Two specifications";
  fixture.productRevisions.push(newer);
  const projection = build(fixture);
  assert.equal(
    projection.products.find((product) => product.productId === newer.productId)?.title,
    "Scout Mini Revision Two"
  );
});
