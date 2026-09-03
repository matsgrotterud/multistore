import { prisma } from "@/lib/db";
import {
  discoverProductsForStore,
  importCandidateToProduct,
} from "@/lib/catalog/candidate-service";
import {
  evaluateCandidateV1,
  resolveCatalogProviderKeysV1,
  resolveNicheIntentV1,
  selectCatalogCandidatesV1,
  type CatalogSelectionPlanV1,
  type NicheIntentV1,
} from "@/lib/generator-v3";
import type { PricePositioning } from "@/lib/ai/types";
import type { SupplierAdapter } from "@/lib/suppliers/types";
import type { ProviderKey } from "@/lib/suppliers/providers/types";
import type { ProviderQueryAttempt } from "@/lib/catalog/provider-search-policy";
import { parseJsonObject, toJson } from "@/lib/utils/json";
import type { Prisma } from "@prisma/client";

/** Build the canonical intent from merchant input only. */
function buildStoreIntent(store: { niche: string }, negativeKeywords?: string[]): NicheIntentV1 {
  return resolveNicheIntentV1({ niche: store.niche, negativeKeywords });
}

/**
 * Compatibility wrapper for the old generator/admin flow.
 *
 * Supplier search writes ProductCandidate rows first. This wrapper ranks a
 * larger evidence-backed candidate pool, approves only the bounded selection,
 * and imports it as unpublished/noindex Product drafts.
 */

export interface ImportResult {
  imported: number;
  skipped: number;
  slugs: string[];
  discovered: number;
  rejected: number;
  providerKeys: string[];
  providerAttempts: ProviderQueryAttempt[];
  selectionPlan: CatalogSelectionPlanV1;
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
  intent?: NicheIntentV1;
  pricePositioning?: PricePositioning;
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

  const providerKeys = resolveCatalogProviderKeysV1({
    explicit: options.providerKeys?.map(String),
    configuredCsv: process.env.CATALOG_IMPORT_PROVIDER_KEYS,
  });
  const intent = options.intent ?? buildStoreIntent(store, options.negativeKeywords);
  const requestedCount = Math.max(1, Math.min(12, options.limit ?? 8));
  // Compare a larger bounded pool than the final 8/12 catalog. This is still
  // intentionally modest because CJ detail/media calls are paced and happen
  // synchronously in the current generator runtime.
  const discoveryTarget = Math.min(
    24,
    Math.max(requestedCount, Math.ceil(requestedCount * 1.5))
  );
  const queries = uniqueQueries([
    options.query,
    ...(options.queryVariants ?? []),
  ]);
  const discoveredByProvider = new Set<string>();
  let discovered = 0;
  let rejected = 0;
  const providerAttempts: ProviderQueryAttempt[] = [];

  for (const providerKey of providerKeys) {
    for (const query of queries) {
      const summary = await discoverProductsForStore({
        storeId: store.id,
        categoryId: category.id,
        providerKey,
        query,
        limit: discoveryTarget,
        intent,
      });
      if (summary.discovered > 0) discoveredByProvider.add(providerKey);
      discovered += summary.discovered;
      rejected += summary.rejected;
      providerAttempts.push(...summary.providerAttempts);
      const enrichedCount = await prisma.productCandidate.count({
        where: {
          storeId: store.id,
          categoryId: category.id,
          providerKey,
          status: "ENRICHED",
          importedProductId: null,
        },
      });
      if (enrichedCount >= discoveryTarget) break;
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
    orderBy: [{ score: "desc" }, { id: "asc" }],
    take: Math.min(64, Math.max(discoveryTarget * 2, 24)),
    include: { _count: { select: { mediaAssets: true } } },
  });

  const selectionPlan = buildSelectionPlan({
    candidates,
    intent,
    requestedCount,
    pricePositioning: options.pricePositioning ?? "value",
  });
  await persistSelectionEvidence(candidates, selectionPlan);

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    slugs: [],
    discovered,
    rejected,
    providerKeys: [...discoveredByProvider],
    providerAttempts,
    selectionPlan,
  };
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  for (const selected of selectionPlan.selected) {
    const candidate = byId.get(selected.candidateId);
    if (!candidate) continue;
    const productId = await importCandidateToProduct(candidate.id, intent);
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
  intent?: NicheIntentV1;
  pricePositioning?: PricePositioning;
}): Promise<{
  imported: number;
  slugs: string[];
  selectionPlan?: CatalogSelectionPlanV1;
}> {
  const result: {
    imported: number;
    slugs: string[];
    selectionPlan?: CatalogSelectionPlanV1;
  } = { imported: 0, slugs: [] };
  if (options.remaining <= 0) return result;

  const store = await prisma.store.findUnique({ where: { slug: options.storeSlug } });
  if (!store) throw new Error(`Unknown store: ${options.storeSlug}`);

  const providerKeys = resolveCatalogProviderKeysV1({
    explicit: options.providerKeys?.map(String),
    configuredCsv: process.env.CATALOG_IMPORT_PROVIDER_KEYS,
  });
  const intent = options.intent ?? buildStoreIntent(store, options.negativeKeywords);

  const candidates = await prisma.productCandidate.findMany({
    where: {
      storeId: store.id,
      providerKey: { in: providerKeys as string[] },
      status: "ENRICHED",
      importedProductId: null,
    },
    orderBy: [{ score: "desc" }, { id: "asc" }],
    take: Math.min(64, Math.max(options.remaining * 4, 24)),
    include: { _count: { select: { mediaAssets: true } } },
  });

  const selectionPlan = buildSelectionPlan({
    candidates,
    intent,
    requestedCount: options.remaining,
    pricePositioning: options.pricePositioning ?? "value",
  });
  result.selectionPlan = selectionPlan;
  await persistSelectionEvidence(candidates, selectionPlan);
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  for (const selected of selectionPlan.selected) {
    if (result.imported >= options.remaining) break;
    const candidate = byId.get(selected.candidateId);
    if (!candidate) continue;
    try {
      const productId = await importCandidateToProduct(candidate.id, intent);
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

type SelectionCandidateRecord = Prisma.ProductCandidateGetPayload<{
  include: { _count: { select: { mediaAssets: true } } };
}>;

function buildSelectionPlan(input: {
  candidates: SelectionCandidateRecord[];
  intent: NicheIntentV1;
  requestedCount: number;
  pricePositioning: PricePositioning;
}): CatalogSelectionPlanV1 {
  return selectCatalogCandidatesV1({
    requestedCount: input.requestedCount,
    pricePositioning: input.pricePositioning,
    classConcepts: input.intent.requiredClassConcepts,
    candidates: input.candidates.map((candidate) => {
      const evaluation = evaluateCandidateV1(input.intent, {
        title: candidate.titleRaw,
        description: candidate.descriptionRaw,
        providerKey: candidate.providerKey,
        externalId: candidate.externalId,
        sourceUrl: candidate.sourceUrl,
      });
      const risk = parseJsonObject(candidate.riskJson);
      return {
        id: candidate.id,
        providerKey: candidate.providerKey,
        externalId: candidate.externalId,
        title: candidate.titleRaw,
        // CJ currently exposes a supplier unit cost, not a comparable market
        // retail price. Rank affordability on that recorded cost and never
        // label the result as a market-wide "cheapest" claim.
        price: candidate.priceRaw ?? candidate.supplierCost,
        currency: candidate.currencyRaw?.toUpperCase() ?? null,
        shippingCost: candidate.shippingCost,
        marginPercent: candidate.marginPercent,
        shippingDaysMax: candidate.shippingDaysMax,
        stockStatus: candidate.stockStatus,
        score: candidate.score,
        mediaCount: candidate._count.mediaAssets,
        variantIdentityReady: variantIdentityReady(candidate.variantsJson),
        relevanceState: evaluation.relevance.state,
        manualReviewTerms: stringArray(risk.manualReviewTerms),
      };
    }),
  });
}

async function persistSelectionEvidence(
  candidates: SelectionCandidateRecord[],
  plan: CatalogSelectionPlanV1
): Promise<void> {
  const selectedById = new Map(
    plan.selected.map((entry) => [entry.candidateId, entry])
  );
  const rejectedById = new Map(
    plan.rejected.map((entry) => [entry.candidateId, entry])
  );

  await prisma.$transaction(async (transaction) => {
    for (const candidate of candidates) {
      const selected = selectedById.get(candidate.id);
      const rejected = rejectedById.get(candidate.id);
      const catalogSelectionV1 = selected
        ? { ...selected, disposition: "SELECTED" as const }
        : rejected
          ? {
              version: plan.version,
              candidateId: candidate.id,
              disposition: "REJECTED" as const,
              reasonCodes: rejected.reasonCodes,
            }
          : {
              version: plan.version,
              candidateId: candidate.id,
              disposition: "RESERVE" as const,
              reasonCodes: ["SELECTION_BUDGET_EXHAUSTED"],
            };
      // Persist selection evidence and approve selected rows in one transaction
      // against the exact snapshot that was ranked. The later atomic import
      // claims that approved row by its new updatedAt, closing both race windows.
      const transition = await transaction.productCandidate.updateMany({
        where: {
          id: candidate.id,
          status: "ENRICHED",
          importedProductId: null,
          updatedAt: candidate.updatedAt,
        },
        data: {
          signalsJson: toJson({
            ...parseJsonObject(candidate.signalsJson),
            catalogSelectionV1,
          }),
          ...(selected
            ? { status: "APPROVED", rejectionReason: null }
            : rejected
              ? {
                  status: "REJECTED",
                  rejectionReason: `Catalog selection: ${rejected.reasonCodes.join(",")}`,
                }
              : {}),
        },
      });
      if (selected && transition.count !== 1) {
        throw new Error(
          `Catalog selection approval CAS failed for candidate ${candidate.id}; no stale shortlist was approved.`
        );
      }
    }
  });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function variantIdentityReady(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return true;
    return parsed.every(
      (variant) =>
        variant &&
        typeof variant === "object" &&
        (typeof variant.externalVariantId === "string" ||
          typeof variant.sku === "string")
    );
  } catch {
    return false;
  }
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
