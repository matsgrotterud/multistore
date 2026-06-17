import { z } from "zod";

export const providerKeys = [
  "mock",
  "cj",
  "doba",
  "ebay",
  "aliexpress",
  "temu",
  "amazon",
  "wish",
  "alibaba",
] as const;

export type ProviderKey = (typeof providerKeys)[number];

export interface ProviderCapabilities {
  search: boolean;
  details: boolean;
  images: boolean;
  video: boolean;
  pricing: boolean;
  inventory: boolean;
  checkout: boolean;
  tracking: boolean;
  returns: boolean;
  affiliateLinks: boolean;
}

export type ProviderHealthStatus = "OK" | "NOT_CONFIGURED" | "DEGRADED" | "ERROR";

export interface ProviderHealth {
  key: ProviderKey;
  name: string;
  status: ProviderHealthStatus;
  message: string;
  missingEnv?: string[];
  capabilities: ProviderCapabilities;
  defaultFulfillmentMode: "DROPSHIP" | "AFFILIATE" | "MANUAL" | "MOCK";
}

export interface ProductSearchInput {
  query: string;
  storeId?: string;
  categoryId?: string;
  locale?: string;
  currency?: string;
  limit?: number;
}

export interface ProductDetailsInput {
  externalId: string;
  sourceUrl?: string;
}

export interface ProductMediaInput {
  externalId: string;
  sourceUrl?: string;
}

export interface InventoryResult {
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
  quantity?: number;
  rawData?: unknown;
}

export interface PriceResult {
  price: number;
  currency: string;
  rawData?: unknown;
}

export interface CreateSupplierOrderResult {
  externalOrderId?: string;
  status: "PLACED" | "PENDING" | "ERROR";
  requestJson?: unknown;
  responseJson?: unknown;
  errorMessage?: string;
}

export interface TrackingResult {
  status: string;
  trackingNumber?: string;
  carrier?: string;
  events?: Array<{ date: string; description: string }>;
  rawData?: unknown;
}

export const supplierMediaSchema = z.object({
  url: z.string().url(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  alt: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
  contentType: z.string().optional(),
});

export type SupplierMedia = z.infer<typeof supplierMediaSchema>;

export const supplierProductVariantSchema = z
  .object({
    externalVariantId: z.string().optional(),
    sku: z.string().optional(),
    title: z.string().optional(),
    optionSummary: z.string().optional(),
    options: z.record(z.string()).default({}),
    price: z.number().nonnegative().optional(),
    supplierCost: z.number().nonnegative().optional(),
    shippingCost: z.number().nonnegative().optional(),
    stockStatus: z
      .enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "UNKNOWN"])
      .optional(),
    inventoryQuantity: z.number().int().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
    rawData: z.unknown().optional(),
  })
  .passthrough();

export type SupplierProductVariant = z.infer<typeof supplierProductVariantSchema>;

export const productSearchResultSchema = z.object({
  providerKey: z.enum(providerKeys),
  externalId: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  supplierCost: z.number().nonnegative().optional(),
  shippingCost: z.number().nonnegative().optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "UNKNOWN"]).default("UNKNOWN"),
  shippingDaysMin: z.number().int().nonnegative().optional(),
  shippingDaysMax: z.number().int().nonnegative().optional(),
  countryOfOrigin: z.string().optional(),
  gtin: z.string().optional(),
  sku: z.string().optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  variants: z.array(supplierProductVariantSchema).default([]),
  media: z.array(supplierMediaSchema).default([]),
  signals: z.record(z.unknown()).default({}),
  risk: z.record(z.unknown()).default({}),
  rawData: z.unknown().optional(),
  fulfillmentMode: z.enum(["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"]).optional(),
});

export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;
export type ProductDetailsResult = ProductSearchResult;

export interface CreateDropshipOrderInput {
  orderId: string;
  items: Array<{
    externalId: string;
    externalVariantId?: string;
    sku?: string;
    optionSummary?: string;
    quantity: number;
    title: string;
    unitPrice: number;
  }>;
  shippingAddress: Record<string, unknown>;
}

export interface CommerceProvider {
  key: ProviderKey;
  name: string;
  capabilities: ProviderCapabilities;
  defaultFulfillmentMode: ProviderHealth["defaultFulfillmentMode"];
  getHealth(): Promise<ProviderHealth>;
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]>;
  getProductDetails(input: ProductDetailsInput): Promise<ProductDetailsResult>;
  getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]>;
  getInventory?(input: ProductDetailsInput): Promise<InventoryResult>;
  getPrice?(input: ProductDetailsInput): Promise<PriceResult>;
  createDropshipOrder?(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult>;
  getTracking?(input: ProductDetailsInput): Promise<TrackingResult>;
}

export const BASE_UNCONFIGURED_CAPABILITIES: ProviderCapabilities = {
  search: false,
  details: false,
  images: false,
  video: false,
  pricing: false,
  inventory: false,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: false,
};

export function validateSearchResults(
  providerKey: ProviderKey,
  results: unknown[]
): ProductSearchResult[] {
  return results.map((result) => {
    const objectResult =
      typeof result === "object" && result !== null
        ? (result as Record<string, unknown>)
        : {};
    return productSearchResultSchema.parse({ providerKey, ...objectResult });
  });
}
