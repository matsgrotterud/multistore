import {
  StorefrontProductV2Schema,
  type StorefrontProductV2,
} from "@/lib/catalog-v2/contracts";
import type { StoreExperienceCatalogProjectionV2 } from "./catalog-context";
import {
  DEFAULT_PROTECTED_STOREFRONT_SHELLS_V2,
  STORE_EXPERIENCE_CLAIMS_V2,
  STORE_EXPERIENCE_MANIFEST_V2,
  type StoreExperienceDesignTokensV2,
  type StoreExperienceManifestV2,
} from "./manifest";
import {
  validateStoreExperienceManifestV2,
  type StoreExperienceValidationFailureV2,
} from "./validation";
import type { StoreExperienceClaimV2 } from "./validation-types";

export const STORE_EXPERIENCE_PROPOSAL_V2 =
  "store-experience-proposal.v2" as const;

export const STORE_EXPERIENCE_PROPOSAL_REASON_CODES_V2 = [
  "CATALOG_EMPTY",
  "CATALOG_PRODUCT_INVALID",
  "CATALOG_PRODUCT_IDS_DUPLICATED",
  "MANIFEST_VALIDATION_FAILED",
  "CATALOG_DRIVEN_LAYOUT_PROPOSED",
  "COMMERCE_AND_POLICY_SHELLS_LOCKED",
  "OPTIONAL_FEATURES_CAPABILITY_GATED",
] as const;

export type StoreExperienceProposalReasonCodeV2 =
  (typeof STORE_EXPERIENCE_PROPOSAL_REASON_CODES_V2)[number];

export type StoreExperienceProposalV2 =
  | {
      version: typeof STORE_EXPERIENCE_PROPOSAL_V2;
      status: "PROPOSED";
      proposalId: string;
      catalogProjectionRef: string;
      manifest: StoreExperienceManifestV2;
      reasonCodes: [
        "CATALOG_DRIVEN_LAYOUT_PROPOSED",
        "COMMERCE_AND_POLICY_SHELLS_LOCKED",
        "OPTIONAL_FEATURES_CAPABILITY_GATED"
      ];
      validation: { success: true; issues: [] };
    }
  | {
      version: typeof STORE_EXPERIENCE_PROPOSAL_V2;
      status: "REFUSED";
      proposalId: null;
      catalogProjectionRef: string;
      manifest: null;
      reasonCodes: Array<
        | "CATALOG_EMPTY"
        | "CATALOG_PRODUCT_INVALID"
        | "CATALOG_PRODUCT_IDS_DUPLICATED"
        | "MANIFEST_VALIDATION_FAILED"
      >;
      validation: StoreExperienceValidationFailureV2 | null;
    };

const PALETTES: readonly StoreExperienceDesignTokensV2[] = [
  {
    palette: {
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#172033",
      mutedText: "#475569",
      primary: "#1d4ed8",
      onPrimary: "#ffffff",
      border: "#94a3b8",
    },
    typography: {
      headingFamily: "system-sans",
      bodyFamily: "system-sans",
      scale: "standard",
    },
    spacing: {
      density: "comfortable",
      sectionGap: "medium",
      contentWidth: "standard",
    },
    shape: { radius: "soft", cardStyle: "bordered", shadow: "soft" },
    imagery: { productFit: "contain", productRatio: "square" },
  },
  {
    palette: {
      background: "#f7f5ef",
      surface: "#ffffff",
      text: "#142018",
      mutedText: "#3f5146",
      primary: "#14532d",
      onPrimary: "#ffffff",
      border: "#9aaa9f",
    },
    typography: {
      headingFamily: "system-serif",
      bodyFamily: "system-sans",
      scale: "display",
    },
    spacing: {
      density: "airy",
      sectionGap: "large",
      contentWidth: "wide",
    },
    shape: { radius: "rounded", cardStyle: "flat", shadow: "none" },
    imagery: { productFit: "cover", productRatio: "portrait" },
  },
  {
    palette: {
      background: "#fffaf5",
      surface: "#ffffff",
      text: "#2b1d17",
      mutedText: "#654c3f",
      primary: "#7c2d12",
      onPrimary: "#ffffff",
      border: "#b8a397",
    },
    typography: {
      headingFamily: "system-serif",
      bodyFamily: "system-serif",
      scale: "standard",
    },
    spacing: {
      density: "comfortable",
      sectionGap: "large",
      contentWidth: "narrow",
    },
    shape: { radius: "none", cardStyle: "elevated", shadow: "strong" },
    imagery: { productFit: "cover", productRatio: "landscape" },
  },
] as const;

export const STORE_EXPERIENCE_COMPOSITION_STRATEGIES_V2 = [
  "SPECIFICATION_LED",
  "VARIANT_EDITORIAL",
  "REPEAT_BUNDLE",
] as const;

export type StoreExperienceCompositionStrategyV2 =
  (typeof STORE_EXPERIENCE_COMPOSITION_STRATEGIES_V2)[number];

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)])
  );
}

export function stableStoreExperienceHashV2(value: unknown): string {
  const serialized = JSON.stringify(canonicalize(value));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function verifiedClaims(
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceClaimV2[] {
  const claims = new Set<StoreExperienceClaimV2>(
    (catalog.verifiedClaims ?? []).filter(
      (claim): claim is StoreExperienceClaimV2 =>
        STORE_EXPERIENCE_CLAIMS_V2.includes(claim)
    )
  );
  if (
    catalog.products.length === 0 ||
    catalog.products.some((product) => product.availability === "UNKNOWN")
  ) {
    claims.delete("verified-availability");
  }
  return [...claims].sort();
}

const claimCopy: Record<
  StoreExperienceClaimV2,
  { title: string; body: string }
> = {
  "secure-checkout": {
    title: "Platform checkout",
    body: "Checkout stays inside the platform commerce flow.",
  },
  "clear-returns": {
    title: "Returns information",
    body: "Review the store returns policy before ordering.",
  },
  "merchant-support": {
    title: "Merchant support",
    body: "Merchant support details are available in the store footer.",
  },
  "verified-availability": {
    title: "Catalog availability",
    body: "Availability shown here comes from the supplied catalog projection.",
  },
};

function categoryHref(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}

function productHref(slug: string): string {
  return `/p/${encodeURIComponent(slug)}`;
}

/**
 * Selects a presentation strategy from normalized catalog shape only. Ratios
 * prevent one exceptional SKU from restyling a large store, while the default
 * remains an image-led editorial composition for collection-backed catalogs.
 */
export function selectStoreExperienceCompositionStrategyV2(
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceCompositionStrategyV2 {
  const products = catalog.products;
  const repeatBundleProducts = products.filter((product) => {
    const hasBundle = product.purchaseOptions.some(
      (option) => option.kind === "BUNDLE"
    );
    const hasRepeat = product.purchaseOptions.some(
      (option) => option.repeatPurchase.state === "ELIGIBLE"
    );
    return hasBundle && hasRepeat;
  }).length;
  if (hasRatio(repeatBundleProducts, products.length, 1, 2)) {
    return "REPEAT_BUNDLE";
  }

  const variantProducts = products.filter(
    (product) => product.variants.length >= 2
  ).length;
  const variantIds = new Set(
    products.flatMap((product) =>
      product.variants.map((variant) => variant.variantId)
    )
  );
  const mediaBoundVariantIds = new Set(
    products.flatMap((product) =>
      product.media.flatMap((media) =>
        media.variantIds.filter((variantId) => variantIds.has(variantId))
      )
    )
  );
  const averageVariants =
    products.reduce((sum, product) => sum + product.variants.length, 0) /
    Math.max(products.length, 1);
  const variantMediaCoverage =
    variantIds.size === 0 ? 0 : mediaBoundVariantIds.size / variantIds.size;
  if (
    hasRatio(variantProducts, products.length, 1, 2) &&
    averageVariants >= 3 &&
    variantMediaCoverage >= 0.75
  ) {
    return "VARIANT_EDITORIAL";
  }

  const specificationProducts = products.filter(
    (product) =>
      product.attributes.filter(
        (attribute) => attribute.facetable && attribute.comparable
      ).length >= 4
  ).length;
  if (hasRatio(specificationProducts, products.length, 3, 5)) {
    return "SPECIFICATION_LED";
  }

  const knownCollectionIds = new Set(
    catalog.collections.map((collection) => collection.collectionId)
  );
  const collectionBackedProducts = products.filter((product) =>
    product.collections.some((membership) =>
      knownCollectionIds.has(membership.collectionId)
    )
  ).length;
  return hasRatio(collectionBackedProducts, products.length, 1, 2)
    ? "VARIANT_EDITORIAL"
    : "SPECIFICATION_LED";
}

function hasRatio(
  matching: number,
  total: number,
  numerator: number,
  denominator: number
): boolean {
  return total > 0 && matching * denominator >= total * numerator;
}

function designDirectionForStrategyV2(
  strategy: StoreExperienceCompositionStrategyV2
): StoreExperienceDesignTokensV2 {
  if (strategy === "VARIANT_EDITORIAL") return PALETTES[1];
  if (strategy === "REPEAT_BUNDLE") return PALETTES[2];
  return PALETTES[0];
}

function shapeScoreV2(
  product: StorefrontProductV2,
  strategy: StoreExperienceCompositionStrategyV2
): number {
  if (strategy === "SPECIFICATION_LED") {
    return product.attributes.filter(
      (attribute) => attribute.facetable && attribute.comparable
    ).length;
  }
  if (strategy === "VARIANT_EDITORIAL") {
    const variantMedia = product.media.filter(
      (media) => media.variantIds.length > 0
    ).length;
    return product.variants.length * 10 + variantMedia;
  }
  return product.purchaseOptions.reduce((score, option) => {
    if (option.kind === "BUNDLE") score += 10;
    if (option.repeatPurchase.state === "ELIGIBLE") score += 5;
    return score;
  }, 0);
}

function productsForCompositionV2(
  catalog: StoreExperienceCatalogProjectionV2,
  strategy: StoreExperienceCompositionStrategyV2
): StorefrontProductV2[] {
  const collectionOrder = new Map(
    [...catalog.collections]
      .sort(
        (left, right) =>
          left.position - right.position ||
          left.collectionId.localeCompare(right.collectionId)
      )
      .map((collection, index) => [collection.collectionId, index])
  );
  const collectionRank = (product: StorefrontProductV2) =>
    product.collections
      .flatMap((membership) => {
        const rank = collectionOrder.get(membership.collectionId);
        return rank === undefined
          ? []
          : [{ rank, position: membership.position, id: membership.collectionId }];
      })
      .sort(
        (left, right) =>
          left.rank - right.rank ||
          left.position - right.position ||
          left.id.localeCompare(right.id)
      )[0] ?? null;

  return [...catalog.products].sort((left, right) => {
    if (left.purchasable !== right.purchasable) return left.purchasable ? -1 : 1;
    const availabilityOrder = {
      IN_STOCK: 0,
      LOW_STOCK: 1,
      PREORDER: 2,
      OUT_OF_STOCK: 3,
      UNKNOWN: 4,
    } as const;
    const availabilityDifference =
      availabilityOrder[left.availability] -
      availabilityOrder[right.availability];
    if (availabilityDifference !== 0) return availabilityDifference;

    const scoreDifference =
      shapeScoreV2(right, strategy) - shapeScoreV2(left, strategy);
    if (scoreDifference !== 0) return scoreDifference;

    const leftCollection = collectionRank(left);
    const rightCollection = collectionRank(right);
    if (leftCollection && rightCollection) {
      const collectionDifference =
        leftCollection.rank - rightCollection.rank ||
        leftCollection.position - rightCollection.position ||
        leftCollection.id.localeCompare(rightCollection.id);
      if (collectionDifference !== 0) return collectionDifference;
    } else if (leftCollection || rightCollection) {
      return leftCollection ? -1 : 1;
    }
    return left.productId.localeCompare(right.productId);
  });
}

function productRibbonV2(product: StorefrontProductV2): {
  productRef: string;
  label: "Low stock" | "Bundle options" | "Multiple options";
  tone: "attention" | "value" | "neutral";
} | null {
  if (product.availability === "LOW_STOCK") {
    return {
      productRef: product.productId,
      label: "Low stock",
      tone: "attention",
    };
  }
  if (
    product.purchasable &&
    product.purchaseOptions.some(
      (option) =>
        option.kind === "BUNDLE" &&
        option.price.state === "KNOWN" &&
        (option.availability === "IN_STOCK" ||
          option.availability === "LOW_STOCK")
    )
  ) {
    return {
      productRef: product.productId,
      label: "Bundle options",
      tone: "value",
    };
  }
  if (product.variants.length > 1) {
    return {
      productRef: product.productId,
      label: "Multiple options",
      tone: "neutral",
    };
  }
  return null;
}

function buildManifest(
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceManifestV2 {
  const strategy = selectStoreExperienceCompositionStrategyV2(catalog);
  const products = productsForCompositionV2(catalog, strategy);
  const categories = [...catalog.categories].sort(
    (left, right) =>
      left.depth - right.depth ||
      left.position - right.position ||
      left.path.join("/").localeCompare(right.path.join("/")) ||
      left.categoryId.localeCompare(right.categoryId)
  );
  const productRefs = products.slice(0, 8).map((product) => product.productId);
  const recommendationRefs = products
    .slice(0, Math.min(4, products.length))
    .map((product) => product.productId);
  const categoryRefs = categories
    .slice(0, 8)
    .map((category) => category.categoryId);
  const claims = verifiedClaims(catalog);
  const designTokens = designDirectionForStrategyV2(strategy);
  const wishlist = products.some((product) => product.purchasable);
  const compare = products.length >= 2;
  const quiz = products.length >= 4 && categories.length >= 2;
  const recommendations = products.length >= 3;
  const productRibbons = products.flatMap((product) => {
    const ribbon = productRibbonV2(product);
    return ribbon ? [ribbon] : [];
  });
  const ribbonsFor = (refs: readonly string[]) =>
    productRibbons.filter((ribbon) => refs.includes(ribbon.productRef));
  const primaryHref = categories[0]
    ? categoryHref(categories[0].slug)
    : productHref(products[0].slug);

  type HomeBlock = StoreExperienceManifestV2["pages"]["home"]["blocks"][number];
  const homeHero: HomeBlock = {
    id: "home.hero",
    type: "hero",
    layout:
      strategy === "VARIANT_EDITORIAL"
        ? "editorial"
        : strategy === "REPEAT_BUNDLE"
          ? "centered"
          : "split",
    eyebrow: catalog.store.niche,
    title: `Explore ${catalog.store.niche}`,
    body:
      strategy === "SPECIFICATION_LED"
        ? `Review the current ${catalog.store.name} catalog through its listed product specifications and availability.`
        : strategy === "VARIANT_EDITORIAL"
          ? `Browse the current ${catalog.store.name} catalog through its imagery, product groupings and listed options.`
          : `Review the current ${catalog.store.name} catalog and its listed single-item, bundle and repeat-purchase choices.`,
    primaryAction: {
      label: strategy === "REPEAT_BUNDLE" ? "View purchase choices" : "Browse products",
      href: strategy === "REPEAT_BUNDLE" ? productHref(products[0].slug) : primaryHref,
      emphasis: "primary",
    },
    ...(strategy === "SPECIFICATION_LED" && compare
      ? {
          secondaryAction: {
            label: "Compare products",
            href: "/compare",
            emphasis: "secondary" as const,
          },
        }
      : {}),
    ...(strategy === "REPEAT_BUNDLE"
      ? {}
      : { featuredProductRef: products[0].productId }),
  };
  const homeCategories: HomeBlock | null =
    categoryRefs.length > 0
      ? {
      id: "home.categories",
      type: "category-grid",
      title: "Browse categories",
      categoryRefs,
      columns: categoryRefs.length >= 4 ? "four" : categoryRefs.length >= 3 ? "three" : "two",
          layout: strategy === "VARIANT_EDITORIAL" ? "mosaic" : "grid",
        }
      : null;
  const homeProducts: HomeBlock = {
    id: "home.products",
    type: "product-grid",
    title:
      strategy === "SPECIFICATION_LED"
        ? "Compare listed specifications"
        : strategy === "VARIANT_EDITORIAL"
          ? "Explore the product edit"
          : "Shop available formats",
    productRefs,
    columns:
      strategy === "REPEAT_BUNDLE"
        ? productRefs.length >= 3
          ? "three"
          : "two"
        : strategy === "VARIANT_EDITORIAL"
          ? productRefs.length >= 3
            ? "three"
            : "two"
          : productRefs.length >= 4
            ? "four"
            : productRefs.length >= 3
              ? "three"
              : "two",
    productCardSlot: "commerce.product-card.v1",
    ribbons: ribbonsFor(productRefs),
  };
  const homeClaims: HomeBlock | null =
    claims.length > 0
      ? {
          id: "home.claims",
          type: "value-propositions",
          title: "Store information",
          items: claims.map((claim) => ({ claim, ...claimCopy[claim] })),
        }
      : null;
  const homeNewsletter: HomeBlock = {
    id: "home.newsletter",
    type: "newsletter-signup",
    title: "Keep up with the catalog",
    body: "Receive occasional product updates from this store.",
    submitLabel: "Subscribe",
    consentLabel: "I agree to receive store updates and can unsubscribe at any time.",
    signupSlot: "commerce.newsletter-signup.v1",
  };
  const homeQuiz: HomeBlock | null = quiz
    ? {
        id: "home.quiz",
        type: "quiz-callout",
        title: "Narrow the catalog",
        body: "Answer a few product questions to refine the available choices.",
        href: "/quiz",
      }
    : null;
  const homeRecommendations: HomeBlock | null = recommendations
    ? {
        id: "home.recommendations",
        type: "recommendation-grid",
        title:
          strategy === "REPEAT_BUNDLE"
            ? "More available choices"
            : "More from the catalog",
        productRefs: recommendationRefs,
        productCardSlot: "commerce.product-card.v1",
        ribbons: ribbonsFor(recommendationRefs),
      }
    : null;
  const homeEditorial: HomeBlock | null =
    strategy === "SPECIFICATION_LED"
      ? null
      : {
          id: "home.editorial",
          type: "editorial-callout",
          eyebrow:
            strategy === "REPEAT_BUNDLE"
              ? "Purchase formats"
              : catalog.collections.length > 0
                ? "Catalog groupings"
                : "Product options",
          title:
            strategy === "REPEAT_BUNDLE"
              ? "Choose the listed purchase format"
              : "Explore available product options",
          body:
            strategy === "REPEAT_BUNDLE"
              ? "Review single-item, bundle and repeat-purchase choices where those options are present in the current catalog."
              : catalog.collections.length > 0
                ? "Use the catalog's normalized groupings, imagery and listed variants to explore products from different angles."
                : "Use the available imagery and listed variants to explore products from different angles.",
          action: {
            label:
              strategy === "REPEAT_BUNDLE"
                ? "Review the first product"
                : "Explore the catalog",
            href:
              strategy === "REPEAT_BUNDLE"
                ? productHref(products[0].slug)
                : primaryHref,
            emphasis: "secondary",
          },
        };

  const homeBlocks: StoreExperienceManifestV2["pages"]["home"]["blocks"] = [];
  if (strategy === "SPECIFICATION_LED") {
    homeBlocks.push(homeHero, homeProducts);
    if (homeQuiz) homeBlocks.push(homeQuiz);
    if (homeCategories) homeBlocks.push(homeCategories);
    if (homeRecommendations) homeBlocks.push(homeRecommendations);
    if (homeClaims) homeBlocks.push(homeClaims);
    homeBlocks.push(homeNewsletter);
  } else if (strategy === "VARIANT_EDITORIAL") {
    homeBlocks.push(homeHero);
    if (homeCategories) homeBlocks.push(homeCategories);
    if (homeEditorial) homeBlocks.push(homeEditorial);
    homeBlocks.push(homeProducts);
    if (homeClaims) homeBlocks.push(homeClaims);
    homeBlocks.push(homeNewsletter);
    if (homeRecommendations) homeBlocks.push(homeRecommendations);
    if (homeQuiz) homeBlocks.push(homeQuiz);
  } else {
    homeBlocks.push(homeHero);
    if (homeEditorial) homeBlocks.push(homeEditorial);
    homeBlocks.push(homeProducts);
    if (homeRecommendations) homeBlocks.push(homeRecommendations);
    if (homeCategories) homeBlocks.push(homeCategories);
    if (homeClaims) homeBlocks.push(homeClaims);
    homeBlocks.push(homeNewsletter);
    if (homeQuiz) homeBlocks.push(homeQuiz);
  }

  type PlpBlock = StoreExperienceManifestV2["pages"]["plp"]["blocks"][number];
  const plpHeader: PlpBlock = {
      id: "plp.header",
      type: "category-header",
    alignment: strategy === "VARIANT_EDITORIAL" ? "center" : "left",
      showDescription: true,
  };
  const plpFilters: PlpBlock = {
      id: "plp.filters",
      type: "filter-bar",
    layout: strategy === "SPECIFICATION_LED" ? "sidebar" : "toolbar",
      source: "taxonomy-attributes",
    showResultCount: true,
      facets: ["category", "price", "availability", "brand"],
  };
  const plpProducts: PlpBlock = {
      id: "plp.products",
      type: "product-grid",
    ...(strategy === "REPEAT_BUNDLE"
      ? { title: "Available purchase choices" }
      : {}),
    columns:
      strategy === "SPECIFICATION_LED"
        ? "four"
        : strategy === "VARIANT_EDITORIAL"
          ? "three"
          : "two",
      productCardSlot: "commerce.product-card.v1",
      ribbons: productRibbons,
      emptyState: "No projected products are available in this category.",
  };
  const plpCategories: PlpBlock | null =
    categoryRefs.length > 0
      ? {
          id: "plp.categories",
          type: "category-navigation",
          title: "Other categories",
          categoryRefs,
        }
      : null;
  const plpCompare: PlpBlock | null = compare
    ? {
        id: "plp.compare",
        type: "comparison-callout",
        label: "Compare selected products",
        href: "/compare",
      }
    : null;
  const plpBlocks: StoreExperienceManifestV2["pages"]["plp"]["blocks"] = [];
  if (strategy === "SPECIFICATION_LED") {
    plpBlocks.push(plpHeader, plpFilters);
    if (plpCompare) plpBlocks.push(plpCompare);
    plpBlocks.push(plpProducts);
    if (plpCategories) plpBlocks.push(plpCategories);
  } else if (strategy === "VARIANT_EDITORIAL") {
    plpBlocks.push(plpHeader, plpProducts, plpFilters);
    if (plpCategories) plpBlocks.push(plpCategories);
    if (plpCompare) plpBlocks.push(plpCompare);
  } else {
    plpBlocks.push(plpHeader);
    if (plpCategories) plpBlocks.push(plpCategories);
    plpBlocks.push(plpProducts, plpFilters);
    if (plpCompare) plpBlocks.push(plpCompare);
  }

  type PdpBlock = StoreExperienceManifestV2["pages"]["pdp"]["blocks"][number];
  const pdpGallery: PdpBlock = {
      id: "pdp.gallery",
      type: "product-gallery",
    layout: strategy === "REPEAT_BUNDLE" ? "carousel" : "grid",
    showThumbnails: strategy === "VARIANT_EDITORIAL",
      gallerySlot: "commerce.product-gallery.v1",
  };
  const pdpSummary: PdpBlock = {
      id: "pdp.summary",
      type: "product-summary",
      showBrand: true,
      showSubtitle: true,
    showTaxonomyBreadcrumbs: strategy === "SPECIFICATION_LED",
  };
  const pdpPurchase: PdpBlock = {
      id: "pdp.purchase",
      type: "purchase-panel",
      purchaseSlot: "commerce.purchase-panel.v1",
    showAvailability: true,
  };
  const pdpFacts: PdpBlock = {
      id: "pdp.facts",
      type: "product-facts",
    title:
      strategy === "SPECIFICATION_LED" ? "Specifications and facts" : "Product details",
    fields:
      strategy === "REPEAT_BUNDLE"
        ? ["description", "availability", "specifications", "country-of-origin"]
        : ["description", "specifications", "availability", "country-of-origin"],
  };
  const pdpClaims: PdpBlock | null =
    claims.length > 0
      ? { id: "pdp.claims", type: "trust-facts", claims }
      : null;
  const pdpWishlist: PdpBlock | null = wishlist
    ? {
        id: "pdp.wishlist",
        type: "wishlist-control",
        label: "Save for later",
      }
    : null;
  const pdpRelated: PdpBlock | null = recommendations
    ? {
        id: "pdp.related",
        type: "related-products",
        title:
          strategy === "REPEAT_BUNDLE" ? "Other available formats" : "Related products",
        productRefs: recommendationRefs,
        productCardSlot: "commerce.product-card.v1",
        ribbons: ribbonsFor(recommendationRefs),
      }
    : null;
  const pdpBlocks: StoreExperienceManifestV2["pages"]["pdp"]["blocks"] = [];
  if (strategy === "SPECIFICATION_LED") {
    pdpBlocks.push(pdpSummary, pdpFacts, pdpGallery, pdpPurchase);
    if (pdpClaims) pdpBlocks.push(pdpClaims);
    if (pdpRelated) pdpBlocks.push(pdpRelated);
    if (pdpWishlist) pdpBlocks.push(pdpWishlist);
  } else if (strategy === "VARIANT_EDITORIAL") {
    pdpBlocks.push(pdpGallery, pdpSummary, pdpPurchase);
    if (pdpWishlist) pdpBlocks.push(pdpWishlist);
    if (pdpRelated) pdpBlocks.push(pdpRelated);
    pdpBlocks.push(pdpFacts);
    if (pdpClaims) pdpBlocks.push(pdpClaims);
  } else {
    pdpBlocks.push(pdpSummary, pdpPurchase);
    if (pdpWishlist) pdpBlocks.push(pdpWishlist);
    pdpBlocks.push(pdpGallery, pdpFacts);
    if (pdpRelated) pdpBlocks.push(pdpRelated);
    if (pdpClaims) pdpBlocks.push(pdpClaims);
  }

  const contentBlocks: StoreExperienceManifestV2["pages"]["content"]["blocks"] = [
    {
      id: "content.header",
      type: "content-header",
      alignment: "left",
      showUpdatedDate: true,
    },
    {
      id: "content.article",
      type: "article-body",
      contentSlot: "content.rich-text.v1",
      width: "reading",
    },
    {
      id: "content.products",
      type: "product-links",
      title: "Products in this guide",
      productRefs: recommendationRefs,
      productCardSlot: "commerce.product-card.v1",
    },
    {
      id: "content.policy",
      type: "policy-page",
      policySlot: "policy.page.v1",
    },
  ];

  return {
    version: STORE_EXPERIENCE_MANIFEST_V2,
    catalogProjectionRef: catalog.projectionRef,
    designTokens,
    chrome: {
      header: {
        variant: categories.length >= 3 ? "standard" : "compact",
        brandLabel: catalog.store.name,
        navigation: [
          { id: "nav.home", label: "Home", href: "/" },
          ...categories.slice(0, 5).map((category) => ({
            id: `nav.${category.slug}`,
            label: category.title,
            href: categoryHref(category.slug),
          })),
        ],
        search: products.length >= 6 ? "field" : "button",
        cartSlot: "commerce.cart.v1",
      },
      footer: {
        variant: categories.length >= 3 ? "columns" : "compact",
        tagline: `${catalog.store.name} presents products from its current catalog projection.`,
        navigation: [
          { id: "footer.guides", label: "Guides", href: "/guides" },
          {
            id: "footer.shipping",
            label: "Shipping policy",
            href: "/policies/shipping",
          },
          {
            id: "footer.returns",
            label: "Returns policy",
            href: "/policies/returns",
          },
          {
            id: "footer.privacy",
            label: "Privacy",
            href: "/policies/privacy",
          },
          { id: "footer.terms", label: "Terms", href: "/policies/terms" },
        ],
        merchantIdentitySlot: "policy.merchant-identity.v1",
        policyLinksSlot: "policy.links.v1",
      },
    },
    pages: {
      home: { blocks: homeBlocks },
      plp: { blocks: plpBlocks },
      pdp: { blocks: pdpBlocks },
      content: { blocks: contentBlocks },
    },
    protectedShells: DEFAULT_PROTECTED_STOREFRONT_SHELLS_V2,
    features: { wishlist, compare, quiz, recommendations },
  };
}

/** Deterministic and side-effect-free: no database, provider, clock or network. */
export function proposeStoreExperienceV2(
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceProposalV2 {
  if (catalog.products.length === 0) {
    return {
      version: STORE_EXPERIENCE_PROPOSAL_V2,
      status: "REFUSED",
      proposalId: null,
      catalogProjectionRef: catalog.projectionRef,
      manifest: null,
      reasonCodes: ["CATALOG_EMPTY"],
      validation: null,
    };
  }
  if (
    catalog.products.some(
      (product) => !StorefrontProductV2Schema.safeParse(product).success
    )
  ) {
    return {
      version: STORE_EXPERIENCE_PROPOSAL_V2,
      status: "REFUSED",
      proposalId: null,
      catalogProjectionRef: catalog.projectionRef,
      manifest: null,
      reasonCodes: ["CATALOG_PRODUCT_INVALID"],
      validation: null,
    };
  }
  if (
    new Set(catalog.products.map((product) => product.productId)).size !==
    catalog.products.length
  ) {
    return {
      version: STORE_EXPERIENCE_PROPOSAL_V2,
      status: "REFUSED",
      proposalId: null,
      catalogProjectionRef: catalog.projectionRef,
      manifest: null,
      reasonCodes: ["CATALOG_PRODUCT_IDS_DUPLICATED"],
      validation: null,
    };
  }

  const manifest = buildManifest(catalog);
  const validation = validateStoreExperienceManifestV2(manifest, catalog);
  if (!validation.success) {
    return {
      version: STORE_EXPERIENCE_PROPOSAL_V2,
      status: "REFUSED",
      proposalId: null,
      catalogProjectionRef: catalog.projectionRef,
      manifest: null,
      reasonCodes: ["MANIFEST_VALIDATION_FAILED"],
      validation,
    };
  }

  return {
    version: STORE_EXPERIENCE_PROPOSAL_V2,
    status: "PROPOSED",
    proposalId: `experience-${stableStoreExperienceHashV2(manifest)}`,
    catalogProjectionRef: catalog.projectionRef,
    manifest: validation.manifest,
    reasonCodes: [
      "CATALOG_DRIVEN_LAYOUT_PROPOSED",
      "COMMERCE_AND_POLICY_SHELLS_LOCKED",
      "OPTIONAL_FEATURES_CAPABILITY_GATED",
    ],
    validation: { success: true, issues: [] },
  };
}
