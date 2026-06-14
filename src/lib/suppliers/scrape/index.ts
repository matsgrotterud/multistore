import type { ScrapedSupplierImage } from "@/lib/images/types";

export type SupplierMarketplace = "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";

export interface ScrapeSupplierImagesInput {
  source: SupplierMarketplace;
  searchQuery: string;
  supplierProductId: string;
  listingUrl?: string | null;
}

export interface ScrapeSupplierImagesResult {
  listingUrl: string | null;
  scrapedImages: ScrapedSupplierImage[];
  imageUrls: string[];
  provider?: string;
}

/**
 * Deprecated compatibility shim. Marketplace scraping and reader-based access
 * are disabled; use official provider adapters and media ingestion instead.
 */
export async function scrapeSupplierImages(
  _input: ScrapeSupplierImagesInput
): Promise<ScrapeSupplierImagesResult> {
  void _input;
  return {
    listingUrl: null,
    scrapedImages: [],
    imageUrls: [],
    provider: "disabled",
  };
}
