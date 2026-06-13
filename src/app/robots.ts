import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCanonicalBaseUrl } from "@/lib/seo/canonical";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";

export const dynamic = "force-dynamic";

/**
 * Robots are generated per host: each domain advertises only its own
 * sitemap, storefront pages are crawlable, and internal/admin/api paths are
 * blocked. The internal /s/ paths are blocked too — clean canonical URLs are
 * the only ones that should be indexed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Build-time prerender has no request; fall back to the default store.
  }

  const store = await resolveStoreForRequest({ host });
  const base = store ? getCanonicalBaseUrl(store) : "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/s/", "/cart", "/checkout", "/search"],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
