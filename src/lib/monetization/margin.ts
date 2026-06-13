import type { Product } from "@prisma/client";
import { round2 } from "@/lib/pricing/calculate-price";

/**
 * Margin analysis used by admin tooling. These numbers are internal — they
 * are never rendered on the storefront.
 */

export interface MarginBreakdown {
  price: number;
  cost: number;
  shippingCost: number;
  estimatedPaymentFee: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  health: "HEALTHY" | "ACCEPTABLE" | "AT_RISK";
}

const PAYMENT_FEE_RATE = 0.029;
const PAYMENT_FEE_FIXED = 0.3;

/** Below this margin, recommend an affiliate fallback instead of stocking. */
export const AFFILIATE_FALLBACK_MARGIN_THRESHOLD = 15;
/** Below this margin, surface an internal warning in cart/checkout logs. */
export const MARGIN_SAFE_THRESHOLD = 10;

export function calculateGrossMargin(
  product: Pick<Product, "price" | "cost" | "shippingCost">
): MarginBreakdown {
  const estimatedPaymentFee = round2(
    product.price * PAYMENT_FEE_RATE + PAYMENT_FEE_FIXED
  );
  const grossMarginAmount = round2(
    product.price - product.cost - product.shippingCost - estimatedPaymentFee
  );
  const grossMarginPercent =
    product.price > 0 ? round2((grossMarginAmount / product.price) * 100) : 0;

  return {
    price: product.price,
    cost: product.cost,
    shippingCost: product.shippingCost,
    estimatedPaymentFee,
    grossMarginAmount,
    grossMarginPercent,
    health:
      grossMarginPercent >= 30
        ? "HEALTHY"
        : grossMarginPercent >= AFFILIATE_FALLBACK_MARGIN_THRESHOLD
          ? "ACCEPTABLE"
          : "AT_RISK",
  };
}
