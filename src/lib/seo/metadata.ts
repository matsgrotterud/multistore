import type { Metadata } from "next";
import type { Category, ContentPage, Product, Store } from "@prisma/client";
import { absoluteUrl, canonicalUrl, getCanonicalBaseUrl } from "@/lib/seo/canonical";
import { isLiveStore } from "@/lib/stores/preview-url";

/**
 * Centralized metadata builders. Every storefront page calls one of these so
 * titles, descriptions, canonicals, Open Graph and Twitter cards stay
 * consistent across all tenants.
 */

const FALLBACK_OG_IMAGE = "/api/placeholder?label=Store&seed=og-fallback";

interface BuildArgs {
  store: Store;
  title: string;
  description: string;
  path: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
  noindex?: boolean;
}

export function buildMetadata({
  store,
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  noindex = false,
}: BuildArgs): Metadata {
  const canonical = canonicalUrl(store, path);
  const image = absoluteUrl(store, ogImage || FALLBACK_OG_IMAGE);
  const shouldNoindex = noindex || !isLiveStore(store.launchStatus);

  return {
    title,
    description,
    metadataBase: new URL(getCanonicalBaseUrl(store)),
    alternates: { canonical },
    robots: shouldNoindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: store.name,
      locale: store.locale.replace("-", "_"),
      type: ogType,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildStoreMetadata(store: Store): Metadata {
  return buildMetadata({
    store,
    title: `${store.name} — ${store.valueProposition}`,
    description: store.positioning,
    path: "/",
  });
}

export function buildProductMetadata(store: Store, product: Product): Metadata {
  return buildMetadata({
    store,
    title: product.seoTitle || `${product.title} | ${store.name}`,
    description: product.seoDescription || product.shortDescription,
    path: `/p/${product.slug}`,
    ogImage: product.imageUrl,
    noindex: product.noindex || !product.isPublished,
  });
}

export function buildCategoryMetadata(
  store: Store,
  category: Category,
  publishedProductCount: number
): Metadata {
  // Thin categories (< 3 published products) are kept out of the index until
  // they have enough depth to be worth ranking.
  const noindex = publishedProductCount < 3;
  return buildMetadata({
    store,
    title: category.seoTitle || `${category.name} | ${store.name}`,
    description: category.seoDescription || category.description,
    path: `/c/${category.slug}`,
    noindex,
  });
}

export function buildGuideMetadata(store: Store, guide: ContentPage): Metadata {
  return buildMetadata({
    store,
    title: guide.seoTitle || `${guide.title} | ${store.name}`,
    description: guide.seoDescription || guide.excerpt,
    path: `/guides/${guide.slug}`,
    ogImage: guide.heroImageUrl,
    ogType: "article",
    noindex: guide.noindex || !guide.isPublished,
  });
}
