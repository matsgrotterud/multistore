import type { PricePositioning } from "@/lib/ai/types";

export const CATALOG_SELECTION_VERSION = "catalog-selection.v1" as const;

export interface CatalogSelectionCandidateV1 {
  id: string;
  providerKey: string;
  externalId: string;
  title: string;
  price: number | null;
  currency: string | null;
  shippingCost: number | null;
  marginPercent: number | null;
  shippingDaysMax: number | null;
  stockStatus: string;
  score: number;
  mediaCount: number;
  variantIdentityReady: boolean;
  relevanceState: "PASS" | "FAIL" | "UNKNOWN" | "REVIEW";
  manualReviewTerms?: string[];
}

export interface CatalogSelectionScoreV1 {
  supplierQuality: number;
  affordability: number;
  margin: number;
  shipping: number;
  media: number;
  stock: number;
  novelty: number;
}

export interface CatalogSelectionEntryV1 {
  version: typeof CATALOG_SELECTION_VERSION;
  candidateId: string;
  providerKey: string;
  externalId: string;
  rank: number;
  score: number;
  priceBand: "BUDGET" | "CORE" | "PREMIUM";
  components: CatalogSelectionScoreV1;
  reasonCodes: string[];
}

export interface CatalogSelectionPlanV1 {
  version: typeof CATALOG_SELECTION_VERSION;
  pricePositioning: PricePositioning;
  comparisonCurrency: string | null;
  requestedCount: number;
  eligibleCount: number;
  selectedCount: number;
  selected: CatalogSelectionEntryV1[];
  rejected: Array<{ candidateId: string; reasonCodes: string[] }>;
}

interface CatalogSelectionRequestV1 {
  candidates: CatalogSelectionCandidateV1[];
  requestedCount: number;
  pricePositioning: PricePositioning;
  classConcepts?: string[];
  maxShippingDays?: number;
}

const TITLE_STOP_WORDS = new Set([
  "and",
  "best",
  "for",
  "from",
  "hot",
  "new",
  "of",
  "official",
  "product",
  "sale",
  "the",
  "to",
  "with",
]);

const POSITIONING_WEIGHTS: Record<
  PricePositioning,
  Omit<CatalogSelectionScoreV1, "novelty">
> = {
  budget: {
    supplierQuality: 0.3,
    affordability: 0.3,
    margin: 0.13,
    shipping: 0.11,
    media: 0.08,
    stock: 0.08,
  },
  value: {
    supplierQuality: 0.37,
    affordability: 0.2,
    margin: 0.15,
    shipping: 0.11,
    media: 0.09,
    stock: 0.08,
  },
  premium: {
    supplierQuality: 0.5,
    affordability: 0.03,
    margin: 0.15,
    shipping: 0.12,
    media: 0.12,
    stock: 0.08,
  },
  mixed: {
    supplierQuality: 0.4,
    affordability: 0.12,
    margin: 0.14,
    shipping: 0.12,
    media: 0.12,
    stock: 0.1,
  },
};

/**
 * Evidence-based catalog curation for generated stores.
 *
 * Supplier truth and the hard relevance/media gates run before this planner.
 * The planner is allowed to rank only eligible candidates; price or novelty
 * can never compensate for missing provenance, out-of-stock inventory or a
 * failed product-class match. Greedy novelty scoring avoids importing a dozen
 * near-identical listings while keeping the result deterministic and auditable.
 */
export function selectCatalogCandidatesV1(
  input: CatalogSelectionRequestV1
): CatalogSelectionPlanV1 {
  const requestedCount = Math.max(1, Math.min(12, Math.floor(input.requestedCount)));
  const uniqueCandidates = dedupeCandidates(input.candidates);
  const rejected: CatalogSelectionPlanV1["rejected"] = [];
  const gateEligible = uniqueCandidates.filter((candidate) => {
    const reasonCodes = eligibilityReasonCodes(
      candidate,
      input.maxShippingDays ?? 18
    );
    if (reasonCodes.length > 0) {
      rejected.push({ candidateId: candidate.id, reasonCodes });
      return false;
    }
    return true;
  });
  const comparisonCurrency = preferredComparisonCurrency(gateEligible);
  const eligible = gateEligible.filter((candidate) => {
    if (candidate.currency === comparisonCurrency) return true;
    rejected.push({
      candidateId: candidate.id,
      reasonCodes: ["SELECTION_CURRENCY_NOT_COMPARABLE"],
    });
    return false;
  });
  const landedPrices = eligible.map(landedPrice).sort((left, right) => left - right);
  const classTokens = new Set(
    (input.classConcepts ?? []).flatMap((concept) => titleTokens(concept))
  );
  const weights = POSITIONING_WEIGHTS[input.pricePositioning];
  const scored = eligible.map((candidate) => {
    const components = baseComponents(candidate, landedPrices);
    const baseScore = weightedBaseScore(components, weights);
    return { candidate, components, baseScore };
  });
  const selected: CatalogSelectionEntryV1[] = [];
  const selectedTokenSets: Set<string>[] = [];

  while (selected.length < requestedCount && scored.length > 0) {
    const ranked = scored
      .map((entry) => {
        const candidateTokens = distinctiveTitleTokens(entry.candidate.title, classTokens);
        const novelty = selectedTokenSets.length === 0
          ? 1
          : 1 - Math.max(...selectedTokenSets.map((tokens) => jaccard(tokens, candidateTokens)));
        const reviewPenalty = (entry.candidate.manualReviewTerms?.length ?? 0) > 0 ? 0.025 : 0;
        return {
          ...entry,
          candidateTokens,
          novelty,
          total: clamp01(entry.baseScore * 0.86 + novelty * 0.14 - reviewPenalty),
        };
      })
      .sort(
        (left, right) =>
          right.total - left.total ||
          right.baseScore - left.baseScore ||
          left.candidate.id.localeCompare(right.candidate.id)
      );
    const winner = ranked[0];
    if (!winner) break;
    const rank = selected.length + 1;
    selected.push({
      version: CATALOG_SELECTION_VERSION,
      candidateId: winner.candidate.id,
      providerKey: winner.candidate.providerKey,
      externalId: winner.candidate.externalId,
      rank,
      score: round1(winner.total * 100),
      priceBand: priceBand(landedPrice(winner.candidate), landedPrices),
      components: {
        ...winner.components,
        novelty: round3(winner.novelty),
      },
      reasonCodes: selectionReasonCodes(winner.candidate, winner.components, winner.novelty),
    });
    selectedTokenSets.push(winner.candidateTokens);
    const selectedIndex = scored.findIndex(
      (entry) => entry.candidate.id === winner.candidate.id
    );
    scored.splice(selectedIndex, 1);
  }

  return {
    version: CATALOG_SELECTION_VERSION,
    pricePositioning: input.pricePositioning,
    comparisonCurrency,
    requestedCount,
    eligibleCount: eligible.length,
    selectedCount: selected.length,
    selected,
    rejected: rejected.sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
  };
}

function dedupeCandidates(
  candidates: CatalogSelectionCandidateV1[]
): CatalogSelectionCandidateV1[] {
  const bySupplierIdentity = new Map<string, CatalogSelectionCandidateV1>();
  for (const candidate of [...candidates].sort((left, right) => left.id.localeCompare(right.id))) {
    const key = `${candidate.providerKey.toLowerCase()}:${candidate.externalId}`;
    const current = bySupplierIdentity.get(key);
    if (!current || candidate.score > current.score) bySupplierIdentity.set(key, candidate);
  }
  return [...bySupplierIdentity.values()];
}

function eligibilityReasonCodes(
  candidate: CatalogSelectionCandidateV1,
  maxShippingDays: number
): string[] {
  const reasons: string[] = [];
  if (!candidate.providerKey.trim() || !candidate.externalId.trim()) {
    reasons.push("SELECTION_SUPPLIER_IDENTITY_MISSING");
  }
  if (candidate.relevanceState !== "PASS") reasons.push("SELECTION_RELEVANCE_NOT_PASS");
  if (!["IN_STOCK", "LOW_STOCK"].includes(candidate.stockStatus)) {
    reasons.push(
      candidate.stockStatus === "OUT_OF_STOCK"
        ? "SELECTION_OUT_OF_STOCK"
        : "SELECTION_STOCK_UNVERIFIED"
    );
  }
  if (!Number.isFinite(candidate.price) || (candidate.price ?? 0) <= 0) {
    reasons.push("SELECTION_PRICE_MISSING");
  }
  if (!candidate.currency || !/^[A-Z]{3}$/.test(candidate.currency)) {
    reasons.push("SELECTION_CURRENCY_MISSING");
  }
  if (
    candidate.shippingCost == null ||
    !Number.isFinite(candidate.shippingCost) ||
    candidate.shippingCost < 0
  ) {
    reasons.push("SELECTION_SHIPPING_COST_MISSING");
  }
  if (candidate.shippingDaysMax == null || candidate.shippingDaysMax <= 0) {
    reasons.push("SELECTION_SHIPPING_EVIDENCE_MISSING");
  } else if (candidate.shippingDaysMax > maxShippingDays) {
    reasons.push("SELECTION_SHIPPING_TOO_SLOW");
  }
  if (candidate.mediaCount < 2) reasons.push("SELECTION_MEDIA_INSUFFICIENT");
  if (!candidate.variantIdentityReady) {
    reasons.push("SELECTION_VARIANT_IDENTITY_INVALID");
  }
  if (!Number.isFinite(candidate.score) || candidate.score <= 0) {
    reasons.push("SELECTION_SUPPLIER_SCORE_INVALID");
  }
  return reasons;
}

function baseComponents(
  candidate: CatalogSelectionCandidateV1,
  prices: number[]
): Omit<CatalogSelectionScoreV1, "novelty"> {
  return {
    supplierQuality: round3(clamp01(candidate.score / 100)),
    affordability: round3(affordabilityScore(landedPrice(candidate), prices)),
    margin: round3(
      candidate.marginPercent == null ? 0.4 : clamp01(candidate.marginPercent / 45)
    ),
    shipping: round3(
      candidate.shippingDaysMax == null
        ? 0.25
        : clamp01(1 - (candidate.shippingDaysMax - 4) / 24)
    ),
    media: round3(clamp01(candidate.mediaCount / 5)),
    stock: candidate.stockStatus === "IN_STOCK" ? 1 : candidate.stockStatus === "LOW_STOCK" ? 0.6 : 0.35,
  };
}

function weightedBaseScore(
  components: Omit<CatalogSelectionScoreV1, "novelty">,
  weights: Omit<CatalogSelectionScoreV1, "novelty">
): number {
  return Object.entries(weights).reduce(
    (sum, [key, weight]) =>
      sum + components[key as keyof typeof components] * weight,
    0
  );
}

function affordabilityScore(price: number, prices: number[]): number {
  if (prices.length <= 1) return 0.5;
  const index = prices.findIndex((candidatePrice) => candidatePrice >= price);
  const percentile = (index < 0 ? prices.length - 1 : index) / (prices.length - 1);
  return clamp01(1 - percentile);
}

function landedPrice(candidate: CatalogSelectionCandidateV1): number {
  if (
    candidate.price == null ||
    candidate.shippingCost == null ||
    !Number.isFinite(candidate.price) ||
    !Number.isFinite(candidate.shippingCost)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  return candidate.price + candidate.shippingCost;
}

function preferredComparisonCurrency(
  candidates: CatalogSelectionCandidateV1[]
): string | null {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    if (!candidate.currency) continue;
    counts.set(candidate.currency, (counts.get(candidate.currency) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(
      ([leftCurrency, leftCount], [rightCurrency, rightCount]) =>
        rightCount - leftCount || leftCurrency.localeCompare(rightCurrency)
    )[0]?.[0] ?? null;
}

function priceBand(
  price: number,
  prices: number[]
): CatalogSelectionEntryV1["priceBand"] {
  if (prices.length < 3) return "CORE";
  const low = prices[Math.floor((prices.length - 1) / 3)] ?? price;
  const high = prices[Math.floor(((prices.length - 1) * 2) / 3)] ?? price;
  if (price <= low) return "BUDGET";
  if (price >= high) return "PREMIUM";
  return "CORE";
}

function selectionReasonCodes(
  candidate: CatalogSelectionCandidateV1,
  components: Omit<CatalogSelectionScoreV1, "novelty">,
  novelty: number
): string[] {
  const reasons = ["SELECTION_HARD_GATES_PASS"];
  if (components.affordability >= 0.67) reasons.push("SELECTION_AFFORDABLE");
  if (components.supplierQuality >= 0.75) reasons.push("SELECTION_SUPPLIER_QUALITY_HIGH");
  if (components.margin >= 0.75) reasons.push("SELECTION_MARGIN_HEALTHY");
  if (components.shipping >= 0.7) reasons.push("SELECTION_SHIPPING_COMPETITIVE");
  if (components.media >= 0.8) reasons.push("SELECTION_MEDIA_RICH");
  if (novelty >= 0.7) reasons.push("SELECTION_CATALOG_ROLE_DISTINCT");
  if ((candidate.manualReviewTerms?.length ?? 0) > 0) {
    reasons.push("SELECTION_MANUAL_REVIEW_REQUIRED");
  }
  return reasons;
}

function distinctiveTitleTokens(title: string, classTokens: Set<string>): Set<string> {
  const filtered = titleTokens(title).filter(
    (token) => !TITLE_STOP_WORDS.has(token) && !classTokens.has(token)
  );
  return new Set(filtered.length > 0 ? filtered : titleTokens(title));
}

function titleTokens(value: string): string[] {
  return value
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 1) ?? [];
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
