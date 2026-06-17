import type { ContentPage, Product, Store } from "@prisma/client";
import { absoluteUrl, canonicalUrl } from "@/lib/seo/canonical";
import { parseFaq } from "@/lib/utils/json";
import type { FaqItem, StockStatus } from "@/lib/types";

/**
 * Structured data builders.
 *
 * Honesty rules enforced here:
 * - AggregateRating is ONLY emitted when both ratingAverage and a positive
 *   ratingCount exist. We never fabricate review data.
 * - FAQPage is only built from FAQ content that is actually visible on the
 *   page (callers pass the same array they render).
 * - Availability mirrors the real stockStatus field.
 */

type JsonLd = Record<string, unknown>;

const AVAILABILITY: Record<StockStatus, string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  PREORDER: "https://schema.org/PreOrder",
};

export function organizationJsonLd(store: Store): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.legalName,
    url: canonicalUrl(store, "/"),
    email: store.supportEmail,
    ...(store.supportPhone ? { telephone: store.supportPhone } : {}),
  };
}

export function webSiteJsonLd(store: Store): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: canonicalUrl(store, "/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl(store, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(
  store: Store,
  product: Product,
  galleryUrls?: string[],
  categorySlug?: string | null
): JsonLd {
  const availability =
    AVAILABILITY[product.stockStatus as StockStatus] ??
    "https://schema.org/InStock";

  const imageList = (galleryUrls?.length ? galleryUrls : [product.imageUrl]).map((url) =>
    absoluteUrl(store, url)
  );

  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    image: imageList.length === 1 ? imageList[0] : imageList,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.gtin ? { gtin: product.gtin } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl(
        store,
        categorySlug ? `/c/${categorySlug}/p/${product.slug}` : `/p/${product.slug}`
      ),
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: store.legalName },
    },
  };

  // Never emit AggregateRating without real rating data.
  if (product.ratingAverage !== null && product.ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverage,
      reviewCount: product.ratingCount,
    };
  }

  return jsonLd;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(
  store: Store,
  items: BreadcrumbItem[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(store, item.path),
    })),
  };
}

export function itemListJsonLd(
  store: Store,
  name: string,
  products: Array<Product & { category?: { slug: string } | null }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: canonicalUrl(
        store,
        product.category?.slug
          ? `/c/${product.category.slug}/p/${product.slug}`
          : `/p/${product.slug}`
      ),
      name: product.title,
    })),
  };
}

export function articleJsonLd(store: Store, guide: ContentPage): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    ...(guide.heroImageUrl
      ? { image: absoluteUrl(store, guide.heroImageUrl) }
      : {}),
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: { "@type": "Organization", name: store.name },
    publisher: { "@type": "Organization", name: store.legalName },
    mainEntityOfPage: canonicalUrl(store, `/guides/${guide.slug}`),
  };
}

/**
 * Only call this with FAQ items that are rendered visibly on the same page;
 * emitting FAQ markup for hidden content violates search guidelines.
 */
export function faqPageJsonLd(faq: FaqItem[]): JsonLd | null {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function productFaq(product: Product): FaqItem[] {
  return parseFaq(product.faq);
}
