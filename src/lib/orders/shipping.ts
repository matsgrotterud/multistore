import { round2 } from "@/lib/pricing/calculate-price";

/** Current storefront shipping rule; every channel must quote this same rule. */
export function calculateCheckoutShipping(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : round2(5.95);
}
