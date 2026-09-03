import {
  PORTFOLIO_GROWTH_PRIORITY_VERSION,
  type PortfolioGrowthLane,
  type PortfolioGrowthQueue,
  type PortfolioGrowthQueueItem,
  type PortfolioGrowthReasonCode,
  type StoreGrowthPlan,
  type StoreGrowthRecommendation,
} from "./types";

const LANE_ORDER: Record<PortfolioGrowthLane, number> = {
  INCIDENT: 0,
  SCALE_REVIEW: 1,
  OPTIMIZE: 2,
  MEASURE: 3,
  LAUNCH_BLOCKED: 4,
};

const REASON_ORDER: Record<PortfolioGrowthReasonCode, number> = {
  FULFILLMENT_INCIDENT: 0,
  NON_POSITIVE_MARGIN_INCIDENT: 1,
  NONLIVE_CAPTURED_COMMERCE_INCIDENT: 2,
  CHECKOUT_EVIDENCE_INCIDENT: 3,
  VERIFIED_SCALE_REVIEW_ELIGIBLE: 4,
  TRACTION_EVIDENCE_BLOCKED: 5,
  ZERO_SALES_FUNNEL: 6,
  INSUFFICIENT_MEASUREMENT: 7,
  STORE_NOT_LIVE: 8,
};

/**
 * Turn per-store growth plans into one deterministic, read-only operating
 * queue. The queue never compares revenue across currencies and never treats
 * client telemetry as proof of a sale or permission to spend.
 */
export function prioritizePortfolioGrowth(
  plans: readonly StoreGrowthPlan[]
): PortfolioGrowthQueue {
  const sorted = plans
    .map(classifyPlan)
    .sort((left, right) => {
      const byLane = LANE_ORDER[left.lane] - LANE_ORDER[right.lane];
      if (byLane !== 0) return byLane;
      const byReason = REASON_ORDER[left.reasonCode] - REASON_ORDER[right.reasonCode];
      if (byReason !== 0) return byReason;
      const bySlug = left.plan.store.slug.localeCompare(right.plan.store.slug);
      if (bySlug !== 0) return bySlug;
      return left.plan.store.id.localeCompare(right.plan.store.id);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    version: PORTFOLIO_GROWTH_PRIORITY_VERSION,
    items: sorted,
    summary: {
      totalStores: sorted.length,
      incidents: countLane(sorted, "INCIDENT"),
      scaleReviews: countLane(sorted, "SCALE_REVIEW"),
      optimizationReviews: countLane(sorted, "OPTIMIZE"),
      measurementReviews: countLane(sorted, "MEASURE"),
      launchBlocked: countLane(sorted, "LAUNCH_BLOCKED"),
    },
    limitations: [
      "Only persisted Stripe CAPTURED orders can establish traction; CartEvent telemetry remains advisory and spoofable.",
      "No revenue, contribution or performance score is compared across currencies.",
      "Scale review is a human decision with a bounded budget and stop condition, never an automatic spend instruction.",
      "Refunds, advertising cost, payment fees and a payment-captured timestamp are not modeled yet.",
      "Experiment assignment is not connected to orders, so this queue does not declare A/B winners or ROAS.",
    ],
  };
}

function classifyPlan(plan: StoreGrowthPlan): Omit<PortfolioGrowthQueueItem, "rank"> {
  const nextRecommendation = selectNextRecommendation(plan.recommendations);
  const evidenceTrust = Array.from(
    new Set(plan.evidence.map((entry) => entry.trust))
  ).sort();

  if (plan.scaleEligibility.blockers.includes("FULFILLMENT_BLOCKED")) {
    return item({
      plan,
      lane: "INCIDENT",
      reasonCode: "FULFILLMENT_INCIDENT",
      reason:
        "Captured commerce has an unresolved fulfillment state. More demand would increase operational risk.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.scaleEligibility.blockers.includes("MARGIN_NON_POSITIVE")) {
    return item({
      plan,
      lane: "INCIDENT",
      reasonCode: "NON_POSITIVE_MARGIN_INCIDENT",
      reason:
        "Captured commerce has a non-positive known item contribution proxy. Paid growth must remain blocked.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.stage === "NOT_LIVE" && plan.commerce.capturedOrders > 0) {
    return item({
      plan,
      lane: "INCIDENT",
      reasonCode: "NONLIVE_CAPTURED_COMMERCE_INCIDENT",
      reason:
        "Verified captured commerce exists for a non-LIVE tenant. Investigate the payment and storefront state before any launch or growth work.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.stage === "NOT_LIVE") {
    return item({
      plan,
      lane: "LAUNCH_BLOCKED",
      reasonCode: "STORE_NOT_LIVE",
      reason:
        "The store is not LIVE. Keep it noindex and complete verified launch evidence before distribution or spend.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (
    plan.stage === "ZERO_SALES" &&
    (plan.funnelDiagnosis === "CHECKOUT_FRICTION" ||
      plan.telemetry.clientCheckoutSuccesses > 0)
  ) {
    return item({
      plan,
      lane: "INCIDENT",
      reasonCode: "CHECKOUT_EVIDENCE_INCIDENT",
      reason:
        "Checkout activity exists without a verified captured order. Treat this as an investigation, not a conversion.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.stage === "TRACTION" && plan.scaleEligibility.eligible) {
    return item({
      plan,
      lane: "SCALE_REVIEW",
      reasonCode: "VERIFIED_SCALE_REVIEW_ELIGIBLE",
      reason:
        "Captured Stripe commerce, positive known contribution, fresh catalog evidence and clean fulfillment permit a bounded human review.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.stage === "TRACTION") {
    return item({
      plan,
      lane: "OPTIMIZE",
      reasonCode: "TRACTION_EVIDENCE_BLOCKED",
      reason:
        "The store has captured commerce, but unknown margin or stale/unknown evidence blocks scale review.",
      nextRecommendation,
      evidenceTrust,
    });
  }

  if (plan.stage === "ZERO_SALES") {
    return item({
      plan,
      lane: "OPTIMIZE",
      reasonCode: "ZERO_SALES_FUNNEL",
      reason: `The consented sample is large enough for a bounded ${humanize(
        plan.funnelDiagnosis
      )} hypothesis, but it is not sales evidence.`,
      nextRecommendation,
      evidenceTrust,
    });
  }

  return item({
    plan,
    lane: "MEASURE",
    reasonCode: "INSUFFICIENT_MEASUREMENT",
    reason:
      "There is not enough consented evidence to diagnose the funnel safely. Verify measurement before optimizing.",
    nextRecommendation,
    evidenceTrust,
  });
}

function item(
  input: Omit<PortfolioGrowthQueueItem, "rank" | "humanReviewRequired">
): Omit<PortfolioGrowthQueueItem, "rank"> {
  return { ...input, humanReviewRequired: true };
}

function selectNextRecommendation(
  recommendations: readonly StoreGrowthRecommendation[]
): StoreGrowthRecommendation | null {
  const priority = { P0: 0, P1: 1, P2: 2 } as const;
  return (
    recommendations
      .map((recommendation, index) => ({ recommendation, index }))
      .sort(
        (left, right) =>
          priority[left.recommendation.priority] -
            priority[right.recommendation.priority] ||
          left.index - right.index
      )[0]?.recommendation ?? null
  );
}

function countLane(
  items: readonly PortfolioGrowthQueueItem[],
  lane: PortfolioGrowthLane
): number {
  return items.filter((item) => item.lane === lane).length;
}

function humanize(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
