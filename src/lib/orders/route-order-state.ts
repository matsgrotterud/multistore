export const ROUTE_SUBMISSION_STALE_MS = 15 * 60 * 1000;

export type FulfillmentRouteMode = "DROPSHIP" | "MANUAL" | "MOCK";

export interface RoutingLineValidationInput {
  id: string;
  productId: string;
  variantId: string | null;
  externalVariantId: string | null;
  skuSnapshot: string;
  fulfillmentMode: string;
  providerKey: string | null;
  externalId: string | null;
  commerceEligible: boolean;
  catalogFresh: boolean;
  checkoutAvailable: boolean;
  supplierSettingEnabled: boolean;
  providerCheckoutAvailable: boolean;
  product: {
    id: string;
    storeId: string;
    isPublished: boolean;
    stockStatus: string;
    fulfillmentMode: string;
    providerKey: string | null;
    externalId: string | null;
    sku: string;
    currency: string;
    variantCount: number;
  };
  variant: {
    id: string;
    productId: string;
    stockStatus: string;
    externalVariantId: string | null;
    sku: string | null;
  } | null;
}

export interface RoutingOrderValidationInput {
  orderId: string;
  storeId: string;
  currency: string;
  paymentStatus: string;
  paymentProvider: string | null;
  stripePaymentIntentId: string | null;
  store: {
    id: string;
    isActive: boolean;
    launchStatus: string;
  };
  lines: RoutingLineValidationInput[];
}

export type RoutingValidationReason =
  | "PAYMENT_NOT_READY"
  | "LIVE_PAYMENT_INVALID"
  | "STORE_TENANT_MISMATCH"
  | "STORE_INACTIVE"
  | "STORE_NOT_LIVE"
  | "EMPTY_ORDER"
  | "UNSUPPORTED_FULFILLMENT_MODE"
  | "MULTIPLE_FULFILLMENT_ROUTES"
  | "PRODUCT_TENANT_MISMATCH"
  | "PRODUCT_UNPUBLISHED"
  | "PRODUCT_OUT_OF_STOCK"
  | "PRODUCT_STOCK_NOT_SELLABLE"
  | "PRODUCT_IDENTITY_CHANGED"
  | "PRODUCT_CURRENCY_CHANGED"
  | "PRODUCT_COMMERCE_INELIGIBLE"
  | "PRODUCT_CATALOG_NOT_FRESH"
  | "PRODUCT_CHECKOUT_UNAVAILABLE"
  | "SUPPLIER_SETTING_DISABLED"
  | "PROVIDER_CHECKOUT_UNAVAILABLE"
  | "VARIANT_REQUIRED"
  | "VARIANT_MISSING"
  | "VARIANT_OUT_OF_STOCK"
  | "VARIANT_STOCK_NOT_SELLABLE"
  | "VARIANT_IDENTITY_CHANGED"
  | "MOCK_PAYMENT_INVALID";

export type RoutingOrderValidation =
  | {
      allowed: true;
      mode: FulfillmentRouteMode;
      providerKey: string | null;
      routeKey: string;
      reasonCodes: [];
    }
  | {
      allowed: false;
      mode: null;
      providerKey: null;
      routeKey: null;
      reasonCodes: RoutingValidationReason[];
    };

export function deterministicSupplierOrderId(
  orderId: string,
  routeKey: string
): string {
  const safeRoute = routeKey.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `route-v1_${orderId}_${safeRoute}`;
}

export function deterministicRouteOrderJobId(orderId: string): string {
  const safeOrderId = orderId.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `route-order-v1_${safeOrderId}`;
}

/** Buyer-facing success is narrower than an internally retryable route. */
export function isBuyerAcceptedOrderState(input: {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}): boolean {
  if (input.paymentStatus !== "CAPTURED") return false;
  if (input.status === "SUPPLIER_ORDERED") {
    return ["SUPPLIER_ORDERED", "MOCK"].includes(input.fulfillmentStatus);
  }
  return (
    input.status === "FULFILLMENT_PENDING" &&
    input.fulfillmentStatus === "MANUAL"
  );
}

export function evaluateRoutingOrder(
  input: RoutingOrderValidationInput
): RoutingOrderValidation {
  const reasons: RoutingValidationReason[] = [];
  if (!new Set(["AUTHORIZED", "CAPTURED"]).has(input.paymentStatus)) {
    reasons.push("PAYMENT_NOT_READY");
  }
  if (input.store.id !== input.storeId) reasons.push("STORE_TENANT_MISMATCH");
  if (!input.store.isActive) reasons.push("STORE_INACTIVE");
  if (input.lines.length === 0) reasons.push("EMPTY_ORDER");

  const routes = new Set<string>();
  let routeMode: FulfillmentRouteMode | null = null;
  let routeProvider: string | null = null;

  for (const line of input.lines) {
    const mode = parseRouteMode(line.fulfillmentMode);
    if (!mode) {
      reasons.push("UNSUPPORTED_FULFILLMENT_MODE");
      continue;
    }
    const providerKey = line.providerKey ?? line.product.providerKey;
    routes.add(`${mode}:${providerKey ?? "none"}`);
    routeMode ??= mode;
    routeProvider ??= providerKey;

    if (line.product.id !== line.productId || line.product.storeId !== input.storeId) {
      reasons.push("PRODUCT_TENANT_MISMATCH");
    }
    if (!line.product.isPublished) reasons.push("PRODUCT_UNPUBLISHED");
    if (line.product.stockStatus === "OUT_OF_STOCK") {
      reasons.push("PRODUCT_OUT_OF_STOCK");
    } else if (!["IN_STOCK", "LOW_STOCK"].includes(line.product.stockStatus)) {
      reasons.push("PRODUCT_STOCK_NOT_SELLABLE");
    }
    if (
      line.product.fulfillmentMode !== line.fulfillmentMode ||
      line.product.providerKey !== line.providerKey ||
      line.product.externalId !== line.externalId
    ) {
      reasons.push("PRODUCT_IDENTITY_CHANGED");
    }
    if (line.product.currency !== input.currency) {
      reasons.push("PRODUCT_CURRENCY_CHANGED");
    }
    if (!line.commerceEligible) reasons.push("PRODUCT_COMMERCE_INELIGIBLE");
    if (!line.catalogFresh) reasons.push("PRODUCT_CATALOG_NOT_FRESH");
    if (!line.checkoutAvailable) reasons.push("PRODUCT_CHECKOUT_UNAVAILABLE");

    if (mode === "DROPSHIP") {
      if (!line.supplierSettingEnabled) reasons.push("SUPPLIER_SETTING_DISABLED");
      if (!line.providerCheckoutAvailable || !providerKey || !line.externalId) {
        reasons.push("PROVIDER_CHECKOUT_UNAVAILABLE");
      }
    }

    if (line.variantId) {
      if (!line.variant || line.variant.id !== line.variantId) {
        reasons.push("VARIANT_MISSING");
      } else {
        if (line.variant.productId !== line.productId) {
          reasons.push("VARIANT_MISSING");
        }
        if (line.variant.stockStatus === "OUT_OF_STOCK") {
          reasons.push("VARIANT_OUT_OF_STOCK");
        } else if (!["IN_STOCK", "LOW_STOCK"].includes(line.variant.stockStatus)) {
          reasons.push("VARIANT_STOCK_NOT_SELLABLE");
        }
        if (
          line.variant.externalVariantId !== line.externalVariantId ||
          (line.variant.sku ?? line.product.sku) !== line.skuSnapshot
        ) {
          reasons.push("VARIANT_IDENTITY_CHANGED");
        }
      }
    } else {
      if (line.product.variantCount > 0) reasons.push("VARIANT_REQUIRED");
      if (line.product.sku !== line.skuSnapshot) {
        reasons.push("PRODUCT_IDENTITY_CHANGED");
      }
    }
  }

  if (routes.size > 1) reasons.push("MULTIPLE_FULFILLMENT_ROUTES");
  if (
    routeMode &&
    routeMode !== "MOCK" &&
    (input.paymentProvider !== "stripe" || !input.stripePaymentIntentId)
  ) {
    reasons.push("LIVE_PAYMENT_INVALID");
  }
  if (routeMode !== "MOCK" && input.store.launchStatus !== "LIVE") {
    reasons.push("STORE_NOT_LIVE");
  }
  if (
    routeMode === "MOCK" &&
    (input.paymentProvider !== "mock" || input.stripePaymentIntentId !== null)
  ) {
    reasons.push("MOCK_PAYMENT_INVALID");
  }

  const reasonCodes = [...new Set(reasons)];
  if (reasonCodes.length > 0 || !routeMode) {
    return {
      allowed: false,
      mode: null,
      providerKey: null,
      routeKey: null,
      reasonCodes,
    };
  }

  return {
    allowed: true,
    mode: routeMode,
    providerKey: routeProvider,
    routeKey: `${routeMode}:${routeProvider ?? "none"}`,
    reasonCodes: [],
  };
}

export interface StripeIntentForRouting {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string>;
}

export function validateStripeIntentForRouting(input: {
  orderId: string;
  paymentStatus: string;
  stripePaymentIntentId: string | null;
  grandTotal: number;
  currency: string;
  intent: StripeIntentForRouting;
}): string[] {
  const errors = validateStripeIntentIdentity(input);
  const expectedStatus =
    input.paymentStatus === "AUTHORIZED" ? "requires_capture" : "succeeded";
  if (input.intent.status !== expectedStatus) {
    errors.push("STRIPE_STATUS_MISMATCH");
  }
  return errors;
}

export function validateStripeIntentIdentity(input: {
  orderId: string;
  stripePaymentIntentId: string | null;
  grandTotal: number;
  currency: string;
  intent: StripeIntentForRouting;
}): string[] {
  const errors: string[] = [];
  if (!input.stripePaymentIntentId || input.intent.id !== input.stripePaymentIntentId) {
    errors.push("STRIPE_PAYMENT_INTENT_MISMATCH");
  }
  if (input.intent.metadata.orderId !== input.orderId) {
    errors.push("STRIPE_ORDER_METADATA_MISMATCH");
  }
  if (input.intent.amount !== Math.round(input.grandTotal * 100)) {
    errors.push("STRIPE_AMOUNT_MISMATCH");
  }
  if (input.intent.currency.toLowerCase() !== input.currency.toLowerCase()) {
    errors.push("STRIPE_CURRENCY_MISMATCH");
  }
  return errors;
}

export function shouldReconcileSubmitting(
  updatedAt: Date,
  now = new Date()
): boolean {
  return now.getTime() - updatedAt.getTime() >= ROUTE_SUBMISSION_STALE_MS;
}

function parseRouteMode(value: string): FulfillmentRouteMode | null {
  if (value === "DROPSHIP" || value === "MANUAL" || value === "MOCK") {
    return value;
  }
  return null;
}
