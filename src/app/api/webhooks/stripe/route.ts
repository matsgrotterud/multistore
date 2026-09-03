import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { routeOrder } from "@/lib/orders/route-order";
import { getStripeClient } from "@/lib/payments/stripe-client";
import {
  PAYMENT_AUTHORIZATION_MUTABLE_ORDER_STATUSES,
  PAYMENT_CAPTURE_MUTABLE_ORDER_STATUSES,
  PAYMENT_FAILURE_MUTABLE_ORDER_STATUSES,
  shouldInvokeOrderRouting,
} from "@/lib/payments/order-payment-state";

async function routeIfPaymentMatches(
  orderId: string,
  paymentIntentId: string
): Promise<void> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, stripePaymentIntentId: paymentIntentId },
    select: { status: true },
  });
  if (order && shouldInvokeOrderRouting(order.status)) {
    await routeOrder(orderId);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true, skipped: "no orderId metadata" });
    }

    // One legal CAS transition. A duplicate is harmless; a late event cannot
    // revive an order whose payment or fulfillment already terminated.
    await prisma.order.updateMany({
      where: {
        id: orderId,
        stripePaymentIntentId: paymentIntent.id,
        status: { in: [...PAYMENT_AUTHORIZATION_MUTABLE_ORDER_STATUSES] },
        fulfillmentStatus: "NOT_STARTED",
        paymentStatus: { in: ["UNPAID", "AUTHORIZED"] },
      },
      data: {
        status: "CONFIRMED",
        paymentStatus: "AUTHORIZED",
      },
    });
    await routeIfPaymentMatches(orderId, paymentIntent.id);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true, skipped: "no orderId metadata" });
    }

    await prisma.order.updateMany({
      where: {
        id: orderId,
        stripePaymentIntentId: paymentIntent.id,
        status: { in: [...PAYMENT_CAPTURE_MUTABLE_ORDER_STATUSES] },
        paymentStatus: { in: ["AUTHORIZED", "CAPTURED"] },
      },
      data: { paymentStatus: "CAPTURED" },
    });
    await routeIfPaymentMatches(orderId, paymentIntent.id);
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) {
      await prisma.order.updateMany({
        where: {
          id: orderId,
          stripePaymentIntentId: paymentIntent.id,
          status: { in: [...PAYMENT_FAILURE_MUTABLE_ORDER_STATUSES] },
          fulfillmentStatus: "NOT_STARTED",
          paymentStatus: { not: "CAPTURED" },
        },
        data: {
          status: "ERROR",
          paymentStatus: "FAILED",
          fulfillmentStatus: "ERROR",
          paymentError: paymentIntent.last_payment_error?.message ?? "Payment failed",
        },
      });
    }
  }

  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) {
      await prisma.order.updateMany({
        where: {
          id: orderId,
          stripePaymentIntentId: paymentIntent.id,
          status: { in: [...PAYMENT_FAILURE_MUTABLE_ORDER_STATUSES] },
          fulfillmentStatus: "NOT_STARTED",
          paymentStatus: { not: "CAPTURED" },
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          fulfillmentStatus: "ERROR",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
