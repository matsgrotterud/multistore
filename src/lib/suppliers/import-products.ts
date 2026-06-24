import { prisma } from "@/lib/db";
import {
  approveCandidate,
  discoverProductsForStore,
  importCandidateToProduct,
  rejectCandidate,
} from "@/lib/catalog/candidate-service";
import {
  buildRelevanceProfile,
  evaluateRelevance,
  type RelevanceProfile,
} from "@/lib/ai/category-strategy";
import type { SupplierAdapter } from "@/lib/suppliers/types";
import type { ProviderKey } from "@/lib/suppliers/providers/types";

/**
 * Build an evidence-based relevance profile for a store from its real plan:
 * niche + all category names + stored supplier import queries + negatives. This
 * gives the profile rich, data-driven vocabulary (no per-niche hardcoding).
 */
async function buildStoreRelevanceProfile(
  store: { id: string; niche: string },
  negativeKeywords: string[],
  extraQueries: string[] = []
): Promise<RelevanceProfile> {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({ where: { storeId: store.id }, select: { name: true } }),
    prisma.storeSupplierSettings.findFirst({
      where: { storeId: store.id },
      select: { importQueries: true },
    }),
  ]);
  let storedQueries: string[] = [];
  try {
    storedQueries = settings?.importQueries ? (JSON.parse(settings.importQueries) as string[]) : [];
  } catch {
    storedQueries = [];
  }
  const queries = [...storedQueries, ...extraQueries].filter(Boolean);
  return buildRelevanceProfile({
    niche: store.niche,
    categoryHints: categories.map((c) => c.name),
    supplierSearchHints: queries,
    importQueries: queries,
    negativeKeywords,
  });
}

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
  discovered: number;
  rejected: number;
  providerKeys: string[];
}

export async function importProductsForStore(options: {
  storeSlug: string;
  categorySlug: string;
  query: string;
  queryVariants?: string[];
  negativeKeywords?: string[];
  providerKeys?: Array<ProviderKey | string>;
  adapter?: SupplierAdapter;
  targetMargin?: number;
  limit?: number;
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

  const providerKeys = options.providerKeys ?? defaultProviderKeys();
  const queries = uniqueQueries([
    options.query,
    ...(options.queryVariants ?? []),
    `${store.niche} ${category.name}`,
    store.niche,
    category.name,
  ]);
  const discoveredByProvider = new Set<string>();
  let discovered = 0;
  let rejected = 0;

  for (const providerKey of providerKeys) {
    for (const query of queries) {
      const summary = await discoverProductsForStore({
        storeId: store.id,
        categoryId: category.id,
        providerKey,
        query,
        limit: options.limit ?? 4,
      });
      if (summary.discovered > 0) discoveredByProvider.add(providerKey);
      discovered += summary.discovered;
      rejected += summary.rejected;
      const enrichedCount = await prisma.productCandidate.count({
        where: {
          storeId: store.id,
          categoryId: category.id,
          providerKey,
          status: "ENRICHED",
          importedProductId: null,
        },
      });
      if (enrichedCount >= (options.limit ?? 4)) break;
    }
  }

  const candidates = await prisma.productCandidate.findMany({
    where: {
      storeId: store.id,
      categoryId: category.id,
      providerKey: { in: providerKeys },
      status: "ENRICHED",
      importedProductId: null,
    },
    orderBy: { score: "desc" },
    take: options.limit ?? 8,
  });

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    slugs: [],
    discovered,
    rejected,
    providerKeys: [...discoveredByProvider],
  };
  const negativeKeywords = (options.negativeKeywords ?? [])
    .map((keyword) => keyword.toLowerCase().trim())
    .filter(Boolean);
  const relevanceProfile = await buildStoreRelevanceProfile(store, negativeKeywords, queries);
  for (const candidate of candidates) {
    const verdict = evaluateRelevance(
      relevanceProfile,
      candidate.titleRaw,
      candidate.descriptionRaw,
      negativeKeywords
    );
    if (!verdict.relevant) {
      // Record why an ENRICHED candidate was dropped at import time so debug
      // output explains it instead of silently leaving it ENRICHED.
      await rejectCandidate(candidate.id, `Relevance: ${verdict.reason ?? "not relevant"}`);
      continue;
    }
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

/**
 * Budget-aware sweep used after the per-category import pass. The per-category
 * importer can leave relevant, media-backed candidates unconverted because broad
 * queries overlap and re-`upsert` (re-categorize) the same supplier products
 * across categories. This converts any remaining ENRICHED, relevant candidates
 * up to `remaining`, so a single generation run reliably reaches its target.
 */
export async function importRelevantEnrichedCandidates(options: {
  storeSlug: string;
  remaining: number;
  negativeKeywords?: string[];
  providerKeys?: Array<ProviderKey | string>;
}): Promise<{ imported: number; slugs: string[] }> {
  const result = { imported: 0, slugs: [] as string[] };
  if (options.remaining <= 0) return result;

  const store = await prisma.store.findUnique({ where: { slug: options.storeSlug } });
  if (!store) throw new Error(`Unknown store: ${options.storeSlug}`);

  const providerKeys = options.providerKeys ?? defaultProviderKeys();
  const negativeKeywords = (options.negativeKeywords ?? [])
    .map((keyword) => keyword.toLowerCase().trim())
    .filter(Boolean);
  const relevanceProfile = await buildStoreRelevanceProfile(store, negativeKeywords);

  const candidates = await prisma.productCandidate.findMany({
    where: {
      storeId: store.id,
      providerKey: { in: providerKeys as string[] },
      status: "ENRICHED",
      importedProductId: null,
    },
    orderBy: { score: "desc" },
  });

  for (const candidate of candidates) {
    if (result.imported >= options.remaining) break;
    const verdict = evaluateRelevance(
      relevanceProfile,
      candidate.titleRaw,
      candidate.descriptionRaw,
      negativeKeywords
    );
    if (!verdict.relevant) {
      await rejectCandidate(candidate.id, `Relevance: ${verdict.reason ?? "not relevant"}`);
      continue;
    }
    try {
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
    } catch {
      // A single candidate failure must never abort the sweep.
    }
  }

  return result;
}

function defaultProviderKeys(): Array<ProviderKey | string> {
  const configured = process.env.CATALOG_IMPORT_PROVIDER_KEYS?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (configured && configured.length > 0) return configured;
  return process.env.CJ_ENABLED === "true" ? ["cj"] : ["mock"];
}

function uniqueQueries(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

