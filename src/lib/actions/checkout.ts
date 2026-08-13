"use server";

import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { isMockCheckoutEnabled } from "@/lib/payments/stripe-client";

export interface CheckoutResult {
  ok: boolean;
  orderRef?: string;
  orderId?: string;
  total?: number;
  currency?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  clientSecret?: string;
  publishableKey?: string;
  useStripe?: boolean;
  isTestOrder?: boolean;
}

/**
 * Mock checkout path (MOCK_CHECKOUT=true): validates the customer-facing flow
 * without persisting a sale, recording conversion analytics, charging money or
 * calling a supplier. Stripe checkout uses /api/checkout/create-payment-intent.
 */
export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  if (!isMockCheckoutEnabled()) {
    return {
      ok: false,
      message: "Mock checkout is disabled. Complete payment with Stripe on this page.",
      useStripe: true,
    };
  }

  const prepared = await prepareCheckout(input, { mode: "MOCK" });
  if (!prepared.ok) {
    return {
      ok: false,
      message: prepared.message,
      fieldErrors: prepared.fieldErrors,
    };
  }

  const checkout = prepared.checkout;

  return {
    ok: true,
    orderRef: `TEST-${checkout.orderNumber}`,
    total: checkout.grandTotal,
    currency: checkout.currency,
    isTestOrder: true,
    message: "Test checkout completed. No payment or supplier order was created.",
  };
}
