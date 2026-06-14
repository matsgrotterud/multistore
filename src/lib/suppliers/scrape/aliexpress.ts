import { fetchReadablePage } from "@/lib/suppliers/scrape/jina-reader";
import {
  aliExpressItemUrl,
  aliExpressSearchUrl,
  extractAliExpressProductIds,
  extractMarketplaceImageUrls,
} from "@/lib/suppliers/scrape/image-urls";

export interface AliExpressScrapeResult {
  productId: string | null;
  listingUrl: string | null;
  imageUrls: string[];
}

export async function scrapeAliExpressProduct(productId: string): Promise<AliExpressScrapeResult> {
  const listingUrl = aliExpressItemUrl(productId);
  const page = await fetchReadablePage(listingUrl);
  const imageUrls = extractMarketplaceImageUrls(page).slice(0, 8);

  return {
    productId,
    listingUrl,
    imageUrls,
  };
}

export async function searchAliExpressProducts(query: string): Promise<AliExpressScrapeResult[]> {
  const page = await fetchReadablePage(aliExpressSearchUrl(query));
  const productIds = extractAliExpressProductIds(page).slice(0, 5);
  const searchImages = extractMarketplaceImageUrls(page);

  if (searchImages.length > 0) {
    return [
      {
        productId: productIds[0] ?? null,
        listingUrl: productIds[0] ? aliExpressItemUrl(productIds[0]) : null,
        imageUrls: searchImages.slice(0, 6),
      },
    ];
  }

  if (productIds.length === 0) return [];

  // Optional second request for richer gallery when explicitly enabled.
  if (process.env.SUPPLIER_FETCH_DETAIL === "1") {
    for (const productId of productIds.slice(0, 1)) {
      try {
        const detail = await scrapeAliExpressProduct(productId);
        if (detail.imageUrls.length > 0) return [detail];
      } catch {
        // fall through
      }
    }
  }

  return [];
}

export async function scrapeAliExpressListing(listingUrl: string): Promise<AliExpressScrapeResult> {
  const page = await fetchReadablePage(listingUrl);
  const ids = extractAliExpressProductIds(page);
  const imageUrls = extractMarketplaceImageUrls(page).slice(0, 8);

  return {
    productId: ids[0] ?? null,
    listingUrl,
    imageUrls,
  };
}
