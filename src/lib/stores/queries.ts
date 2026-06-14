import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStoreBySlug, type StoreWithTheme } from "@/lib/tenant/resolve-tenant";
import { parseStringArray } from "@/lib/utils/json";
import type { ClientProduct } from "@/lib/types";
import type { Product } from "@prisma/client";

/**
 * Data access layer for storefront pages. All queries are store-scoped so a
 * tenant can never leak another tenant's data, and wrapped in React cache()
 * to dedupe within a single render.
 */

export const requireStore = cache(async (slug: string): Promise<StoreWithTheme> => {
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return store;
});

export const getCategories = cache(async (storeId: string) => {
  return prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });
});

export const getCategoryWithProducts = cache(
  async (storeId: string, slug: string) => {
    return prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
      include: {
        products: {
          where: { isPublished: true },
          orderBy: { productScore: "desc" },
        },
      },
    });
  }
);

export const getProductBySlug = cache(async (storeId: string, slug: string) => {
  return prisma.product.findUnique({
    where: { storeId_slug: { storeId, slug } },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
});

export const getFeaturedProducts = cache(
  async (storeId: string, limit = 8) => {
    return prisma.product.findMany({
      where: { storeId, isPublished: true },
      orderBy: { productScore: "desc" },
      take: limit,
    });
  }
);

export const getRelatedProducts = cache(
  async (storeId: string, categoryId: string, excludeProductId: string, limit = 4) => {
    const sameCategory = await prisma.product.findMany({
      where: {
        storeId,
        categoryId,
        isPublished: true,
        id: { not: excludeProductId },
      },
      orderBy: { productScore: "desc" },
      take: limit,
    });
    if (sameCategory.length >= limit) return sameCategory;

    const filler = await prisma.product.findMany({
      where: {
        storeId,
        isPublished: true,
        id: { notIn: [excludeProductId, ...sameCategory.map((product) => product.id)] },
      },
      orderBy: { productScore: "desc" },
      take: limit - sameCategory.length,
    });
    return [...sameCategory, ...filler];
  }
);

export const getGuides = cache(async (storeId: string) => {
  return prisma.contentPage.findMany({
    where: { storeId, type: "GUIDE", isPublished: true },
    orderBy: { createdAt: "asc" },
  });
});

export const getGuideBySlug = cache(async (storeId: string, slug: string) => {
  return prisma.contentPage.findUnique({
    where: { storeId_slug: { storeId, slug } },
  });
});

export const getComparisonPage = cache(async (storeId: string) => {
  return prisma.contentPage.findFirst({
    where: { storeId, type: "COMPARISON", isPublished: true },
  });
});

export const getHomepageFaq = cache(async (storeId: string) => {
  return prisma.contentPage.findFirst({
    where: { storeId, type: "FAQ", isPublished: true },
  });
});

export const getProductsByIds = cache(
  async (storeId: string, ids: string[]) => {
    if (ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { storeId, id: { in: ids }, isPublished: true },
    });
    // Preserve the order of the ids array.
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }
);

export async function searchProducts(storeId: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return prisma.product.findMany({
    where: {
      storeId,
      isPublished: true,
      OR: [
        { title: { contains: trimmed } },
        { description: { contains: trimmed } },
        { brand: { contains: trimmed } },
        { subtitle: { contains: trimmed } },
      ],
    },
    orderBy: { productScore: "desc" },
    take: 24,
  });
}

/** Strip server-only fields (cost, margin) before sending to the client. */
export function toClientProduct(product: Product): ClientProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    brand: product.brand,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    stockStatus: product.stockStatus,
    shippingDaysMin: product.shippingDaysMin,
    shippingDaysMax: product.shippingDaysMax,
    countryOfOrigin: product.countryOfOrigin,
    useCases: parseStringArray(product.useCases),
    productScore: product.productScore,
    fulfillmentMode: product.fulfillmentMode,
    affiliateUrl: product.affiliateUrl,
    providerKey: product.providerKey,
    checkoutAvailable: checkoutAvailableForProduct(product),
  };
}

function checkoutAvailableForProduct(product: Product): boolean {
  if (product.fulfillmentMode === "AFFILIATE") return false;
  if (product.fulfillmentMode === "MOCK") return true;
  if (product.fulfillmentMode === "MANUAL") {
    return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
  }
  if (product.fulfillmentMode !== "DROPSHIP") return false;
  if (!product.externalId) return false;

  switch (product.providerKey) {
    case "cj":
      return (
        process.env.CJ_ENABLED === "true" &&
        process.env.CJ_ORDER_API_ENABLED === "true" &&
        Boolean(process.env.CJ_LOGISTIC_NAME) &&
        Boolean(process.env.CJ_FROM_COUNTRY_CODE)
      );
    case "mock":
      return true;
    default:
      return false;
  }
}
