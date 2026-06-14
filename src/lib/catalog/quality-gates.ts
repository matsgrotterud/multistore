import type { ProductCandidate } from "@prisma/client";
import { parseJsonObject } from "@/lib/utils/json";

const restrictedTerms = [
  "supplement",
  "gummy",
  "cbd",
  "medical",
  "acne",
  "skin whitening",
  "baby",
  "infant",
  "child safety",
  "drone",
  "battery",
  "charger",
  "weapon",
  "knife",
  "self defense",
  "adult",
  "replica",
  "designer",
  "trademark",
];

export interface QualityGateResult {
  passes: boolean;
  status: "ENRICHED" | "REJECTED";
  reasons: string[];
  risk: Record<string, unknown>;
}

export function evaluateCandidateQuality(input: {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  externalId?: string | null;
  shippingDaysMin?: number | null;
  shippingDaysMax?: number | null;
  mediaCount: number;
  score: number;
  minScore?: number;
  marginPercent?: number | null;
  minMarginPercent?: number;
}): QualityGateResult {
  const reasons: string[] = [];
  const risk: Record<string, unknown> = {};
  const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const matchedRestrictedTerms = restrictedTerms.filter((term) => haystack.includes(term));

  if (matchedRestrictedTerms.length > 0) {
    reasons.push(`Manual review required for restricted/risky terms: ${matchedRestrictedTerms.join(", ")}`);
    risk.restrictedTerms = matchedRestrictedTerms;
  }
  if (!input.sourceUrl || !input.externalId) {
    reasons.push("Missing source URL or external supplier ID.");
  }
  if (input.shippingDaysMin == null || input.shippingDaysMax == null) {
    reasons.push("Missing supplier shipping estimate.");
  }
  if (input.mediaCount < 2) {
    reasons.push("Fewer than 2 usable supplier media assets.");
  }
  if (input.marginPercent != null && input.minMarginPercent != null && input.marginPercent < input.minMarginPercent) {
    reasons.push(`Estimated margin ${input.marginPercent.toFixed(1)}% is below ${input.minMarginPercent}%.`);
  }
  if (input.score < (input.minScore ?? 50)) {
    reasons.push(`Candidate score ${input.score.toFixed(1)} is below minimum ${(input.minScore ?? 50).toFixed(1)}.`);
  }

  return {
    passes: reasons.length === 0,
    status: reasons.length === 0 ? "ENRICHED" : "REJECTED",
    reasons,
    risk,
  };
}

export function evaluateImportedProductReadiness(candidate: ProductCandidate): QualityGateResult {
  const parsedRisk = parseJsonObject(candidate.riskJson);
  const result = evaluateCandidateQuality({
    title: candidate.titleEnhanced ?? candidate.titleRaw,
    description: candidate.descriptionEnhanced ?? candidate.descriptionRaw,
    sourceUrl: candidate.sourceUrl,
    externalId: candidate.externalId,
    shippingDaysMin: candidate.shippingDaysMin,
    shippingDaysMax: candidate.shippingDaysMax,
    mediaCount: safeArrayLength(candidate.mediaJson),
    score: candidate.score,
    minScore: 75,
    marginPercent: candidate.marginPercent,
    minMarginPercent: 25,
  });
  return { ...result, risk: { ...parsedRisk, ...result.risk } };
}

function safeArrayLength(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

