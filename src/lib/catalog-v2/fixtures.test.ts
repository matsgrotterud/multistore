import assert from "node:assert/strict";
import test from "node:test";
import {
  CatalogReferenceFixtureV2Schema,
  apparelCatalogFixtureV2,
  catalogReferenceFixturesV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
} from "./index";

test("the three synthetic reference fixtures round-trip their strict contracts", () => {
  assert.equal(catalogReferenceFixturesV2.length, 3);
  for (const fixture of catalogReferenceFixturesV2) {
    assert.deepEqual(CatalogReferenceFixtureV2Schema.parse(fixture), fixture);
  }
});

test("drone fixture contains 8-12 specification-heavy product identities", () => {
  assert.ok(droneCatalogFixtureV2.productRevisions.length >= 8);
  assert.ok(droneCatalogFixtureV2.productRevisions.length <= 12);
  assert.equal(new Set(droneCatalogFixtureV2.productRevisions.map((item) => item.productId)).size, 10);
  for (const revision of droneCatalogFixtureV2.productRevisions) {
    assert.ok(revision.attributeValues.length >= 7);
    assert.ok(revision.attributeDefinitions.every((definition) => definition.facetable));
    assert.ok(revision.attributeDefinitions.every((definition) => definition.comparable));
  }
  assert.ok(
    droneCatalogFixtureV2.productRevisions.some(
      (revision) => revision.price.state === "UNKNOWN"
    )
  );
});

test("drone technical facets are declared by contract flags, not key names", () => {
  const revision = droneCatalogFixtureV2.productRevisions[0]!;
  const technicalFacets = revision.attributeDefinitions
    .filter((definition) => definition.facetable && definition.comparable)
    .map((definition) => definition.label);
  assert.deepEqual(technicalFacets, [
    "Flight time",
    "Control range",
    "Camera resolution",
    "Takeoff weight",
    "Obstacle avoidance",
    "Wind resistance level",
    "Skill level",
  ]);
});

test("apparel fixture has at least four products with size/color axes and variant media", () => {
  assert.ok(apparelCatalogFixtureV2.productRevisions.length >= 4);
  for (const revision of apparelCatalogFixtureV2.productRevisions) {
    const facetDefinitions = revision.attributeDefinitions.filter(
      (definition) => definition.facetable && definition.scope === "VARIANT"
    );
    assert.deepEqual(
      facetDefinitions.map((definition) => definition.label),
      ["Size", "Color"]
    );
    for (const variant of revision.variants) {
      assert.equal(variant.attributeValues.length, 2);
      assert.ok(variant.mediaIds.length > 0);
      for (const mediaId of variant.mediaIds) {
        const media = revision.media.find((asset) => asset.mediaId === mediaId);
        assert.equal(media?.role, "VARIANT");
        assert.ok(media?.variantIds.includes(variant.variantId));
      }
    }
  }
});

test("reference catalogs normalize semantic attribute keys to one store definition", () => {
  for (const fixture of [apparelCatalogFixtureV2, consumableCatalogFixtureV2]) {
    const definitions = fixture.productRevisions.flatMap(
      (revision) => revision.attributeDefinitions
    );
    const idsByKey = new Map<string, Set<string>>();
    for (const definition of definitions) {
      const ids = idsByKey.get(definition.key) ?? new Set<string>();
      ids.add(definition.attributeDefinitionId);
      idsByKey.set(definition.key, ids);
    }
    assert.ok(
      [...idsByKey.values()].every((ids) => ids.size === 1),
      `${fixture.fixtureId} must not fork one semantic key into product-local definitions`
    );
  }
});

test("consumable fixture has at least four identities with bundles and repeat purchase", () => {
  assert.ok(consumableCatalogFixtureV2.productRevisions.length >= 4);
  for (const revision of consumableCatalogFixtureV2.productRevisions) {
    const bundle = revision.purchaseOptions.find((option) => option.kind === "BUNDLE");
    assert.ok(bundle);
    assert.ok(bundle.quantity >= 2);
    assert.equal(bundle.repeatPurchase.state, "ELIGIBLE");
    assert.ok(bundle.repeatPurchase.intervalDays.length > 0);
    assert.ok(
      revision.purchaseOptions.some(
        (option) => option.kind === "SINGLE" && option.quantity === 1
      )
    );
  }
  const fullyOutOfStock = consumableCatalogFixtureV2.productRevisions.find(
    (revision) => revision.availability === "OUT_OF_STOCK"
  );
  assert.ok(fullyOutOfStock);
  assert.ok(
    fullyOutOfStock.variants.every(
      (variant) => variant.availability === "OUT_OF_STOCK"
    )
  );
  assert.ok(
    fullyOutOfStock.purchaseOptions.every(
      (option) => option.availability === "OUT_OF_STOCK"
    )
  );
});

test("fixture public media has explicit verified synthetic rights and evidence", () => {
  for (const fixture of catalogReferenceFixturesV2) {
    for (const revision of fixture.productRevisions) {
      for (const media of revision.media.filter(
        (asset) => asset.publicationState === "PUBLIC_READY"
      )) {
        assert.equal(media.rights.state, "VERIFIED");
        assert.equal(media.rights.sourceKind, "SYNTHETIC");
        assert.ok(media.evidenceIds.length > 0);
      }
    }
  }
});

test("supplier offers and observations remain internal, linked, and provider-neutral", () => {
  for (const fixture of catalogReferenceFixturesV2) {
    const observationById = new Map(
      fixture.supplierObservations.map((observation) => [
        observation.observationId,
        observation,
      ])
    );
    for (const offer of fixture.supplierOffers) {
      const latest = offer.latestObservationId
        ? observationById.get(offer.latestObservationId)
        : null;
      assert.equal(latest?.offerId, offer.offerId);
    }
  }
  const serialized = JSON.stringify(catalogReferenceFixturesV2);
  assert.doesNotMatch(serialized, /\b(?:cj|aliexpress|temu|ebay|amazon)\b/i);
});

test("unknown supplier outcomes contain no optimistic commercial facts", () => {
  const unknownObservations = droneCatalogFixtureV2.supplierObservations.filter(
    (observation) => observation.outcome === "UNKNOWN"
  );
  assert.ok(unknownObservations.length > 0);
  for (const observation of unknownObservations) {
    assert.deepEqual(observation.inventory, {
      state: "UNKNOWN",
      availability: "UNKNOWN",
      quantity: null,
    });
    assert.deepEqual(observation.unitCost, { state: "UNKNOWN", money: null });
    assert.deepEqual(observation.shipping, {
      state: "UNKNOWN",
      minDays: null,
      maxDays: null,
      cost: null,
    });
  }
});
