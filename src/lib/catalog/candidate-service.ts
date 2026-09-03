import { prisma } from "@/lib/db";
import { buildImportedProductContent } from "@/lib/catalog/build-product-content";
import {
  CANDIDATE_IMPORT_CLAIM_STATUS,
  executeAtomicCandidateImport,
} from "@/lib/catalog/candidate-import-transaction";
import { ingestRequiredCandidateMedia } from "@/lib/catalog/candidate-media-ingestion";
import {
  CANDIDATE_MEDIA_STAGING_STATUS,
  assertCandidateApprovalCasResult,
  candidateSummaryDelta,
  requireVerifiedStoredPrimaryImage,
  selectVerifiedStoredCandidateMedia,
  selectVerifiedStoredCandidateImages,
  stageCandidateEvaluationStatus,
} from "@/lib/catalog/candidate-media-state";
import {
  getMediaStorageSafetyReport,
  isStoredMediaUrlUsable,
} from "@/lib/storage/media-storage-safety";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import {
  convertCurrency,
  normalizeImportedPrice,
} from "@/lib/pricing/normalize-price";
import { parseJsonObject, parseSpecs } from "@/lib/utils/json";
import {
  evaluateCandidateQuality,
  qualityGateManualReviewTerms,
} from "@/lib/catalog/quality-gates";
import {
  runProviderSearchWithPolicy,
  type ProviderQueryAttempt,
} from "@/lib/catalog/provider-search-policy";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import type {
  ProductSearchResult,
  ProviderKey,
  SupplierProductVariant,
} from "@/lib/suppliers/providers/types";
import {
  evaluateCandidateV1,
  parseNicheIntentV1,
  resolveNicheIntentV1,
  type NicheIntentV1,
} from "@/lib/generator-v3";
import { scoreCandidate } from "@/lib/suppliers/catalog/score-candidate";
import {
  aggregateProductStockStatus,
  normalizeSupplierStockStatus,
} from "@/lib/catalog/stock-status";
import { toJson } from "@/lib/utils/json";
import type { Prisma } from "@prisma/client";

export interface DiscoverProductsForStoreInput {
  storeId: string;
  providerKey: ProviderKey | string;
  query: string;
  categoryId?: string;
  limit?: number;
  intent?: NicheIntentV1;
}

export interface DiscoverProductsForStoreResult {
  discovered: number;
  enriched: number;
  rejected: number;
  errors: string[];
  providerAttempts: ProviderQueryAttempt[];
}

export async function discoverProductsForStore(
  input: DiscoverProductsForStoreInput
): Promise<DiscoverProductsForStoreResult> {
  const store = await prisma.store.findUnique({ where: { id: input.storeId } });
  if (!store) throw new Error(`Unknown store: ${input.storeId}`);

  const provider = getCommerceProvider(input.providerKey);
  const intent = input.intent ?? resolveNicheIntentV1({ niche: store.niche });
  const providerRecord = await prisma.supplierProvider.findUnique({ where: { key: provider.key } });
  const settings = await prisma.storeSupplierSettings.findUnique({
    where: { storeId_providerKey: { storeId: store.id, providerKey: provider.key } },
  });

  const search = await runProviderSearchWithPolicy({
    providerKey: provider.key,
    query: input.query,
    search: () =>
      provider.searchProducts({
        query: input.query,
        storeId: store.id,
        categoryId: input.categoryId,
        locale: store.locale,
        currency: store.currency,
        limit: input.limit ?? 12,
      }),
  });
  const results = search.results;

  const existingProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    select: { title: true },
    take: 500,
  });

  const summary: DiscoverProductsForStoreResult = {
    discovered: results.length,
    enriched: 0,
    rejected: 0,
    errors: [],
    providerAttempts: search.attempts,
  };

  for (const result of results) {
    try {
      const detailedResult = await getDetailedResult(provider, result, summary);
      const candidate = await upsertCandidateFromResult({
        storeId: store.id,
        categoryId: input.categoryId,
        providerKey: provider.key,
        result: detailedResult,
        providerReliability: providerRecord?.reliabilityScore ?? 0.75,
        existingTitles: existingProducts.map((product) => product.title),
        minScore: settings?.minProductScore ?? 50,
        minMarginPercent: settings?.minMarginPercent ?? 25,
        intent,
      });

      if (candidate.status === CANDIDATE_MEDIA_STAGING_STATUS) {
        const mediaResult = await ingestRequiredCandidateMedia({
          candidateId: candidate.id,
          providerKey: provider.key,
          externalId: detailedResult.externalId,
          title: detailedResult.title,
          media: detailedResult.media,
        });
        applyCandidateStatusToSummary(summary, mediaResult.finalStatus);
        if (
          mediaResult.diagnostics.length > 0 ||
          !mediaResult.mediaReady ||
          !mediaResult.transitionApplied
        ) {
          summary.errors.push(
            `Media enrichment ${provider.key}/${detailedResult.externalId}: ${
              [mediaResult.rejectionReason, ...mediaResult.diagnostics]
                .filter(Boolean)
                .join("; ")
            }`
          );
        }
      } else {
        applyCandidateStatusToSummary(summary, candidate.status);
      }
    } catch (error) {
      summary.errors.push(error instanceof Error ? error.message : "Unknown candidate error");
    }
  }

  return summary;
}

async function getDetailedResult(
  provider: ReturnType<typeof getCommerceProvider>,
  result: ProductSearchResult,
  summary: DiscoverProductsForStoreResult
): Promise<ProductSearchResult> {
  if (!provider.capabilities.details) return result;
  try {
    const details = await provider.getProductDetails({
      externalId: result.externalId,
      sourceUrl: result.sourceUrl,
    });
    return {
      ...result,
      ...details,
      media: details.media.length > 0 ? details.media : result.media,
      variants: details.variants.length > 0 ? details.variants : result.variants,
      signals: { ...result.signals, ...details.signals },
      risk: { ...result.risk, ...details.risk },
      rawData: details.rawData ?? result.rawData,
    };
  } catch (error) {
    summary.errors.push(
      `Details fetch failed for ${provider.key}/${result.externalId}: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
    return result;
  }
}

export async function upsertCandidateFromResult(input: {
  storeId: string;
  categoryId?: string;
  providerKey: ProviderKey;
  result: ProductSearchResult;
  providerReliability: number;
  existingTitles?: string[];
  minScore?: number;
  minMarginPercent?: number;
  intent?: NicheIntentV1;
}) {
  const scored = scoreCandidate({
    result: input.result,
    providerReliability: input.providerReliability,
    existingTitles: input.existingTitles,
  });
  const quality = evaluateCandidateQuality({
    title: input.result.title,
    description: input.result.description,
    sourceUrl: input.result.sourceUrl,
    externalId: input.result.externalId,
    shippingDaysMin: input.result.shippingDaysMin,
    shippingDaysMax: input.result.shippingDaysMax,
    mediaCount: input.result.media.filter((media) => media.mediaType === "IMAGE").length,
    score: scored.score,
    minScore: input.minScore,
    marginPercent: scored.marginPercent,
    minMarginPercent: input.minMarginPercent,
    manualReviewTerms: qualityGateManualReviewTerms(input.intent),
  });
  const relevance = input.intent
    ? evaluateCandidateV1(input.intent, {
        title: input.result.title,
        description: input.result.description,
        providerCategoryPath: providerCategoryPathFromResult(input.result),
        specs: input.result.specs,
        variants: input.result.variants,
        providerKey: input.providerKey,
        externalId: input.result.externalId,
        sourceUrl: input.result.sourceUrl,
      })
    : null;
  const relevanceRejected = relevance ? relevance.relevance.state !== "PASS" : false;
  const evaluatedStatus = relevanceRejected ? "REJECTED" : quality.status;
  const status = stageCandidateEvaluationStatus(evaluatedStatus);
  const rejectionReasons = [
    ...(relevanceRejected
      ? [`Relevance: ${relevance?.relevance.reasonCodes.join(",") || "RELEVANCE_NOT_PASS"}`]
      : []),
    ...quality.reasons,
  ];
  const rejectionReason =
    status === "REJECTED" ? rejectionReasons.join(" ") : null;

  return prisma.productCandidate.upsert({
    where: {
      storeId_providerKey_externalId: {
        storeId: input.storeId,
        providerKey: input.providerKey,
        externalId: input.result.externalId,
      },
    },
    update: {
      // Stable first assignment: repeated query hits for the same provider ID
      // must never move a candidate to whichever category happened to run last.
      sourceUrl: input.result.sourceUrl,
      affiliateUrl: input.result.affiliateUrl,
      titleRaw: input.result.title,
      descriptionRaw: input.result.description,
      brandRaw: input.result.brand,
      priceRaw: input.result.price,
      currencyRaw: input.result.currency,
      supplierCost: input.result.supplierCost,
      shippingCost: input.result.shippingCost,
      marginPercent: scored.marginPercent,
      stockStatus: input.result.stockStatus,
      shippingDaysMin: input.result.shippingDaysMin,
      shippingDaysMax: input.result.shippingDaysMax,
      countryOfOrigin: input.result.countryOfOrigin,
      gtin: input.result.gtin,
      skuCandidate: input.result.sku,
      specsJson: toJson(input.result.specs),
      variantsJson: toJson(input.result.variants),
      mediaJson: toJson(input.result.media),
      signalsJson: toJson({
        ...scored.signals,
        candidateEvaluationV1: relevance,
        ...(input.intent ? { nicheIntentV1: input.intent } : {}),
        raw: input.result.rawData,
      }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status,
      rejectionReason,
      lastSeenAt: new Date(),
    },
    create: {
      storeId: input.storeId,
      categoryId: input.categoryId,
      providerKey: input.providerKey,
      externalId: input.result.externalId,
      sourceUrl: input.result.sourceUrl,
      affiliateUrl: input.result.affiliateUrl,
      titleRaw: input.result.title,
      descriptionRaw: input.result.description,
      brandRaw: input.result.brand,
      priceRaw: input.result.price,
      currencyRaw: input.result.currency,
      supplierCost: input.result.supplierCost,
      shippingCost: input.result.shippingCost,
      marginPercent: scored.marginPercent,
      stockStatus: input.result.stockStatus,
      shippingDaysMin: input.result.shippingDaysMin,
      shippingDaysMax: input.result.shippingDaysMax,
      countryOfOrigin: input.result.countryOfOrigin,
      gtin: input.result.gtin,
      skuCandidate: input.result.sku,
      specsJson: toJson(input.result.specs),
      variantsJson: toJson(input.result.variants),
      mediaJson: toJson(input.result.media),
      signalsJson: toJson({
        ...scored.signals,
        candidateEvaluationV1: relevance,
        ...(input.intent ? { nicheIntentV1: input.intent } : {}),
        raw: input.result.rawData,
      }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status,
      rejectionReason,
    },
  });
}

function providerCategoryPathFromResult(result: ProductSearchResult): string | undefined {
  if (!result.rawData || typeof result.rawData !== "object") return undefined;
  const raw = result.rawData as Record<string, unknown>;
  for (const key of ["categoryPath", "categoryName", "category", "productType"]) {
    if (typeof raw[key] === "string" && raw[key].trim()) return raw[key].trim();
  }
  return undefined;
}

function applyCandidateStatusToSummary(
  summary: Pick<DiscoverProductsForStoreResult, "enriched" | "rejected">,
  status: string | null
): void {
  const delta = candidateSummaryDelta(status);
  summary.enriched += delta.enriched;
  summary.rejected += delta.rejected;
}

export async function approveCandidate(candidateId: string): Promise<void> {
  const transition = await prisma.productCandidate.updateMany({
    where: { id: candidateId, status: "ENRICHED" },
    data: { status: "APPROVED", rejectionReason: null },
  });
  if (transition.count === 1) return;

  const current = await prisma.productCandidate.findUnique({
    where: { id: candidateId },
    select: { status: true },
  });
  assertCandidateApprovalCasResult(
    candidateId,
    transition.count,
    current?.status ?? null
  );
}

export async function rejectCandidate(candidateId: string, reason: string): Promise<void> {
  await prisma.productCandidate.update({
    where: { id: candidateId },
    data: { status: "REJECTED", rejectionReason: reason || "Rejected by admin." },
  });
}

export async function importApprovedCandidates(storeId: string, limit = 20): Promise<{ imported: number; errors: string[] }> {
  const candidates = await prisma.productCandidate.findMany({
    where: { storeId, status: "APPROVED" },
    orderBy: { score: "desc" },
    take: limit,
  });
  const result = { imported: 0, errors: [] as string[] };
  for (const candidate of candidates) {
    try {
      await importCandidateToProduct(candidate.id);
      result.imported += 1;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown import error");
    }
  }
  return result;
}

export async function importCandidateToProduct(
  candidateId: string,
  pinnedIntent?: NicheIntentV1
): Promise<string> {
  const candidate = await prisma.productCandidate.findUnique({
    where: { id: candidateId },
    include: { store: true, category: true, mediaAssets: true },
  });
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  if (candidate.status === "IMPORTED" || candidate.importedProductId) {
    if (candidate.status !== "IMPORTED" || !candidate.importedProductId) {
      throw new Error(
        `Candidate ${candidate.id} has an inconsistent imported state.`
      );
    }
    const importedProduct = await prisma.product.findUnique({
      where: { id: candidate.importedProductId },
      select: {
        id: true,
        storeId: true,
        providerKey: true,
        externalId: true,
      },
    });
    assertImportedProductMatchesCandidate(candidate, importedProduct);
    return candidate.importedProductId;
  }
  if (candidate.status !== "APPROVED") {
    throw new Error(`Candidate ${candidate.id} must be approved before import.`);
  }

  const initialCandidateEvaluation = parseCandidateEvaluation(candidate.signalsJson) as
    | { relevance?: { state?: string } }
    | null;
  if (!initialCandidateEvaluation || initialCandidateEvaluation.relevance?.state !== "PASS") {
    throw new Error(
      `Candidate ${candidate.id} is missing a PASS V3 relevance evaluation.`
    );
  }

  const category =
    candidate.category ??
    (await prisma.category.findFirst({
      where: { storeId: candidate.storeId },
      orderBy: { sortOrder: "asc" },
    }));
  if (!category) throw new Error("Store has no category for imported product.");

  const variants = parseSupplierVariants(candidate.variantsJson);
  const defaultVariant = variants.find((variant) => variant.stockStatus !== "OUT_OF_STOCK") ?? variants[0];
  const storage = getStorageProvider();
  const safety = getMediaStorageSafetyReport();
  const usabilityProvider = safety.unsafe ? "vercel-blob" : storage.name;
  const verifiedStoredImages = selectVerifiedStoredCandidateImages(
    candidate.mediaAssets,
    (storageUrl) => isStoredMediaUrlUsable(storageUrl, usabilityProvider)
  );
  requireVerifiedStoredPrimaryImage(candidate.id, verifiedStoredImages);
  const supplierCurrency = candidate.currencyRaw ?? candidate.store.currency;
  const norm = normalizeImportedPrice({
    supplierCost: candidate.supplierCost ?? defaultVariant?.supplierCost ?? null,
    supplierPrice: candidate.priceRaw ?? defaultVariant?.price ?? null,
    shippingCost: candidate.shippingCost ?? defaultVariant?.shippingCost ?? null,
    supplierCurrency,
    storeCurrency: candidate.store.currency,
    targetMargin: 0.35,
  });
  const { price, cost, shippingCost, marginPercent } = norm;

  // Build store-specific premium copy from supplier facts (Section B). Keeps the
  // raw supplier text out of the storefront while preserving it for audit below.
  const content = await buildImportedProductContent({
    storeName: candidate.store.name,
    niche: candidate.store.niche,
    audience: candidate.store.audience,
    brandVoice: candidate.store.brandVoice,
    categoryName: category.name,
    rawTitle: candidate.titleEnhanced ?? candidate.titleRaw,
    rawDescription: candidate.descriptionRaw,
    brand: candidate.brandRaw,
    specs: parseSpecs(candidate.specsJson),
    variantOptionSummaries: variants
      .map((variant) => variant.optionSummary ?? variant.title ?? "")
      .filter(Boolean),
    shippingDaysMin: candidate.shippingDaysMin ?? candidate.store.defaultShippingDaysMin,
    shippingDaysMax: candidate.shippingDaysMax ?? candidate.store.defaultShippingDaysMax,
    countryOfOrigin: candidate.countryOfOrigin,
  });
  const risk = parseJsonObject(candidate.riskJson);
  const evaluationIntent =
    pinnedIntent ??
    persistedIntentFromSignals(candidate.signalsJson) ??
    resolveNicheIntentV1({ niche: candidate.store.niche });
  const evaluateFinalCandidate = (usableStoredMediaCount: number) =>
    evaluateCandidateV1(evaluationIntent, {
      title: candidate.titleRaw,
      description: candidate.descriptionRaw,
      specs: parseSpecs(candidate.specsJson),
      variants,
      providerKey: candidate.providerKey,
      externalId: candidate.externalId,
      sourceUrl: candidate.sourceUrl,
      usableStoredMediaCount,
      variantIdentityReady:
        variants.length === 0 ||
        variants.every((variant) => Boolean(variant.externalVariantId || variant.sku)),
      price,
      marginPercent,
      shippingDaysMax: candidate.shippingDaysMax,
      riskVeto: Array.isArray(risk.restrictedTerms) && risk.restrictedTerms.length > 0,
      groundedContentReady:
        content.factScore >= 1 &&
        !content.guardrailFlags.some((flag) => flag.startsWith("ERROR:")),
    });
  const candidateEvaluationV1 = evaluateFinalCandidate(
    verifiedStoredImages.length
  );
  assertFinalCandidateGate(candidate.id, candidateEvaluationV1);

  const title = content.title;
  const sku = candidate.skuCandidate ?? `${candidate.providerKey.toUpperCase()}-${candidate.externalId.slice(-10)}`;
  const imported = await executeAtomicCandidateImport<Prisma.TransactionClient>({
    candidateId: candidate.id,
    supplierIdentityLabel: `${candidate.storeId}/${candidate.providerKey}/${candidate.externalId}`,
    withTransaction: (operation) =>
      withSerializableImportTransaction(operation),
    claimCandidate: async (transaction) => {
      const claim = await transaction.productCandidate.updateMany({
        where: {
          id: candidate.id,
          storeId: candidate.storeId,
          providerKey: candidate.providerKey,
          externalId: candidate.externalId,
          status: "APPROVED",
          importedProductId: null,
          updatedAt: candidate.updatedAt,
        },
        data: { status: CANDIDATE_IMPORT_CLAIM_STATUS },
      });
      return claim.count;
    },
    readCandidateState: (transaction) =>
      transaction.productCandidate.findUnique({
        where: { id: candidate.id },
        select: { status: true, importedProductId: true },
      }),
    assertImportedProductIdentity: async (transaction, productId) => {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          storeId: true,
          providerKey: true,
          externalId: true,
        },
      });
      assertImportedProductMatchesCandidate(candidate, product);
    },
    findSupplierIdentityProductIds: async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          storeId: candidate.storeId,
          OR: [
            {
              providerKey: candidate.providerKey,
              externalId: candidate.externalId,
            },
            {
              supplierSource: candidate.providerKey,
              supplierProductId: candidate.externalId,
            },
          ],
        },
        select: { id: true },
        take: 3,
      });
      return products.map((product) => product.id);
    },
    createProductGraph: async (transaction) => {
      // Re-read and verify media after the claim. Media rows are separate from
      // ProductCandidate.updatedAt, so the authoritative image gate belongs in
      // the same transaction that creates the product graph.
      const currentCandidateAssets = await transaction.productMediaAsset.findMany({
        where: { candidateId: candidate.id },
      });
      const storedAssets = selectVerifiedStoredCandidateMedia(
        currentCandidateAssets,
        (storageUrl) => isStoredMediaUrlUsable(storageUrl, usabilityProvider)
      );
      const currentStoredImages = selectVerifiedStoredCandidateImages(
        currentCandidateAssets,
        (storageUrl) => isStoredMediaUrlUsable(storageUrl, usabilityProvider)
      );
      const storedPrimary = requireVerifiedStoredPrimaryImage(
        candidate.id,
        currentStoredImages
      );
      const transactionEvaluation = evaluateFinalCandidate(
        currentStoredImages.length
      );
      assertFinalCandidateGate(candidate.id, transactionEvaluation);

      const slug = await uniqueProductSlug(
        transaction,
        candidate.storeId,
        slugify(title)
      );
      const product = await transaction.product.create({
        data: {
          storeId: candidate.storeId,
          categoryId: category.id,
          slug,
          title,
          subtitle: content.subtitle,
          description: content.description,
          shortDescription: content.shortDescription,
          brand: candidate.brandRaw ?? candidate.store.name,
          sku,
          gtin: candidate.gtin,
          imageUrl: storedPrimary.storageUrl,
          imageAlt: storedPrimary.alt || content.imageAlt,
          price,
          currency: norm.currency,
          cost,
          shippingCost,
          marginPercent,
          stockStatus: normalizeProductStockStatus(candidate.stockStatus, variants),
          supplierName: candidate.providerKey,
          supplierProductId: candidate.externalId,
          supplierSource: candidate.providerKey,
          supplierUrl: candidate.sourceUrl,
          supplierSearchQuery: title,
          providerKey: candidate.providerKey,
          externalId: candidate.externalId,
          sourceUrl: candidate.sourceUrl,
          affiliateUrl: candidate.affiliateUrl,
          fulfillmentMode: fulfillmentModeForCandidate(candidate.providerKey),
          lastSupplierSyncAt: new Date(),
          supplierDataJson: toJson({
            candidateId: candidate.id,
            signals: candidate.signalsJson,
            risk: candidate.riskJson,
            candidateEvaluationV1: transactionEvaluation,
            nicheIntentV1: evaluationIntent,
            // Raw supplier copy preserved for audit; never shown on the storefront.
            rawTitle: candidate.titleRaw,
            rawDescription: candidate.descriptionRaw,
            supplierCurrency,
            currencyConverted: norm.converted,
            contentFactScore: content.factScore,
            guardrailFlags: content.guardrailFlags,
          }),
          mediaStatus:
            currentStoredImages.length >= 2 ? "OK" : "NEEDS_ENHANCEMENT",
          qualityStatus: content.qualityStatus,
          shippingDaysMin:
            candidate.shippingDaysMin ?? candidate.store.defaultShippingDaysMin,
          shippingDaysMax:
            candidate.shippingDaysMax ?? candidate.store.defaultShippingDaysMax,
          countryOfOrigin: candidate.countryOfOrigin,
          specs: toJson(content.specs),
          useCases: toJson(content.useCases),
          faq: toJson(content.faq),
          pros: toJson(content.pros),
          cons: toJson(content.cons),
          seoTitle: content.seoTitle,
          seoDescription: content.seoDescription,
          productScore: candidate.score,
          isPublished: false,
          noindex: content.noindex,
        },
      });

      if (variants.length > 0) {
        await transaction.productVariant.createMany({
          data: variants.map((variant, index) => {
            const variantNorm =
              variant.supplierCost != null || variant.price != null
                ? normalizeImportedPrice({
                    supplierCost: variant.supplierCost ?? null,
                    supplierPrice: variant.price ?? null,
                    shippingCost:
                      variant.shippingCost ?? candidate.shippingCost ?? null,
                    supplierCurrency,
                    storeCurrency: candidate.store.currency,
                    targetMargin: 0.35,
                  })
                : null;
            return {
              productId: product.id,
              providerKey: candidate.providerKey,
              externalId: candidate.externalId,
              externalVariantId: variant.externalVariantId,
              sku: variant.sku,
              title:
                variant.title ??
                variant.optionSummary ??
                `${title} option ${index + 1}`,
              optionSummary:
                variant.optionSummary ?? variant.title ?? `Option ${index + 1}`,
              optionsJson: toJson(normalizeVariantOptions(variant.options)),
              price: variantNorm?.price ?? null,
              cost:
                variantNorm?.cost ??
                convertCurrency(
                  variant.supplierCost,
                  supplierCurrency,
                  candidate.store.currency
                ),
              shippingCost: convertCurrency(
                variant.shippingCost,
                supplierCurrency,
                candidate.store.currency
              ),
              stockStatus: normalizeSupplierStockStatus(
                variant.stockStatus ?? "UNKNOWN"
              ),
              inventoryQuantity: variant.inventoryQuantity,
              imageUrl: variant.imageUrl,
              sortOrder: index,
              isDefault:
                defaultVariant === variant || (!defaultVariant && index === 0),
              rawDataJson: toJson(variant.rawData ?? variant),
            };
          }),
        });
      }

      if (storedAssets.length > 0) {
        await transaction.productMediaAsset.createMany({
          data: storedAssets.map((asset) => ({
            productId: product.id,
            providerKey: asset.providerKey,
            externalId: asset.externalId,
            mediaType: asset.mediaType,
            sourceUrl: asset.sourceUrl,
            storageUrl: asset.storageUrl,
            storageKey: asset.storageKey,
            thumbnailUrl: asset.thumbnailUrl,
            alt: asset.alt,
            sortOrder: asset.sortOrder,
            isPrimary: asset.isPrimary,
            width: asset.width,
            height: asset.height,
            contentType: asset.contentType,
            contentHash: asset.contentHash,
            fileSize: asset.fileSize,
            licenseStatus: asset.licenseStatus,
            ingestionStatus: asset.ingestionStatus,
            enhancementStatus: asset.enhancementStatus,
          })),
        });
      }

      await transaction.productImage.createMany({
        data: currentStoredImages.map((asset, index) => ({
          productId: product.id,
          url: requireStoredAssetUrl(candidate.id, asset.storageUrl),
          alt: asset.alt || content.imageAlt,
          sortOrder: index,
          isPrimary: index === 0,
          sourceUrl: asset.sourceUrl,
          storageKey: asset.storageKey,
          providerKey: asset.providerKey,
          externalId: asset.externalId,
          contentHash: asset.contentHash,
          width: asset.width,
          height: asset.height,
          contentType: asset.contentType,
          ingestionStatus: asset.ingestionStatus,
        })),
      });

      return product.id;
    },
    finalizeCandidate: async (transaction, productId) => {
      const finalized = await transaction.productCandidate.updateMany({
        where: {
          id: candidate.id,
          status: CANDIDATE_IMPORT_CLAIM_STATUS,
          importedProductId: null,
        },
        data: { status: "IMPORTED", importedProductId: productId },
      });
      return finalized.count;
    },
  });

  return imported.productId;
}

function persistedIntentFromSignals(raw: string | null | undefined): NicheIntentV1 | null {
  return parseNicheIntentV1(parseJsonObject(raw).nicheIntentV1);
}

function parseCandidateEvaluation(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed.candidateEvaluationV1 ?? null;
  } catch {
    return null;
  }
}

function parseSupplierVariants(raw: string): SupplierProductVariant[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((entry): entry is SupplierProductVariant => Boolean(entry) && typeof entry === "object")
          .map((entry) => ({
            ...entry,
            options: normalizeVariantOptions(entry.options),
          }))
      : [];
  } catch {
    return [];
  }
}

function normalizeProductStockStatus(
  candidateStatus: string,
  variants: SupplierProductVariant[]
) {
  return aggregateProductStockStatus(
    candidateStatus,
    variants.map((variant) => variant.stockStatus)
  );
}

function normalizeVariantOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, optionValue]) => [key, optionValue])
  );
}

function fulfillmentModeForCandidate(providerKey: string): "AFFILIATE" | "MANUAL" | "MOCK" | "DROPSHIP" {
  if (providerKey === "mock") return "MOCK";
  if (providerKey === "cj" || providerKey === "doba") return "DROPSHIP";
  if (providerKey === "ebay" || providerKey === "amazon" || providerKey === "aliexpress" || providerKey === "temu") return "AFFILIATE";
  return "MANUAL";
}

function assertFinalCandidateGate(
  candidateId: string,
  evaluation: ReturnType<typeof evaluateCandidateV1>
): void {
  if (
    evaluation.relevance.state === "PASS" &&
    evaluation.previewVisibility.state === "PASS"
  ) {
    return;
  }
  throw new Error(
    `Candidate ${candidateId} failed the final V3 preview gate: ${[
      ...evaluation.relevance.reasonCodes,
      ...evaluation.previewVisibility.reasonCodes,
    ].join(",") || "PREVIEW_HARD_GATE_FAILED"}`
  );
}

function assertImportedProductMatchesCandidate(
  candidate: {
    id: string;
    storeId: string;
    providerKey: string;
    externalId: string;
    importedProductId: string | null;
  },
  product: {
    id: string;
    storeId: string;
    providerKey: string | null;
    externalId: string | null;
  } | null
): void {
  if (
    !product ||
    product.id !== candidate.importedProductId ||
    product.storeId !== candidate.storeId ||
    product.providerKey !== candidate.providerKey ||
    product.externalId !== candidate.externalId
  ) {
    throw new Error(
      `Candidate ${candidate.id} imported-product identity is missing or inconsistent.`
    );
  }
}

function requireStoredAssetUrl(
  candidateId: string,
  storageUrl: string | null
): string {
  if (!storageUrl) {
    throw new Error(
      `Candidate ${candidateId} contains verified media without a stored URL.`
    );
  }
  return storageUrl;
}

async function withSerializableImportTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (!isSerializableWriteConflict(error) || attempt === 3) throw error;
    }
  }
  throw new Error("Candidate import transaction retry budget exhausted.");
}

function isSerializableWriteConflict(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

async function uniqueProductSlug(
  transaction: Prisma.TransactionClient,
  storeId: string,
  baseSlug: string
): Promise<string> {
  const base = baseSlug || "product";
  let slug = base.slice(0, 60);
  let suffix = 2;
  while (
    await transaction.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
    })
  ) {
    slug = `${base.slice(0, 52)}-${suffix++}`;
  }
  return slug;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
