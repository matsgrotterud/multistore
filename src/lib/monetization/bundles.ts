import type { Product } from "@prisma/client";
import { parseStringArray } from "@/lib/utils/json";
import { round2 } from "@/lib/pricing/calculate-price";

/**
 * Bundle suggestions for admin: pairs of products from the same store whose
 * use cases overlap and whose combined margin can absorb a small bundle
 * discount. Internal tooling only.
 */

export interface BundleSuggestion {
  anchorProductId: string;
  anchorTitle: string;
  companionProductId: string;
  companionTitle: string;
  combinedPrice: number;
  suggestedBundlePrice: number;
  combinedMarginPercent: number;
  sharedUseCases: string[];
}

const BUNDLE_DISCOUNT = 0.08;

export function suggestBundles(
  products: Product[],
  maxSuggestions = 10
): BundleSuggestion[] {
  const suggestions: BundleSuggestion[] = [];

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const anchor = products[i];
      const companion = products[j];
      if (anchor.categoryId === companion.categoryId) continue; // bundles should cross categories

      const shared = intersect(
        parseStringArray(anchor.useCases),
        parseStringArray(companion.useCases)
      );
      if (shared.length === 0) continue;

      const combinedPrice = round2(anchor.price + companion.price);
      const suggestedBundlePrice = round2(combinedPrice * (1 - BUNDLE_DISCOUNT));
      const combinedCost =
        anchor.cost + anchor.shippingCost + companion.cost + companion.shippingCost;
      const combinedMarginPercent = round2(
        ((suggestedBundlePrice - combinedCost) / suggestedBundlePrice) * 100
      );
      if (combinedMarginPercent < 20) continue; // discount would eat the margin

      suggestions.push({
        anchorProductId: anchor.id,
        anchorTitle: anchor.title,
        companionProductId: companion.id,
        companionTitle: companion.title,
        combinedPrice,
        suggestedBundlePrice,
        combinedMarginPercent,
        sharedUseCases: shared,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.combinedMarginPercent - a.combinedMarginPercent)
    .slice(0, maxSuggestions);
}

function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}
