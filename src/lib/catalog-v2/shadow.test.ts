import assert from "node:assert/strict";
import test from "node:test";
import {
  SHADOW_COMPARISON_MAX_PRODUCTS_V2,
  ShadowComparisonReportV2Schema,
  V1_V2_SHADOW_INPUT_V2,
  compareLegacyCatalogShadowV2,
  droneCatalogFixtureV2,
  isImmediatelyPurchasableV2,
  retailPriceFromMinorUnitsV2,
  type ShadowComparisonInputV2,
} from "./index";

const RUN_AT = "2026-02-10T12:00:00.000Z";
const VERIFIED_AT = "2026-02-09T09:00:00.000Z";

function droneShadowInput(): ShadowComparisonInputV2 {
  const revisions = droneCatalogFixtureV2.productRevisions.filter(
    (revision) => revision.price.state === "KNOWN"
  );
  return {
    contractVersion: V1_V2_SHADOW_INPUT_V2,
    runAt: RUN_AT,
    items: revisions.map((revision) => {
      assert.equal(revision.price.state, "KNOWN");
      if (revision.price.state !== "KNOWN") throw new Error("Expected known price");
      const primary = revision.media.find((media) => media.role === "PRIMARY");
      assert.ok(primary?.publicUrl);
      return {
        legacyProduct: {
          id: `legacy:${revision.slug}`,
          slug: revision.slug,
          title: revision.title,
          subtitle: revision.subtitle,
          description: revision.description,
          seoTitle: revision.seoTitle,
          seoDescription: revision.seoDescription,
          brand: revision.brand,
          imageUrl: primary.publicUrl,
          imageAlt: primary.altText,
          price: revision.price.money.amountMinor / 100,
          compareAtPrice: null,
          currency: revision.price.money.currency,
          stockStatus: revision.availability,
          isPublished: true,
          category: { slug: "drones" },
          variants: [],
        },
        v1PublicFacts: {
          identity: { slug: revision.slug, title: revision.title },
          price: revision.price,
          availability: revision.availability,
          purchasable: isImmediatelyPurchasableV2(revision.availability),
        },
        verifiedPublicMedia: {
          state: "VERIFIED",
          sourceKind: "MERCHANT_OWNED",
          publicUrl: primary.publicUrl,
          attestationRef: `attestation:drone:${revision.slug}`,
          verifiedAt: VERIFIED_AT,
        },
      };
    }),
  };
}

function deepKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(deepKeys);
  return Object.entries(value).flatMap(([key, child]) => [key, ...deepKeys(child)]);
}

test("9-product synthetic drone catalog produces deterministic PASS rollout proof", () => {
  const input = droneShadowInput();
  assert.ok(input.items.length >= 8 && input.items.length <= 12);
  const execution = compareLegacyCatalogShadowV2(input);
  assert.equal(execution.status, "PASS");
  assert.ok(execution.report);
  assert.equal(execution.report.itemCount, 9);
  assert.equal(execution.report.passCount, 9);
  assert.equal(execution.report.failCount, 0);
  assert.equal(execution.report.refusedCount, 0);
  assert.equal(execution.report.mode, "READ_ONLY");
  assert.equal(execution.report.activationAllowed, false);
  assert.equal(execution.report.mutationCount, 0);
  assert.equal(ShadowComparisonReportV2Schema.safeParse(execution.report).success, true);
  assert.match(execution.report.v1CatalogDigest, /^sha256:[a-f0-9]{64}$/);
  assert.match(execution.report.v2CatalogDigest, /^sha256:[a-f0-9]{64}$/);
  assert.match(execution.report.reportDigest, /^sha256:[a-f0-9]{64}$/);
});

test("input ordering does not change the canonical shadow report", () => {
  const input = droneShadowInput();
  const reversed = structuredClone(input);
  reversed.items.reverse();
  assert.deepEqual(
    compareLegacyCatalogShadowV2(reversed),
    compareLegacyCatalogShadowV2(input)
  );
});

test("public price drift produces FAIL with reviewable safe values and fact digests", () => {
  const input = droneShadowInput();
  const firstPrice = input.items[0]!.v1PublicFacts.price;
  assert.equal(firstPrice.state, "KNOWN");
  if (firstPrice.state === "KNOWN") firstPrice.money.amountMinor += 1;

  const execution = compareLegacyCatalogShadowV2(input);
  assert.equal(execution.status, "FAIL");
  assert.ok(execution.report);
  assert.equal(execution.report.failCount, 1);
  const failed = execution.report.items.find((item) => item.state === "FAIL");
  assert.ok(failed);
  assert.equal(failed.facts.price.state, "FAIL");
  assert.notEqual(
    failed.facts.price.expectedDigest,
    failed.facts.price.actualDigest
  );
  assert.ok(failed.expected.price.state === "KNOWN");
  assert.ok(failed.actual?.price.state === "KNOWN");
});

test("an explicitly attested but supplier-ID-bearing media URL fails closed", () => {
  const input = droneShadowInput();
  const sentinel = "SUPPLIER-MEDIA-ID-SENTINEL";
  input.items[0]!.legacyProduct.externalId = sentinel;
  input.items[0]!.verifiedPublicMedia.publicUrl =
    `https://assets.example.invalid/${sentinel}.webp`;

  const execution = compareLegacyCatalogShadowV2(input);
  assert.equal(execution.status, "REFUSED");
  assert.ok(execution.report);
  assert.equal(execution.report.refusedCount, 1);
  assert.equal(
    execution.report.items.some(
      (item) => item.reasonCodes[0] === "STOREFRONT_PROJECTION_REFUSED"
    ),
    true
  );
  assert.equal(JSON.stringify(execution.report).includes(sentinel), false);
});

test("missing explicit media verification is rejected and never inferred", () => {
  const input = droneShadowInput() as unknown as {
    items: Array<Record<string, unknown>>;
  };
  delete input.items[0]!.verifiedPublicMedia;
  const first = compareLegacyCatalogShadowV2(input);
  const second = compareLegacyCatalogShadowV2(structuredClone(input));
  assert.deepEqual(second, first);
  assert.equal(first.status, "REFUSED");
  assert.equal(first.report, null);
  assert.match(first.refusalDigest, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(first.reasonCodes, ["INVALID_SHADOW_INPUT"]);
});

test("future-dated media verification and oversized catalogs are refused", () => {
  const future = droneShadowInput();
  future.items[0]!.verifiedPublicMedia.verifiedAt =
    "2026-02-11T00:00:00.000Z";
  assert.equal(compareLegacyCatalogShadowV2(future).status, "REFUSED");

  const oversized = droneShadowInput() as unknown as { items: unknown[] };
  const template = oversized.items[0]!;
  oversized.items = Array.from(
    { length: SHADOW_COMPARISON_MAX_PRODUCTS_V2 + 1 },
    () => structuredClone(template)
  );
  const execution = compareLegacyCatalogShadowV2(oversized);
  assert.equal(execution.status, "REFUSED");
  assert.equal(execution.report, null);
});

test("report shape contains no legacy, supplier, provider, rights, or attestation fields", () => {
  const input = droneShadowInput();
  input.items[0]!.legacyProduct.providerKey = "PROVIDER-SENTINEL";
  input.items[0]!.legacyProduct.supplierProductId = "SUPPLIER-SENTINEL";
  const execution = compareLegacyCatalogShadowV2(input);
  assert.ok(execution.report);
  const forbiddenKey = deepKeys(execution.report).find((key) =>
    /legacy|supplier|provider|rights|attestation|publicUrl|title|slug/i.test(key)
  );
  assert.equal(forbiddenKey, undefined);
  const serialized = JSON.stringify(execution.report);
  assert.equal(serialized.includes("PROVIDER-SENTINEL"), false);
  assert.equal(serialized.includes("SUPPLIER-SENTINEL"), false);
});

test("shadow comparison does not mutate its input", () => {
  const input = droneShadowInput();
  const before = structuredClone(input);
  compareLegacyCatalogShadowV2(input);
  assert.deepEqual(input, before);
});

test("tampering with report facts invalidates the report digest", () => {
  const execution = compareLegacyCatalogShadowV2(droneShadowInput());
  assert.ok(execution.report);
  const tampered = structuredClone(execution.report);
  tampered.items[0]!.expected.purchasable = !tampered.items[0]!.expected.purchasable;
  assert.equal(ShadowComparisonReportV2Schema.safeParse(tampered).success, false);
});

test("minor-unit helper preserves explicit unknown instead of inventing currency", () => {
  assert.deepEqual(retailPriceFromMinorUnitsV2(null, null), {
    state: "UNKNOWN",
    money: null,
  });
  assert.deepEqual(retailPriceFromMinorUnitsV2(1299, "NOK"), {
    state: "KNOWN",
    money: { version: "catalog-money.v2", currency: "NOK", amountMinor: 1299 },
  });
  assert.deepEqual(retailPriceFromMinorUnitsV2(1299, "nok"), {
    state: "UNKNOWN",
    money: null,
  });
});
