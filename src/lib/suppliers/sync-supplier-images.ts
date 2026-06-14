import type { PrismaClient } from "@prisma/client";
import { syncProductImages } from "@/lib/images/sync-product-images";
import { parseStringArray } from "@/lib/utils/json";
import {
  scrapeSupplierImages,
  type SupplierMarketplace,
} from "@/lib/suppliers/scrape";
import { delay } from "@/lib/suppliers/scrape/jina-reader";

type DbClient = Pick<PrismaClient, "product" | "productImage" | "store">;

export interface SyncSupplierImagesResult {
  productId: string;
  slug: string;
  imageCount: number;
  listingUrl: string | null;
  skipped?: boolean;
  error?: string;
}

function parseSupplierSource(value: string | null | undefined): SupplierMarketplace {
  const normalized = (value ?? "aliexpress").toLowerCase();
  if (
    normalized === "aliexpress" ||
    normalized === "temu" ||
    normalized === "ebay" ||
    normalized === "wish" ||
    normalized === "alibaba"
  ) {
    return normalized;
  }
  return "aliexpress";
}

function buildSearchQuery(product: {
  title: string;
  subtitle: string;
  supplierSearchQuery: string | null;
  store: { niche: string };
}): string {
  if (product.supplierSearchQuery?.trim()) {
    return product.supplierSearchQuery.trim();
  }
  return [product.title, product.subtitle, product.store.niche].filter(Boolean).join(" ");
}

/**
 * Scrape supplier listing images and persist remote CDN URLs on the product.
 * Images live in the database — nothing is committed to git.
 */
export async function syncSupplierImagesForProduct(
  db: DbClient,
  productId: string,
  options?: { delayMs?: number }
): Promise<SyncSupplierImagesResult> {
  const product = await prismaProduct(db, productId);
  if (!product) {
    return { productId, slug: "unknown", imageCount: 0, listingUrl: null, error: "Product not found" };
  }

  const searchQuery = buildSearchQuery(product);
  const source = parseSupplierSource(product.supplierSource);

  try {
    const scraped = await scrapeSupplierImages({
      source,
      searchQuery,
      supplierProductId: product.supplierProductId,
      listingUrl: product.supplierUrl,
    });

    if (scraped.imageUrls.length === 0) {
      return {
        productId,
        slug: product.slug,
        imageCount: 0,
        listingUrl: product.supplierUrl,
        skipped: true,
        error: "No supplier images found",
      };
    }

    await syncProductImages(db, productId, {
      title: product.title,
      subtitle: product.subtitle,
      slug: product.slug,
      sku: product.sku,
      niche: product.store.niche,
      brand: product.brand,
      keywords: parseStringArray(product.useCases),
      scrapedImages: scraped.scrapedImages,
    });

    await db.product.update({
      where: { id: productId },
      data: {
        supplierUrl: scraped.listingUrl ?? product.supplierUrl,
        imagesSyncedAt: new Date(),
      },
    });

    if (options?.delayMs) {
      await delay(options.delayMs);
    }

    return {
      productId,
      slug: product.slug,
      imageCount: scraped.imageUrls.length,
      listingUrl: scraped.listingUrl,
    };
  } catch (error) {
    return {
      productId,
      slug: product.slug,
      imageCount: 0,
      listingUrl: product.supplierUrl,
      error: error instanceof Error ? error.message : "Scrape failed",
    };
  }
}

export async function syncSupplierImagesForStore(
  db: DbClient,
  storeSlug: string,
  options?: { delayMs?: number; limit?: number }
): Promise<SyncSupplierImagesResult[]> {
  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) throw new Error(`Unknown store: ${storeSlug}`);

  const products = await db.product.findMany({
    where: { storeId: store.id, isPublished: true },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: options?.limit,
  });

  const results: SyncSupplierImagesResult[] = [];
  for (const product of products) {
    results.push(await syncSupplierImagesForProduct(db, product.id, options));
  }
  return results;
}

export async function syncSupplierImagesForAllStores(
  db: DbClient,
  options?: { delayMs?: number; limitPerStore?: number }
): Promise<{ storeSlug: string; results: SyncSupplierImagesResult[] }[]> {
  const stores = await db.store.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });

  const output: { storeSlug: string; results: SyncSupplierImagesResult[] }[] = [];
  for (const store of stores) {
    const results = await syncSupplierImagesForStore(db, store.slug, {
      delayMs: options?.delayMs,
      limit: options?.limitPerStore,
    });
    output.push({ storeSlug: store.slug, results });
  }
  return output;
}

async function prismaProduct(db: DbClient, productId: string) {
  return db.product.findUnique({
    where: { id: productId },
    include: { store: { select: { niche: true } } },
  });
}
