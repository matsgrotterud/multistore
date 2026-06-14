import { prisma } from "@/lib/db";
import { ingestProductMedia } from "@/lib/media/ingest-product-media";
import { syncProductGallery } from "@/lib/media/sync-product-gallery";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { evaluateCandidateQuality } from "@/lib/catalog/quality-gates";
import { getCommerceProvider, syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";
import type { ProductSearchResult, ProviderKey, SupplierMedia } from "@/lib/suppliers/providers/types";
import { scoreCandidate } from "@/lib/suppliers/catalog/score-candidate";
import { toJson } from "@/lib/utils/json";

export interface DiscoverProductsForStoreInput {
  storeId: string;
  providerKey: ProviderKey | string;
  query: string;
  categoryId?: string;
  limit?: number;
}

export interface DiscoverProductsForStoreResult {
  discovered: number;
  enriched: number;
  rejected: number;
  errors: string[];
}

export async function discoverProductsForStore(
  input: DiscoverProductsForStoreInput
): Promise<DiscoverProductsForStoreResult> {
  await syncProviderRegistryToDb();
  const store = await prisma.store.findUnique({ where: { id: input.storeId } });
  if (!store) throw new Error(`Unknown store: ${input.storeId}`);

  const provider = getCommerceProvider(input.providerKey);
  const providerRecord = await prisma.supplierProvider.findUnique({ where: { key: provider.key } });
  const settings = await prisma.storeSupplierSettings.findUnique({
    where: { storeId_providerKey: { storeId: store.id, providerKey: provider.key } },
  });

  const results = await provider.searchProducts({
    query: input.query,
    storeId: store.id,
    categoryId: input.categoryId,
    locale: store.locale,
    currency: store.currency,
    limit: input.limit ?? 12,
  });

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
  };

  for (const result of results) {
    try {
      const candidate = await upsertCandidateFromResult({
        storeId: store.id,
        categoryId: input.categoryId,
        providerKey: provider.key,
        result,
        providerReliability: providerRecord?.reliabilityScore ?? 0.75,
        existingTitles: existingProducts.map((product) => product.title),
        minScore: settings?.minProductScore ?? 50,
        minMarginPercent: settings?.minMarginPercent ?? 25,
      });

      if (candidate.status === "ENRICHED") summary.enriched += 1;
      if (candidate.status === "REJECTED") summary.rejected += 1;

      if (result.media.length > 0) {
        await ingestProductMedia({
          candidateId: candidate.id,
          providerKey: provider.key,
          externalId: result.externalId,
          title: result.title,
          media: result.media,
        });
      }
    } catch (error) {
      summary.errors.push(error instanceof Error ? error.message : "Unknown candidate error");
    }
  }

  return summary;
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
  });

  return prisma.productCandidate.upsert({
    where: {
      storeId_providerKey_externalId: {
        storeId: input.storeId,
        providerKey: input.providerKey,
        externalId: input.result.externalId,
      },
    },
    update: {
      categoryId: input.categoryId,
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
      signalsJson: toJson({ ...scored.signals, raw: input.result.rawData }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status: quality.status,
      rejectionReason: quality.reasons.join(" "),
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
      signalsJson: toJson({ ...scored.signals, raw: input.result.rawData }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status: quality.status,
      rejectionReason: quality.reasons.join(" "),
    },
  });
}

export async function approveCandidate(candidateId: string): Promise<void> {
  await prisma.productCandidate.update({
    where: { id: candidateId },
    data: { status: "APPROVED", rejectionReason: null },
  });
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

export async function importCandidateToProduct(candidateId: string): Promise<string> {
  const candidate = await prisma.productCandidate.findUnique({
    where: { id: candidateId },
    include: { store: true, category: true, mediaAssets: true },
  });
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  if (candidate.importedProductId) return candidate.importedProductId;
  if (candidate.status !== "APPROVED") {
    throw new Error(`Candidate ${candidate.id} must be approved before import.`);
  }

  const category =
    candidate.category ??
    (await prisma.category.findFirst({
      where: { storeId: candidate.storeId },
      orderBy: { sortOrder: "asc" },
    }));
  if (!category) throw new Error("Store has no category for imported product.");

  const media = parseSupplierMedia(candidate.mediaJson);
  const storedPrimary = candidate.mediaAssets.find(
    (asset) => asset.mediaType === "IMAGE" && asset.ingestionStatus === "STORED" && asset.storageUrl
  );
  const title = candidate.titleEnhanced ?? candidate.titleRaw;
  const description =
    candidate.descriptionEnhanced ??
    candidate.descriptionRaw ??
    `${title} selected for ${candidate.store.name}. Supplier details are pending editorial review.`;
  const price =
    candidate.priceRaw ??
    calculatePrice({
      supplierCost: candidate.supplierCost ?? 10,
      shippingCost: candidate.shippingCost ?? 0,
      targetMargin: 0.35,
    }).price;
  const cost = candidate.supplierCost ?? Math.round(price * 0.55 * 100) / 100;
  const shippingCost = candidate.shippingCost ?? 0;
  const marginPercent =
    candidate.marginPercent ?? Math.round(((price - cost - shippingCost) / price) * 1000) / 10;
  const slug = await uniqueProductSlug(candidate.storeId, slugify(title));
  const sku = candidate.skuCandidate ?? `${candidate.providerKey.toUpperCase()}-${candidate.externalId.slice(-10)}`;

  const product = await prisma.product.create({
    data: {
      storeId: candidate.storeId,
      categoryId: category.id,
      slug,
      title,
      subtitle: candidate.brandRaw ? `Supplier: ${candidate.brandRaw}` : "",
      description,
      shortDescription: description.slice(0, 160),
      brand: candidate.brandRaw ?? candidate.store.name,
      sku,
      gtin: candidate.gtin,
      imageUrl: storedPrimary?.storageUrl ?? media[0]?.url ?? `/api/placeholder?label=${encodeURIComponent(title)}`,
      imageAlt: storedPrimary?.alt ?? title,
      price,
      currency: candidate.currencyRaw ?? candidate.store.currency,
      cost,
      shippingCost,
      marginPercent,
      stockStatus: normalizeStockStatus(candidate.stockStatus),
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
      }),
      mediaStatus: storedPrimary ? "OK" : "PENDING",
      qualityStatus: "NEEDS_REVIEW",
      shippingDaysMin: candidate.shippingDaysMin ?? candidate.store.defaultShippingDaysMin,
      shippingDaysMax: candidate.shippingDaysMax ?? candidate.store.defaultShippingDaysMax,
      countryOfOrigin: candidate.countryOfOrigin,
      specs: candidate.specsJson,
      useCases: toJson([]),
      faq: toJson([]),
      pros: toJson([]),
      cons: toJson([]),
      seoTitle: `${title} | ${candidate.store.name}`,
      seoDescription: description.slice(0, 155),
      productScore: candidate.score,
      isPublished: false,
      noindex: true,
    },
  });

  const storedAssets = candidate.mediaAssets.filter((asset) => asset.ingestionStatus === "STORED");
  if (storedAssets.length > 0) {
    await prisma.productMediaAsset.createMany({
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
    await syncProductGallery(product.id);
  } else if (media.length > 0) {
    await ingestProductMedia({
      productId: product.id,
      providerKey: candidate.providerKey,
      externalId: candidate.externalId,
      title,
      media,
    });
  }

  await prisma.productCandidate.update({
    where: { id: candidate.id },
    data: { status: "IMPORTED", importedProductId: product.id },
  });

  return product.id;
}

function parseSupplierMedia(raw: string): SupplierMedia[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SupplierMedia[]) : [];
  } catch {
    return [];
  }
}

function normalizeStockStatus(value: string): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" {
  if (value === "LOW_STOCK" || value === "OUT_OF_STOCK" || value === "PREORDER") return value;
  return "IN_STOCK";
}

function fulfillmentModeForCandidate(providerKey: string): "AFFILIATE" | "MANUAL" | "MOCK" {
  if (providerKey === "mock") return "MOCK";
  if (providerKey === "ebay" || providerKey === "amazon" || providerKey === "aliexpress" || providerKey === "temu") return "AFFILIATE";
  return "MANUAL";
}

async function uniqueProductSlug(storeId: string, baseSlug: string): Promise<string> {
  const base = baseSlug || "product";
  let slug = base.slice(0, 60);
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { storeId_slug: { storeId, slug } } })) {
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
