import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  checkoutOrderId,
  isReusableCheckoutPaymentIntentStatus,
} from "@/lib/orders/checkout-attempt";
import {
  checkoutFinalizationSecret,
  createCheckoutFinalizationToken,
  verifyCheckoutFinalizationToken,
} from "@/lib/orders/checkout-finalization";
import { persistOrderFromCheckout } from "@/lib/orders/persist-order";
import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { routeOrder } from "@/lib/orders/route-order";
import {
  validateStripeIntentForRouting,
  validateStripeIntentIdentity,
} from "@/lib/orders/route-order-state";
import {
  getStripeClient,
  isMockCheckoutEnabled,
  isStripeConfigured,
  paymentCaptureMode,
} from "@/lib/payments/stripe-client";
import { PAYMENT_CONFIRMABLE_ORDER_STATUSES } from "@/lib/payments/order-payment-state";
import { checkoutTenantMatches } from "@/lib/tenant/checkout-tenant";
import { resolveStoreSlugFromHostname } from "@/lib/tenant/resolve-tenant";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isMockCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Stripe checkout is disabled while MOCK_CHECKOUT=true. Use the mock checkout form." },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
      { status: 503 }
    );
  }

  const captureMethod = paymentCaptureMode();
  if (captureMethod !== "manual") {
    return NextResponse.json(
      {
        error:
          "Live dropship checkout requires PAYMENT_CAPTURE_MODE=manual until an automated refund workflow is enabled.",
      },
      { status: 503 }
    );
  }
  const finalizationSecret = checkoutFinalizationSecret();
  if (!finalizationSecret) {
    return NextResponse.json(
      { error: "Checkout finalization is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const requestedStoreSlug =
    body && typeof body === "object" && !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).storeSlug === "string"
      ? (body as Record<string, string>).storeSlug
      : null;
  const isProduction = process.env.NODE_ENV === "production";
  const hostStoreSlug = isProduction
    ? await resolveStoreSlugFromHostname(request.headers.get("host") ?? "", {
        requireLive: true,
        databaseAuthority: true,
      })
    : null;
  if (!checkoutTenantMatches({ isProduction, requestedStoreSlug, hostStoreSlug })) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const prepared = await prepareCheckout(body);
  if (!prepared.ok) {
    return NextResponse.json(
      { error: prepared.message, fieldErrors: prepared.fieldErrors },
      { status: 400 }
    );
  }

  const checkout = prepared.checkout;
  if (checkout.grandTotal <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });
  }

  let order;
  try {
    ({ order } = await persistOrderFromCheckout(prisma, checkout, {
      orderId: checkoutOrderId(checkout.storeId, checkout.checkoutAttemptId),
      paymentProvider: "stripe",
      paymentStatus: "UNPAID",
      orderStatus: "DRAFT",
    }));
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("This checkout attempt")
        ? error.message
        : "Could not create an idempotent checkout session.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const stripe = getStripeClient();
  const paymentIntent = order.stripePaymentIntentId
    ? await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
    : await stripe.paymentIntents.create(
        {
          amount: Math.round(checkout.grandTotal * 100),
          currency: checkout.currency.toLowerCase(),
          capture_method: captureMethod,
          // The current client finalizes fulfillment with a short-lived
          // capability after confirmation. Redirect-based methods are filtered
          // until a durable return/resume page is implemented.
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          receipt_email: checkout.customer.email,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            storeId: checkout.storeId,
            storeSlug: checkout.storeSlug,
          },
        },
        { idempotencyKey: `payment-intent:${order.id}` }
      );

  const identityErrors = validateStripeIntentIdentity({
    orderId: order.id,
    stripePaymentIntentId: order.stripePaymentIntentId ?? paymentIntent.id,
    grandTotal: order.grandTotal,
    currency: order.currency,
    intent: {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    },
  });
  if (
    identityErrors.length > 0 ||
    !paymentIntent.client_secret ||
    !isReusableCheckoutPaymentIntentStatus(paymentIntent.status)
  ) {
    return NextResponse.json(
      { error: "Existing payment session cannot be reused for this order." },
      { status: 409 }
    );
  }

  await prisma.order.updateMany({
    where: {
      id: order.id,
      OR: [
        { stripePaymentIntentId: null },
        { stripePaymentIntentId: paymentIntent.id },
      ],
      status: "DRAFT",
      paymentStatus: "UNPAID",
    },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: "UNPAID",
    },
  });

  const attached = await prisma.order.findFirst({
    where: { id: order.id, stripePaymentIntentId: paymentIntent.id },
    select: { id: true },
  });
  if (!attached) {
    return NextResponse.json(
      { error: "Payment session could not be attached to this order." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    orderNumber: order.orderNumber,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    captureMode: captureMethod,
    finalizationToken: createCheckoutFinalizationToken({
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      secret: finalizationSecret,
    }),
    grandTotal: order.grandTotal,
    currency: order.currency,
  });
}

/** Finalize an authorized Stripe payment after client-side confirmation. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: { orderId?: string; finalizationToken?: string };
  try {
    body = (await request.json()) as {
      orderId?: string;
      finalizationToken?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { store: { select: { slug: true } } },
  });
  if (!order?.stripePaymentIntentId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const finalizationSecret = checkoutFinalizationSecret();
  if (
    !finalizationSecret ||
    !body.finalizationToken ||
    !verifyCheckoutFinalizationToken({
      token: body.finalizationToken,
      orderId: order.id,
      paymentIntentId: order.stripePaymentIntentId,
      secret: finalizationSecret,
    })
  ) {
    return NextResponse.json(
      { error: "Checkout finalization authorization is invalid or expired." },
      { status: 403 }
    );
  }

  if (process.env.NODE_ENV === "production") {
    const hostStoreSlug = await resolveStoreSlugFromHostname(
      request.headers.get("host") ?? "",
      { requireLive: true, databaseAuthority: true }
    );
    if (hostStoreSlug !== order.store.slug) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  const nextPaymentStatus =
    paymentIntent.status === "requires_capture"
      ? "AUTHORIZED"
      : paymentIntent.status === "succeeded"
        ? "CAPTURED"
        : null;

  if (!nextPaymentStatus) {
    return NextResponse.json(
      { error: `Payment not authorized yet (status: ${paymentIntent.status})` },
      { status: 400 }
    );
  }

  const paymentErrors = validateStripeIntentForRouting({
    orderId: order.id,
    paymentStatus: nextPaymentStatus,
    stripePaymentIntentId: order.stripePaymentIntentId,
    grandTotal: order.grandTotal,
    currency: order.currency,
    intent: {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    },
  });
  if (paymentErrors.length > 0) {
    return NextResponse.json(
      { error: "Payment identity did not match this order." },
      { status: 409 }
    );
  }

  await prisma.order.updateMany({
    where: {
      id: order.id,
      stripePaymentIntentId: paymentIntent.id,
      status: { in: [...PAYMENT_CONFIRMABLE_ORDER_STATUSES] },
    },
    data: {
      paymentStatus: nextPaymentStatus,
      status: "CONFIRMED",
    },
  });

  const matchingOrder = await prisma.order.findFirst({
    where: { id: order.id, stripePaymentIntentId: paymentIntent.id },
    select: { id: true },
  });
  if (!matchingOrder) {
    return NextResponse.json(
      { error: "Payment is not attached to this order." },
      { status: 409 }
    );
  }

  const routed = await routeOrder(order.id);
  return NextResponse.json(routed, { status: routed.ok ? 200 : 422 });
}
