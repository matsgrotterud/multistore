import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreExperienceAdminPreviewV2 } from "@/components/storefront-v2";
import {
  apparelCatalogFixtureV2,
  buildCatalogProjectionV2,
} from "@/lib/catalog-v2";
import { catalogProjectionToStoreExperienceV2 } from "./catalog-context";
import { proposeStoreExperienceV2 } from "./generator";
import {
  DEFAULT_PROTECTED_STOREFRONT_SHELLS_V2,
  STORE_EXPERIENCE_BLOCKS_V2,
  storeExperienceManifestV2Schema,
} from "./manifest";
import { storeExperienceCatalogFixtureV2 } from "./test-fixtures";
import {
  contrastRatioV2,
  validateStoreExperienceManifestV2,
} from "./validation";

function generatedFixture() {
  const catalog = storeExperienceCatalogFixtureV2();
  const proposal = proposeStoreExperienceV2(catalog);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") throw new Error("fixture proposal refused");
  return { catalog, manifest: proposal.manifest };
}

test("Store Experience V2 is a strict, versioned allowlist", () => {
  const { manifest } = generatedFixture();
  assert.equal(storeExperienceManifestV2Schema.safeParse(manifest).success, true);
  assert.ok(manifest.designTokens.spacing.contentWidth);
  assert.ok(manifest.designTokens.shape.shadow);
  assert.ok(
    manifest.pages.home.blocks.some(
      (block) => block.type === "newsletter-signup"
    )
  );

  for (const [page, pageManifest] of Object.entries(manifest.pages)) {
    const allowed = STORE_EXPERIENCE_BLOCKS_V2[
      page as keyof typeof STORE_EXPERIENCE_BLOCKS_V2
    ] as readonly string[];
    assert.equal(
      pageManifest.blocks.every((block) => allowed.includes(block.type)),
      true
    );
  }

  const arbitraryCss = { ...manifest, customCss: "body { display: none }" };
  assert.equal(storeExperienceManifestV2Schema.safeParse(arbitraryCss).success, false);

  const arbitraryBlock = structuredClone(manifest) as Record<string, unknown>;
  const pages = arbitraryBlock.pages as {
    home: { blocks: Array<Record<string, unknown>> };
  };
  pages.home.blocks.push({
    id: "home.code",
    type: "custom-html",
    html: "<script>unsafe()</script>",
  });
  assert.equal(storeExperienceManifestV2Schema.safeParse(arbitraryBlock).success, false);
});

test("product ribbons are fact-bounded and cannot annotate an absent product", () => {
  const { catalog, manifest } = generatedFixture();
  const changed = structuredClone(manifest);
  const grid = changed.pages.home.blocks.find(
    (block) => block.type === "product-grid"
  );
  assert.ok(grid?.type === "product-grid");
  if (grid?.type !== "product-grid") return;
  grid.ribbons = [
    {
      productRef: catalog.products.at(-1)!.productId,
      label: "Multiple options",
      tone: "neutral",
    },
  ];
  grid.productRefs = grid.productRefs.filter(
    (productRef) => productRef !== grid.ribbons?.[0]?.productRef
  );

  const validation = validateStoreExperienceManifestV2(changed, catalog);
  assert.equal(validation.success, false);
  assert.ok(
    validation.issues.some(
      (issue) => issue.code === "RIBBON_PRODUCT_NOT_IN_BLOCK"
    )
  );
});

test("protected commerce and policy shells cannot be replaced by manifest data", () => {
  const { catalog, manifest } = generatedFixture();
  assert.deepEqual(manifest.protectedShells, DEFAULT_PROTECTED_STOREFRONT_SHELLS_V2);

  const replaced = structuredClone(manifest);
  (replaced.protectedShells.commerce as { checkout: string }).checkout =
    "author.checkout";
  const validation = validateStoreExperienceManifestV2(replaced, catalog);
  assert.equal(validation.success, false);
  assert.equal(validation.issues.some((issue) => issue.code === "SCHEMA_INVALID"), true);
});

test("contrast, claims and catalog references fail closed", () => {
  const { catalog, manifest } = generatedFixture();
  assert.ok(contrastRatioV2("#172033", "#f8fafc") >= 4.5);

  const inaccessible = structuredClone(manifest);
  inaccessible.designTokens.palette.text = "#eeeeee";
  inaccessible.designTokens.palette.mutedText = "#eeeeee";
  const contrastValidation = validateStoreExperienceManifestV2(
    inaccessible,
    catalog
  );
  assert.equal(contrastValidation.success, false);
  assert.equal(
    contrastValidation.issues.some(
      (issue) => issue.code === "INSUFFICIENT_CONTRAST"
    ),
    true
  );

  const unknownReference = structuredClone(manifest);
  const productGrid = unknownReference.pages.home.blocks.find(
    (block) => block.type === "product-grid"
  );
  assert.ok(productGrid && "productRefs" in productGrid);
  if (productGrid && "productRefs" in productGrid) {
    productGrid.productRefs[0] = "missing-product";
  }
  const referenceValidation = validateStoreExperienceManifestV2(
    unknownReference,
    catalog
  );
  assert.equal(referenceValidation.success, false);
  assert.equal(
    referenceValidation.issues.some(
      (issue) => issue.code === "UNKNOWN_PRODUCT_REF"
    ),
    true
  );

  const unverifiedCatalog = { ...catalog, verifiedClaims: [] };
  const claimValidation = validateStoreExperienceManifestV2(
    manifest,
    unverifiedCatalog
  );
  assert.equal(claimValidation.success, false);
  assert.equal(
    claimValidation.issues.some((issue) => issue.code === "UNVERIFIED_CLAIM"),
    true
  );
});

test("unsafe absolute and medical claims are rejected even as plain text", () => {
  const { catalog, manifest } = generatedFixture();
  const unsafe = structuredClone(manifest);
  const hero = unsafe.pages.home.blocks.find((block) => block.type === "hero");
  assert.ok(hero && hero.type === "hero");
  if (hero?.type === "hero") hero.body = "Guaranteed to cure pain at the lowest price.";

  const validation = validateStoreExperienceManifestV2(unsafe, catalog);
  assert.equal(validation.success, false);
  assert.equal(
    validation.issues.some((issue) => issue.code === "UNSAFE_CLAIM_COPY"),
    true
  );
});

test("feature blocks and flags must agree", () => {
  const { catalog, manifest } = generatedFixture();
  const disabled = structuredClone(manifest);
  disabled.features.quiz = false;
  const disabledValidation = validateStoreExperienceManifestV2(disabled, catalog);
  assert.equal(disabledValidation.success, false);
  assert.equal(
    disabledValidation.issues.some(
      (issue) => issue.code === "FEATURE_BLOCK_DISABLED"
    ),
    true
  );

  const missing = structuredClone(manifest);
  missing.pages.pdp.blocks = missing.pages.pdp.blocks.filter(
    (block) => block.type !== "wishlist-control"
  );
  const missingValidation = validateStoreExperienceManifestV2(missing, catalog);
  assert.equal(missingValidation.success, false);
  assert.equal(
    missingValidation.issues.some(
      (issue) => issue.code === "FEATURE_BLOCK_MISSING"
    ),
    true
  );
});

test("admin preview is inert and emits no navigable links", () => {
  const { catalog, manifest } = generatedFixture();
  const markup = renderToStaticMarkup(
    createElement(StoreExperienceAdminPreviewV2, { manifest, catalog })
  );

  assert.doesNotMatch(markup, /\shref=/i);
  assert.match(markup, /aria-disabled="true"/);
  assert.match(markup, /data-preview-link="disabled"/);
  assert.match(markup, /commerce mutations disabled/i);
});

test("admin PLP preview surfaces generic product and variant facets", () => {
  const projection = buildCatalogProjectionV2(apparelCatalogFixtureV2);
  assert.equal(projection.status, "PROJECTED");
  if (projection.status !== "PROJECTED") return;
  const catalog = catalogProjectionToStoreExperienceV2({
    catalog: projection.projection,
    store: { name: "Field and Form", niche: "Trail apparel" },
  });
  const proposal = proposeStoreExperienceV2(catalog);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;
  const category = catalog.categories.find(
    (candidate) => candidate.slug === "trail-shoes"
  );
  assert.ok(category);

  const markup = renderToStaticMarkup(
    createElement(StoreExperienceAdminPreviewV2, {
      manifest: proposal.manifest,
      catalog,
      page: {
        kind: "plp",
        categoryRef: category.categoryId,
        title: category.title,
        description: category.description,
      },
    })
  );

  for (const facet of ["material", "waterproof", "size", "color"]) {
    assert.match(markup, new RegExp(`>${facet}<`));
  }
});

test("admin PLP preview includes products placed below a parent taxonomy node", () => {
  const projection = buildCatalogProjectionV2(apparelCatalogFixtureV2);
  assert.equal(projection.status, "PROJECTED");
  if (projection.status !== "PROJECTED") return;
  const catalog = catalogProjectionToStoreExperienceV2({
    catalog: projection.projection,
    store: { name: "Field and Form", niche: "Trail apparel" },
  });
  const proposal = proposeStoreExperienceV2(catalog);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;
  const parent = catalog.categories.find(
    (category) => category.slug === "apparel"
  );
  assert.ok(parent);

  const markup = renderToStaticMarkup(
    createElement(StoreExperienceAdminPreviewV2, {
      manifest: proposal.manifest,
      catalog,
      page: {
        kind: "plp",
        categoryRef: parent.categoryId,
        title: parent.title,
        description: parent.description,
      },
    })
  );
  assert.match(markup, /4 projected products/);
});
