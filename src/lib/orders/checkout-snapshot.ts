import { createHash } from "node:crypto";
import type { PreparedCheckout } from "@/lib/orders/types";

export interface PersistedCheckoutSnapshot {
  storeId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentProvider: string | null;
  paymentError: string | null;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  shippingAddressJson: string;
  billingAddressJson: string;
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
    titleSnapshot: string;
    skuSnapshot: string;
    variantSnapshotJson: string;
    externalVariantId: string | null;
    optionSummarySnapshot: string | null;
    unitPrice: number;
    unitCost: number | null;
    providerKey: string | null;
    externalId: string | null;
    fulfillmentMode: string;
  }>;
}

export interface ExpectedCheckoutPersistenceState {
  orderStatus: string;
  paymentStatus: string;
  paymentProvider: string;
  paymentError: string | null;
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeJsonValue(nested)])
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJsonValue(value));
}

function parseCanonicalJson(raw: string): string | null {
  try {
    return canonicalJson(JSON.parse(raw));
  } catch {
    return null;
  }
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function preparedCheckoutFingerprint(
  checkout: PreparedCheckout,
  expected: ExpectedCheckoutPersistenceState
): string {
  return fingerprint({
    storeId: checkout.storeId,
    status: expected.orderStatus,
    paymentStatus: expected.paymentStatus,
    fulfillmentStatus: "NOT_STARTED",
    paymentProvider: expected.paymentProvider,
    paymentError: expected.paymentError,
    currency: checkout.currency,
    subtotal: checkout.subtotal,
    shippingTotal: checkout.shippingTotal,
    taxTotal: 0,
    grandTotal: checkout.grandTotal,
    shippingAddress: checkout.customer,
    billingAddress: checkout.customer,
    items: checkout.lines
      .map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        titleSnapshot: line.optionSummary
          ? `${line.title} (${line.optionSummary})`
          : line.title,
        skuSnapshot: line.sku,
        variantSnapshot: normalizeJsonValue(line.variantSnapshot),
        externalVariantId: line.externalVariantId,
        optionSummarySnapshot: line.optionSummary,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        providerKey: line.providerKey,
        externalId: line.externalId,
        fulfillmentMode: line.fulfillmentMode,
      }))
      .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right))),
  });
}

export function persistedCheckoutFingerprint(
  order: PersistedCheckoutSnapshot
): string | null {
  const shippingAddress = parseCanonicalJson(order.shippingAddressJson);
  const billingAddress = parseCanonicalJson(order.billingAddressJson);
  const items = order.items.map((item) => {
    const variantSnapshot = parseCanonicalJson(item.variantSnapshotJson);
    return variantSnapshot === null
      ? null
      : {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          titleSnapshot: item.titleSnapshot,
          skuSnapshot: item.skuSnapshot,
          variantSnapshot: JSON.parse(variantSnapshot) as unknown,
          externalVariantId: item.externalVariantId,
          optionSummarySnapshot: item.optionSummarySnapshot,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          providerKey: item.providerKey,
          externalId: item.externalId,
          fulfillmentMode: item.fulfillmentMode,
        };
  });

  if (
    shippingAddress === null ||
    billingAddress === null ||
    items.some((item) => item === null)
  ) {
    return null;
  }

  return fingerprint({
    storeId: order.storeId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentProvider: order.paymentProvider,
    paymentError: order.paymentError,
    currency: order.currency,
    subtotal: order.subtotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    grandTotal: order.grandTotal,
    shippingAddress: JSON.parse(shippingAddress) as unknown,
    billingAddress: JSON.parse(billingAddress) as unknown,
    items: items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right))),
  });
}

export function matchesPreparedCheckoutSnapshot(
  order: PersistedCheckoutSnapshot,
  checkout: PreparedCheckout,
  expected: ExpectedCheckoutPersistenceState
): boolean {
  const persisted = persistedCheckoutFingerprint(order);
  return persisted !== null && persisted === preparedCheckoutFingerprint(checkout, expected);
}
