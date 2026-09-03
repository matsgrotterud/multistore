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

/**
 * These terms describe product classes that can be evaluated in an internal,
 * noindex preview, but must still be reviewed before live commerce. They are
 * deliberately not hard vetoes; the V3 product-class policy remains the
 * authority that blocks publication and autonomous launch.
 */
const manualReviewEligibleTerms = new Set(["drone", "battery", "charger"]);

const restrictedTermPatterns: Record<string, RegExp> = {
  supplement: /\bsupplements?\b/i,
  gummy: /\b(?:gummy|gummies)\b/i,
  cbd: /\bcbd\b/i,
  medical: /\bmedical\b/i,
  acne: /\bacne\b/i,
  "skin whitening": /\bskin[\s-]+whitening\b/i,
  baby: /\b(?:baby|babies)\b/i,
  infant: /\binfants?\b/i,
  "child safety": /\bchild[\s-]+safety\b/i,
  drone: /\bdrones?\b/i,
  battery: /\b(?:battery|batteries)\b/i,
  charger: /\bchargers?\b/i,
  weapon: /\bweapons?\b/i,
  knife: /\b(?:knife|knives)\b/i,
  "self defense": /\bself[\s-]+defen[cs]e\b/i,
  replica: /\breplicas?\b/i,
  designer: /\bdesigners?\b/i,
  trademark: /\btrademarks?\b/i,
};

const benignAdultMetadata = [
  /\bapplicable\s+age\s*(?::|：|-)?\s*adults?\b/gi,
];

const adultGoodsPatterns = [
  /\badult[\s-]+(?:only|toy|toys|novelty|novelties|product|products|content|entertainment|shop)\b/i,
  /\bsex(?:ual)?[\s-]+toys?\b/i,
  /\b(?:erotic|fetish|pornographic)\b/i,
  /\b(?:vibrator|vibrators|dildo|dildos|masturbator|masturbators)\b/i,
];

/**
 * Concrete wearable nouns used only to distinguish an adult size/audience
 * label from adult-content merchandise. A nearby apparel noun is not allowed
 * to suppress the explicit adult-goods patterns above.
 */
const wearableAdultContextTerms = new Set([
  "apparel",
  "clothing",
  "headwear",
  "hat",
  "hats",
  "cap",
  "caps",
  "beanie",
  "beanies",
  "shirt",
  "shirts",
  "jacket",
  "jackets",
  "coat",
  "coats",
  "dress",
  "dresses",
  "skirt",
  "skirts",
  "trouser",
  "trousers",
  "pants",
  "jeans",
  "shorts",
  "sock",
  "socks",
  "glove",
  "gloves",
  "scarf",
  "scarves",
  "belt",
  "belts",
  "shoe",
  "shoes",
  "boot",
  "boots",
  "slipper",
  "slippers",
]);

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
  /** Server-approved terms that may proceed to a review-only preview. */
  manualReviewTerms?: string[];
}): QualityGateResult {
  const reasons: string[] = [];
  const risk: Record<string, unknown> = {};
  const visibleTitle = extractVisibleRiskText(input.title);
  const visibleDescription = extractVisibleRiskText(input.description ?? "");
  const adultScreenedDescription = benignAdultMetadata.reduce(
    (text, pattern) => text.replace(pattern, " "),
    visibleDescription
  );
  const haystack = `${visibleTitle} ${adultScreenedDescription}`;
  const rawVisibleText = `${visibleTitle} ${visibleDescription}`;
  const adultRisk =
    adultGoodsPatterns.some((pattern) => pattern.test(rawVisibleText)) ||
    hasUnscreenedAdultMention(visibleTitle) ||
    hasUnscreenedAdultMention(adultScreenedDescription);
  const matchedRiskTerms = restrictedTerms.filter((term) =>
    term === "adult"
      ? adultRisk
      : (restrictedTermPatterns[term]?.test(haystack) ?? false)
  );
  const permittedManualReviewTerms = new Set(
    (input.manualReviewTerms ?? []).filter((term) =>
      manualReviewEligibleTerms.has(term)
    )
  );
  const matchedManualReviewTerms = matchedRiskTerms.filter((term) =>
    permittedManualReviewTerms.has(term)
  );
  const matchedRestrictedTerms = matchedRiskTerms.filter(
    (term) => !permittedManualReviewTerms.has(term)
  );

  if (matchedRestrictedTerms.length > 0) {
    reasons.push(`Restricted/risky terms require rejection: ${matchedRestrictedTerms.join(", ")}`);
    risk.restrictedTerms = matchedRestrictedTerms;
  }
  if (matchedManualReviewTerms.length > 0) {
    risk.manualReviewTerms = matchedManualReviewTerms;
    risk.reviewRequired = true;
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

/**
 * Return true when at least one adult label is not locally anchored to a
 * concrete wearable/apparel noun. This keeps "Adult Western Cowboy Hat" and
 * "headwear sized for adults" out of the adult-content bucket while preserving
 * a fail-closed result for unrelated adult-labelled goods.
 */
function hasUnscreenedAdultMention(value: string): boolean {
  const tokens = value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const adultIndexes = tokens.flatMap((token, index) =>
    token === "adult" || token === "adults" ? [index] : []
  );
  if (adultIndexes.length === 0) return false;

  const wearableIndexes = tokens.flatMap((token, index) =>
    wearableAdultContextTerms.has(token) ? [index] : []
  );
  return adultIndexes.some(
    (adultIndex) =>
      !wearableIndexes.some(
        (wearableIndex) => Math.abs(wearableIndex - adultIndex) <= 5
      )
  );
}

/**
 * Keep risk screening focused on shopper-visible supplier claims. Supplier
 * descriptions commonly contain image tags, tracking URLs and opaque hashes;
 * those machine-only values must not trigger restricted-term review.
 */
function extractVisibleRiskText(value: string): string {
  const decodedMarkup = value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&amp;/gi, "&");

  return decodedMarkup
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi, " ")
    .replace(/&(?:[a-z][a-z0-9]+|#\d+|#x[a-f0-9]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateImportedProductReadiness(candidate: ProductCandidate): QualityGateResult {
  const parsedRisk = parseJsonObject(candidate.riskJson);
  const signals = parseJsonObject(candidate.signalsJson);
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
    manualReviewTerms: qualityGateManualReviewTerms(signals.nicheIntentV1),
  });
  return { ...result, risk: { ...parsedRisk, ...result.risk } };
}

/**
 * Only the reviewed static camera-drone class can downgrade these risk terms
 * from a hard rejection to internal-preview review evidence. This prevents a
 * battery mention in an otherwise ALLOW class from bypassing live gates.
 */
export function qualityGateManualReviewTerms(intent: unknown): string[] {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) return [];
  const candidate = intent as Record<string, unknown>;
  return candidate.productClass === "electronics.camera-drones" &&
    candidate.policyDecision === "MANUAL_REVIEW_REQUIRED"
    ? [...manualReviewEligibleTerms]
    : [];
}

function safeArrayLength(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
