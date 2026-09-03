export interface CheckoutAvailabilityProduct {
  fulfillmentMode: string;
  providerKey: string | null;
  externalId: string | null;
}

type CheckoutEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Keep storefront CTAs aligned with the authoritative checkout modes.
 * Explicit mock checkout may exercise any non-affiliate product without
 * enabling live payment or fulfillment for that product.
 */
export function isProductCheckoutAvailable(
  product: CheckoutAvailabilityProduct,
  environment: CheckoutEnvironment = process.env
): boolean {
  if (product.fulfillmentMode === "AFFILIATE") return false;

  if (environment.MOCK_CHECKOUT === "true") return true;

  if (product.fulfillmentMode === "MOCK") return false;
  if (product.fulfillmentMode === "MANUAL") {
    return environment.MANUAL_FULFILLMENT_ENABLED === "true";
  }
  if (product.fulfillmentMode !== "DROPSHIP" || !product.externalId) {
    return false;
  }

  switch (product.providerKey) {
    case "cj":
      return (
        environment.CJ_ENABLED === "true" &&
        environment.CJ_ORDER_API_ENABLED === "true" &&
        // payType=3 produces a PENDING supplier order, but v1 has no verified
        // provider reconciliation contract. Keep it out of live checkout.
        environment.CJ_ORDER_PAY_TYPE === "2" &&
        Boolean(environment.CJ_API_KEY || environment.CJ_ACCESS_TOKEN) &&
        Boolean(environment.CJ_LOGISTIC_NAME) &&
        Boolean(environment.CJ_FROM_COUNTRY_CODE)
      );
    case "mock":
      return false;
    default:
      return false;
  }
}
