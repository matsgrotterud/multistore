/**
 * Pricing engine.
 *
 * Computes a margin-safe retail price from real cost inputs. Used by the
 * supplier import pipeline and by admin tooling; the seeded catalog stores
 * the resulting marginPercent so the storefront never has to recompute it.
 */

export interface PriceInput {
  /** What the supplier charges us per unit. */
  supplierCost: number;
  /** What we pay to ship one unit to the customer. */
  shippingCost: number;
  /** Payment processor fee, e.g. 0.029 for 2.9%. */
  paymentFeeRate?: number;
  /** Fixed payment fee per transaction, e.g. 0.30. */
  paymentFeeFixed?: number;
  /** Expected fraction of orders returned, e.g. 0.04 for 4%. */
  expectedReturnRate?: number;
  /** Target gross margin as a fraction of price, e.g. 0.35 for 35%. */
  targetMargin?: number;
}

export interface PriceResult {
  price: number;
  landedCost: number;
  estimatedFees: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
}

const DEFAULTS = {
  paymentFeeRate: 0.029,
  paymentFeeFixed: 0.3,
  expectedReturnRate: 0.04,
  targetMargin: 0.35,
};

/**
 * Solves price P such that:
 *   P - landedCost - feeRate*P - feeFixed - returnRate*landedCost = targetMargin * P
 */
export function calculatePrice(input: PriceInput): PriceResult {
  const paymentFeeRate = input.paymentFeeRate ?? DEFAULTS.paymentFeeRate;
  const paymentFeeFixed = input.paymentFeeFixed ?? DEFAULTS.paymentFeeFixed;
  const expectedReturnRate =
    input.expectedReturnRate ?? DEFAULTS.expectedReturnRate;
  const targetMargin = input.targetMargin ?? DEFAULTS.targetMargin;

  const landedCost = input.supplierCost + input.shippingCost;
  const effectiveCost =
    landedCost * (1 + expectedReturnRate) + paymentFeeFixed;

  const denominator = 1 - paymentFeeRate - targetMargin;
  if (denominator <= 0) {
    throw new Error(
      "Target margin plus payment fees exceed 100% of price; lower the target margin."
    );
  }

  const rawPrice = effectiveCost / denominator;
  const price = toCharmPrice(rawPrice);

  const estimatedFees = price * paymentFeeRate + paymentFeeFixed;
  const grossMarginAmount = price - landedCost - estimatedFees;
  const grossMarginPercent = price > 0 ? (grossMarginAmount / price) * 100 : 0;

  return {
    price,
    landedCost,
    estimatedFees: round2(estimatedFees),
    grossMarginAmount: round2(grossMarginAmount),
    grossMarginPercent: round2(grossMarginPercent),
  };
}

/**
 * compareAtPrice is only honest if the product genuinely sold at that price.
 * This helper validates a configured compare-at value instead of inventing
 * one; it returns null when the value would be misleading.
 */
export function honestCompareAtPrice(
  price: number,
  configuredCompareAt: number | null | undefined
): number | null {
  if (!configuredCompareAt) return null;
  if (configuredCompareAt <= price) return null;
  // Reject implausible anchor prices (> 60% discount looks like fake urgency).
  if ((configuredCompareAt - price) / configuredCompareAt > 0.6) return null;
  return round2(configuredCompareAt);
}

/** Round to .95 / .00 endings without inflating the price. */
function toCharmPrice(raw: number): number {
  const whole = Math.ceil(raw);
  const charm = whole - 0.05;
  return charm >= raw ? round2(charm) : round2(whole);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
