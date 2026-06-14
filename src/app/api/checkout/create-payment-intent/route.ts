import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { persistOrderFromCheckout } from "@/lib/orders/persist-order";
import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { routeOrder } from "@/lib/orders/route-order";
import {
  getStripeClient,
  isMockCheckoutEnabled,
  isStripeConfigured,
  paymentCaptureMode,
} from "@/lib/payments/stripe-client";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

  const { order } = await persistOrderFromCheckout(prisma, checkout, {
    paymentProvider: "stripe",
    paymentStatus: "UNPAID",
    orderStatus: "DRAFT",
  });

  const stripe = getStripeClient();
  const captureMethod = paymentCaptureMode();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(checkout.grandTotal * 100),
    currency: checkout.currency.toLowerCase(),
    capture_method: captureMethod,
    automatic_payment_methods: { enabled: true },
    receipt_email: checkout.customer.email,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId: checkout.storeId,
      storeSlug: checkout.storeSlug,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: "UNPAID",
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    orderNumber: order.orderNumber,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    captureMode: captureMethod,
  });
}

/** Finalize an authorized Stripe payment after client-side confirmation. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order?.stripePaymentIntentId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

  if (
    paymentIntent.status !== "requires_capture" &&
    paymentIntent.status !== "succeeded" &&
    paymentIntent.status !== "processing"
  ) {
    return NextResponse.json(
      { error: `Payment not authorized yet (status: ${paymentIntent.status})` },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "AUTHORIZED", status: "CONFIRMED" },
  });

  const routed = await routeOrder(order.id);
  return NextResponse.json(routed, { status: routed.ok ? 200 : 422 });
}
