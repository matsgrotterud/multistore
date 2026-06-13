import type { Product, Store } from "@prisma/client";
import {
  AFFILIATE_FALLBACK_MARGIN_THRESHOLD,
  calculateGrossMargin,
} from "@/lib/monetization/margin";
import { parseStringArray } from "@/lib/utils/json";

/**
 * Commercial recommendations for the admin dashboard. None of this is shown
 * to shoppers; it informs catalog strategy per store.
 */

export interface ProductInsight {
  productId: string;
  title: string;
  marginPercent: number;
  upsellCandidates: { productId: string; title: string; price: number }[];
  subscriptionSuitable: boolean;
  subscriptionReason: string | null;
  affiliateFallbackRecommended: boolean;
}

const CONSUMABLE_HINTS = [
  "toothbrush",
  "brush head",
  "refill",
  "floss",
  "filter",
  "shampoo",
  "wipes",
  "treats",
  "pads",
  "blade",
  "soap",
  "replacement",
];

/** Consumable niches where replenishment subscriptions usually work. */
const SUBSCRIPTION_FRIENDLY_NICHES = ["oral care", "pet care", "grooming"];

export function buildProductInsights(
  store: Store,
  products: Product[]
): ProductInsight[] {
  return products.map((product) => {
    const margin = calculateGrossMargin(product);

    const upsellCandidates = recommendUpsells(product, products).map(
      (candidate) => ({
        productId: candidate.id,
        title: candidate.title,
        price: candidate.price,
      })
    );

    const subscription = assessSubscriptionSuitability(store, product);

    return {
      productId: product.id,
      title: product.title,
      marginPercent: margin.grossMarginPercent,
      upsellCandidates,
      subscriptionSuitable: subscription.suitable,
      subscriptionReason: subscription.reason,
      affiliateFallbackRecommended:
        margin.grossMarginPercent < AFFILIATE_FALLBACK_MARGIN_THRESHOLD,
    };
  });
}

/**
 * Upsells: same category, 15-80% more expensive, decent score. The classic
 * "spend a little more, get meaningfully more" ladder.
 */
export function recommendUpsells(
  product: Product,
  catalog: Product[],
  limit = 3
): Product[] {
  return catalog
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryId === product.categoryId &&
        candidate.isPublished &&
        candidate.price > product.price * 1.15 &&
        candidate.price < product.price * 1.8
    )
    .sort((a, b) => b.productScore - a.productScore)
    .slice(0, limit);
}

export function assessSubscriptionSuitability(
  store: Store,
  product: Product
): { suitable: boolean; reason: string | null } {
  const haystack = `${product.title} ${product.description}`.toLowerCase();
  const useCases = parseStringArray(product.useCases);

  const isConsumable =
    CONSUMABLE_HINTS.some((hint) => haystack.includes(hint)) ||
    useCases.includes("subscription");
  const nicheFriendly = SUBSCRIPTION_FRIENDLY_NICHES.some((niche) =>
    store.niche.toLowerCase().includes(niche)
  );

  if (isConsumable && product.price <= 60) {
    return {
      suitable: true,
      reason: nicheFriendly
        ? "Consumable in a replenishment-friendly niche; offer a 2-3 month refill cadence."
        : "Consumable product; test a refill subscription with a small discount.",
    };
  }
  return { suitable: false, reason: null };
}
