import type { Store } from "@prisma/client";

/**
 * Canonical URLs always point at the store's primary domain with clean paths
 * (never the internal /s/[storeSlug] path). This keeps one indexable URL per
 * page even when the same content is reachable via localhost, ?store= or the
 * internal path during development.
 */

export function getCanonicalBaseUrl(store: Pick<Store, "primaryDomain">): string {
  const domain = store.primaryDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${domain}`;
}

export function canonicalUrl(
  store: Pick<Store, "primaryDomain">,
  path: string
): string {
  const base = getCanonicalBaseUrl(store);
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Make a possibly-relative asset URL absolute against the store domain. */
export function absoluteUrl(
  store: Pick<Store, "primaryDomain">,
  urlOrPath: string
): string {
  if (/^https?:\/\//.test(urlOrPath)) return urlOrPath;
  return canonicalUrl(store, urlOrPath);
}
