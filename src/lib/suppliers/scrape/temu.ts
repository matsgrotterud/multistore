export interface TemuScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function scrapeTemuListing(_listingUrl: string): Promise<TemuScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, imageUrls: [] };
}

export async function searchTemuProducts(_query: string): Promise<TemuScrapeResult[]> {
  void _query;
  return [];
}
