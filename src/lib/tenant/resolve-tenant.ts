import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_STORE_SLUG,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";
import type { Prisma } from "@prisma/client";

export type StoreWithTheme = Prisma.StoreGetPayload<{
  include: { theme: true };
}>;

/**
 * Server-side tenant resolution. Unlike the edge middleware (which only has
 * the static domain map), this also consults the Domain table, so domains
 * added at runtime resolve correctly for sitemaps/feeds/robots.
 */

export const getStoreBySlug = cache(
  async (slug: string): Promise<StoreWithTheme | null> => {
    return prisma.store.findFirst({
      where: { slug, isActive: true },
      include: { theme: true },
    });
  }
);

export async function resolveStoreSlugFromHostname(
  hostname: string
): Promise<string | null> {
  const host = hostname.toLowerCase().split(":")[0];

  const mapped = resolveStoreSlugFromHost(host);
  if (mapped) return mapped;

  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    include: { store: { select: { slug: true, isActive: true } } },
  });
  if (domain?.store.isActive) return domain.store.slug;

  return null;
}

/**
 * Resolve a store for request-handler contexts (robots, sitemap, feeds) that
 * receive a Host header and optionally an explicit ?store= override.
 */
export async function resolveStoreForRequest(options: {
  host?: string | null;
  storeParam?: string | null;
}): Promise<StoreWithTheme | null> {
  if (options.storeParam) {
    const bySlug = await getStoreBySlug(options.storeParam);
    if (bySlug) return bySlug;
  }
  if (options.host) {
    const slug = await resolveStoreSlugFromHostname(options.host);
    if (slug) {
      const byHost = await getStoreBySlug(slug);
      if (byHost) return byHost;
    }
  }
  return getStoreBySlug(DEFAULT_STORE_SLUG);
}
