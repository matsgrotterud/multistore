import { resolveProductImages } from "@/lib/images/resolve-product-images";
import type {
  ImageEnhanceInput,
  ImageEnhanceResult,
  ProductCopyEnhanceInput,
  ProductCopyEnhanceResult,
} from "@/lib/images/types";

/**
 * Image enhancement pipeline (stub).
 *
 * Future flow:
 *   1. Scrape supplier gallery (Ali/Temu/eBay adapter)
 *   2. enhanceProductImages() → background removal, upscale, lifestyle composites
 *   3. generateSalesImages() → hero banners, comparison strips, social crops
 *   4. Persist to CDN + ProductImage rows
 *
 * Wire a real provider (Replicate, OpenAI Images, etc.) behind enhanceProductImages().
 */

export async function enhanceProductImages(
  input: ImageEnhanceInput
): Promise<ImageEnhanceResult> {
  // Mock: pass through scraped URLs or fall back to curated stock until AI is configured.
  const resolved = resolveProductImages({
    title: input.productTitle,
    slug: input.productTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    sku: input.productTitle.slice(0, 12),
    niche: input.niche,
    scrapedImages: input.sourceUrls.map((url, index) => ({
      url,
      source: "other",
      supplierProductId: `mock-${index}`,
      sortOrder: index,
    })),
  });

  return {
    urls: resolved.galleryUrls,
    provider: "mock",
    notes:
      "Mock enhancer: returns curated/scraped URLs unchanged. Connect REPLICATE_API_TOKEN or an image API for real upscaling and lifestyle generation.",
  };
}

export async function enhanceProductCopy(
  input: ProductCopyEnhanceInput
): Promise<ProductCopyEnhanceResult> {
  const seoTitle = `${input.title} | ${input.niche} — specs & honest buying guide`.slice(
    0,
    60
  );
  const seoDescription = input.description.slice(0, 155);

  return {
    title: input.title,
    subtitle: `Selected for ${input.audience}`,
    shortDescription: input.description.slice(0, 220),
    description: input.description,
    seoTitle,
    seoDescription,
    specs: input.specs,
    pros: [
      "Transparent shipping window published on the product page",
      "Specs verified against supplier listing",
      "Standard return policy applies",
    ],
    cons: [
      "Ships from a partner supplier — not local same-day dispatch",
      "Compare alternatives in our buying guides before purchasing",
    ],
  };
}
