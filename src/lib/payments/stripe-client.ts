import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

export function isMockCheckoutEnabled(): boolean {
  return process.env.MOCK_CHECKOUT !== "false";
}

export function paymentCaptureMode(): "automatic" | "manual" {
  return process.env.PAYMENT_CAPTURE_MODE === "manual" ? "manual" : "automatic";
}
