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
  // Mock checkout must be explicitly enabled. A missing production variable
  // must never turn a public storefront into a test checkout.
  return process.env.MOCK_CHECKOUT === "true";
}

export function paymentCaptureMode(): "automatic" | "manual" {
  // Dropshipping must authorize first and capture only after the supplier
  // route is durably confirmed. Missing or mistyped configuration fails safe.
  return process.env.PAYMENT_CAPTURE_MODE === "automatic" ? "automatic" : "manual";
}
