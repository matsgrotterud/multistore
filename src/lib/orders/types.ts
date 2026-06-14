export const ORDER_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "FULFILLMENT_PENDING",
  "SUPPLIER_ORDERED",
  "ERROR",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "AUTHORIZED",
  "CAPTURED",
  "CANCELLED",
  "FAILED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  "NOT_STARTED",
  "PENDING",
  "SUPPLIER_ORDERED",
  "MANUAL",
  "AFFILIATE",
  "ERROR",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_MODES = ["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"] as const;
export type FulfillmentMode = (typeof FULFILLMENT_MODES)[number];

export interface CheckoutLineInput {
  productId: string;
  quantity: number;
}

export interface CheckoutCustomerInput {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PreparedCheckoutLine {
  productId: string;
  title: string;
  slug: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  fulfillmentMode: FulfillmentMode;
  providerKey: string | null;
  externalId: string | null;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string | null;
}

export interface PreparedCheckout {
  storeId: string;
  storeSlug: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  orderNumber: string;
  customer: CheckoutCustomerInput;
  lines: PreparedCheckoutLine[];
}
