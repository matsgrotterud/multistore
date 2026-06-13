"use server";

import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/payment-provider";
import { MARGIN_SAFE_THRESHOLD, calculateGrossMargin } from "@/lib/monetization/margin";
import { checkoutSchema } from "@/lib/validation/schemas";
import { round2 } from "@/lib/pricing/calculate-price";
import { toJson } from "@/lib/utils/json";

export interface CheckoutResult {
  ok: boolean;
  orderRef?: string;
  total?: number;
  currency?: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

/** Mirrors estimateShippingCost in cart-context.tsx; keep in sync. */
function shippingCostFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : 5.95;
}

/**
 * Mock checkout. Validates the order, re-prices every line item from the
 * database (never trusting client prices), runs the payment provider and
 * records analytics. Designed so a real provider slot-in only touches
 * src/lib/payments/payment-provider.ts.
 */
export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const store = await prisma.store.findUnique({ where: { slug: data.storeSlug } });
  if (!store) return { ok: false, message: "Unknown store." };

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      id: { in: data.items.map((item) => item.productId) },
      isPublished: true,
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const lineItems = [];
  let subtotal = 0;
  for (const item of data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { ok: false, message: "An item in your cart is no longer available." };
    }
    if (product.stockStatus === "OUT_OF_STOCK") {
      return { ok: false, message: `"${product.title}" is currently out of stock.` };
    }
    subtotal += product.price * item.quantity;
    lineItems.push({
      productId: product.id,
      title: product.title,
      quantity: item.quantity,
      unitPrice: product.price,
    });

    // Internal margin-safe warning: never shown to customers, only logged so
    // operators notice orders that barely (or don't) cover costs.
    const margin = calculateGrossMargin(product);
    if (margin.grossMarginPercent < MARGIN_SAFE_THRESHOLD) {
      console.warn(
        `[margin-safe] Order line below ${MARGIN_SAFE_THRESHOLD}% margin: ` +
          `${store.slug}/${product.slug} at ${margin.grossMarginPercent}%`
      );
    }
  }

  subtotal = round2(subtotal);
  const shipping = shippingCostFor(subtotal);
  const total = round2(subtotal + shipping);
  const orderRef = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const payment = await getPaymentProvider().createPayment({
    storeId: store.id,
    orderRef,
    currency: store.currency,
    amountSubtotal: subtotal,
    amountShipping: shipping,
    amountTotal: total,
    customer: {
      name: data.name,
      email: data.email,
      addressLine1: data.addressLine1,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
    },
    lineItems,
  });

  if (payment.status !== "SUCCEEDED") {
    return {
      ok: false,
      message: payment.errorMessage ?? "Payment could not be completed.",
    };
  }

  await prisma.cartEvent.create({
    data: {
      storeId: store.id,
      sessionId: "server",
      eventName: "checkout_success",
      payload: toJson({
        orderRef,
        transactionId: payment.transactionId,
        subtotal,
        shipping,
        total,
        currency: store.currency,
        itemCount: lineItems.reduce((sum, line) => sum + line.quantity, 0),
        // No PII in analytics payloads.
      }),
    },
  });

  return {
    ok: true,
    orderRef,
    total,
    currency: store.currency,
    message: "Order placed successfully.",
  };
}
