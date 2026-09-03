import React, { type CSSProperties, type ReactNode } from "react";
import type {
  StorefrontAttributeV2,
  StorefrontProductV2,
} from "@/lib/catalog-v2/contracts";
import {
  categoryDescendantReferenceSetV2,
  findExperienceCategoryV2,
  findStorefrontProductV2,
  storeExperienceFacetKeysV2,
  type StoreExperienceCatalogProjectionV2,
} from "@/lib/storefront-v2/catalog-context";
import type {
  ContentExperienceBlockV2,
  HomeExperienceBlockV2,
  PdpExperienceBlockV2,
  PlpExperienceBlockV2,
  StoreExperienceDesignTokensV2,
  StoreExperienceManifestV2,
} from "@/lib/storefront-v2/manifest";
import { validateStoreExperienceManifestV2 } from "@/lib/storefront-v2/validation";
import type { StoreExperienceClaimV2 } from "@/lib/storefront-v2/validation-types";

export type StoreExperiencePageV2 =
  | { kind: "home" }
  | {
      kind: "plp";
      categoryRef: string | null;
      title: string;
      description?: string | null;
    }
  | { kind: "pdp"; productRef: string }
  | {
      kind: "content";
      contentKind: "article" | "faq" | "policy";
      title: string;
      updatedLabel?: string | null;
    }
  | { kind: "cart" }
  | { kind: "checkout" };

/**
 * These nodes/functions are supplied by trusted application code. A manifest
 * may choose where an allowlisted shell appears, but cannot replace its logic.
 */
export interface ProtectedStorefrontRenderSlotsV2 {
  commerce: {
    cart: ReactNode;
    cartPage: ReactNode;
    checkoutPage: ReactNode;
    productCard: (product: StorefrontProductV2) => ReactNode;
    productGallery: (product: StorefrontProductV2) => ReactNode;
    purchasePanel: (product: StorefrontProductV2) => ReactNode;
    filterBar: (
      facets: readonly string[],
      products: readonly StorefrontProductV2[]
    ) => ReactNode;
    wishlistControl: (product: StorefrontProductV2, label: string) => ReactNode;
    newsletterSignup: (copy: {
      title: string;
      body: string;
      submitLabel: string;
      consentLabel: string;
    }) => ReactNode;
  };
  policy: {
    merchantIdentity: ReactNode;
    links: ReactNode;
    page: ReactNode;
  };
  content: {
    article: ReactNode;
    faq: ReactNode;
  };
}

export interface StoreExperienceRendererPropsV2 {
  manifest: StoreExperienceManifestV2;
  catalog: StoreExperienceCatalogProjectionV2;
  page: StoreExperiencePageV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  preview?: boolean;
}

const densityClass: Record<
  StoreExperienceDesignTokensV2["spacing"]["density"],
  string
> = {
  compact: "py-8",
  comfortable: "py-12",
  airy: "py-16",
};

const sectionGapClass: Record<
  StoreExperienceDesignTokensV2["spacing"]["sectionGap"],
  string
> = {
  small: "space-y-8",
  medium: "space-y-12",
  large: "space-y-16",
};

const radiusClass: Record<
  StoreExperienceDesignTokensV2["shape"]["radius"],
  string
> = {
  none: "rounded-none",
  soft: "rounded-xl",
  rounded: "rounded-3xl",
};

const cardClass: Record<
  StoreExperienceDesignTokensV2["shape"]["cardStyle"],
  string
> = {
  bordered: "border",
  elevated: "border",
  flat: "border-0",
};

const shadowClass: Record<
  StoreExperienceDesignTokensV2["shape"]["shadow"],
  string
> = {
  none: "shadow-none",
  soft: "shadow-sm",
  strong: "shadow-xl",
};

const contentWidthClass: Record<
  StoreExperienceDesignTokensV2["spacing"]["contentWidth"],
  string
> = {
  narrow: "max-w-5xl",
  standard: "max-w-7xl",
  wide: "max-w-[90rem]",
};

const headingClass: Record<
  StoreExperienceDesignTokensV2["typography"]["scale"],
  string
> = {
  compact: "text-3xl sm:text-4xl",
  standard: "text-4xl sm:text-5xl",
  display: "text-5xl sm:text-6xl",
};

const columnClass = {
  two: "sm:grid-cols-2",
  three: "sm:grid-cols-2 lg:grid-cols-3",
  four: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

const claimLabels: Record<StoreExperienceClaimV2, string> = {
  "secure-checkout": "Platform checkout",
  "clear-returns": "Returns information",
  "merchant-support": "Merchant support",
  "verified-availability": "Catalog availability",
};

const radiusValue: Record<
  StoreExperienceDesignTokensV2["shape"]["radius"],
  string
> = {
  none: "0px",
  soft: "0.75rem",
  rounded: "1.5rem",
};

const shadowValue: Record<
  StoreExperienceDesignTokensV2["shape"]["shadow"],
  string
> = {
  none: "none",
  soft: "0 1px 3px rgb(15 23 42 / 0.12)",
  strong: "0 18px 45px rgb(15 23 42 / 0.18)",
};

const sectionGapValue: Record<
  StoreExperienceDesignTokensV2["spacing"]["sectionGap"],
  string
> = {
  small: "2rem",
  medium: "3rem",
  large: "4rem",
};

const densityValue: Record<
  StoreExperienceDesignTokensV2["spacing"]["density"],
  string
> = {
  compact: "2rem",
  comfortable: "3rem",
  airy: "4rem",
};

const headingSizeValue: Record<
  StoreExperienceDesignTokensV2["typography"]["scale"],
  string
> = {
  compact: "2.25rem",
  standard: "3rem",
  display: "3.75rem",
};

const contentWidthValue: Record<
  StoreExperienceDesignTokensV2["spacing"]["contentWidth"],
  string
> = {
  narrow: "64rem",
  standard: "80rem",
  wide: "90rem",
};

const imageRatioValue: Record<
  StoreExperienceDesignTokensV2["imagery"]["productRatio"],
  string
> = {
  square: "1 / 1",
  portrait: "4 / 5",
  landscape: "4 / 3",
};

const interactiveLinkClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--storefront-color-background)]";

function bodyFontFamily(tokens: StoreExperienceDesignTokensV2): string {
  return tokens.typography.bodyFamily === "system-serif"
    ? "ui-serif, Georgia, Cambria, serif"
    : "ui-sans-serif, system-ui, sans-serif";
}

function headingFontFamily(tokens: StoreExperienceDesignTokensV2): string {
  return tokens.typography.headingFamily === "system-serif"
    ? "ui-serif, Georgia, Cambria, serif"
    : "ui-sans-serif, system-ui, sans-serif";
}

function rootStyle(tokens: StoreExperienceDesignTokensV2): CSSProperties {
  return {
    "--storefront-color-background": tokens.palette.background,
    "--storefront-color-surface": tokens.palette.surface,
    "--storefront-color-text": tokens.palette.text,
    "--storefront-color-muted-text": tokens.palette.mutedText,
    "--storefront-color-primary": tokens.palette.primary,
    "--storefront-color-on-primary": tokens.palette.onPrimary,
    "--storefront-color-border": tokens.palette.border,
    "--storefront-font-body": bodyFontFamily(tokens),
    "--storefront-font-heading": headingFontFamily(tokens),
    "--storefront-heading-size": headingSizeValue[tokens.typography.scale],
    "--storefront-density-space": densityValue[tokens.spacing.density],
    "--storefront-radius": radiusValue[tokens.shape.radius],
    "--storefront-shadow": shadowValue[tokens.shape.shadow],
    "--storefront-card-border-width":
      tokens.shape.cardStyle === "flat" ? "0px" : "1px",
    "--storefront-section-gap": sectionGapValue[tokens.spacing.sectionGap],
    "--storefront-content-width": contentWidthValue[tokens.spacing.contentWidth],
    "--storefront-product-fit": tokens.imagery.productFit,
    "--storefront-product-ratio": imageRatioValue[tokens.imagery.productRatio],
    backgroundColor: "var(--storefront-color-background)",
    color: "var(--storefront-color-text)",
    fontFamily: "var(--storefront-font-body)",
  } as CSSProperties;
}

function headingStyle(): CSSProperties {
  return {
    fontFamily: "var(--storefront-font-heading)",
  };
}

function surfaceStyle(): CSSProperties {
  return {
    backgroundColor: "var(--storefront-color-surface)",
    borderColor: "var(--storefront-color-border)",
  };
}

function primaryStyle(): CSSProperties {
  return {
    backgroundColor: "var(--storefront-color-primary)",
    color: "var(--storefront-color-on-primary)",
  };
}

function formatAttributeScalarV2(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) return "Not stated";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? new Intl.NumberFormat("en-US").format(value)
      : "Not stated";
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : "Not stated";
}

export function formatStorefrontAttributeValueV2(
  value: StorefrontAttributeV2["value"] | null | undefined,
  unitCode: string | null = null
): string {
  const formatted = Array.isArray(value)
    ? value.length > 0
      ? value.map((entry) => formatAttributeScalarV2(entry)).join(", ")
      : "Not stated"
    : formatAttributeScalarV2(value);
  if (formatted === "Not stated" || !unitCode) return formatted;
  return `${formatted} ${unitCode}`;
}

function formatAvailabilityV2(
  availability: StorefrontProductV2["availability"]
): string {
  return {
    IN_STOCK: "In stock",
    LOW_STOCK: "Low stock",
    PREORDER: "Pre-order",
    OUT_OF_STOCK: "Out of stock",
    UNKNOWN: "Not stated",
  }[availability];
}

function ExperienceLink({
  href,
  preview,
  children,
  className,
  style,
}: {
  href: string;
  preview: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const classes = `${className ?? ""} ${interactiveLinkClass}`.trim();
  if (preview) {
    return (
      <span
        role="link"
        aria-disabled="true"
        data-preview-link="disabled"
        className={classes}
        style={style}
      >
        {children}
      </span>
    );
  }
  return (
    <a href={href} className={classes} style={style}>
      {children}
    </a>
  );
}

function productList(
  refs: readonly string[],
  catalog: StoreExperienceCatalogProjectionV2
): StorefrontProductV2[] {
  return refs.flatMap((productRef) => {
    const product = findStorefrontProductV2(catalog, productRef);
    return product ? [product] : [];
  });
}

function ProductCards({
  products,
  columns,
  slots,
  ribbons = [],
}: {
  products: readonly StorefrontProductV2[];
  columns: keyof typeof columnClass;
  slots: ProtectedStorefrontRenderSlotsV2;
  ribbons?: readonly {
    productRef: string;
    label: "Low stock" | "Bundle options" | "Multiple options";
    tone: "attention" | "value" | "neutral";
  }[];
}) {
  return (
    <div className={`grid min-w-0 gap-5 ${columnClass[columns]}`}>
      {products.map((product) => {
        const ribbon = ribbons.find(
          (candidate) => candidate.productRef === product.productId
        );
        return (
          <div
            key={product.productId}
            data-product-ref={product.productId}
            className="relative min-w-0"
          >
            {ribbon ? (
              <span
                className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                  ribbon.tone === "attention"
                    ? "bg-amber-100 text-amber-950"
                    : ribbon.tone === "value"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-800"
                }`}
              >
                {ribbon.label}
              </span>
            ) : null}
            {slots.commerce.productCard(product)}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <h2
      className="mb-6 text-2xl font-bold leading-tight sm:text-3xl"
      style={headingStyle()}
    >
      {children}
    </h2>
  );
}

const heroLayoutClass: Record<
  Extract<HomeExperienceBlockV2, { type: "hero" }>["layout"],
  string
> = {
  centered:
    "min-h-[22rem] place-items-center text-center sm:min-h-[26rem]",
  split:
    "md:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.72fr)] md:items-center",
  editorial:
    "md:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.65fr)] md:items-end md:px-12 lg:px-16",
};

function HomeBlock({
  block,
  catalog,
  slots,
  tokens,
  preview,
}: {
  block: HomeExperienceBlockV2;
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
  preview: boolean;
}) {
  switch (block.type) {
    case "hero": {
      const featured = block.featuredProductRef
        ? findStorefrontProductV2(catalog, block.featuredProductRef)
        : undefined;
      return (
        <section
          data-experience-hero-layout={block.layout}
          className={`grid min-w-0 overflow-hidden gap-8 p-7 sm:p-10 ${radiusClass[tokens.shape.radius]} ${cardClass[tokens.shape.cardStyle]} ${shadowClass[tokens.shape.shadow]} ${heroLayoutClass[block.layout]}`}
          style={surfaceStyle()}
        >
          <div
            className={
              block.layout === "centered"
                ? "mx-auto max-w-3xl"
                : "min-w-0 max-w-3xl"
            }
          >
            {block.eyebrow ? (
              <p
                className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--storefront-color-primary)" }}
              >
                {block.eyebrow}
              </p>
            ) : null}
            <h1
              className={`font-extrabold leading-tight tracking-tight ${headingClass[tokens.typography.scale]}`}
              style={headingStyle()}
            >
              {block.title}
            </h1>
            <p
              className="mt-5 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--storefront-color-muted-text)" }}
            >
              {block.body}
            </p>
            <div
              className={`mt-7 flex flex-wrap gap-3 ${
                block.layout === "centered" ? "justify-center" : ""
              }`}
            >
              <ExperienceLink
                href={block.primaryAction.href}
                preview={preview}
                className={`inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-semibold ${radiusClass[tokens.shape.radius]}`}
                style={primaryStyle()}
              >
                {block.primaryAction.label}
              </ExperienceLink>
              {block.secondaryAction ? (
                <ExperienceLink
                  href={block.secondaryAction.href}
                  preview={preview}
                  className={`inline-flex min-h-11 items-center justify-center border px-5 py-3 text-sm font-semibold ${radiusClass[tokens.shape.radius]}`}
                  style={surfaceStyle()}
                >
                  {block.secondaryAction.label}
                </ExperienceLink>
              ) : null}
            </div>
          </div>
          {featured && block.layout !== "centered" ? (
            <div
              data-protected-shell="commerce.product-card.v1"
              className={`w-full min-w-0 max-w-sm justify-self-center md:justify-self-end ${
                block.layout === "editorial" ? "md:translate-y-5" : ""
              }`}
            >
              {slots.commerce.productCard(featured)}
            </div>
          ) : null}
        </section>
      );
    }
    case "category-grid":
      return (
        <section>
          <SectionHeading>{block.title}</SectionHeading>
          <div
            data-experience-category-layout={block.layout}
            className={`grid gap-4 ${columnClass[block.columns]} ${
              block.layout === "mosaic"
                ? "auto-rows-[minmax(9rem,auto)] sm:auto-rows-[minmax(11rem,auto)]"
                : ""
            }`}
          >
            {block.categoryRefs.map((categoryRef, index) => {
              const category = findExperienceCategoryV2(catalog, categoryRef);
              return (
                <ExperienceLink
                  key={categoryRef}
                  href={category ? `/c/${encodeURIComponent(category.slug)}` : "/"}
                  preview={preview}
                  className={`min-h-28 border p-5 ${radiusClass[tokens.shape.radius]} ${cardClass[tokens.shape.cardStyle]} ${shadowClass[tokens.shape.shadow]} ${block.layout === "mosaic" && index === 0 ? "sm:col-span-2 sm:row-span-2 sm:flex sm:flex-col sm:justify-end" : ""}`}
                  style={surfaceStyle()}
                >
                  <h3 className="font-bold" style={headingStyle()}>
                    {category?.title ?? categoryRef}
                  </h3>
                  {category?.description ? (
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--storefront-color-muted-text)" }}>
                      {category.description}
                    </p>
                  ) : null}
                </ExperienceLink>
              );
            })}
          </div>
        </section>
      );
    case "product-grid":
      return (
        <section data-protected-shell={block.productCardSlot}>
          <SectionHeading>{block.title}</SectionHeading>
          <ProductCards
            products={productList(block.productRefs, catalog)}
            columns={block.columns}
            slots={slots}
            ribbons={block.ribbons}
          />
        </section>
      );
    case "value-propositions":
      return (
        <section>
          {block.title ? <SectionHeading>{block.title}</SectionHeading> : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {block.items.map((item) => (
              <article
                key={`${block.id}-${item.claim}`}
                className={`border p-5 ${radiusClass[tokens.shape.radius]}`}
                style={surfaceStyle()}
              >
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tokens.palette.primary }}>
                  {claimLabels[item.claim]}
                </p>
                <h3 className="mt-2 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: tokens.palette.mutedText }}>
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      );
    case "editorial-callout":
      return (
        <section
          className={`border p-7 sm:p-10 ${radiusClass[tokens.shape.radius]}`}
          style={surfaceStyle()}
        >
          {block.eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tokens.palette.primary }}>
              {block.eyebrow}
            </p>
          ) : null}
          <SectionHeading>{block.title}</SectionHeading>
          <p className="max-w-3xl leading-7" style={{ color: tokens.palette.mutedText }}>
            {block.body}
          </p>
          <ExperienceLink
            className="mt-5 inline-flex min-h-11 items-center font-semibold underline"
            href={block.action.href}
            preview={preview}
          >
            {block.action.label}
          </ExperienceLink>
        </section>
      );
    case "newsletter-signup":
      return (
        <section
          data-protected-shell={block.signupSlot}
          className={`border p-7 sm:p-10 ${radiusClass[tokens.shape.radius]} ${shadowClass[tokens.shape.shadow]}`}
          style={surfaceStyle()}
        >
          {slots.commerce.newsletterSignup({
            title: block.title,
            body: block.body,
            submitLabel: block.submitLabel,
            consentLabel: block.consentLabel,
          })}
        </section>
      );
    case "quiz-callout":
      return (
        <section
          className={`p-7 sm:p-10 ${radiusClass[tokens.shape.radius]}`}
          style={primaryStyle()}
        >
          <h2 className="text-2xl font-bold" style={headingStyle()}>
            {block.title}
          </h2>
          <p className="mt-3 max-w-2xl leading-7">{block.body}</p>
          <ExperienceLink
            className="mt-5 inline-flex min-h-11 items-center font-semibold underline"
            href={block.href}
            preview={preview}
          >
            Open product quiz
          </ExperienceLink>
        </section>
      );
    case "recommendation-grid":
      return (
        <section data-protected-shell={block.productCardSlot}>
          <SectionHeading>{block.title}</SectionHeading>
          <ProductCards
            products={productList(block.productRefs, catalog)}
            columns="four"
            slots={slots}
            ribbons={block.ribbons}
          />
        </section>
      );
  }
}

function PlpBlock({
  block,
  page,
  products,
  catalog,
  slots,
  tokens,
  preview,
}: {
  block: PlpExperienceBlockV2;
  page: Extract<StoreExperiencePageV2, { kind: "plp" }>;
  products: readonly StorefrontProductV2[];
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
  preview: boolean;
}) {
  switch (block.type) {
    case "category-header":
      return (
        <section className={block.alignment === "center" ? "text-center" : "text-left"}>
          <h1 className={headingClass[tokens.typography.scale]} style={headingStyle()}>
            {page.title}
          </h1>
          {block.showDescription && page.description ? (
            <p className="mt-4 max-w-3xl leading-7" style={{ color: tokens.palette.mutedText }}>
              {page.description}
            </p>
          ) : null}
        </section>
      );
    case "filter-bar":
      return (
        <section
          data-experience-filter-layout={block.layout ?? "toolbar"}
          data-experience-filter-result-count={
            block.showResultCount === false ? "hidden" : "shown"
          }
          className={`min-w-0 ${
            (block.layout ?? "toolbar") === "toolbar" ? "w-full" : ""
          }`}
        >
          {slots.commerce.filterBar(
            [
              ...(block.facets ?? []),
              ...(block.source === "taxonomy-attributes"
                ? storeExperienceFacetKeysV2(catalog, products)
                : []),
            ].filter((facet, index, facets) => facets.indexOf(facet) === index),
            products
          )}
        </section>
      );
    case "product-grid":
      return products.length > 0 ? (
        <section data-protected-shell={block.productCardSlot}>
          <ProductCards
            products={products}
            columns={block.columns}
            slots={slots}
            ribbons={block.ribbons}
          />
        </section>
      ) : (
        <p className="border p-6 text-sm" style={surfaceStyle()}>
          {block.emptyState ?? "No projected products are available."}
        </p>
      );
    case "category-navigation":
      return (
        <section>
          <SectionHeading>{block.title}</SectionHeading>
          <nav aria-label={block.title} className="flex flex-wrap gap-3">
            {block.categoryRefs.map((categoryRef) => {
              const category = findExperienceCategoryV2(catalog, categoryRef);
              if (!category) return null;
              return (
                <ExperienceLink
                  key={categoryRef}
                  href={`/c/${encodeURIComponent(category.slug)}`}
                  preview={preview}
                  className={`inline-flex min-h-11 items-center justify-center border px-4 py-2 text-sm font-semibold ${radiusClass[tokens.shape.radius]}`}
                  style={surfaceStyle()}
                >
                  {category.title}
                </ExperienceLink>
              );
            })}
          </nav>
        </section>
      );
    case "comparison-callout":
      return (
        <ExperienceLink
          href={block.href}
          preview={preview}
          className={`inline-flex min-h-11 items-center justify-center px-5 py-3 font-semibold ${radiusClass[tokens.shape.radius]}`}
          style={primaryStyle()}
        >
          {block.label}
        </ExperienceLink>
      );
    case "recommendation-grid":
      return (
        <section data-protected-shell={block.productCardSlot}>
          <SectionHeading>{block.title}</SectionHeading>
          <ProductCards
            products={productList(block.productRefs, catalog)}
            columns="four"
            slots={slots}
            ribbons={block.ribbons}
          />
        </section>
      );
  }
}

function PlpLayout({
  blocks,
  page,
  products,
  catalog,
  slots,
  tokens,
  preview,
}: {
  blocks: readonly PlpExperienceBlockV2[];
  page: Extract<StoreExperiencePageV2, { kind: "plp" }>;
  products: readonly StorefrontProductV2[];
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
  preview: boolean;
}) {
  const renderBlock = (block: PlpExperienceBlockV2) => (
    <PlpBlock
      key={block.id}
      block={block}
      page={page}
      products={products}
      catalog={catalog}
      slots={slots}
      tokens={tokens}
      preview={preview}
    />
  );
  const sidebarFilter = blocks.find(
    (block) => block.type === "filter-bar" && block.layout === "sidebar"
  );
  if (!sidebarFilter) {
    return (
      <div
        data-experience-plp-layout="toolbar"
        className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}
      >
        {blocks.map(renderBlock)}
      </div>
    );
  }

  const headers = blocks.filter((block) => block.type === "category-header");
  const categoryNavigation = blocks.filter(
    (block) => block.type === "category-navigation"
  );
  const results = blocks.filter(
    (block) =>
      block.id !== sidebarFilter.id &&
      block.type !== "category-header" &&
      block.type !== "category-navigation"
  );

  return (
    <div
      data-experience-plp-layout="sidebar"
      className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}
    >
      {headers.map(renderBlock)}
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:items-start">
        <aside aria-label="Catalog filters" className="min-w-0 lg:sticky lg:top-6">
          {renderBlock(sidebarFilter)}
        </aside>
        <div className="min-w-0 space-y-8">{results.map(renderBlock)}</div>
      </div>
      {categoryNavigation.map(renderBlock)}
    </div>
  );
}

function ProductFacts({
  block,
  product,
}: {
  block: Extract<PdpExperienceBlockV2, { type: "product-facts" }>;
  product: StorefrontProductV2;
}) {
  return (
    <section>
      <SectionHeading>{block.title}</SectionHeading>
      <div className="space-y-6">
        {block.fields.includes("description") ? (
          <p
            className="max-w-3xl leading-7"
            style={{ color: "var(--storefront-color-muted-text)" }}
          >
            {product.description}
          </p>
        ) : null}
        {block.fields.includes("specifications") ? (
          product.attributes.length > 0 ? (
            <dl
              className="grid gap-px overflow-hidden border sm:grid-cols-2"
              style={{ borderColor: "var(--storefront-color-border)" }}
            >
              {product.attributes.map((attribute) => (
                <div
                  key={attribute.key}
                  className="grid min-w-0 gap-2 p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-3"
                  style={surfaceStyle()}
                >
                  <dt className="font-semibold">{attribute.label}</dt>
                  <dd
                    className="break-words text-left"
                    style={{ color: "var(--storefront-color-muted-text)" }}
                  >
                    {formatStorefrontAttributeValueV2(
                      attribute.value,
                      attribute.unitCode
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm">
              <strong>Specifications:</strong> Not stated
            </p>
          )
        ) : null}
        {block.fields.includes("availability") ? (
          <p className="text-sm">
            <strong>Availability:</strong> {formatAvailabilityV2(product.availability)}
          </p>
        ) : null}
        {block.fields.includes("shipping-window") ? (
          <p className="text-sm">
            <strong>Shipping window:</strong> Not stated
          </p>
        ) : null}
        {block.fields.includes("country-of-origin") ? (
          <p className="text-sm">
            <strong>Country of origin:</strong>{" "}
            {formatStorefrontAttributeValueV2(
              product.attributes.find(
                (attribute) => attribute.key === "country-of-origin"
              )?.value
            )}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ProductTaxonomyBreadcrumbs({
  product,
  catalog,
  preview,
}: {
  product: StorefrontProductV2;
  catalog: StoreExperienceCatalogProjectionV2;
  preview: boolean;
}) {
  const leafCategory = product.taxonomyNodeIds
    .map((categoryRef) => findExperienceCategoryV2(catalog, categoryRef))
    .filter((category) => category !== undefined)
    .sort((left, right) => right.depth - left.depth)[0];
  if (!leafCategory) return null;

  const path = leafCategory.path.flatMap((slug, index) => {
    const category = catalog.categories.find(
      (candidate) =>
        candidate.slug === slug &&
        candidate.path.length === index + 1 &&
        candidate.path.every(
          (pathSegment, segmentIndex) =>
            pathSegment === leafCategory.path[segmentIndex]
        )
    );
    return category ? [category] : [];
  });

  return (
    <nav
      aria-label="Product category"
      className="mb-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold"
      style={{ color: "var(--storefront-color-muted-text)" }}
    >
      {path.map((category, index) => (
        <React.Fragment key={category.categoryId}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          <ExperienceLink
            href={`/c/${encodeURIComponent(category.slug)}`}
            preview={preview}
            className="inline-flex min-h-11 items-center hover:underline"
            style={{ color: "var(--storefront-color-primary)" }}
          >
            {category.title}
          </ExperienceLink>
        </React.Fragment>
      ))}
    </nav>
  );
}

function PdpBlock({
  block,
  product,
  catalog,
  slots,
  tokens,
  preview,
}: {
  block: PdpExperienceBlockV2;
  product: StorefrontProductV2;
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
  preview: boolean;
}) {
  switch (block.type) {
    case "product-gallery": {
      const layout = block.layout ?? "carousel";
      return (
        <section
          data-experience-gallery-layout={layout}
          data-gallery-layout={layout}
          data-gallery-thumbnails={block.showThumbnails ? "true" : "false"}
          data-protected-shell={block.gallerySlot}
          className={`min-w-0 ${
            layout === "carousel"
              ? "overflow-hidden"
              : block.showThumbnails
                ? "grid gap-3"
                : "grid gap-5"
          }`}
          style={
            {
              "--storefront-gallery-fit": "var(--storefront-product-fit)",
              "--storefront-gallery-ratio": "var(--storefront-product-ratio)",
            } as CSSProperties
          }
        >
          {slots.commerce.productGallery(product)}
        </section>
      );
    }
    case "product-summary":
      return (
        <section className="min-w-0">
          {block.showTaxonomyBreadcrumbs ? (
            <ProductTaxonomyBreadcrumbs
              product={product}
              catalog={catalog}
              preview={preview}
            />
          ) : null}
          {block.showBrand !== false && product.brand ? (
            <p
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--storefront-color-primary)" }}
            >
              {product.brand}
            </p>
          ) : null}
          <h1
            className={`${headingClass[tokens.typography.scale]} break-words font-extrabold leading-tight tracking-tight`}
            style={headingStyle()}
          >
            {product.title}
          </h1>
          {block.showSubtitle !== false && product.subtitle ? (
            <p
              className="mt-3 text-lg leading-7"
              style={{ color: "var(--storefront-color-muted-text)" }}
            >
              {product.subtitle}
            </p>
          ) : null}
        </section>
      );
    case "purchase-panel":
      return (
        <section
          data-protected-shell={block.purchaseSlot}
          data-show-availability={block.showAvailability ? "true" : undefined}
        >
          {slots.commerce.purchasePanel(product)}
        </section>
      );
    case "product-facts":
      return <ProductFacts block={block} product={product} />;
    case "trust-facts":
      return (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {block.claims.map((claim) => (
            <div
              key={claim}
              className={`border p-4 text-sm font-semibold ${radiusClass[tokens.shape.radius]}`}
              style={surfaceStyle()}
            >
              {claimLabels[claim]}
            </div>
          ))}
        </section>
      );
    case "wishlist-control":
      return (
        <section data-experience-feature="wishlist">
          {slots.commerce.wishlistControl(product, block.label)}
        </section>
      );
    case "related-products":
    case "recommendation-grid": {
      const related = productList(block.productRefs, catalog).filter(
        (candidate) => candidate.productId !== product.productId
      );
      return related.length > 0 ? (
        <section data-protected-shell={block.productCardSlot}>
          <SectionHeading>{block.title}</SectionHeading>
          <ProductCards
            products={related}
            columns="four"
            slots={slots}
            ribbons={block.ribbons}
          />
        </section>
      ) : null;
    }
  }
}

type ProductGalleryExperienceBlockV2 = Extract<
  PdpExperienceBlockV2,
  { type: "product-gallery" }
>;

type PdpCompositionV2 =
  | "specification-led"
  | "editorial"
  | "repeat-bundle";

function pdpCompositionV2(
  gallery: ProductGalleryExperienceBlockV2
): PdpCompositionV2 {
  if ((gallery.layout ?? "carousel") === "carousel") return "repeat-bundle";
  return gallery.showThumbnails ? "editorial" : "specification-led";
}

function PdpLayout({
  blocks,
  product,
  catalog,
  slots,
  tokens,
  preview,
}: {
  blocks: readonly PdpExperienceBlockV2[];
  product: StorefrontProductV2;
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
  preview: boolean;
}) {
  const gallery = blocks.find(
    (block): block is ProductGalleryExperienceBlockV2 =>
      block.type === "product-gallery"
  );
  if (!gallery) return null;

  const renderBlock = (block: PdpExperienceBlockV2) => (
    <PdpBlock
      key={block.id}
      block={block}
      product={product}
      catalog={catalog}
      slots={slots}
      tokens={tokens}
      preview={preview}
    />
  );
  const summary = blocks.filter((block) => block.type === "product-summary");
  const purchase = blocks.filter((block) => block.type === "purchase-panel");
  const wishlist = blocks.filter((block) => block.type === "wishlist-control");
  const facts = blocks.filter(
    (block) => block.type === "product-facts" || block.type === "trust-facts"
  );
  const merchandising = blocks.filter(
    (block) =>
      block.type === "related-products" || block.type === "recommendation-grid"
  );
  const composition = pdpCompositionV2(gallery);
  const continuation = (
    <div className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}>
      {merchandising.map(renderBlock)}
    </div>
  );

  if (composition === "specification-led") {
    return (
      <div
        data-experience-pdp-layout={composition}
        className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}
      >
        {summary.map(renderBlock)}
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.68fr)] lg:items-start xl:gap-12">
          <div className="min-w-0 space-y-8">{facts.map(renderBlock)}</div>
          <aside
            aria-label="Product media and purchase"
            className="min-w-0 space-y-6 lg:sticky lg:top-6"
          >
            {renderBlock(gallery)}
            {purchase.map(renderBlock)}
            {wishlist.map(renderBlock)}
          </aside>
        </div>
        {continuation}
      </div>
    );
  }

  if (composition === "editorial") {
    return (
      <div
        data-experience-pdp-layout={composition}
        className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}
      >
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-start xl:gap-12">
          <div className="min-w-0">{renderBlock(gallery)}</div>
          <aside
            aria-label="Product purchase"
            className="min-w-0 space-y-6 lg:sticky lg:top-6"
          >
            {summary.map(renderBlock)}
            {purchase.map(renderBlock)}
            {wishlist.map(renderBlock)}
          </aside>
        </div>
        <div className="min-w-0 space-y-8">{facts.map(renderBlock)}</div>
        {continuation}
      </div>
    );
  }

  return (
    <div
      data-experience-pdp-layout={composition}
      className={`min-w-0 ${sectionGapClass[tokens.spacing.sectionGap]}`}
    >
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.72fr)] lg:items-start xl:gap-12">
        <aside
          aria-label="Product purchase"
          className="min-w-0 space-y-6 lg:order-2 lg:sticky lg:top-6"
        >
          {summary.map(renderBlock)}
          {purchase.map(renderBlock)}
          {wishlist.map(renderBlock)}
        </aside>
        <div className="min-w-0 lg:order-1">{renderBlock(gallery)}</div>
      </div>
      <div className="min-w-0 space-y-8">{facts.map(renderBlock)}</div>
      {continuation}
    </div>
  );
}

function ContentBlock({
  block,
  page,
  catalog,
  slots,
  tokens,
}: {
  block: ContentExperienceBlockV2;
  page: Extract<StoreExperiencePageV2, { kind: "content" }>;
  catalog: StoreExperienceCatalogProjectionV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  tokens: StoreExperienceDesignTokensV2;
}) {
  switch (block.type) {
    case "content-header":
      return (
        <header className={block.alignment === "center" ? "text-center" : "text-left"}>
          <h1 className={headingClass[tokens.typography.scale]} style={headingStyle()}>
            {page.title}
          </h1>
          {block.showUpdatedDate !== false && page.updatedLabel ? (
            <p className="mt-3 text-sm" style={{ color: tokens.palette.mutedText }}>
              {page.updatedLabel}
            </p>
          ) : null}
        </header>
      );
    case "article-body":
      return page.contentKind === "article" ? (
        <section className={block.width !== "wide" ? "mx-auto max-w-3xl" : "max-w-none"} data-content-slot={block.contentSlot}>
          {slots.content.article}
        </section>
      ) : null;
    case "faq-body":
      return page.contentKind === "faq" ? (
        <section data-content-slot={block.contentSlot}>{slots.content.faq}</section>
      ) : null;
    case "product-links":
      return page.contentKind !== "policy" ? (
        <section data-protected-shell={block.productCardSlot}>
          <SectionHeading>{block.title}</SectionHeading>
          <ProductCards
            products={productList(block.productRefs, catalog)}
            columns="four"
            slots={slots}
          />
        </section>
      ) : null;
    case "policy-page":
      return page.contentKind === "policy" ? (
        <section data-protected-shell={block.policySlot}>{slots.policy.page}</section>
      ) : null;
  }
}

function ExperienceHeader({
  manifest,
  slots,
  preview,
}: {
  manifest: StoreExperienceManifestV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  preview: boolean;
}) {
  const { header } = manifest.chrome;
  const tokens = manifest.designTokens;
  const headerLayoutClass = {
    compact: "sm:flex-nowrap sm:justify-between",
    standard: "sm:flex-nowrap sm:justify-between",
    centered: "flex-col items-center text-center",
  }[header.variant];
  return (
    <header
      data-experience-header-variant={header.variant}
      className="min-w-0 overflow-x-clip border-b"
      style={{
        ...surfaceStyle(),
        color: "var(--storefront-color-text)",
      }}
    >
      <div
        className={`mx-auto flex min-w-0 flex-wrap items-center ${contentWidthClass[tokens.spacing.contentWidth]} gap-x-5 gap-y-2 px-4 py-3 sm:px-6 ${headerLayoutClass}`}
      >
        <ExperienceLink
          href="/"
          preview={preview}
          className="inline-flex min-h-11 shrink-0 items-center text-xl font-extrabold"
          style={headingStyle()}
        >
          {header.brandLabel}
        </ExperienceLink>
        <nav
          aria-label="Primary navigation"
          className={`order-3 flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 overflow-visible text-sm sm:order-none sm:w-auto sm:flex-nowrap sm:gap-4 ${
            header.variant === "centered" ? "justify-start sm:justify-center" : ""
          }`}
        >
          {header.navigation.map((item) => (
            <ExperienceLink
              key={item.id}
              href={item.href}
              preview={preview}
              className="inline-flex min-h-11 shrink-0 items-center font-semibold hover:underline"
            >
              {item.label}
            </ExperienceLink>
          ))}
        </nav>
        <div
          className={`flex shrink-0 items-center gap-2 sm:gap-3 ${
            header.variant === "centered" ? "mx-auto" : "ml-auto"
          }`}
        >
          {header.search !== "hidden" ? (
            <ExperienceLink
              href="/search"
              preview={preview}
              className={`inline-flex min-h-11 items-center justify-center text-sm font-semibold ${
                header.search === "field"
                  ? `border px-4 ${radiusClass[tokens.shape.radius]}`
                  : "px-2"
              }`}
              style={header.search === "field" ? surfaceStyle() : undefined}
            >
              Search
            </ExperienceLink>
          ) : null}
          <div
            data-protected-shell={header.cartSlot}
            className="flex min-h-11 items-center"
          >
            {slots.commerce.cart}
          </div>
        </div>
      </div>
    </header>
  );
}

function ExperienceFooter({
  manifest,
  slots,
  preview,
}: {
  manifest: StoreExperienceManifestV2;
  slots: ProtectedStorefrontRenderSlotsV2;
  preview: boolean;
}) {
  const { footer } = manifest.chrome;
  const tokens = manifest.designTokens;
  const footerLayoutClass = {
    compact: "sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]",
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    editorial:
      "lg:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.6fr)_minmax(12rem,0.8fr)]",
  }[footer.variant];
  return (
    <footer
      data-experience-footer-variant={footer.variant}
      className="mt-16 min-w-0 overflow-x-clip border-t"
      style={{
        ...surfaceStyle(),
        color: "var(--storefront-color-text)",
      }}
    >
      <div
        className={`mx-auto grid min-w-0 ${contentWidthClass[tokens.spacing.contentWidth]} ${footerLayoutClass} gap-8 px-4 py-10 sm:px-6 ${
          footer.variant === "editorial" ? "sm:py-14" : ""
        }`}
      >
        <div className="min-w-0">
          <p
            className={footer.variant === "editorial" ? "text-2xl font-bold leading-tight" : "font-bold"}
            style={headingStyle()}
          >
            {footer.tagline}
          </p>
          <div className="mt-4" data-protected-shell={footer.merchantIdentitySlot}>
            {slots.policy.merchantIdentity}
          </div>
        </div>
        <nav
          aria-label="Footer navigation"
          className={`min-w-0 text-sm ${
            footer.variant === "compact"
              ? "flex flex-wrap gap-x-4 gap-y-1"
              : "grid gap-1"
          }`}
        >
          {footer.navigation.map((item) => (
            <ExperienceLink
              key={item.id}
              href={item.href}
              preview={preview}
              className="inline-flex min-h-11 items-center hover:underline"
            >
              {item.label}
            </ExperienceLink>
          ))}
        </nav>
        <div data-protected-shell={footer.policyLinksSlot}>{slots.policy.links}</div>
      </div>
    </footer>
  );
}

function InvalidExperience({ issues }: { issues: readonly { code: string }[] }) {
  return (
    <section
      role="alert"
      data-store-experience-invalid="true"
      className="border border-red-300 bg-red-50 p-5 text-sm text-red-950"
    >
      Store experience refused: {issues.map((issue) => issue.code).join(", ")}
    </section>
  );
}

/** Renders only a validated manifest and always injects platform-owned shells. */
export function StoreExperienceRendererV2({
  manifest,
  catalog,
  page,
  slots,
  preview = false,
}: StoreExperienceRendererPropsV2) {
  const validation = validateStoreExperienceManifestV2(manifest, catalog);
  if (!validation.success) return <InvalidExperience issues={validation.issues} />;

  const validated = validation.manifest;
  const tokens = validated.designTokens;
  let body: ReactNode;

  if (page.kind === "home") {
    body = validated.pages.home.blocks.map((block) => (
      <HomeBlock
        key={block.id}
        block={block}
        catalog={catalog}
        slots={slots}
        tokens={tokens}
        preview={preview}
      />
    ));
  } else if (page.kind === "plp") {
    const categoryRefs = page.categoryRef
      ? categoryDescendantReferenceSetV2(catalog, page.categoryRef)
      : null;
    const products = categoryRefs
      ? catalog.products.filter((product) =>
          product.taxonomyNodeIds.some((categoryRef) =>
            categoryRefs.has(categoryRef)
          )
        )
      : catalog.products;
    body = (
      <PlpLayout
        blocks={validated.pages.plp.blocks}
        page={page}
        products={products}
        catalog={catalog}
        slots={slots}
        tokens={tokens}
        preview={preview}
      />
    );
  } else if (page.kind === "pdp") {
    const product = findStorefrontProductV2(catalog, page.productRef);
    if (!product) {
      return <InvalidExperience issues={[{ code: "UNKNOWN_PRODUCT_REF" }]} />;
    }
    body = (
      <PdpLayout
        blocks={validated.pages.pdp.blocks}
        product={product}
        catalog={catalog}
        slots={slots}
        tokens={tokens}
        preview={preview}
      />
    );
  } else if (page.kind === "content") {
    body = validated.pages.content.blocks.map((block) => (
      <ContentBlock
        key={block.id}
        block={block}
        page={page}
        catalog={catalog}
        slots={slots}
        tokens={tokens}
      />
    ));
  } else if (page.kind === "cart") {
    body = <section data-protected-shell="commerce.cart.v1">{slots.commerce.cartPage}</section>;
  } else {
    body = (
      <section data-protected-shell="commerce.checkout.v1">
        {slots.commerce.checkoutPage}
      </section>
    );
  }

  return (
    <div
      data-store-experience-version={validated.version}
      data-store-experience-page={page.kind}
      data-store-experience-preview={preview ? "true" : undefined}
      data-storefront-token-scope="v2"
      data-product-image-fit={tokens.imagery.productFit}
      data-product-image-ratio={tokens.imagery.productRatio}
      className="min-w-0 overflow-x-clip"
      style={rootStyle(tokens)}
    >
      <ExperienceHeader manifest={validated} slots={slots} preview={preview} />
      <main
        className={`mx-auto w-full min-w-0 ${contentWidthClass[tokens.spacing.contentWidth]} px-4 sm:px-6 ${densityClass[tokens.spacing.density]} ${sectionGapClass[tokens.spacing.sectionGap]}`}
      >
        {body}
      </main>
      <ExperienceFooter manifest={validated} slots={slots} preview={preview} />
    </div>
  );
}
