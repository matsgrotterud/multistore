export const PAYMENT_CONFIRMABLE_ORDER_STATUSES = ["DRAFT"] as const;
export const PAYMENT_AUTHORIZATION_MUTABLE_ORDER_STATUSES = [
  "DRAFT",
  "CONFIRMED",
] as const;
export const PAYMENT_CAPTURE_MUTABLE_ORDER_STATUSES = [
  "CONFIRMED",
  "FULFILLMENT_ROUTING",
  "SUPPLIER_ORDERED",
] as const;
export const PAYMENT_FAILURE_MUTABLE_ORDER_STATUSES = [
  "DRAFT",
  "CONFIRMED",
] as const;

/** Authorization events are only legal before fulfillment has begun. */
export function canApplyStripeAuthorization(input: {
  orderStatus: string;
  fulfillmentStatus: string;
  paymentStatus: string;
}): boolean {
  return (
    (PAYMENT_AUTHORIZATION_MUTABLE_ORDER_STATUSES as readonly string[]).includes(
      input.orderStatus
    ) &&
    input.fulfillmentStatus === "NOT_STARTED" &&
    ["UNPAID", "AUTHORIZED"].includes(input.paymentStatus)
  );
}

/** A succeeded event may acknowledge capture, but never revive a terminal order. */
export function canApplyStripeCapture(input: {
  orderStatus: string;
  paymentStatus: string;
}): boolean {
  return (
    (PAYMENT_CAPTURE_MUTABLE_ORDER_STATUSES as readonly string[]).includes(
      input.orderStatus
    ) && ["AUTHORIZED", "CAPTURED"].includes(input.paymentStatus)
  );
}

/**
 * A confirmed order may enter routing; an already-claimed order may safely
 * resume a PREPARED route after a worker or request was interrupted.
 */
export function shouldInvokeOrderRouting(status: string): boolean {
  return status === "CONFIRMED" || status === "FULFILLMENT_ROUTING";
}

/** Failed/cancelled payment events must never overwrite fulfillment work. */
export function canApplyPreFulfillmentPaymentFailure(input: {
  orderStatus: string;
  fulfillmentStatus: string;
  paymentStatus: string;
}): boolean {
  return (
    (PAYMENT_FAILURE_MUTABLE_ORDER_STATUSES as readonly string[]).includes(
      input.orderStatus
    ) &&
    input.fulfillmentStatus === "NOT_STARTED" &&
    input.paymentStatus !== "CAPTURED"
  );
}
