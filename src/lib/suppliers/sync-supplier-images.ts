import type { PrismaClient } from "@prisma/client";

type DbClient = Pick<PrismaClient, "product" | "store">;

export interface SyncSupplierImagesResult {
  productId: string;
  slug: string;
  imageCount: number;
  listingUrl: string | null;
  skipped?: boolean;
  error?: string;
}

/**
 * Deprecated safety shim.
 *
 * The old image sync used marketplace page scraping. Runtime supplier media now
 * flows through provider adapters and src/lib/media/ingest-product-media.ts.
 */
export async function syncSupplierImagesForProduct(
  db: DbClient,
  productId: string,
  _options?: { delayMs?: number }
): Promise<SyncSupplierImagesResult> {
  void _options;
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, supplierUrl: true },
  });
  return {
    productId,
    slug: product?.slug ?? "unknown",
    imageCount: 0,
    listingUrl: product?.supplierUrl ?? null,
    skipped: true,
    error: "Deprecated scraping sync is disabled. Use provider media ingestion instead.",
  };
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
  return Promise.all(products.map((product) => syncSupplierImagesForProduct(db, product.id)));
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
  const output = [];
  for (const store of stores) {
    output.push({
      storeSlug: store.slug,
      results: await syncSupplierImagesForStore(db, store.slug, { limit: options?.limitPerStore }),
    });
  }
  return output;
}
