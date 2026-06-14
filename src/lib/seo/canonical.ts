import type { Store } from "@prisma/client";
import { getDeploymentHost, getDeploymentProtocol, isLiveStore } from "@/lib/stores/preview-url";

/**
 * Canonical URLs always point at the store's primary domain with clean paths
 * (never the internal /s/[storeSlug] path) once LIVE. Preview stores use the
 * deployment host with an explicit /s/[slug] prefix so each tenant has a
 * unique, honest URL while noindexed.
 */

export type StoreForCanonical = Pick<
  Store,
  "primaryDomain" | "slug" | "launchStatus" | "plannedDomain"
>;

export function getCanonicalBaseUrl(store: StoreForCanonical): string {
  if (!isLiveStore(store.launchStatus)) {
    const host = getDeploymentHost();
    const protocol = getDeploymentProtocol(host);
    return `${protocol}://${host}/s/${store.slug}`;
  }

  const domain = (store.plannedDomain ?? store.primaryDomain)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return `https://${domain}`;
}

export function canonicalUrl(store: StoreForCanonical, path: string): string {
  const base = getCanonicalBaseUrl(store);
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Make a possibly-relative asset URL absolute against the store domain. */
export function absoluteUrl(store: StoreForCanonical, urlOrPath: string): string {
  if (/^https?:\/\//.test(urlOrPath)) return urlOrPath;
  return canonicalUrl(store, urlOrPath);
}
