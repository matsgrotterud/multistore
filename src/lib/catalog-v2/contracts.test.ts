import assert from "node:assert/strict";
import test from "node:test";
import {
  CatalogReferenceFixtureV2Schema,
  MediaAssetV2Schema,
  MoneyV2Schema,
  ProductRevisionV2Schema,
  RetailPriceV2Schema,
  SupplierObservationV2Schema,
  TaxonomyV2Schema,
  apparelCatalogFixtureV2,
  droneCatalogFixtureV2,
  isImmediatelyPurchasableV2,
} from "./index";

test("money requires non-negative integer minor units and uppercase currency", () => {
  const valid = { version: "catalog-money.v2", currency: "NOK", amountMinor: 1999 };
  assert.deepEqual(MoneyV2Schema.parse(valid), valid);
  assert.equal(MoneyV2Schema.safeParse({ ...valid, amountMinor: 19.99 }).success, false);
  assert.equal(MoneyV2Schema.safeParse({ ...valid, amountMinor: -1 }).success, false);
  assert.equal(MoneyV2Schema.safeParse({ ...valid, currency: "nok" }).success, false);
  assert.equal(MoneyV2Schema.safeParse({ ...valid, majorUnits: 19.99 }).success, false);
});

test("retail price distinguishes known zero from unknown and forbids hybrid states", () => {
  assert.equal(
    RetailPriceV2Schema.safeParse({
      state: "KNOWN",
      money: { version: "catalog-money.v2", currency: "NOK", amountMinor: 0 },
    }).success,
    true
  );
  assert.deepEqual(RetailPriceV2Schema.parse({ state: "UNKNOWN", money: null }), {
    state: "UNKNOWN",
    money: null,
  });
  assert.equal(
    RetailPriceV2Schema.safeParse({
      state: "UNKNOWN",
      money: { version: "catalog-money.v2", currency: "NOK", amountMinor: 0 },
    }).success,
    false
  );
});

test("product revisions require the persisted V2 contractVersion discriminant", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  assert.equal(ProductRevisionV2Schema.safeParse(revision).success, true);
  const wrongDiscriminant = {
    ...revision,
    contractVersion: undefined,
    version: "catalog-product-revision.v2",
  };
  assert.equal(ProductRevisionV2Schema.safeParse(wrongDiscriminant).success, false);
});

test("taxonomy hierarchy validates parent existence, paths, depth, and cycles", () => {
  const taxonomy = structuredClone(droneCatalogFixtureV2.taxonomy);
  assert.equal(TaxonomyV2Schema.safeParse(taxonomy).success, true);

  const missingParent = structuredClone(taxonomy);
  missingParent.nodes[1]!.parentId = "taxonomy:missing";
  assert.equal(TaxonomyV2Schema.safeParse(missingParent).success, false);

  const wrongPath = structuredClone(taxonomy);
  wrongPath.nodes[1]!.path = ["drones", "wrong"];
  assert.equal(TaxonomyV2Schema.safeParse(wrongPath).success, false);

  const cycle = structuredClone(taxonomy);
  cycle.nodes[0]!.parentId = cycle.nodes[1]!.taxonomyNodeId;
  cycle.nodes[0]!.path = ["drones", "camera-drones", "drones"];
  cycle.nodes[0]!.depth = 2;
  assert.equal(TaxonomyV2Schema.safeParse(cycle).success, false);
});

test("dynamic values must match definition scope, type, cardinality, and enum", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  const typeMismatch = structuredClone(revision);
  const firstValue = typeMismatch.attributeValues[0]!;
  typeMismatch.attributeValues[0] = {
    attributeDefinitionId: firstValue.attributeDefinitionId,
    dataType: "TEXT",
    values: ["24"],
  };
  assert.equal(ProductRevisionV2Schema.safeParse(typeMismatch).success, false);

  const invalidEnum = structuredClone(revision);
  const camera = invalidEnum.attributeValues.find(
    (value) => value.attributeDefinitionId === "attribute:drone:camera-resolution"
  );
  assert.ok(camera && camera.dataType === "ENUM");
  camera.values = ["12k"];
  assert.equal(ProductRevisionV2Schema.safeParse(invalidEnum).success, false);

  const duplicate = structuredClone(revision);
  duplicate.attributeValues.push(structuredClone(duplicate.attributeValues[0]!));
  assert.equal(ProductRevisionV2Schema.safeParse(duplicate).success, false);
});

test("required product and variant attributes cannot silently disappear", () => {
  const drone = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  drone.attributeValues = drone.attributeValues.slice(1);
  assert.equal(ProductRevisionV2Schema.safeParse(drone).success, false);

  const apparel = structuredClone(apparelCatalogFixtureV2.productRevisions[0]);
  apparel.variants[0]!.attributeValues = apparel.variants[0]!.attributeValues.slice(1);
  assert.equal(ProductRevisionV2Schema.safeParse(apparel).success, false);
});

test("facet and comparison behavior must be explicit on every definition", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  const definition = revision.attributeDefinitions[0] as unknown as Record<
    string,
    unknown
  >;
  delete definition.facetable;
  assert.equal(ProductRevisionV2Schema.safeParse(revision).success, false);
});

test("verified media rights require a known source kind and evidence", () => {
  const media = structuredClone(droneCatalogFixtureV2.productRevisions[0]!.media[0]!);
  media.evidenceIds = [];
  assert.equal(MediaAssetV2Schema.safeParse(media).success, false);
  media.evidenceIds = ["evidence:restored"];
  media.rights.sourceKind = "UNKNOWN";
  assert.equal(MediaAssetV2Schema.safeParse(media).success, false);
});

test("catalog media URLs are HTTPS-only and cannot carry executable schemes", () => {
  const media = structuredClone(
    droneCatalogFixtureV2.productRevisions[0]!.media[0]!
  );
  media.publicUrl = "javascript:alert(1)";
  assert.equal(MediaAssetV2Schema.safeParse(media).success, false);

  media.publicUrl = "http://assets.example.invalid/product.webp";
  assert.equal(MediaAssetV2Schema.safeParse(media).success, false);

  media.publicUrl = "https://assets.example.invalid/product.webp";
  media.rights.sourceUrl = "data:text/html,unsafe";
  assert.equal(MediaAssetV2Schema.safeParse(media).success, false);
});

test("variant and media relationships are normalized and bidirectional", () => {
  const revision = structuredClone(apparelCatalogFixtureV2.productRevisions[0]);
  const variant = revision.variants[0]!;
  assert.ok(variant.mediaIds.length > 0);
  const media = revision.media.find((asset) => asset.mediaId === variant.mediaIds[0]);
  assert.ok(media?.variantIds.includes(variant.variantId));

  variant.mediaIds = [];
  assert.equal(ProductRevisionV2Schema.safeParse(revision).success, false);
});

test("fixture relationships reject missing taxonomy, collection, and offer links", () => {
  const missingTaxonomy = structuredClone(droneCatalogFixtureV2);
  missingTaxonomy.productRevisions[0]!.taxonomyNodeIds = ["taxonomy:not-here"];
  assert.equal(CatalogReferenceFixtureV2Schema.safeParse(missingTaxonomy).success, false);

  const missingCollection = structuredClone(droneCatalogFixtureV2);
  missingCollection.productRevisions[0]!.collectionMemberships[0]!.collectionId =
    "collection:not-here";
  assert.equal(CatalogReferenceFixtureV2Schema.safeParse(missingCollection).success, false);

  const missingOffer = structuredClone(droneCatalogFixtureV2);
  missingOffer.supplierObservations[0]!.offerId = "offer:not-here";
  assert.equal(CatalogReferenceFixtureV2Schema.safeParse(missingOffer).success, false);
});

test("failed observations cannot smuggle known inventory, cost, or shipping facts", () => {
  const observation = structuredClone(droneCatalogFixtureV2.supplierObservations[0]);
  observation.outcome = "FAILED";
  observation.reasonCodes = ["SOURCE_FAILED"];
  assert.equal(SupplierObservationV2Schema.safeParse(observation).success, false);

  observation.inventory = {
    state: "UNKNOWN",
    availability: "UNKNOWN",
    quantity: null,
  };
  observation.unitCost = { state: "UNKNOWN", money: null };
  observation.shipping = {
    state: "UNKNOWN",
    minDays: null,
    maxDays: null,
    cost: null,
  };
  assert.equal(SupplierObservationV2Schema.safeParse(observation).success, true);
});

test("UNKNOWN and OUT_OF_STOCK fail closed for immediate purchase", () => {
  assert.equal(isImmediatelyPurchasableV2("IN_STOCK"), true);
  assert.equal(isImmediatelyPurchasableV2("LOW_STOCK"), true);
  assert.equal(isImmediatelyPurchasableV2("OUT_OF_STOCK"), false);
  assert.equal(isImmediatelyPurchasableV2("UNKNOWN"), false);
});
