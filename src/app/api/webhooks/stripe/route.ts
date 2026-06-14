import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { routeOrder } from "@/lib/orders/route-order";
import { getStripeClient } from "@/lib/payments/stripe-client";

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

    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: { paymentStatus: "AUTHORIZED", status: "CONFIRMED" },
    });

    await routeOrder(orderId);
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
        status: { notIn: ["SUPPLIER_ORDERED", "FULFILLMENT_PENDING", "ERROR", "CANCELLED"] },
      },
      data: { paymentStatus: "CAPTURED", status: "CONFIRMED" },
    });

    await routeOrder(orderId);
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
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
      await prisma.order.update({
        where: { id: orderId },
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
