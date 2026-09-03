import { cache } from "react";
import { prisma } from "@/lib/db";
import { rethrowDevMissingTableError } from "@/lib/db/dev-guard";
import {
  DEFAULT_STORE_SLUG,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";
import type { Prisma } from "@prisma/client";

export type StoreWithTheme = Prisma.StoreGetPayload<{
  include: { theme: true };
}>;

interface HostnameResolutionOptions {
  requireLive?: boolean;
  databaseAuthority?: boolean;
}

/**
 * Server-side tenant resolution shared by Node.js middleware and request
 * handlers. The static map is the fast path; the Domain table lets domains
 * added at runtime resolve correctly for storefronts, sitemaps, feeds and
 * robots.
 */

export const getStoreBySlug = cache(
  async (slug: string): Promise<StoreWithTheme | null> => {
    try {
      return await prisma.store.findFirst({
        where: { slug, isActive: true },
        include: { theme: true },
      });
    } catch (error) {
      rethrowDevMissingTableError(error, "Store");
    }
  }
);

export async function resolveStoreSlugFromHostname(
  hostname: string,
  options: HostnameResolutionOptions = {}
): Promise<string | null> {
  const host = hostname.toLowerCase().split(":")[0];

  const databaseAuthority =
    options.databaseAuthority || process.env.NODE_ENV === "production";
  const mapped = databaseAuthority ? null : resolveStoreSlugFromHost(host);
  if (mapped) return mapped;

  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    include: {
      store: { select: { slug: true, isActive: true, launchStatus: true } },
    },
  });
  if (
    domain?.store.isActive &&
    (!options.requireLive || domain.store.launchStatus === "LIVE")
  ) {
    return domain.store.slug;
  }

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
  const allowDevelopmentFallback = process.env.NODE_ENV !== "production";

  if (allowDevelopmentFallback && options.storeParam) {
    const bySlug = await getStoreBySlug(options.storeParam);
    if (bySlug) return bySlug;
  }
  if (options.host) {
    const slug = await resolveStoreSlugFromHostname(options.host, {
      databaseAuthority: process.env.NODE_ENV === "production",
    });
    if (slug) {
      const byHost = await getStoreBySlug(slug);
      if (byHost) return byHost;
    }
  }
  return allowDevelopmentFallback ? getStoreBySlug(DEFAULT_STORE_SLUG) : null;
}
