import type { ProductSearchResult } from "@/lib/suppliers/providers/types";

export interface CandidateScoreResult {
  score: number;
  marginPercent: number | null;
  signals: Record<string, unknown>;
}

export function scoreCandidate(input: {
  result: ProductSearchResult;
  providerReliability: number;
  existingTitles?: string[];
}): CandidateScoreResult {
  const { result } = input;
  const marginPercent = estimateMarginPercent(result);
  const avgShipping =
    result.shippingDaysMin != null && result.shippingDaysMax != null
      ? (result.shippingDaysMin + result.shippingDaysMax) / 2
      : null;

  const marginScore = marginPercent == null ? 0.45 : clamp01(marginPercent / 45);
  const shippingScore = avgShipping == null ? 0 : clamp01(1 - (avgShipping - 4) / 20);
  const mediaScore = clamp01(result.media.filter((media) => media.mediaType === "IMAGE").length / 4);
  const completenessScore = completeness(result);
  const stockScore = result.stockStatus === "IN_STOCK" ? 1 : result.stockStatus === "LOW_STOCK" ? 0.6 : result.stockStatus === "UNKNOWN" ? 0.35 : 0;
  const uniquenessScore = estimateUniqueness(result.title, input.existingTitles ?? []);

  const total =
    marginScore * 22 +
    shippingScore * 16 +
    clamp01(input.providerReliability) * 14 +
    mediaScore * 16 +
    completenessScore * 16 +
    stockScore * 8 +
    uniquenessScore * 4 +
    0.5 * 4;

  return {
    score: Math.round(total * 10) / 10,
    marginPercent,
    signals: {
      marginScore,
      shippingScore,
      mediaScore,
      completenessScore,
      stockScore,
      uniquenessScore,
      seoPotential: "placeholder",
      sourceSignals: result.signals,
    },
  };
}

function estimateMarginPercent(result: ProductSearchResult): number | null {
  if (!result.price || result.supplierCost == null) return null;
  const shippingCost = result.shippingCost ?? 0;
  return Math.round(((result.price - result.supplierCost - shippingCost) / result.price) * 1000) / 10;
}

function completeness(result: ProductSearchResult): number {
  let points = 0;
  if (result.title.length > 10) points += 1;
  if ((result.description?.length ?? 0) > 80) points += 1;
  if (result.specs.length >= 2) points += 1;
  if (result.sourceUrl) points += 1;
  if (result.price && result.currency) points += 1;
  if (result.shippingDaysMin != null && result.shippingDaysMax != null) points += 1;
  return clamp01(points / 6);
}

function estimateUniqueness(title: string, existingTitles: string[]): number {
  const normalized = new Set(title.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
  if (normalized.size === 0 || existingTitles.length === 0) return 0.75;
  const bestOverlap = existingTitles.reduce((best, existing) => {
    const words = existing.toLowerCase().split(/\W+/).filter((word) => normalized.has(word));
    return Math.max(best, words.length / normalized.size);
  }, 0);
  return clamp01(1 - bestOverlap);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

