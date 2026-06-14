import {
  getAliExpressProductDetailApi,
  isAliExpressApiConfigured,
  searchAliExpressProductsApi,
} from "@/lib/suppliers/aliexpress/api-client";
import { aliExpressItemUrl } from "@/lib/suppliers/scrape/image-urls";
import { searchAliExpressProducts as searchAliExpressViaJina } from "@/lib/suppliers/scrape/aliexpress";

export interface SupplierImageSearchResult {
  listingUrl: string | null;
  imageUrls: string[];
  productId: string | null;
  provider: "aliexpress-api" | "jina-scrape";
}

/** Prefer official AliExpress API; fall back to Jina scrape when keys are missing. */
export async function findSupplierImages(
  query: string,
  options?: { listingUrl?: string | null; productId?: string | null }
): Promise<SupplierImageSearchResult> {
  if (isAliExpressApiConfigured()) {
    try {
      if (options?.productId) {
        const detail = await getAliExpressProductDetailApi(options.productId);
        if (detail && detail.galleryUrls.length > 0) {
          return {
            listingUrl: detail.productUrl,
            imageUrls: detail.galleryUrls.slice(0, 6),
            productId: detail.productId,
            provider: "aliexpress-api",
          };
        }
      }

      const results = await searchAliExpressProductsApi(query, 3);
      const best = results[0];
      if (best) {
        const detail = await getAliExpressProductDetailApi(best.productId);
        const gallery = detail?.galleryUrls.length ? detail.galleryUrls : best.galleryUrls;
        return {
          listingUrl: best.productUrl,
          imageUrls: gallery.slice(0, 6),
          productId: best.productId,
          provider: "aliexpress-api",
        };
      }
    } catch (error) {
      console.warn("[supplier-images] AliExpress API failed, falling back to scrape:", error);
    }
  }

  if (options?.listingUrl) {
    const scraped = await searchAliExpressViaJina(query);
    const fromListing = scraped.find((item) => item.listingUrl === options.listingUrl);
    if (fromListing?.imageUrls.length) {
      return {
        listingUrl: fromListing.listingUrl,
        imageUrls: fromListing.imageUrls.slice(0, 6),
        productId: fromListing.productId,
        provider: "jina-scrape",
      };
    }
  }

  const scraped = await searchAliExpressViaJina(query);
  const best = scraped[0];
  if (!best || best.imageUrls.length === 0) {
    return { listingUrl: null, imageUrls: [], productId: null, provider: "jina-scrape" };
  }

  return {
    listingUrl: best.listingUrl ?? (best.productId ? aliExpressItemUrl(best.productId) : null),
    imageUrls: best.imageUrls.slice(0, 6),
    productId: best.productId,
    provider: "jina-scrape",
  };
}
