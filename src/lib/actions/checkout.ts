"use server";

import { prisma } from "@/lib/db";
import { persistOrderFromCheckout } from "@/lib/orders/persist-order";
import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { routeOrder } from "@/lib/orders/route-order";
import { isMockCheckoutEnabled } from "@/lib/payments/stripe-client";
import { toJson } from "@/lib/utils/json";

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
}

/**
 * Mock checkout path (MOCK_CHECKOUT=true): validates, persists Order + Customer,
 * routes fulfillment, records analytics. Stripe checkout uses
 * /api/checkout/create-payment-intent instead.
 */
export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  if (!isMockCheckoutEnabled()) {
    return {
      ok: false,
      message: "Mock checkout is disabled. Complete payment with Stripe on this page.",
      useStripe: true,
    };
  }

  const prepared = await prepareCheckout(input);
  if (!prepared.ok) {
    return {
      ok: false,
      message: prepared.message,
      fieldErrors: prepared.fieldErrors,
    };
  }

  const checkout = prepared.checkout;
  const { order } = await persistOrderFromCheckout(prisma, checkout, {
    paymentProvider: "mock",
    paymentStatus: "AUTHORIZED",
    orderStatus: "CONFIRMED",
  });

  const routed = await routeOrder(order.id);
  if (!routed.ok) {
    return {
      ok: false,
      orderRef: order.orderNumber,
      orderId: order.id,
      message: routed.error ?? "Fulfillment failed for this order.",
    };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "CAPTURED" },
  });

  await prisma.cartEvent.create({
    data: {
      storeId: checkout.storeId,
      sessionId: "server",
      eventName: "checkout_success",
      payload: toJson({
        orderRef: order.orderNumber,
        orderId: order.id,
        subtotal: checkout.subtotal,
        shipping: checkout.shippingTotal,
        total: checkout.grandTotal,
        currency: checkout.currency,
        itemCount: checkout.lines.reduce((sum, line) => sum + line.quantity, 0),
        paymentProvider: "mock",
      }),
    },
  });

  return {
    ok: true,
    orderRef: order.orderNumber,
    orderId: order.id,
    total: checkout.grandTotal,
    currency: checkout.currency,
    message: "Order placed successfully.",
  };
}
