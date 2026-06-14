import { fetchReadablePage } from "@/lib/suppliers/scrape/jina-reader";
import {
  extractMarketplaceImageUrls,
  temuSearchUrl,
} from "@/lib/suppliers/scrape/image-urls";

export interface TemuScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function searchTemuProducts(query: string): Promise<TemuScrapeResult[]> {
  const page = await fetchReadablePage(temuSearchUrl(query));
  const imageUrls = extractMarketplaceImageUrls(page);

  if (imageUrls.length === 0) return [];

  return [
    {
      listingUrl: null,
      imageUrls: imageUrls.slice(0, 8),
    },
  ];
}

export async function scrapeTemuListing(listingUrl: string): Promise<TemuScrapeResult> {
  const page = await fetchReadablePage(listingUrl);
  const imageUrls = extractMarketplaceImageUrls(page).slice(0, 8);

  return {
    listingUrl,
    imageUrls,
  };
}
