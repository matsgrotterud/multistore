import {
  getAliExpressProductDetailApi,
  isAliExpressApiConfigured,
  searchAliExpressProductsApi,
} from "@/lib/suppliers/aliexpress/api-client";

export interface SupplierImageSearchResult {
  listingUrl: string | null;
  imageUrls: string[];
  productId: string | null;
  provider: "aliexpress-api";
}

/** Official AliExpress API image lookup only. No reader/scraping fallback. */
export async function findSupplierImages(
  query: string,
  options?: { productId?: string | null }
): Promise<SupplierImageSearchResult> {
  if (!isAliExpressApiConfigured()) {
    return { listingUrl: null, imageUrls: [], productId: null, provider: "aliexpress-api" };
  }

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
  if (!best) {
    return { listingUrl: null, imageUrls: [], productId: null, provider: "aliexpress-api" };
  }

  const detail = await getAliExpressProductDetailApi(best.productId);
  const gallery = detail?.galleryUrls.length ? detail.galleryUrls : best.galleryUrls;
  return {
    listingUrl: best.productUrl,
    imageUrls: gallery.slice(0, 6),
    productId: best.productId,
    provider: "aliexpress-api",
  };
}

