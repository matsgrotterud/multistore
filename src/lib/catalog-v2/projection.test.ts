import assert from "node:assert/strict";
import test from "node:test";
import {
  StorefrontProductV2Schema,
  apparelCatalogFixtureV2,
  catalogReferenceFixturesV2,
  droneCatalogFixtureV2,
  consumableCatalogFixtureV2,
  projectStorefrontProductV2,
} from "./index";

function projectedProduct(input: unknown) {
  const result = projectStorefrontProductV2(input);
  assert.equal(result.status, "PROJECTED");
  if (result.status !== "PROJECTED") throw new Error("Expected projection");
  return result.product;
}

function allObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(allObjectKeys);
  return Object.entries(value).flatMap(([key, child]) => [key, ...allObjectKeys(child)]);
}

test("every published reference revision produces a strict storefront projection", () => {
  for (const fixture of catalogReferenceFixturesV2) {
    for (const revision of fixture.productRevisions) {
      const product = projectedProduct(revision);
      assert.equal(StorefrontProductV2Schema.safeParse(product).success, true);
      assert.equal(product.seoTitle, revision.seoTitle);
      assert.equal(product.seoDescription, revision.seoDescription);
      assert.deepEqual(
        product.media.map((media) => [media.width, media.height]),
        revision.media
          .filter(
            (media) =>
              media.publicationState === "PUBLIC_READY" &&
              media.rights.state === "VERIFIED"
          )
          .map((media) => [media.width, media.height])
      );
    }
  }
});

test("projection is an explicit whitelist with no internal source or evidence keys", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  revision.evidence[0]!.notes.push("SUPPLIER-SECRET-SENTINEL");
  revision.evidence[0]!.sourceRef = "source:SUPPLIER-SECRET-SENTINEL";
  revision.media[0]!.rights.sourceUrl =
    "https://internal.example.invalid/SUPPLIER-SECRET-SENTINEL";
  const product = projectedProduct(revision);
  const serialized = JSON.stringify(product);
  assert.equal(serialized.includes("SUPPLIER-SECRET-SENTINEL"), false);

  const forbiddenKey = allObjectKeys(product).find((key) =>
    /supplier|provider|external|source|evidence|cost|rights|publication/i.test(key)
  );
  assert.equal(forbiddenKey, undefined);
  assert.equal(
    StorefrontProductV2Schema.safeParse({
      ...product,
      supplierOfferId: "offer:secret",
    }).success,
    false
  );
});

test("UNKNOWN retail price and availability remain visible but never purchasable", () => {
  const unknownPriceRevision = droneCatalogFixtureV2.productRevisions.find(
    (revision) => revision.slug === "night-explorer"
  );
  assert.ok(unknownPriceRevision);
  const unknownPriceProduct = projectedProduct(unknownPriceRevision);
  assert.deepEqual(unknownPriceProduct.price, { state: "UNKNOWN", money: null });
  assert.equal(unknownPriceProduct.purchasable, false);

  const unknownAvailabilityRevision = droneCatalogFixtureV2.productRevisions.find(
    (revision) => revision.slug === "creator-fpv"
  );
  assert.ok(unknownAvailabilityRevision);
  assert.equal(projectedProduct(unknownAvailabilityRevision).purchasable, false);
});

test("draft and unknown revision states are refused", () => {
  for (const revisionState of ["DRAFT", "UNKNOWN"] as const) {
    const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
    revision.revisionState = revisionState;
    assert.deepEqual(projectStorefrontProductV2(revision), {
      status: "REFUSED",
      product: null,
      reasonCodes: ["REVISION_NOT_PUBLISHED"],
    });
  }
});

test("public-ready media is withheld until rights are VERIFIED", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  revision.media[0]!.rights = {
    state: "REVIEW_REQUIRED",
    sourceKind: "SUPPLIER_LICENSED",
    sourceUrl: "https://supplier.example.invalid/license-record",
  };
  assert.deepEqual(projectStorefrontProductV2(revision), {
    status: "REFUSED",
    product: null,
    reasonCodes: ["MISSING_PUBLIC_PRIMARY_MEDIA"],
  });
});

test("private attributes are omitted while public facet/compare metadata survives", () => {
  const revision = structuredClone(droneCatalogFixtureV2.productRevisions[0]);
  revision.attributeDefinitions[0]!.storefrontVisible = false;
  const product = projectedProduct(revision);
  assert.equal(product.attributes.some((entry) => entry.key === "flight-time"), false);
  const range = product.attributes.find((entry) => entry.key === "control-range");
  assert.deepEqual(
    range && { facetable: range.facetable, comparable: range.comparable },
    { facetable: true, comparable: true }
  );
});

test("projection normalizes order from explicit positions rather than input arrays", () => {
  const revision = structuredClone(apparelCatalogFixtureV2.productRevisions[0]);
  const expected = projectedProduct(revision);
  revision.attributeDefinitions.reverse();
  revision.attributeValues.reverse();
  revision.variants.reverse();
  revision.variants.forEach((variant) => variant.attributeValues.reverse());
  revision.media.reverse();
  revision.collectionMemberships.reverse();
  assert.deepEqual(projectedProduct(revision), expected);
});

test("variant UNKNOWN price blocks that choice without inventing a fallback", () => {
  const revision = structuredClone(apparelCatalogFixtureV2.productRevisions[0]);
  revision.variants.forEach((variant) => {
    variant.availability = "UNKNOWN";
    variant.price = { state: "UNKNOWN", money: null };
  });
  const product = projectedProduct(revision);
  assert.equal(product.variants.every((variant) => variant.price?.state === "UNKNOWN"), true);
  assert.equal(product.purchasable, false);
});

test("unknown purchase-option kind cannot authorize checkout", () => {
  const revision = structuredClone(
    consumableCatalogFixtureV2.productRevisions[0]!
  );
  revision.purchaseOptions.forEach((option) => {
    option.kind = "UNKNOWN";
  });
  assert.equal(projectedProduct(revision).purchasable, false);
});
