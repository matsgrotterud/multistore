import { calculatePrice, round2 } from "@/lib/pricing/calculate-price";

/**
 * Phase 1 currency normalization.
 *
 * Supplier feeds (CJ etc.) quote prices in their own currency (typically USD or
 * CNY) while a generated store can use any currency (e.g. NOK). We must never
 * display a USD-magnitude number labelled as NOK, so all imported costs are
 * converted into the store currency BEFORE the retail price is computed and
 * `product.currency` is always set to the store currency.
 *
 * IMPORTANT: these rates are STATIC, APPROXIMATE Phase-1 fallbacks. They exist
 * so generated stores show sane numbers, not for accounting. Override any pair
 * with an env var `FX_RATE_<FROM>_<TO>` (e.g. FX_RATE_USD_NOK=10.8) or wire a
 * live FX source before charging real money. See README.
 */

// Approximate units of currency per 1 USD (mid-2025 ballpark).
const USD_PER_UNIT_INVERSE: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NOK: 10.8,
  SEK: 10.7,
  DKK: 6.9,
  CHF: 0.88,
  CNY: 7.2,
  CAD: 1.37,
  AUD: 1.52,
  JPY: 152,
  PLN: 3.95,
};

function envRate(from: string, to: string): number | null {
  const raw = process.env[`FX_RATE_${from}_${to}`];
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Units of `to` per 1 unit of `from`. Returns 1 for unknown/equal currencies. */
export function fxRate(from: string, to: string): number {
  const f = (from || "USD").toUpperCase();
  const t = (to || "USD").toUpperCase();
  if (f === t) return 1;

  const direct = envRate(f, t);
  if (direct) return direct;
  const inverse = envRate(t, f);
  if (inverse) return 1 / inverse;

  const fromPerUsd = USD_PER_UNIT_INVERSE[f];
  const toPerUsd = USD_PER_UNIT_INVERSE[t];
  if (!fromPerUsd || !toPerUsd) return 1; // Unknown currency: do not invent a rate.
  return toPerUsd / fromPerUsd;
}

export function convertCurrency(
  amount: number | null | undefined,
  from: string,
  to: string
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  return round2(amount * fxRate(from, to));
}

export interface NormalizedImportedPrice {
  /** Final retail price in store currency. */
  price: number;
  /** Landed unit cost in store currency. */
  cost: number;
  /** Shipping cost in store currency. */
  shippingCost: number;
  currency: string;
  marginPercent: number;
  /** True when a non-trivial FX conversion was applied. */
  converted: boolean;
}

/**
 * Compute a store-currency retail price from supplier inputs. When a supplier
 * cost is available we run the margin-safe pricing engine; otherwise we fall
 * back to a converted supplier list price with the target markup applied.
 */
export function normalizeImportedPrice(input: {
  supplierCost?: number | null;
  supplierPrice?: number | null;
  shippingCost?: number | null;
  supplierCurrency: string;
  storeCurrency: string;
  targetMargin?: number;
}): NormalizedImportedPrice {
  const from = (input.supplierCurrency || "USD").toUpperCase();
  const to = (input.storeCurrency || "USD").toUpperCase();
  const targetMargin = input.targetMargin ?? 0.35;
  const converted = from !== to;

  const cost = convertCurrency(input.supplierCost, from, to);
  const shippingCost = convertCurrency(input.shippingCost, from, to) ?? 0;
  const listPrice = convertCurrency(input.supplierPrice, from, to);

  if (cost != null) {
    const result = calculatePrice({
      supplierCost: cost,
      shippingCost,
      targetMargin,
    });
    return {
      price: result.price,
      cost,
      shippingCost,
      currency: to,
      marginPercent: result.grossMarginPercent,
      converted,
    };
  }

  // No supplier cost: keep the (converted) list price and estimate cost so the
  // margin figure is honest rather than fabricated.
  const price = listPrice ?? calculatePrice({ supplierCost: 10, shippingCost, targetMargin }).price;
  const estimatedCost = round2(price * (1 - targetMargin) - shippingCost);
  const safeCost = estimatedCost > 0 ? estimatedCost : round2(price * 0.55);
  const marginPercent =
    price > 0 ? round2(((price - safeCost - shippingCost) / price) * 100) : 0;

  return {
    price,
    cost: safeCost,
    shippingCost,
    currency: to,
    marginPercent,
    converted,
  };
}
