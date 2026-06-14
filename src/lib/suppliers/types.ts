/**
 * Supplier adapter contract.
 *
 * Every fulfillment source (AliExpress-style aggregator, EU warehouse,
 * print-on-demand, ...) is integrated through this interface so stores can
 * import products from any supplier with the same pipeline
 * (see import-products.ts).
 */

export interface RawSupplierProduct {
  /** Supplier's own product id. */
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** Full supplier gallery when scraped from Ali/Temu/eBay. */
  galleryUrls?: string[];
  /** Direct listing URL for image re-sync cron. */
  supplierUrl?: string;
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  supplierSearchQuery?: string;
  /** Unit cost charged by the supplier, in USD. */
  costUsd: number;
  /** Supplier's shipping charge to typical destination, in USD. */
  shippingCostUsd: number;
  shipsFromCountry: string;
  estimatedShippingDaysMin: number;
  estimatedShippingDaysMax: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  keywords: string[];
}

export interface NormalizedSupplierProduct {
  supplierName: string;
  supplierProductId: string;
  title: string;
  description: string;
  imageUrl: string;
  galleryUrls?: string[];
  supplierUrl?: string;
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  supplierSearchQuery?: string;
  cost: number;
  shippingCost: number;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  specs: { label: string; value: string }[];
  keywords: string[];
}

export interface ShippingEstimate {
  daysMin: number;
  daysMax: number;
  costUsd: number;
}

export interface LandedCost {
  unitCost: number;
  shippingCost: number;
  /** Placeholder for duties/VAT handling per destination market. */
  estimatedDuties: number;
  total: number;
}

export interface SupplierAdapter {
  readonly name: string;
  /** 0-1, feeds into productScore. */
  readonly reliabilityScore: number;

  searchProducts(query: string): Promise<RawSupplierProduct[]>;
  getProduct(id: string): Promise<RawSupplierProduct | null>;
  normalizeProduct(raw: RawSupplierProduct): NormalizedSupplierProduct;
  estimateShipping(raw: RawSupplierProduct): ShippingEstimate;
  calculateLandedCost(raw: RawSupplierProduct): LandedCost;
}
