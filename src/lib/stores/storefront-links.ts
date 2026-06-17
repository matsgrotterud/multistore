import { isLiveStore } from "@/lib/stores/preview-url";

/**
 * Central storefront URL builder. This is the ONLY place that decides whether a
 * storefront link keeps the internal `/s/[slug]` prefix.
 *
 * - Preview / draft stores are reached at `/s/[slug]` on a shared deployment
 *   host, so every in-store link must keep that prefix or the visitor falls
 *   back to whatever tenant the cookie/host resolves to (the "URL loses store
 *   context" bug). Direct `/s/[slug]` navigation therefore stays on `/s/[slug]`.
 * - Live stores are served from their own domain where the edge middleware
 *   rewrites clean URLs to the internal path, so links stay clean (`/c/...`).
 *
 * Product URLs are category-aware (`/c/[category]/p/[product]`) when the
 * category slug is known, which keeps category context in the URL and matches
 * the canonical URL emitted for SEO.
 */

export interface LinkStore {
  slug: string;
  launchStatus: string;
}

/** `/s/[slug]` for preview/draft, empty string for live (clean URLs). */
export function storefrontBase(store: LinkStore): string {
  return isLiveStore(store.launchStatus) ? "" : `/s/${store.slug}`;
}

export function storefrontHref(store: LinkStore, path = "/"): string {
  return joinBase(storefrontBase(store), path);
}

/** Build an href from a precomputed base (used by client components). */
export function joinBase(base: string, path = "/"): string {
  if (!path || path === "/") return base || "/";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Canonical, category-aware relative product path (no store prefix). */
export function productRelPath(
  productSlug: string,
  categorySlug?: string | null
): string {
  return categorySlug
    ? `/c/${categorySlug}/p/${productSlug}`
    : `/p/${productSlug}`;
}

export function categoryRelPath(categorySlug: string): string {
  return `/c/${categorySlug}`;
}

export function productHref(
  store: LinkStore,
  productSlug: string,
  categorySlug?: string | null
): string {
  return storefrontHref(store, productRelPath(productSlug, categorySlug));
}

export function categoryHref(store: LinkStore, categorySlug: string): string {
  return storefrontHref(store, categoryRelPath(categorySlug));
}
