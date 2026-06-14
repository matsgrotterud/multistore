import type { ScrapedSupplierImage } from "@/lib/images/types";
import {
  scrapeAliExpressListing,
  searchAliExpressProducts,
} from "@/lib/suppliers/scrape/aliexpress";
import { searchEbayProducts, scrapeEbayListing } from "@/lib/suppliers/scrape/ebay";
import { toScrapedImages } from "@/lib/suppliers/scrape/image-urls";
import { searchTemuProducts, scrapeTemuListing } from "@/lib/suppliers/scrape/temu";

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
}

export async function scrapeSupplierImages(
  input: ScrapeSupplierImagesInput
): Promise<ScrapeSupplierImagesResult> {
  const { source, searchQuery, supplierProductId, listingUrl } = input;

  if (listingUrl) {
    const direct = await scrapeListingByUrl(source, listingUrl);
    if (direct.imageUrls.length > 0) {
      return {
        listingUrl,
        imageUrls: direct.imageUrls,
        scrapedImages: toScrapedImages(direct.imageUrls, mapSource(source), supplierProductId),
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
  };
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
    case "aliexpress":
    case "alibaba":
    case "wish":
      return searchAliExpressProducts(query);
    case "ebay":
      return searchEbayProducts(query);
    case "temu":
      return searchTemuProducts(query);
    default:
      return searchAliExpressProducts(query);
  }
}
