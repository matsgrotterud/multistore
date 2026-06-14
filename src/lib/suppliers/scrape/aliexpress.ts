export interface AliExpressScrapeResult {
  listingUrl: string | null;
  productId: string | null;
  imageUrls: string[];
}

export async function scrapeAliExpressProduct(_productId: string): Promise<AliExpressScrapeResult> {
  void _productId;
  return { listingUrl: null, productId: null, imageUrls: [] };
}

export async function searchAliExpressProducts(_query: string): Promise<AliExpressScrapeResult[]> {
  void _query;
  return [];
}

export async function scrapeAliExpressListing(_listingUrl: string): Promise<AliExpressScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, productId: null, imageUrls: [] };
}
