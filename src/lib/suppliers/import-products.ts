import { prisma } from "@/lib/db";
import {
  approveCandidate,
  discoverProductsForStore,
  importCandidateToProduct,
} from "@/lib/catalog/candidate-service";
import type { SupplierAdapter } from "@/lib/suppliers/types";
import type { ProviderKey } from "@/lib/suppliers/providers/types";

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
  for (const candidate of candidates.filter((candidate) => isRelevantCandidate(candidate, queries, store.niche))) {
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

function isRelevantCandidate(
  candidate: { titleRaw: string; descriptionRaw: string | null },
  queries: string[],
  niche: string
): boolean {
  const haystack = `${candidate.titleRaw} ${candidate.descriptionRaw ?? ""}`.toLowerCase();
  if (isChildToyNiche(niche) && /\b(pet|cat|dog|bird|parrot|hamster|rabbit)\b/i.test(haystack)) {
    return false;
  }
  const bestMatch = Math.max(
    ...queries.map((query) => {
      const terms = importantTerms(query);
      if (terms.length === 0) return 0;
      return terms.filter((term) => haystack.includes(term)).length;
    })
  );
  return bestMatch >= 1;
}

function isChildToyNiche(value: string): boolean {
  return /(child|children|kid|kids|toy|toys|toddler)/i.test(value);
}

function importantTerms(value: string): string[] {
  const generic = new Set([
    "best",
    "seller",
    "sellers",
    "product",
    "products",
    "store",
    "safe",
    "material",
    "materials",
    "children",
    "child",
    "kids",
    "kid",
    "toy",
    "toys",
    "vegan",
    "for",
    "and",
    "the",
  ]);
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !generic.has(term));
}
