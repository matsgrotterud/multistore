import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo/canonical";
import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";

/**
 * Builds the sitemap for a single store. Each domain serves only its own
 * store's URLs; unpublished and noindex'd pages are excluded, and categories
 * with fewer than 3 published products are excluded to mirror the noindex
 * rule applied on the page itself.
 */
export async function buildStoreSitemap(
  store: StoreWithTheme
): Promise<MetadataRoute.Sitemap> {
  const [categories, products, guides] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, isPublished: true, noindex: false },
      select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
    }),
    prisma.contentPage.findMany({
      where: {
        storeId: store.id,
        type: "GUIDE",
        isPublished: true,
        noindex: false,
      },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: canonicalUrl(store, "/"),
      lastModified: store.updatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    { url: canonicalUrl(store, "/compare"), changeFrequency: "weekly", priority: 0.6 },
    { url: canonicalUrl(store, "/quiz"), changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const category of categories) {
    if (category._count.products < 3) continue;
    entries.push({
      url: canonicalUrl(store, `/c/${category.slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const product of products) {
    entries.push({
      url: canonicalUrl(
        store,
        product.category?.slug
          ? `/c/${product.category.slug}/p/${product.slug}`
          : `/p/${product.slug}`
      ),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const guide of guides) {
    entries.push({
      url: canonicalUrl(store, `/guides/${guide.slug}`),
      lastModified: guide.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const policy of ["shipping", "returns", "privacy", "terms"]) {
    entries.push({
      url: canonicalUrl(store, `/policies/${policy}`),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  return entries;
}
