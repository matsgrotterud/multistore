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

  if (productIds.length === 0) {
    return searchImages.length
      ? [{ productId: null, listingUrl: null, imageUrls: searchImages.slice(0, 6) }]
      : [];
  }

  const results: AliExpressScrapeResult[] = [];
  for (const productId of productIds.slice(0, 2)) {
    try {
      const detail = await scrapeAliExpressProduct(productId);
      if (detail.imageUrls.length > 0) {
        results.push(detail);
        break;
      }
    } catch {
      // Try next search result.
    }
  }

  if (results.length === 0 && searchImages.length > 0) {
    return [
      {
        productId: productIds[0] ?? null,
        listingUrl: productIds[0] ? aliExpressItemUrl(productIds[0]) : null,
        imageUrls: searchImages.slice(0, 6),
      },
    ];
  }

  return results;
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
