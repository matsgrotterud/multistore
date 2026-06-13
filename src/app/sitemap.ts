import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { buildStoreSitemap } from "@/lib/seo/sitemap";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";

export const dynamic = "force-dynamic";

/**
 * Per-domain sitemap: each host serves only its own store's URLs. Unpublished
 * and noindex pages are excluded in buildStoreSitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Build-time prerender has no request; fall back to the default store.
  }

  const store = await resolveStoreForRequest({ host });
  if (!store) return [];
  return buildStoreSitemap(store);
}
