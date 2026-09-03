import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StorefrontProductV2 } from "@/lib/catalog-v2/contracts";
import { proposeStoreExperienceV2 } from "@/lib/storefront-v2/generator";
import {
  storefrontProductFixtureV2,
  storeExperienceCatalogFixtureV2,
} from "@/lib/storefront-v2/test-fixtures";
import {
  REFERENCE_SHOPPER_SESSION_POLICY_V2,
  ReferenceShopperPreviewV2,
  buildEffectiveReferenceShopperManifestV2,
  deriveReferenceShopperPriceRangesV2,
  effectiveReferenceShopperCapabilitiesV2,
  formatReferenceShopperPublicValueV2,
  isReferenceShopperPreviewMediaSourceV2,
  isReferenceShopperProductInPriceRangeV2,
  isReferenceShopperSelectionPurchasableV2,
  orderedReferenceShopperMediaIdsV2,
  referenceShopperThemeStyleV2,
  referenceShopperWishlistIdentityV2,
  resetReferenceShopperGallerySelectionV2,
  selectReferenceShopperMediaContractV2,
  shouldManageReferenceShopperFocusV2,
} from "./ReferenceShopperPreview";

function fixtureManifest() {
  const catalog = storeExperienceCatalogFixtureV2();
  const proposal = proposeStoreExperienceV2(catalog);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") {
    throw new Error("Experience fixture was refused");
  }
  return { catalog, manifest: proposal.manifest };
}

test("commerce selection fails closed for unknown price and unavailable stock", () => {
  const base = storefrontProductFixtureV2(1);
  assert.equal(
    isReferenceShopperSelectionPurchasableV2({
      product: base,
      variant: null,
      purchaseOption: null,
    }),
    true
  );

  for (const product of [
    {
      ...base,
      price: { state: "UNKNOWN", money: null },
    },
    { ...base, availability: "UNKNOWN" },
    { ...base, availability: "OUT_OF_STOCK" },
  ] as StorefrontProductV2[]) {
    assert.equal(
      isReferenceShopperSelectionPurchasableV2({
        product,
        variant: null,
        purchaseOption: null,
      }),
      false
    );
  }
});

test("products with variants and purchase options require a compatible available choice", () => {
  const base = storefrontProductFixtureV2(2);
  const variant = {
    variantId: "variant-available",
    label: "Medium / Blue",
    attributes: [],
    price: null,
    compareAtPrice: null,
    availability: "IN_STOCK" as const,
    mediaIds: [],
  };
  const option = {
    purchaseOptionId: "option-bundle",
    kind: "BUNDLE" as const,
    label: "Bundle of three",
    quantity: 3,
    variantId: variant.variantId,
    price: base.price,
    compareAtPrice: null,
    availability: "LOW_STOCK" as const,
    repeatPurchase: { state: "ELIGIBLE" as const, intervalDays: [14, 30] },
  };
  const product = {
    ...base,
    variants: [variant],
    purchaseOptions: [option],
  } as StorefrontProductV2;

  assert.equal(
    isReferenceShopperSelectionPurchasableV2({
      product,
      variant: null,
      purchaseOption: option,
    }),
    false
  );
  assert.equal(
    isReferenceShopperSelectionPurchasableV2({
      product,
      variant,
      purchaseOption: { ...option, variantId: "another-variant" },
    }),
    false
  );
  assert.equal(
    isReferenceShopperSelectionPurchasableV2({
      product,
      variant,
      purchaseOption: option,
    }),
    true
  );
});

test("variant media selection uses an exact binding and never a mismatched fallback", () => {
  const primary = {
    mediaId: "media-primary",
    kind: "IMAGE" as const,
    role: "PRIMARY" as const,
    publicUrl: "https://example.invalid/primary.webp",
    altText: "Primary",
    width: 100,
    height: 100,
    focalPoint: null,
    variantIds: [],
    position: 0,
  };
  const bound = {
    ...primary,
    mediaId: "media-blue",
    role: "VARIANT" as const,
    altText: "Blue",
    variantIds: ["variant-blue"],
    position: 1,
  };
  const product = storefrontProductFixtureV2(3, {
    media: [primary, bound],
    variants: [
      {
        variantId: "variant-blue",
        label: "Blue",
        attributes: [],
        price: null,
        compareAtPrice: null,
        availability: "IN_STOCK",
        mediaIds: [bound.mediaId],
      },
    ],
  });
  assert.equal(
    selectReferenceShopperMediaContractV2(product, "variant-blue")?.mediaId,
    bound.mediaId
  );
  const malformed = {
    ...product,
    variants: [{ ...product.variants[0], mediaIds: ["missing-media"] }],
  };
  assert.equal(
    selectReferenceShopperMediaContractV2(malformed, "variant-blue"),
    null
  );
  assert.deepEqual(
    orderedReferenceShopperMediaIdsV2(product, "variant-blue"),
    ["media-blue", "media-primary"]
  );
  assert.deepEqual(
    resetReferenceShopperGallerySelectionV2(
      { [product.productId]: "media-primary", untouched: "media-other" },
      product.productId
    ),
    { untouched: "media-other" }
  );
});

test("preview media accepts only the exact reviewed local WebP path shape", () => {
  assert.equal(
    isReferenceShopperPreviewMediaSourceV2(
      "/reference-store-factory-v2/apparel/ridge-trail-shoe-navy.webp"
    ),
    true
  );
  for (const unsafe of [
    "/reference-store-factory-v2/apparel/../secret.webp",
    "/reference-store-factory-v2/apparel/%2e%2e%2fsecret.webp",
    "/reference-store-factory-v2/apparel/shoe.webp?next=/api/private",
    "/reference-store-factory-v2/apparel/shoe.webp#fragment",
    "/reference-store-factory-v2//apparel/shoe.webp",
    "/reference-store-factory-v2/other/shoe.webp",
    "/reference-store-factory-v2/apparel/shoe.png",
    "//reference-store-factory-v2/apparel/shoe.webp",
  ]) {
    assert.equal(isReferenceShopperPreviewMediaSourceV2(unsafe), false, unsafe);
  }
});

test("price ranges use integer minor units in one currency and exclude unknowns", () => {
  const first = storefrontProductFixtureV2(10, {
    price: {
      state: "KNOWN",
      money: {
        version: "catalog-money.v2",
        currency: "NOK",
        amountMinor: 10_000,
      },
    },
  });
  const second = storefrontProductFixtureV2(11, {
    price: {
      state: "KNOWN",
      money: {
        version: "catalog-money.v2",
        currency: "NOK",
        amountMinor: 30_000,
      },
    },
  });
  const unknown = storefrontProductFixtureV2(12, {
    price: { state: "UNKNOWN", money: null },
    purchasable: false,
  });
  const ranges = deriveReferenceShopperPriceRangesV2([
    first,
    second,
    unknown,
  ]);
  assert.equal(ranges.length, 2);
  assert.equal(ranges[0].currency, "NOK");
  assert.equal(ranges[0].maxMinor, 10_000);
  assert.equal(ranges[1].minMinor, 30_000);
  assert.equal(isReferenceShopperProductInPriceRangeV2(first, ranges[0]), true);
  assert.equal(isReferenceShopperProductInPriceRangeV2(second, ranges[0]), false);
  assert.equal(isReferenceShopperProductInPriceRangeV2(unknown, ranges[0]), false);

  const mixedCurrency = storefrontProductFixtureV2(13, {
    price: {
      state: "KNOWN",
      money: {
        version: "catalog-money.v2",
        currency: "USD",
        amountMinor: 10_000,
      },
    },
  });
  assert.deepEqual(
    deriveReferenceShopperPriceRangesV2([first, mixedCurrency, unknown]),
    []
  );
});

test("effective capabilities intersect the manifest and remove inert feature blocks", () => {
  const { manifest } = fixtureManifest();
  const capabilities = effectiveReferenceShopperCapabilitiesV2({
    manifest,
    runtime: {
      search: false,
      wishlist: false,
      compare: false,
      recommendations: false,
      quiz: true,
    },
  });
  assert.equal(capabilities.search, false);
  assert.equal(capabilities.wishlist, false);
  assert.equal(capabilities.compare, false);
  assert.equal(capabilities.recommendations, false);
  assert.equal(capabilities.quiz, false);

  const effective = buildEffectiveReferenceShopperManifestV2({
    manifest,
    capabilities,
  });
  assert.deepEqual(effective.features, {
    ...manifest.features,
    wishlist: false,
    compare: false,
    quiz: false,
    recommendations: false,
  });
  assert.equal(
    Object.values(effective.pages).some((page) =>
      page.blocks.some((block) =>
        [
          "quiz-callout",
          "wishlist-control",
          "comparison-callout",
          "recommendation-grid",
          "related-products",
        ].includes(block.type)
      )
    ),
    false
  );
});

test("wishlist identity includes the selected variant and public booleans are explicit", () => {
  assert.equal(
    referenceShopperWishlistIdentityV2("product-1", "variant-blue"),
    "product-1::variant-blue"
  );
  assert.notEqual(
    referenceShopperWishlistIdentityV2("product-1", "variant-blue"),
    referenceShopperWishlistIdentityV2("product-1", "variant-red")
  );
  assert.equal(formatReferenceShopperPublicValueV2("true", "BOOLEAN"), "Yes");
  assert.equal(formatReferenceShopperPublicValueV2("false", "BOOLEAN"), "No");
  assert.equal(formatReferenceShopperPublicValueV2("", "TEXT"), "Not stated");
});

test("custom shopper pages inherit every design-token family", () => {
  const { manifest } = fixtureManifest();
  const styled = structuredClone(manifest);
  styled.designTokens.typography = {
    headingFamily: "system-serif",
    bodyFamily: "system-serif",
    scale: "display",
  };
  styled.designTokens.spacing = {
    density: "airy",
    sectionGap: "large",
    contentWidth: "wide",
  };
  styled.designTokens.shape = {
    radius: "rounded",
    cardStyle: "flat",
    shadow: "strong",
  };
  styled.designTokens.imagery = {
    productFit: "contain",
    productRatio: "portrait",
  };
  const style = referenceShopperThemeStyleV2(styled) as Record<string, string>;
  assert.match(style["--storefront-font-heading"], /ui-serif/);
  assert.match(style["--storefront-font-body"], /ui-serif/);
  assert.equal(style["--storefront-heading-size"], "3.75rem");
  assert.equal(style["--storefront-density-space"], "4rem");
  assert.equal(style["--storefront-section-gap"], "4rem");
  assert.equal(style["--storefront-content-width"], "90rem");
  assert.equal(style["--storefront-radius"], "1.5rem");
  assert.equal(style["--storefront-card-border-width"], "0px");
  assert.match(style["--storefront-shadow"], /18px/);
  assert.equal(style["--storefront-product-fit"], "contain");
  assert.equal(style["--storefront-product-ratio"], "4 / 5");
});

test("PLP follows manifest block order and toolbar layout", () => {
  const { catalog, manifest } = fixtureManifest();
  const changed = structuredClone(manifest);
  const header = changed.pages.plp.blocks.find(
    (block) => block.type === "category-header"
  );
  const products = changed.pages.plp.blocks.find(
    (block) => block.type === "product-grid"
  );
  const filters = changed.pages.plp.blocks.find(
    (block) => block.type === "filter-bar"
  );
  assert.ok(header && products && filters?.type === "filter-bar");
  if (!header || !products || filters?.type !== "filter-bar") return;
  filters.layout = "toolbar";
  changed.pages.plp.blocks = [header, products, filters];

  const markup = renderToStaticMarkup(
    createElement(ReferenceShopperPreviewV2, {
      revisionKey: "revision-toolbar",
      catalog,
      manifest: changed,
      initialPage: "plp",
    })
  );
  assert.match(markup, /data-reference-plp-composition="manifest-flow"/);
  assert.match(markup, /data-experience-filter-layout="toolbar"/);
  assert.match(markup, /<legend[^>]*>Price<\/legend>/);
  assert.match(markup, /<legend[^>]*>Availability<\/legend>/);
  assert.match(markup, /<legend[^>]*>Brand<\/legend>/);
  assert.ok(
    markup.indexOf('data-manifest-plp-block="product-grid"') <
      markup.indexOf('data-manifest-plp-block="filter-bar"')
  );
});

test("PDP renders reviewed thumbnail metadata and variant media first", () => {
  const { catalog, manifest } = fixtureManifest();
  const primary = {
    ...catalog.products[0].media[0],
    mediaId: "media-primary",
    altText: "Primary product view",
    width: 100,
    height: 100,
    variantIds: [],
  };
  const variantMedia = {
    ...primary,
    mediaId: "media-blue",
    role: "VARIANT" as const,
    altText: "Blue variant view",
    variantIds: ["variant-blue"],
  };
  const product = {
    ...catalog.products[0],
    media: [primary, variantMedia],
    variants: [
      {
        variantId: "variant-blue",
        label: "Blue",
        attributes: [],
        price: null,
        compareAtPrice: null,
        availability: "IN_STOCK" as const,
        mediaIds: ["media-blue"],
      },
    ],
  };
  const changedCatalog = {
    ...catalog,
    products: [product, ...catalog.products.slice(1)],
  };
  const changedManifest = structuredClone(manifest);
  const gallery = changedManifest.pages.pdp.blocks.find(
    (block) => block.type === "product-gallery"
  );
  assert.ok(gallery?.type === "product-gallery");
  if (gallery?.type !== "product-gallery") return;
  gallery.showThumbnails = true;

  const markup = renderToStaticMarkup(
    createElement(ReferenceShopperPreviewV2, {
      revisionKey: "revision-gallery",
      catalog: changedCatalog,
      manifest: changedManifest,
      initialPage: "pdp",
      initialProductId: product.productId,
      resolveMedia: (
        _product: StorefrontProductV2,
        media: StorefrontProductV2["media"][number]
      ) => ({
        src: `/reference-store-factory-v2/apparel/${
          media.mediaId === "media-blue" ? "product-blue" : "product-primary"
        }.webp`,
        width: 100,
        height: 100,
        altText: media.altText,
        mediaId: media.mediaId,
        rights: "VERIFIED_SYNTHETIC",
        source: "test-local-reference",
        variantIds: media.variantIds,
        focalPoint: media.focalPoint,
      }),
    })
  );
  assert.match(markup, /data-gallery-media-count="2"/);
  assert.match(markup, /gallery thumbnails/);
  assert.match(markup, /data-media-rights="VERIFIED_SYNTHETIC"/);
  assert.match(markup, /data-media-source="test-local-reference"/);
  assert.ok(
    markup.indexOf('data-media-id="media-blue"') <
      markup.indexOf('data-media-id="media-primary"')
  );
});

test("revisionKey keys the complete stateful child and the runtime has no persistence or network API", () => {
  const { catalog, manifest } = fixtureManifest();
  const first = ReferenceShopperPreviewV2({
    revisionKey: "revision-a",
    catalog,
    manifest,
  });
  const second = ReferenceShopperPreviewV2({
    revisionKey: "revision-b",
    catalog,
    manifest,
  });
  assert.equal(first.key, "revision-a");
  assert.equal(second.key, "revision-b");
  assert.deepEqual(REFERENCE_SHOPPER_SESSION_POLICY_V2, {
    persistence: "MEMORY_ONLY",
    networkRequests: "DISABLED",
    analytics: "DISABLED",
    commerceWrites: "DISABLED",
  });
  assert.equal(
    shouldManageReferenceShopperFocusV2({
      mounted: false,
      userTransitionPending: true,
    }),
    false
  );
  assert.equal(
    shouldManageReferenceShopperFocusV2({
      mounted: true,
      userTransitionPending: true,
    }),
    true
  );
  const markup = renderToStaticMarkup(
    createElement(ReferenceShopperPreviewV2, {
      revisionKey: "revision-focus",
      catalog,
      manifest,
    })
  );
  assert.match(markup, /data-managed-focus-target="shopper-page-content"/);
  assert.match(markup, /tabindex="-1"/);
  assert.match(markup, /aria-label="Preview page content: home"/);

  const source = readFileSync(
    new URL("./ReferenceShopperPreview.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\blocalStorage\b/);
  assert.doesNotMatch(source, /\bsessionStorage\b/);
  assert.doesNotMatch(source, /\bsendBeacon\b/);
  assert.doesNotMatch(source, /from\s+["']@\/lib\/actions\//);
  assert.match(source, /pageFocusTargetRef\.current\?\.focus/);
});
