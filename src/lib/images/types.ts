/**
 * Product image pipeline contracts.
 *
 * Today: curated photographic URLs (Unsplash) keyed by niche keywords.
 * Next: scrape AliExpress / Temu / eBay → enhance → generate lifestyle hero shots.
 */

export type ImageSourceKind = "curated" | "scraped" | "enhanced" | "generated";

export interface ScrapedSupplierImage {
  url: string;
  source: "aliexpress" | "temu" | "ebay" | "amazon" | "other";
  supplierProductId: string;
  sortOrder?: number;
}

export interface ResolvedProductImages {
  primaryUrl: string;
  primaryAlt: string;
  galleryUrls: string[];
  sourceKind: ImageSourceKind;
  /** When scraped/enhanced, keep the original for audit/compliance. */
  sourceUrls?: string[];
}

export interface ResolveProductImagesInput {
  title: string;
  subtitle?: string;
  slug: string;
  sku: string;
  niche: string;
  brand?: string;
  keywords?: string[];
  /** Raw URLs from a supplier scrape (future). Takes precedence when provided. */
  scrapedImages?: ScrapedSupplierImage[];
}

export interface ImageEnhanceInput {
  sourceUrls: string[];
  productTitle: string;
  niche: string;
  brandVoice?: string;
  /** hero = white-bg catalog, lifestyle = in-use scene, detail = close-up */
  variants?: Array<"hero" | "lifestyle" | "detail" | "comparison">;
}

export interface ImageEnhanceResult {
  urls: string[];
  provider: "mock" | "replicate" | "openai" | "manual";
  notes?: string;
}

export interface ProductCopyEnhanceInput {
  title: string;
  description: string;
  specs: Array<{ label: string; value: string }>;
  niche: string;
  audience: string;
  brandVoice: string;
  locale: string;
}

export interface ProductCopyEnhanceResult {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  specs: Array<{ label: string; value: string }>;
  pros: string[];
  cons: string[];
}
