export interface EbayScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function scrapeEbayListing(_listingUrl: string): Promise<EbayScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, imageUrls: [] };
}

export async function searchEbayProducts(_query: string): Promise<EbayScrapeResult[]> {
  void _query;
  return [];
}
