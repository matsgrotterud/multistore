/** Stable merchant-owned identifier; never reuse a supplier SKU in feeds. */
export function merchantProductId(product: { id: string }): string {
  return product.id;
}

export type GoogleFeedExclusionReason =
  | "STORE_NOT_LIVE"
  | "PRODUCT_NOT_PUBLISHED"
  | "PRODUCT_NOINDEX"
  | "COMMERCE_NOT_ELIGIBLE"
  | "CATALOG_FRESHNESS_NOT_VERIFIED"
  | "CHECKOUT_UNAVAILABLE"
  | "CURRENCY_MISMATCH"
  | "STOCK_NOT_SELLABLE"
  | "VARIANT_FEED_NOT_SUPPORTED"
  | "STORED_IMAGE_MISSING"
  | "SUPPLIER_ROUTE_NOT_READY"
  | "SHIPPING_WINDOW_EXCEEDED";

/** Merchant feeds must be stricter than storefront visibility. */
export function evaluateGoogleFeedEligibility(input: {
  storeLive: boolean;
  published: boolean;
  noindex: boolean;
  commerceEligible: boolean;
  catalogFresh: boolean;
  checkoutAvailable: boolean;
  currencyMatches: boolean;
  stockStatus: string;
  variantCount: number;
  storedImageAvailable: boolean;
  supplierRouteReady: boolean;
  shippingWithinLimit: boolean;
}): { allowed: boolean; reasonCodes: GoogleFeedExclusionReason[] } {
  const reasonCodes: GoogleFeedExclusionReason[] = [];
  if (!input.storeLive) reasonCodes.push("STORE_NOT_LIVE");
  if (!input.published) reasonCodes.push("PRODUCT_NOT_PUBLISHED");
  if (input.noindex) reasonCodes.push("PRODUCT_NOINDEX");
  if (!input.commerceEligible) reasonCodes.push("COMMERCE_NOT_ELIGIBLE");
  if (!input.catalogFresh) {
    reasonCodes.push("CATALOG_FRESHNESS_NOT_VERIFIED");
  }
  if (!input.checkoutAvailable) reasonCodes.push("CHECKOUT_UNAVAILABLE");
  if (!input.currencyMatches) reasonCodes.push("CURRENCY_MISMATCH");
  if (!["IN_STOCK", "LOW_STOCK"].includes(input.stockStatus)) {
    reasonCodes.push("STOCK_NOT_SELLABLE");
  }
  if (input.variantCount > 0) reasonCodes.push("VARIANT_FEED_NOT_SUPPORTED");
  if (!input.storedImageAvailable) reasonCodes.push("STORED_IMAGE_MISSING");
  if (!input.supplierRouteReady) reasonCodes.push("SUPPLIER_ROUTE_NOT_READY");
  if (!input.shippingWithinLimit) reasonCodes.push("SHIPPING_WINDOW_EXCEEDED");
  return { allowed: reasonCodes.length === 0, reasonCodes };
}
