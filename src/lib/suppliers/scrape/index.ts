import type { ScrapedSupplierImage } from "@/lib/images/types";
import { findSupplierImages } from "@/lib/suppliers/aliexpress/find-images";
import { searchEbayProducts, scrapeEbayListing } from "@/lib/suppliers/scrape/ebay";
import { toScrapedImages } from "@/lib/suppliers/scrape/image-urls";
import { searchTemuProducts, scrapeTemuListing } from "@/lib/suppliers/scrape/temu";
import { scrapeAliExpressListing } from "@/lib/suppliers/scrape/aliexpress";

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

export async function scrapeSupplierImages(
  input: ScrapeSupplierImagesInput
): Promise<ScrapeSupplierImagesResult> {
  const { source, searchQuery, supplierProductId, listingUrl } = input;

  if (source === "aliexpress" || source === "alibaba" || source === "wish") {
    const productId = extractProductId(listingUrl);
    const found = await findSupplierImages(searchQuery, { listingUrl, productId });
    if (found.imageUrls.length > 0) {
      return {
        listingUrl: found.listingUrl,
        imageUrls: found.imageUrls,
        scrapedImages: toScrapedImages(found.imageUrls, source, supplierProductId),
        provider: found.provider,
      };
    }
  }

  if (listingUrl) {
    const direct = await scrapeListingByUrl(source, listingUrl);
    if (direct.imageUrls.length > 0) {
      return {
        listingUrl,
        imageUrls: direct.imageUrls,
        scrapedImages: toScrapedImages(direct.imageUrls, mapSource(source), supplierProductId),
        provider: "jina-scrape",
      };
    }
  }

  const searchResult = await searchBySource(source, searchQuery);
  const best = searchResult[0];
  if (!best || best.imageUrls.length === 0) {
    return { listingUrl: null, imageUrls: [], scrapedImages: [] };
  }

  return {
    listingUrl: best.listingUrl,
    imageUrls: best.imageUrls,
    scrapedImages: toScrapedImages(best.imageUrls, mapSource(source), supplierProductId),
    provider: "jina-scrape",
  };
}

function extractProductId(listingUrl?: string | null): string | null {
  if (!listingUrl) return null;
  const match = listingUrl.match(/\/item\/(\d{10,20})\.html/i);
  return match?.[1] ?? null;
}

function mapSource(source: SupplierMarketplace): ScrapedSupplierImage["source"] {
  return source;
}

async function scrapeListingByUrl(
  source: SupplierMarketplace,
  listingUrl: string
): Promise<{ listingUrl: string; imageUrls: string[] }> {
  switch (source) {
    case "aliexpress":
    case "alibaba":
    case "wish": {
      const result = await scrapeAliExpressListing(listingUrl);
      return { listingUrl, imageUrls: result.imageUrls };
    }
    case "ebay": {
      const result = await scrapeEbayListing(listingUrl);
      return { listingUrl, imageUrls: result.imageUrls };
    }
    case "temu": {
      const result = await scrapeTemuListing(listingUrl);
      return { listingUrl, imageUrls: result.imageUrls };
    }
    default:
      return { listingUrl, imageUrls: [] };
  }
}

async function searchBySource(
  source: SupplierMarketplace,
  query: string
): Promise<Array<{ listingUrl: string | null; imageUrls: string[] }>> {
  switch (source) {
    case "ebay":
      return searchEbayProducts(query);
    case "temu":
      return searchTemuProducts(query);
    default:
      return [];
  }
}
