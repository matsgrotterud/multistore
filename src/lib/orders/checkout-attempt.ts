import { createHash } from "node:crypto";

/** A high-entropy client attempt ID maps to one stable merchant order ID. */
export function checkoutOrderId(storeId: string, checkoutAttemptId: string): string {
  const digest = createHash("sha256")
    .update(`checkout-attempt.v1:${storeId}:${checkoutAttemptId}`)
    .digest("hex")
    .slice(0, 40);
  return `checkout_${digest}`;
}

const REUSABLE_PAYMENT_INTENT_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/** Only statuses that can still be completed through the current Payment Element. */
export function isReusableCheckoutPaymentIntentStatus(status: string): boolean {
  return REUSABLE_PAYMENT_INTENT_STATUSES.has(status);
}
