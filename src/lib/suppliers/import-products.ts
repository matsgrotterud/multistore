import { prisma } from "@/lib/db";
import {
  approveCandidate,
  discoverProductsForStore,
  importCandidateToProduct,
} from "@/lib/catalog/candidate-service";
import type { SupplierAdapter } from "@/lib/suppliers/types";

/**
 * Compatibility wrapper for the old generator/admin flow.
 *
 * Supplier search now writes ProductCandidate rows first. This wrapper uses
 * the mock commerce provider, approves enriched candidates and imports them as
 * unpublished/noindex Product drafts so existing generator code keeps working.
 */

export interface ImportResult {
  imported: number;
  skipped: number;
  slugs: string[];
}

export async function importProductsForStore(options: {
  storeSlug: string;
  categorySlug: string;
  query: string;
  adapter?: SupplierAdapter;
  targetMargin?: number;
}): Promise<ImportResult> {
  void options.adapter;
  void options.targetMargin;

  const store = await prisma.store.findUnique({
    where: { slug: options.storeSlug },
  });
  if (!store) throw new Error(`Unknown store: ${options.storeSlug}`);

  const category = await prisma.category.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: options.categorySlug } },
  });
  if (!category) {
    throw new Error(`Unknown category: ${options.categorySlug}`);
  }

  await discoverProductsForStore({
    storeId: store.id,
    categoryId: category.id,
    providerKey: "mock",
    query: options.query,
    limit: 8,
  });

  const candidates = await prisma.productCandidate.findMany({
    where: {
      storeId: store.id,
      categoryId: category.id,
      providerKey: "mock",
      status: "ENRICHED",
      importedProductId: null,
    },
    orderBy: { score: "desc" },
    take: 8,
  });

  const result: ImportResult = { imported: 0, skipped: 0, slugs: [] };
  for (const candidate of candidates) {
    await approveCandidate(candidate.id);
    const productId = await importCandidateToProduct(candidate.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) {
      result.imported += 1;
      result.slugs.push(product.slug);
    }
  }

  result.skipped = Math.max(0, candidates.length - result.imported);
  return result;
}

