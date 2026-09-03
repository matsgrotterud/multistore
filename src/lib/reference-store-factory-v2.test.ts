import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReferenceStoreFactoryFixturesV2,
  selectReferenceStoreRevisionV2,
} from "./reference-store-factory-v2";
import { validateStoreExperienceManifestV2 } from "./storefront-v2";

test("reference factory projects the exact three acceptance catalogs", () => {
  const fixtures = buildReferenceStoreFactoryFixturesV2();
  assert.deepEqual(
    fixtures.map((fixture) => [fixture.key, fixture.catalog.products.length]),
    [
      ["drones", 10],
      ["apparel", 4],
      ["consumables", 4],
    ]
  );
  assert.equal(
    new Set(
      fixtures.map(
        (fixture) =>
          fixture.revisions[1].manifest.designTokens.palette.primary
      )
    ).size,
    3,
    "acceptance fixtures should visibly exercise three deterministic art directions"
  );
  assert.deepEqual(
    fixtures.map((fixture) => ({
      key: fixture.key,
      home: fixture.revisions[1].manifest.pages.home.blocks.map(
        (block) => block.type
      ),
      plp: fixture.revisions[1].manifest.pages.plp.blocks.map(
        (block) => block.type
      ),
      pdp: fixture.revisions[1].manifest.pages.pdp.blocks.map(
        (block) => block.type
      ),
    })),
    [
      {
        key: "drones",
        home: [
          "hero",
          "product-grid",
          "quiz-callout",
          "category-grid",
          "recommendation-grid",
          "newsletter-signup",
        ],
        plp: [
          "category-header",
          "filter-bar",
          "comparison-callout",
          "product-grid",
          "category-navigation",
        ],
        pdp: [
          "product-summary",
          "product-facts",
          "product-gallery",
          "purchase-panel",
          "related-products",
          "wishlist-control",
        ],
      },
      {
        key: "apparel",
        home: [
          "hero",
          "category-grid",
          "editorial-callout",
          "product-grid",
          "newsletter-signup",
          "recommendation-grid",
          "quiz-callout",
        ],
        plp: [
          "category-header",
          "product-grid",
          "filter-bar",
          "category-navigation",
          "comparison-callout",
        ],
        pdp: [
          "product-gallery",
          "product-summary",
          "purchase-panel",
          "wishlist-control",
          "related-products",
          "product-facts",
        ],
      },
      {
        key: "consumables",
        home: [
          "hero",
          "editorial-callout",
          "product-grid",
          "recommendation-grid",
          "category-grid",
          "newsletter-signup",
          "quiz-callout",
        ],
        plp: [
          "category-header",
          "category-navigation",
          "product-grid",
          "filter-bar",
          "comparison-callout",
        ],
        pdp: [
          "product-summary",
          "purchase-panel",
          "wishlist-control",
          "product-gallery",
          "product-facts",
          "related-products",
        ],
      },
    ]
  );

  const [drones, apparel, consumables] = fixtures.map(
    (fixture) => fixture.revisions[1].manifest
  );
  assert.equal(
    drones.pages.plp.blocks.find((block) => block.type === "filter-bar")
      ?.layout,
    "sidebar"
  );
  const apparelGallery = apparel.pages.pdp.blocks.find(
    (block) => block.type === "product-gallery"
  );
  assert.equal(apparelGallery?.layout, "grid");
  assert.equal(apparelGallery?.showThumbnails, true);
  assert.equal(
    consumables.pages.home.blocks.some(
      (block) => block.type === "editorial-callout"
    ),
    true
  );

  for (const fixture of fixtures) {
    assert.equal(fixture.catalog.products.length, fixture.expectedProductCount);
    assert.equal(fixture.revisions.length, 2);
    assert.equal(fixture.revisions[0].status, "APPROVED");
    assert.equal(fixture.revisions[1].status, "DRAFT");
    assert.equal(fixture.revisions[0].persisted, false);
    assert.equal(fixture.revisions[1].persisted, false);
    assert.equal(Object.isFrozen(fixture.revisions), true);
    assert.equal(Object.isFrozen(fixture.revisions[0].manifest), true);
    assert.equal(fixture.diff.changed, true);
    assert.ok(fixture.diff.totalChanges >= 1);
    assert.equal(fixture.buildTimeline.length, 5);

    for (const revision of fixture.revisions) {
      assert.equal(revision.renderDocument.revisionId, revision.id);
      assert.deepEqual(revision.renderDocument.catalog, fixture.catalog);
      assert.strictEqual(revision.renderDocument.manifest, revision.manifest);
      assert.equal(
        revision.renderDocument.contentProposal.catalogProjectionRef,
        fixture.catalog.projectionRef
      );
      assert.equal(revision.renderDocument.activation.scope, "PREVIEW_ONLY");
      assert.equal(revision.renderDocument.activation.liveAuthorized, false);
      assert.equal(revision.renderDocument.activation.indexingAuthorized, false);
      assert.equal(Object.isFrozen(revision.renderDocument), true);
      assert.equal(Object.isFrozen(revision.renderDocument.brief), true);
      assert.equal(Object.isFrozen(revision.renderDocument.contentProposal), true);
      const validation = validateStoreExperienceManifestV2(
        revision.renderDocument.manifest,
        revision.renderDocument.catalog
      );
      assert.equal(validation.success, true);
    }
  }
});

test("public reference viewmodels contain no supplier, evidence or source payload data", () => {
  const serialized = JSON.stringify(buildReferenceStoreFactoryFixturesV2());
  for (const forbidden of [
    "supplierAccountRef",
    "sourceOfferRef",
    "sourcePayloadDigest",
    '"unitCost":',
    '"shipping":{"state":',
    '"evidence"',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("reference output and revision selection are deterministic and fail safe", () => {
  const first = buildReferenceStoreFactoryFixturesV2();
  const second = buildReferenceStoreFactoryFixturesV2();
  assert.deepEqual(second, first);

  const fixture = first[0];
  assert.equal(
    selectReferenceStoreRevisionV2(fixture, fixture.revisions[0].id).id,
    fixture.revisions[0].id
  );
  assert.equal(
    selectReferenceStoreRevisionV2(fixture, "untrusted-or-stale-id").id,
    fixture.selectedRevisionId
  );
});

test("unknown and out-of-stock fixture facts remain non-purchasable", () => {
  const fixtures = buildReferenceStoreFactoryFixturesV2();
  const unavailable = fixtures.flatMap((fixture) =>
    fixture.catalog.products.filter((product) =>
      ["UNKNOWN", "OUT_OF_STOCK"].includes(product.availability)
    )
  );
  assert.ok(unavailable.length >= 3);
  assert.ok(unavailable.every((product) => product.purchasable === false));
});

test("value ribbons require an available, known-price bundle", () => {
  for (const fixture of buildReferenceStoreFactoryFixturesV2()) {
    const products = new Map(
      fixture.catalog.products.map((product) => [product.productId, product])
    );
    const valueRibbons = fixture.revisions[1].manifest.pages.home.blocks.flatMap(
      (block) =>
        "ribbons" in block
          ? (block.ribbons ?? []).filter((ribbon) => ribbon.tone === "value")
          : []
    );
    for (const ribbon of valueRibbons) {
      const product = products.get(ribbon.productRef);
      assert.ok(product?.purchasable);
      assert.ok(
        product.purchaseOptions.some(
          (option) =>
            option.kind === "BUNDLE" &&
            option.price.state === "KNOWN" &&
            ["IN_STOCK", "LOW_STOCK"].includes(option.availability)
        )
      );
    }
  }
});
