import assert from "node:assert/strict";
import test from "node:test";
import {
  StorefrontProductV2Schema,
  apparelCatalogFixtureV2,
  buildCatalogProjectionV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
} from "@/lib/catalog-v2/index";
import {
  STORE_EXPERIENCE_PROPOSAL_V2,
  proposeStoreExperienceV2,
  selectStoreExperienceCompositionStrategyV2,
} from "./generator";
import {
  STORE_EXPERIENCE_CATALOG_PROJECTION_V2,
  catalogProjectionToStoreExperienceV2,
  type StoreExperienceCatalogProjectionV2,
} from "./catalog-context";
import {
  storeExperienceCatalogFixtureV2,
  storefrontProductFixtureV2,
} from "./test-fixtures";
import { validateStoreExperienceManifestV2 } from "./validation";

function projectedCatalog(
  fixture: unknown,
  store: StoreExperienceCatalogProjectionV2["store"]
): StoreExperienceCatalogProjectionV2 {
  const result = buildCatalogProjectionV2(fixture);
  if (result.status !== "PROJECTED") {
    throw new Error(result.reasonCodes.join(","));
  }
  return catalogProjectionToStoreExperienceV2({
    catalog: result.projection,
    store,
    verifiedClaims: [],
  });
}

function compositionSignature(
  result: ReturnType<typeof proposeStoreExperienceV2>
): unknown {
  assert.equal(result.status, "PROPOSED");
  if (result.status !== "PROPOSED") return null;
  const blocks = (values: readonly { type: string }[]) =>
    values.map((block) => {
      const fields = block as unknown as Record<string, unknown>;
      return [
        block.type,
        fields.layout ?? null,
        fields.columns ?? null,
        fields.alignment ?? null,
        fields.showThumbnails ?? null,
        fields.fields ?? null,
      ];
    });
  return {
    home: blocks(result.manifest.pages.home.blocks),
    plp: blocks(result.manifest.pages.plp.blocks),
    pdp: blocks(result.manifest.pages.pdp.blocks),
  };
}

test("catalog-driven proposals are deterministic and input-order independent", () => {
  const catalog = storeExperienceCatalogFixtureV2(5);
  assert.equal(
    catalog.products.every(
      (product) => StorefrontProductV2Schema.safeParse(product).success
    ),
    true
  );
  const before = structuredClone(catalog);
  const first = proposeStoreExperienceV2(catalog);
  const second = proposeStoreExperienceV2(catalog);
  const reordered = proposeStoreExperienceV2({
    ...catalog,
    products: [...catalog.products].reverse(),
    categories: [...catalog.categories].reverse(),
    collections: [...catalog.collections].reverse(),
    attributeDefinitions: [...catalog.attributeDefinitions].reverse(),
    verifiedClaims: [...(catalog.verifiedClaims ?? [])].reverse(),
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first, reordered);
  assert.deepEqual(catalog, before);
  assert.equal(first.version, STORE_EXPERIENCE_PROPOSAL_V2);
  assert.equal(first.status, "PROPOSED");
  if (first.status !== "PROPOSED") return;
  assert.equal(validateStoreExperienceManifestV2(first.manifest, catalog).success, true);
});

test("normalized collection membership deterministically ranks featured products", () => {
  const base = storeExperienceCatalogFixtureV2(3);
  const catalog: StoreExperienceCatalogProjectionV2 = {
    ...base,
    collections: [
      {
        collectionId: "collection-featured",
        slug: "featured-selection",
        title: "Featured selection",
        description: null,
        position: 0,
      },
    ],
    products: base.products.map((product, index) => ({
      ...product,
      collections:
        index === 2
          ? [
              {
                collectionId: "collection-featured",
                position: 0,
              },
            ]
          : [],
    })),
  };
  const proposal = proposeStoreExperienceV2(catalog);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;
  const hero = proposal.manifest.pages.home.blocks.find(
    (block) => block.type === "hero"
  );
  const grid = proposal.manifest.pages.home.blocks.find(
    (block) => block.type === "product-grid"
  );
  assert.equal(hero?.featuredProductRef, base.products[2].productId);
  assert.equal(grid?.productRefs[0], base.products[2].productId);
});

test("optional features are explicitly capability-gated by projected catalog facts", () => {
  const single = proposeStoreExperienceV2(storeExperienceCatalogFixtureV2(1));
  assert.equal(single.status, "PROPOSED");
  if (single.status !== "PROPOSED") return;
  assert.deepEqual(single.manifest.features, {
    wishlist: true,
    compare: false,
    quiz: false,
    recommendations: false,
  });
  assert.equal(
    single.manifest.pages.home.blocks.some((block) => block.type === "quiz-callout"),
    false
  );
  assert.equal(
    single.manifest.pages.pdp.blocks.some((block) => block.type === "related-products"),
    false
  );

  const rich = proposeStoreExperienceV2(storeExperienceCatalogFixtureV2(5));
  assert.equal(rich.status, "PROPOSED");
  if (rich.status !== "PROPOSED") return;
  assert.deepEqual(rich.manifest.features, {
    wishlist: true,
    compare: true,
    quiz: true,
    recommendations: true,
  });
});

test("generic catalog-shape profiles select three materially different compositions", () => {
  const drones = projectedCatalog(droneCatalogFixtureV2, {
    name: "Flight Atlas",
    niche: "Camera drones",
  });
  const apparel = projectedCatalog(apparelCatalogFixtureV2, {
    name: "Field and Form",
    niche: "Trail apparel",
  });
  const consumables = projectedCatalog(consumableCatalogFixtureV2, {
    name: "North Roast",
    niche: "Whole bean coffee",
  });

  assert.equal(
    selectStoreExperienceCompositionStrategyV2(drones),
    "SPECIFICATION_LED"
  );
  assert.equal(
    selectStoreExperienceCompositionStrategyV2(apparel),
    "VARIANT_EDITORIAL"
  );
  assert.equal(
    selectStoreExperienceCompositionStrategyV2(consumables),
    "REPEAT_BUNDLE"
  );

  const signatures = [drones, apparel, consumables].map((catalog) =>
    JSON.stringify(compositionSignature(proposeStoreExperienceV2(catalog)))
  );
  assert.equal(new Set(signatures).size, 3);
});

test("one exceptional SKU cannot flip a dominant specification-led catalog", () => {
  const drones = projectedCatalog(droneCatalogFixtureV2, {
    name: "Technical Store",
    niche: "Technical products",
  });
  const apparel = projectedCatalog(apparelCatalogFixtureV2, {
    name: "Variant Store",
    niche: "Variant products",
  });
  const consumables = projectedCatalog(consumableCatalogFixtureV2, {
    name: "Repeat Store",
    niche: "Repeat products",
  });
  const source = drones.products[0];
  const variantException = {
    ...structuredClone(apparel.products[0]),
    productId: source.productId,
    revisionId: source.revisionId,
    slug: source.slug,
    taxonomyNodeIds: [...source.taxonomyNodeIds],
    collections: structuredClone(source.collections),
  };
  const repeatException = {
    ...structuredClone(consumables.products[0]),
    productId: source.productId,
    revisionId: source.revisionId,
    slug: source.slug,
    taxonomyNodeIds: [...source.taxonomyNodeIds],
    collections: structuredClone(source.collections),
  };

  for (const exception of [variantException, repeatException]) {
    const catalog = {
      ...drones,
      products: [exception, ...drones.products.slice(1)],
    };
    assert.equal(
      selectStoreExperienceCompositionStrategyV2(catalog),
      "SPECIFICATION_LED"
    );
    assert.equal(proposeStoreExperienceV2(catalog).status, "PROPOSED");
  }
});

test("labels and slugs cannot select a niche-specific composition", () => {
  const catalog = projectedCatalog(droneCatalogFixtureV2, {
    name: "Flight Atlas",
    niche: "Camera drones",
  });
  const categories = [...catalog.categories]
    .sort(
      (left, right) =>
        left.depth - right.depth || left.categoryId.localeCompare(right.categoryId)
    )
    .reduce<typeof catalog.categories>((result, category, index) => {
      const parent = category.parentCategoryId
        ? result.find(
            (candidate) => candidate.categoryId === category.parentCategoryId
          )
        : null;
      const slug = `group-${index + 1}`;
      result.push({
        ...category,
        slug,
        title: `Group ${index + 1}`,
        description: `Description ${index + 1}`,
        path: parent ? [...parent.path, slug] : [slug],
      });
      return result;
    }, []);
  const relabeled: StoreExperienceCatalogProjectionV2 = {
    ...catalog,
    projectionRef: "relabeled-catalog-projection",
    store: { name: "Renamed Store", niche: "Renamed products" },
    categories,
    collections: catalog.collections.map((collection, index) => ({
      ...collection,
      slug: `selection-${index + 1}`,
      title: `Selection ${index + 1}`,
      description: null,
    })),
    products: catalog.products.map((product, index) => ({
      ...product,
      slug: `item-${index + 1}`,
      title: `Item ${index + 1}`,
      subtitle: `Option ${index + 1}`,
      description: `Description for item ${index + 1}.`,
      seoTitle: `Item ${index + 1}`,
      seoDescription: `Catalog description for item ${index + 1}.`,
    })),
  };

  assert.deepEqual(
    compositionSignature(proposeStoreExperienceV2(relabeled)),
    compositionSignature(proposeStoreExperienceV2(catalog))
  );
});

test("empty and identity-ambiguous catalog projections are refused", () => {
  const empty: StoreExperienceCatalogProjectionV2 = {
    version: STORE_EXPERIENCE_CATALOG_PROJECTION_V2,
    projectionRef: "empty-catalog",
    store: { name: "Empty", niche: "empty" },
    products: [],
    categories: [],
    collections: [],
    attributeDefinitions: [],
    verifiedClaims: [],
  };
  const emptyResult = proposeStoreExperienceV2(empty);
  assert.equal(emptyResult.status, "REFUSED");
  assert.deepEqual(emptyResult.reasonCodes, ["CATALOG_EMPTY"]);

  const duplicate: StoreExperienceCatalogProjectionV2 = {
    ...empty,
    projectionRef: "duplicate-catalog",
    products: [storefrontProductFixtureV2(1), storefrontProductFixtureV2(1)],
  };
  const duplicateResult = proposeStoreExperienceV2(duplicate);
  assert.equal(duplicateResult.status, "REFUSED");
  assert.deepEqual(duplicateResult.reasonCodes, [
    "CATALOG_PRODUCT_IDS_DUPLICATED",
  ]);
});

test("an invalid Catalog V2 product cannot reach manifest generation", () => {
  const catalog = storeExperienceCatalogFixtureV2(1);
  const invalidProduct = {
    ...catalog.products[0],
    media: [],
  } as (typeof catalog.products)[number];
  const result = proposeStoreExperienceV2({
    ...catalog,
    products: [invalidProduct],
  });

  assert.equal(result.status, "REFUSED");
  assert.deepEqual(result.reasonCodes, ["CATALOG_PRODUCT_INVALID"]);
});

test("generator refuses unsafe store-authored copy instead of emitting markup", () => {
  const catalog = storeExperienceCatalogFixtureV2(2);
  const result = proposeStoreExperienceV2({
    ...catalog,
    store: { ...catalog.store, name: "<script>unsafe()</script>" },
  });

  assert.equal(result.status, "REFUSED");
  assert.deepEqual(result.reasonCodes, ["MANIFEST_VALIDATION_FAILED"]);
  if (result.status === "REFUSED") {
    assert.equal(
      result.validation?.issues.some((issue) => issue.code === "SCHEMA_INVALID"),
      true
    );
  }
});
