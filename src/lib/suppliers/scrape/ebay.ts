import { fetchReadablePage } from "@/lib/suppliers/scrape/jina-reader";
import {
  ebaySearchUrl,
  extractMarketplaceImageUrls,
} from "@/lib/suppliers/scrape/image-urls";

export interface EbayScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function searchEbayProducts(query: string): Promise<EbayScrapeResult[]> {
  const page = await fetchReadablePage(ebaySearchUrl(query));
  const imageUrls = extractMarketplaceImageUrls(page);

  if (imageUrls.length === 0) return [];

  const itemMatch = page.match(/https:\/\/www\.ebay\.com\/itm\/\d+/i);
  return [
    {
      listingUrl: itemMatch?.[0] ?? null,
      imageUrls: imageUrls.slice(0, 8),
    },
  ];
}

export async function scrapeEbayListing(listingUrl: string): Promise<EbayScrapeResult> {
  const page = await fetchReadablePage(listingUrl);
  const imageUrls = extractMarketplaceImageUrls(page).slice(0, 8);

  return {
    listingUrl,
    imageUrls,
  };
}
