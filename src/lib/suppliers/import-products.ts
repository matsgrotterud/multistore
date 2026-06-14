import { prisma } from "@/lib/db";
import { syncProductImages } from "@/lib/images/sync-product-images";
import { syncSupplierImagesForProduct } from "@/lib/suppliers/sync-supplier-images";
import type { ScrapedSupplierImage } from "@/lib/images/types";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { computeProductScore } from "@/lib/products/product-score";
import { mockSupplier } from "@/lib/suppliers/mock-supplier";
import type { SupplierAdapter } from "@/lib/suppliers/types";
import { toJson } from "@/lib/utils/json";

/**
 * Supplier import pipeline: search -> normalize -> price -> score -> upsert.
 *
 * This is how a store grows its catalog from any supplier without manual
 * data entry. Imported products land unpublished so a human (or the AI
 * guardrails) can review copy and compliance before they go live.
 *
 * Example:
 *   await importProductsForStore({
 *     storeSlug: "drones",
 *     categorySlug: "camera-drones",
 *     query: "drone camera",
 *   });
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
  const adapter = options.adapter ?? mockSupplier;

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

  const rawProducts = await adapter.searchProducts(options.query);
  const result: ImportResult = { imported: 0, skipped: 0, slugs: [] };

  for (const raw of rawProducts) {
    const normalized = adapter.normalizeProduct(raw);

    const existing = await prisma.product.findFirst({
      where: { storeId: store.id, supplierProductId: normalized.supplierProductId },
    });
    if (existing) {
      result.skipped += 1;
      continue;
    }

    const pricing = calculatePrice({
      supplierCost: normalized.cost,
      shippingCost: normalized.shippingCost,
      targetMargin: options.targetMargin ?? 0.35,
    });

    const slug = slugify(normalized.title);
    const score = computeProductScore({
      marginPercent: pricing.grossMarginPercent,
      shippingDaysMin: normalized.shippingDaysMin,
      shippingDaysMax: normalized.shippingDaysMax,
      supplierReliability: adapter.reliabilityScore,
      stockStatus: normalized.stockStatus,
      returnRiskRate: 0.04,
      content: {
        descriptionLength: normalized.description.length,
        prosCount: 0,
        consCount: 0,
        specsCount: normalized.specs.length,
        faqCount: 0,
        useCasesCount: normalized.keywords.length,
        hasImageAlt: true,
      },
    });

    const sku = `${store.slug.toUpperCase().slice(0, 4)}-${normalized.supplierProductId}`;

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: category.id,
        slug,
        title: normalized.title,
        subtitle: "",
        description: normalized.description,
        shortDescription: normalized.description.slice(0, 160),
        brand: store.name,
        sku,
        imageUrl: normalized.imageUrl,
        imageAlt: normalized.title,
        price: pricing.price,
        currency: store.currency,
        cost: normalized.cost,
        shippingCost: normalized.shippingCost,
        marginPercent: pricing.grossMarginPercent,
        stockStatus: normalized.stockStatus,
        supplierName: normalized.supplierName,
        supplierProductId: normalized.supplierProductId,
        supplierSource: normalized.supplierSource ?? "aliexpress",
        supplierUrl: normalized.supplierUrl ?? null,
        supplierSearchQuery: normalized.supplierSearchQuery ?? normalized.title,
        shippingDaysMin: normalized.shippingDaysMin,
        shippingDaysMax: normalized.shippingDaysMax,
        countryOfOrigin: normalized.countryOfOrigin,
        specs: toJson(normalized.specs),
        useCases: toJson(normalized.keywords),
        seoTitle: `${normalized.title} | ${store.name}`,
        seoDescription: normalized.description.slice(0, 155),
        productScore: score,
        // Imported products require human/guardrail review before publishing.
        isPublished: false,
        noindex: true,
      },
    });

    const scrapedImages: ScrapedSupplierImage[] | undefined =
      normalized.galleryUrls?.map((url, index) => ({
        url,
        source: normalized.supplierSource ?? "aliexpress",
        supplierProductId: normalized.supplierProductId,
        sortOrder: index,
      }));

    if (scrapedImages?.length) {
      await syncProductImages(prisma, product.id, {
        title: normalized.title,
        slug,
        sku,
        niche: store.niche,
        brand: store.name,
        keywords: normalized.keywords,
        scrapedImages,
      });
    } else {
      await syncSupplierImagesForProduct(prisma, product.id);
    }

    result.imported += 1;
    result.slugs.push(slug);
  }

  return result;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
