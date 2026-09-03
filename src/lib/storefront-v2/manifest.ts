import { z } from "zod";

/**
 * Experience V2 is a closed, serializable presentation contract. It contains
 * no HTML, CSS, JavaScript, component names supplied by an author, or remote
 * resources. Rendering authority remains in the application.
 */
export const STORE_EXPERIENCE_MANIFEST_V2 =
  "store-experience-manifest.v2" as const;

export const STORE_EXPERIENCE_BLOCKS_V2 = {
  home: [
    "hero",
    "category-grid",
    "product-grid",
    "value-propositions",
    "editorial-callout",
    "newsletter-signup",
    "quiz-callout",
    "recommendation-grid",
  ],
  plp: [
    "category-header",
    "filter-bar",
    "product-grid",
    "category-navigation",
    "comparison-callout",
    "recommendation-grid",
  ],
  pdp: [
    "product-gallery",
    "product-summary",
    "purchase-panel",
    "product-facts",
    "trust-facts",
    "wishlist-control",
    "related-products",
    "recommendation-grid",
  ],
  content: [
    "content-header",
    "article-body",
    "faq-body",
    "product-links",
    "policy-page",
  ],
} as const;

export const STORE_EXPERIENCE_CLAIMS_V2 = [
  "secure-checkout",
  "clear-returns",
  "merchant-support",
  "verified-availability",
] as const;

const safeIdentifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/);

const safeReferenceSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/);

const unsafeAuthorContent = /[<>{}]|javascript\s*:|data\s*:\s*text\/html/i;

/** Plain display copy only. Markup, templates and executable URLs fail. */
export const storeExperienceSafeTextV2Schema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => !unsafeAuthorContent.test(value), {
    message: "Only plain display text is allowed",
  });

const shortTextSchema = storeExperienceSafeTextV2Schema.pipe(z.string().max(100));
const headingTextSchema = storeExperienceSafeTextV2Schema.pipe(
  z.string().max(140)
);

export const storeExperienceInternalHrefV2Schema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine(
    (value) =>
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\\\s<>{}]/.test(value),
    { message: "Only a safe internal path is allowed" }
  );

const navigationItemSchema = z
  .object({
    id: safeIdentifierSchema,
    label: shortTextSchema,
    href: storeExperienceInternalHrefV2Schema,
  })
  .strict();

const actionSchema = z
  .object({
    label: shortTextSchema,
    href: storeExperienceInternalHrefV2Schema,
    emphasis: z.enum(["primary", "secondary"]),
  })
  .strict();

export const storeExperienceDesignTokensV2Schema = z
  .object({
    palette: z
      .object({
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        mutedText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        onPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        border: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      })
      .strict(),
    typography: z
      .object({
        headingFamily: z.enum(["system-sans", "system-serif"]),
        bodyFamily: z.enum(["system-sans", "system-serif"]),
        scale: z.enum(["compact", "standard", "display"]),
      })
      .strict(),
    spacing: z
      .object({
        density: z.enum(["compact", "comfortable", "airy"]),
        sectionGap: z.enum(["small", "medium", "large"]),
        contentWidth: z.enum(["narrow", "standard", "wide"]),
      })
      .strict(),
    shape: z
      .object({
        radius: z.enum(["none", "soft", "rounded"]),
        cardStyle: z.enum(["bordered", "elevated", "flat"]),
        shadow: z.enum(["none", "soft", "strong"]),
      })
      .strict(),
    imagery: z
      .object({
        productFit: z.enum(["contain", "cover"]),
        productRatio: z.enum(["square", "portrait", "landscape"]),
      })
      .strict(),
  })
  .strict();

export const storeExperienceChromeV2Schema = z
  .object({
    header: z
      .object({
        variant: z.enum(["compact", "standard", "centered"]),
        brandLabel: shortTextSchema,
        navigation: z.array(navigationItemSchema).max(8),
        search: z.enum(["hidden", "button", "field"]),
        cartSlot: z.literal("commerce.cart.v1"),
      })
      .strict(),
    footer: z
      .object({
        variant: z.enum(["compact", "columns", "editorial"]),
        tagline: storeExperienceSafeTextV2Schema.pipe(z.string().max(220)),
        navigation: z.array(navigationItemSchema).max(12),
        merchantIdentitySlot: z.literal("policy.merchant-identity.v1"),
        policyLinksSlot: z.literal("policy.links.v1"),
      })
      .strict(),
  })
  .strict();

const baseBlockShape = {
  id: safeIdentifierSchema,
};

const productReferenceListSchema = z
  .array(safeReferenceSchema)
  .min(1)
  .max(24)
  .refine((values) => new Set(values).size === values.length, {
    message: "Product references must be unique",
  });

const categoryReferenceListSchema = z
  .array(safeReferenceSchema)
  .min(1)
  .max(16)
  .refine((values) => new Set(values).size === values.length, {
    message: "Category references must be unique",
  });

const productRibbonListSchema = z
  .array(
    z
      .object({
        productRef: safeReferenceSchema,
        label: z.enum(["Low stock", "Bundle options", "Multiple options"]),
        tone: z.enum(["attention", "value", "neutral"]),
      })
      .strict()
  )
  .max(24)
  .refine(
    (ribbons) =>
      new Set(ribbons.map((ribbon) => ribbon.productRef)).size === ribbons.length,
    { message: "A product may have at most one ribbon per block" }
  );

const heroBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("hero"),
    layout: z.enum(["centered", "split", "editorial"]),
    eyebrow: shortTextSchema.optional(),
    title: headingTextSchema,
    body: storeExperienceSafeTextV2Schema.pipe(z.string().max(280)),
    primaryAction: actionSchema,
    secondaryAction: actionSchema.optional(),
    featuredProductRef: safeReferenceSchema.optional(),
  })
  .strict();

const homeCategoryGridBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("category-grid"),
    title: headingTextSchema,
    categoryRefs: categoryReferenceListSchema,
    columns: z.enum(["two", "three", "four"]),
    layout: z.enum(["grid", "mosaic"]),
  })
  .strict();

const homeProductGridBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-grid"),
    title: headingTextSchema,
    productRefs: productReferenceListSchema,
    columns: z.enum(["two", "three", "four"]),
    productCardSlot: z.literal("commerce.product-card.v1"),
    ribbons: productRibbonListSchema.optional(),
  })
  .strict();

const valuePropositionsBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("value-propositions"),
    title: headingTextSchema.optional(),
    items: z
      .array(
        z
          .object({
            claim: z.enum(STORE_EXPERIENCE_CLAIMS_V2),
            title: shortTextSchema,
            body: storeExperienceSafeTextV2Schema.pipe(z.string().max(180)),
          })
          .strict()
      )
      .min(1)
      .max(4),
  })
  .strict();

const editorialCalloutBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("editorial-callout"),
    eyebrow: shortTextSchema.optional(),
    title: headingTextSchema,
    body: storeExperienceSafeTextV2Schema.pipe(z.string().max(300)),
    action: actionSchema,
  })
  .strict();

const newsletterSignupBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("newsletter-signup"),
    title: headingTextSchema,
    body: storeExperienceSafeTextV2Schema.pipe(z.string().max(220)),
    submitLabel: shortTextSchema,
    consentLabel: storeExperienceSafeTextV2Schema.pipe(z.string().max(220)),
    signupSlot: z.literal("commerce.newsletter-signup.v1"),
  })
  .strict();

const quizCalloutBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("quiz-callout"),
    title: headingTextSchema,
    body: storeExperienceSafeTextV2Schema.pipe(z.string().max(220)),
    href: storeExperienceInternalHrefV2Schema,
  })
  .strict();

const recommendationGridBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("recommendation-grid"),
    title: headingTextSchema,
    productRefs: productReferenceListSchema,
    productCardSlot: z.literal("commerce.product-card.v1"),
    ribbons: productRibbonListSchema.optional(),
  })
  .strict();

export const homeExperienceBlockV2Schema = z.discriminatedUnion("type", [
  heroBlockSchema,
  homeCategoryGridBlockSchema,
  homeProductGridBlockSchema,
  valuePropositionsBlockSchema,
  editorialCalloutBlockSchema,
  newsletterSignupBlockSchema,
  quizCalloutBlockSchema,
  recommendationGridBlockSchema,
]);

const categoryHeaderBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("category-header"),
    alignment: z.enum(["left", "center"]),
    showDescription: z.boolean(),
  })
  .strict();

const filterBarBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("filter-bar"),
    layout: z.enum(["sidebar", "toolbar"]).optional(),
    source: z.literal("taxonomy-attributes").optional(),
    showResultCount: z.boolean().optional(),
    facets: z
      .array(z.enum(["category", "price", "availability", "brand"]))
      .max(4)
      .refine((values) => new Set(values).size === values.length, {
        message: "Facets must be unique",
      })
      .optional(),
  })
  .strict();

const plpProductGridBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-grid"),
    title: headingTextSchema.optional(),
    columns: z.enum(["two", "three", "four"]),
    productCardSlot: z.literal("commerce.product-card.v1"),
    ribbons: productRibbonListSchema.optional(),
    emptyState: storeExperienceSafeTextV2Schema
      .pipe(z.string().max(180))
      .optional(),
  })
  .strict();

const categoryNavigationBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("category-navigation"),
    title: headingTextSchema,
    categoryRefs: categoryReferenceListSchema,
  })
  .strict();

const comparisonCalloutBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("comparison-callout"),
    label: shortTextSchema,
    href: storeExperienceInternalHrefV2Schema,
  })
  .strict();

export const plpExperienceBlockV2Schema = z.discriminatedUnion("type", [
  categoryHeaderBlockSchema,
  filterBarBlockSchema,
  plpProductGridBlockSchema,
  categoryNavigationBlockSchema,
  comparisonCalloutBlockSchema,
  recommendationGridBlockSchema,
]);

const productGalleryBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-gallery"),
    layout: z.enum(["grid", "carousel"]).optional(),
    showThumbnails: z.boolean().optional(),
    gallerySlot: z.literal("commerce.product-gallery.v1"),
  })
  .strict();

const productSummaryBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-summary"),
    showBrand: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
    showTaxonomyBreadcrumbs: z.boolean().optional(),
  })
  .strict();

const purchasePanelBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("purchase-panel"),
    purchaseSlot: z.literal("commerce.purchase-panel.v1"),
    showAvailability: z.boolean().optional(),
  })
  .strict();

const productFactsBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-facts"),
    title: headingTextSchema,
    fields: z
      .array(
        z.enum([
          "description",
          "specifications",
          "shipping-window",
          "country-of-origin",
          "availability",
        ])
      )
      .min(1)
      .max(5),
  })
  .strict();

const trustFactsBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("trust-facts"),
    claims: z.array(z.enum(STORE_EXPERIENCE_CLAIMS_V2)).min(1).max(4),
  })
  .strict();

const wishlistControlBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("wishlist-control"),
    label: shortTextSchema,
  })
  .strict();

const relatedProductsBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("related-products"),
    title: headingTextSchema,
    productRefs: productReferenceListSchema,
    productCardSlot: z.literal("commerce.product-card.v1"),
    ribbons: productRibbonListSchema.optional(),
  })
  .strict();

export const pdpExperienceBlockV2Schema = z.discriminatedUnion("type", [
  productGalleryBlockSchema,
  productSummaryBlockSchema,
  purchasePanelBlockSchema,
  productFactsBlockSchema,
  trustFactsBlockSchema,
  wishlistControlBlockSchema,
  relatedProductsBlockSchema,
  recommendationGridBlockSchema,
]);

const contentHeaderBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("content-header"),
    alignment: z.enum(["left", "center"]),
    showUpdatedDate: z.boolean().optional(),
  })
  .strict();

const articleBodyBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("article-body"),
    contentSlot: z.literal("content.rich-text.v1"),
    width: z.enum(["reading", "wide"]).optional(),
  })
  .strict();

const faqBodyBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("faq-body"),
    contentSlot: z.literal("content.faq.v1"),
  })
  .strict();

const productLinksBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("product-links"),
    title: headingTextSchema,
    productRefs: productReferenceListSchema,
    productCardSlot: z.literal("commerce.product-card.v1"),
  })
  .strict();

const policyPageBlockSchema = z
  .object({
    ...baseBlockShape,
    type: z.literal("policy-page"),
    policySlot: z.literal("policy.page.v1"),
  })
  .strict();

export const contentExperienceBlockV2Schema = z.discriminatedUnion("type", [
  contentHeaderBlockSchema,
  articleBodyBlockSchema,
  faqBodyBlockSchema,
  productLinksBlockSchema,
  policyPageBlockSchema,
]);

export const protectedStorefrontShellsV2Schema = z
  .object({
    commerce: z
      .object({
        locked: z.literal(true),
        cart: z.literal("commerce.cart.v1"),
        checkout: z.literal("commerce.checkout.v1"),
        productCard: z.literal("commerce.product-card.v1"),
        productGallery: z.literal("commerce.product-gallery.v1"),
        purchasePanel: z.literal("commerce.purchase-panel.v1"),
        newsletterSignup: z.literal("commerce.newsletter-signup.v1"),
      })
      .strict(),
    policy: z
      .object({
        locked: z.literal(true),
        merchantIdentity: z.literal("policy.merchant-identity.v1"),
        links: z.literal("policy.links.v1"),
        page: z.literal("policy.page.v1"),
      })
      .strict(),
  })
  .strict();

export const DEFAULT_PROTECTED_STOREFRONT_SHELLS_V2 = {
  commerce: {
    locked: true,
    cart: "commerce.cart.v1",
    checkout: "commerce.checkout.v1",
    productCard: "commerce.product-card.v1",
    productGallery: "commerce.product-gallery.v1",
    purchasePanel: "commerce.purchase-panel.v1",
    newsletterSignup: "commerce.newsletter-signup.v1",
  },
  policy: {
    locked: true,
    merchantIdentity: "policy.merchant-identity.v1",
    links: "policy.links.v1",
    page: "policy.page.v1",
  },
} as const;

export const storeExperienceManifestV2Schema = z
  .object({
    version: z.literal(STORE_EXPERIENCE_MANIFEST_V2),
    catalogProjectionRef: safeReferenceSchema,
    designTokens: storeExperienceDesignTokensV2Schema,
    chrome: storeExperienceChromeV2Schema,
    pages: z
      .object({
        home: z
          .object({
            blocks: z.array(homeExperienceBlockV2Schema).min(1).max(12),
          })
          .strict(),
        plp: z
          .object({
            blocks: z.array(plpExperienceBlockV2Schema).min(1).max(10),
          })
          .strict(),
        pdp: z
          .object({
            blocks: z.array(pdpExperienceBlockV2Schema).min(1).max(12),
          })
          .strict(),
        content: z
          .object({
            blocks: z.array(contentExperienceBlockV2Schema).min(1).max(8),
          })
          .strict(),
      })
      .strict(),
    protectedShells: protectedStorefrontShellsV2Schema,
    features: z
      .object({
        wishlist: z.boolean(),
        compare: z.boolean(),
        quiz: z.boolean(),
        recommendations: z.boolean(),
      })
      .strict(),
  })
  .strict();

/** Pascal-case alias for callers that expose schemas alongside generated types. */
export const StoreExperienceManifestV2Schema =
  storeExperienceManifestV2Schema;

export type StoreExperienceManifestV2 = z.infer<
  typeof storeExperienceManifestV2Schema
>;
export type StoreExperienceDesignTokensV2 = z.infer<
  typeof storeExperienceDesignTokensV2Schema
>;
export type HomeExperienceBlockV2 = z.infer<
  typeof homeExperienceBlockV2Schema
>;
export type PlpExperienceBlockV2 = z.infer<
  typeof plpExperienceBlockV2Schema
>;
export type PdpExperienceBlockV2 = z.infer<
  typeof pdpExperienceBlockV2Schema
>;
export type ContentExperienceBlockV2 = z.infer<
  typeof contentExperienceBlockV2Schema
>;

export type StoreExperiencePageKindV2 = keyof StoreExperienceManifestV2["pages"];
