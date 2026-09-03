import assert from "node:assert/strict";
import test from "node:test";
import {
  apparelCatalogFixtureV2,
  buildCatalogProjectionV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
} from "@/lib/catalog-v2";
import {
  StoreExperienceCatalogProjectionV2Schema,
  categoryDescendantReferenceSetV2,
  catalogProjectionToStoreExperienceV2,
  collectionReferenceSetV2,
  findExperienceCollectionV2,
  storeExperienceFacetKeysV2,
} from "./catalog-context";

function projectedApparel() {
  const result = buildCatalogProjectionV2(apparelCatalogFixtureV2);
  assert.equal(result.status, "PROJECTED");
  return catalogProjectionToStoreExperienceV2({
    catalog: result.projection,
    store: { name: "Field & Form", niche: "Trail footwear and outerwear" },
  });
}

test("experience projection retains normalized hierarchy and collections", () => {
  const catalog = projectedApparel();
  assert.equal(
    StoreExperienceCatalogProjectionV2Schema.safeParse(catalog).success,
    true
  );
  assert.ok(catalog.categories.every((category) => category.path.length > 0));
  assert.ok(
    catalog.categories.every(
      (category) => category.path.length === category.depth + 1
    )
  );
  assert.ok(catalog.collections.length > 0);
  assert.deepEqual(
    catalog.attributeDefinitions.map((definition) => definition.key),
    ["material", "waterproof", "size", "color"]
  );
  const collection = catalog.collections[0];
  assert.ok(collectionReferenceSetV2(catalog).has(collection.collectionId));
  assert.equal(
    findExperienceCollectionV2(catalog, collection.collectionId)?.slug,
    collection.slug
  );
  assert.ok(
    catalog.products.some((product) =>
      product.collections.some(
        (membership) => membership.collectionId === collection.collectionId
      )
    )
  );
});

test("parent taxonomy nodes resolve their complete descendant product scope", () => {
  const catalog = projectedApparel();
  const apparel = catalog.categories.find(
    (category) => category.slug === "apparel"
  );
  assert.ok(apparel);
  const descendants = categoryDescendantReferenceSetV2(
    catalog,
    apparel.categoryId
  );
  assert.ok(descendants.has(apparel.categoryId));
  assert.ok(
    catalog.categories
      .filter((category) => category.parentCategoryId === apparel.categoryId)
      .every((category) => descendants.has(category.categoryId))
  );
  assert.equal(
    catalog.products.filter((product) =>
      product.taxonomyNodeIds.some((categoryId) => descendants.has(categoryId))
    ).length,
    catalog.products.length
  );
});

test("experience facets preserve generic product and variant definitions", () => {
  const fixtures = [
    {
      fixture: droneCatalogFixtureV2,
      expected: [
        "flight-time",
        "control-range",
        "camera-resolution",
        "takeoff-weight",
        "obstacle-avoidance",
        "wind-resistance-level",
        "skill-level",
      ],
    },
    {
      fixture: apparelCatalogFixtureV2,
      expected: ["material", "waterproof", "size", "color"],
    },
    {
      fixture: consumableCatalogFixtureV2,
      expected: ["roast-level", "whole-bean", "pack-size"],
    },
  ] as const;

  for (const [index, fixture] of fixtures.entries()) {
    const result = buildCatalogProjectionV2(fixture.fixture);
    assert.equal(result.status, "PROJECTED");
    if (result.status !== "PROJECTED") continue;
    const catalog = catalogProjectionToStoreExperienceV2({
      catalog: result.projection,
      store: { name: `Store ${index}`, niche: `Catalog ${index}` },
    });
    assert.deepEqual(
      storeExperienceFacetKeysV2(catalog, catalog.products),
      [...fixture.expected]
    );
  }
});

test("experience projection refuses dangling hierarchy and collection memberships", () => {
  const missingParent = structuredClone(projectedApparel());
  missingParent.categories[0].parentCategoryId = "category:not-present";
  assert.equal(
    StoreExperienceCatalogProjectionV2Schema.safeParse(missingParent).success,
    false
  );

  const danglingCollection = structuredClone(projectedApparel());
  const product = danglingCollection.products.find(
    (candidate) => candidate.collections.length > 0
  );
  assert.ok(product);
  product.collections[0].collectionId = "collection:not-present";
  assert.equal(
    StoreExperienceCatalogProjectionV2Schema.safeParse(danglingCollection)
      .success,
    false
  );

  const danglingDefinition = structuredClone(projectedApparel());
  danglingDefinition.attributeDefinitions[0].appliesToTaxonomyNodeIds = [
    "category:not-present",
  ];
  assert.equal(
    StoreExperienceCatalogProjectionV2Schema.safeParse(danglingDefinition)
      .success,
    false
  );
});
