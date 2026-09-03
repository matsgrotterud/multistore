import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogProjectionToMerchandisingV2,
  compareMerchandisingProductsV2,
  recommendMerchandisingProductsV2,
  searchMerchandisingCatalogV2,
  type MerchandisingAttributeDefinitionV2,
  type MerchandisingProductV2,
} from "./merchandising-v2";
import {
  apparelCatalogFixtureV2,
  buildCatalogProjectionV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
} from "./catalog-v2";

const definitions: MerchandisingAttributeDefinitionV2[] = [
  {
    key: "flight-time",
    label: "Flight time",
    kind: "INTEGER",
    facetable: true,
    comparable: true,
    unitCode: "min",
    sortOrder: 1,
  },
  {
    key: "color",
    label: "Color",
    kind: "ENUM",
    facetable: true,
    comparable: false,
    unitCode: null,
    sortOrder: 2,
  },
];

const products: MerchandisingProductV2[] = [
  product("drone-b", "Scout 4K", "drone", "25", "black", 15900),
  product("drone-a", "Pocket Camera Drone", "camera drone", "25", "white", 14900),
  product("drone-c", "Survey Drone", "mapping aircraft", "40", "black", null, {
    availability: "UNKNOWN",
    purchasable: false,
  }),
];

test("search combines generic taxonomy and attribute filters with stable paging", () => {
  const result = searchMerchandisingCatalogV2({
    products,
    attributeDefinitions: definitions,
    request: {
      query: "camera drone",
      taxonomyNodeIds: ["camera-drones"],
      attributeFilters: { "flight-time": ["25"] },
      sort: "PRICE_ASC",
      page: 1,
      pageSize: 1,
    },
  });

  assert.equal(result.total, 2);
  assert.equal(result.pageCount, 2);
  assert.equal(result.products[0]?.productId, "drone-a");
  assert.deepEqual(
    result.facets.find((facet) => facet.key === "color")?.values,
    [
      { value: "black", count: 1 },
      { value: "white", count: 1 },
    ]
  );
});

test("comparison rows come only from taxonomy definitions marked comparable", () => {
  const rows = compareMerchandisingProductsV2({
    products,
    attributeDefinitions: definitions,
  });
  assert.deepEqual(rows.map((row) => row.key), ["flight-time"]);
  assert.deepEqual(
    rows[0]?.values.map((entry) => entry.value),
    ["25", "25", "40"]
  );
});

test("recommendations are available, deterministic and carry evidence only", () => {
  const first = recommendMerchandisingProductsV2({
    sourceProductId: "drone-a",
    products,
    attributeDefinitions: definitions,
  });
  const second = recommendMerchandisingProductsV2({
    sourceProductId: "drone-a",
    products: [...products].reverse(),
    attributeDefinitions: definitions,
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first.items.map((item) => item.product.productId), ["drone-b"]);
  assert.equal(first.experimentAssignment, null);
  assert.equal(first.attribution, null);
  assert.ok(first.items[0]?.evidence.some((entry) => entry.code === "SHARED_TAXONOMY"));
  assert.equal(
    Object.prototype.hasOwnProperty.call(first.items[0]?.product ?? {}, "providerKey"),
    false
  );
});

test("sanitized CatalogProjectionV2 feeds generic facets without niche-specific keys", () => {
  const projected = buildCatalogProjectionV2(droneCatalogFixtureV2);
  assert.equal(projected.status, "PROJECTED");
  if (projected.status !== "PROJECTED") return;

  const catalog = catalogProjectionToMerchandisingV2(projected.projection);
  const result = searchMerchandisingCatalogV2({
    ...catalog,
    request: { pageSize: 12, sort: "PRICE_ASC" },
  });

  assert.equal(result.total, 10);
  assert.ok(result.facets.length > 0);
  assert.ok(result.facets.some((facet) => facet.key === "flight-time"));
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.products[0] ?? {}, "supplierOffers"),
    false
  );
});

test("variant axes participate in the same generic facet and filter runtime", () => {
  for (const [fixture, expectedFacets] of [
    [apparelCatalogFixtureV2, ["color", "material", "size", "waterproof"]],
    [consumableCatalogFixtureV2, ["pack-size", "roast-level", "whole-bean"]],
  ] as const) {
    const projected = buildCatalogProjectionV2(fixture);
    assert.equal(projected.status, "PROJECTED");
    if (projected.status !== "PROJECTED") continue;

    const catalog = catalogProjectionToMerchandisingV2(projected.projection);
    const result = searchMerchandisingCatalogV2({
      ...catalog,
      request: { pageSize: 100, sort: "TITLE_ASC" },
    });
    assert.deepEqual(
      result.facets.map((facet) => facet.key).sort(),
      [...expectedFacets].sort()
    );

    const variantDefinition = projected.projection.attributeDefinitions.find(
      (definition) => definition.scope === "VARIANT" && definition.facetable
    );
    assert.ok(variantDefinition);
    const selectedValue = result.facets.find(
      (facet) => facet.key === variantDefinition.key
    )?.values[0]?.value;
    assert.ok(selectedValue);
    const filtered = searchMerchandisingCatalogV2({
      ...catalog,
      request: {
        attributeFilters: { [variantDefinition.key]: [selectedValue] },
        pageSize: 100,
      },
    });
    assert.ok(filtered.total > 0);
    assert.ok(
      filtered.products.every((product) =>
        product.attributes.some(
          (attribute) =>
            attribute.key === variantDefinition.key &&
            attribute.values.includes(selectedValue)
        )
      )
    );
  }
});

test("a parent taxonomy filter includes products placed in descendant nodes", () => {
  const projected = buildCatalogProjectionV2(apparelCatalogFixtureV2);
  assert.equal(projected.status, "PROJECTED");
  if (projected.status !== "PROJECTED") return;
  const root = projected.projection.taxonomy.nodes.find(
    (node) => node.slug === "apparel"
  );
  assert.ok(root);
  const catalog = catalogProjectionToMerchandisingV2(projected.projection);
  const result = searchMerchandisingCatalogV2({
    ...catalog,
    request: { taxonomyNodeIds: [root.taxonomyNodeId], pageSize: 100 },
  });
  assert.equal(result.total, projected.projection.products.length);
});

function product(
  productId: string,
  title: string,
  description: string,
  flightTime: string,
  color: string,
  priceMinor: number | null,
  overrides: Partial<MerchandisingProductV2> = {}
): MerchandisingProductV2 {
  return {
    productId,
    title,
    description,
    taxonomyNodeIds: ["camera-drones"],
    attributes: [
      { key: "flight-time", label: "Flight time", values: [flightTime], unitCode: "min" },
      { key: "color", label: "Color", values: [color], unitCode: null },
    ],
    priceMinor,
    currency: priceMinor === null ? null : "NOK",
    availability: "IN_STOCK",
    purchasable: true,
    ...overrides,
  };
}
