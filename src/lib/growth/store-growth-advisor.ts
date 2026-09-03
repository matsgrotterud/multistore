import {
  STORE_GROWTH_ADVISOR_VERSION,
  STORE_GROWTH_MIN_CONSENTED_SESSIONS,
  STORE_GROWTH_MIN_PRODUCT_VIEWS,
  STORE_GROWTH_WINDOW_DAYS,
  type BuildStoreGrowthPlanInput,
  type StoreGrowthActionArea,
  type StoreGrowthActionCode,
  type StoreGrowthCatalogFreshness,
  type StoreGrowthCommerceMetrics,
  type StoreGrowthEventInput,
  type StoreGrowthFunnelDiagnosis,
  type StoreGrowthMarginStatus,
  type StoreGrowthOrderInput,
  type StoreGrowthPlan,
  type StoreGrowthRecommendation,
  type StoreGrowthScaleBlocker,
  type StoreGrowthStage,
  type StoreGrowthTelemetryMetrics,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1_000;
const MAX_EVENT_PAYLOAD_BYTES = 16 * 1_024;

const FUNNEL_EVENTS = new Set([
  "page_view",
  "product_view",
  "add_to_cart",
  "begin_checkout",
  "checkout_success",
]);

// These database fields are unconstrained strings. Marketing eligibility must
// therefore recognize only the terminal success states produced by the live
// routing path; every unknown, legacy or intermediate value fails closed.
const SCALE_SAFE_ORDER_STATES = new Set(["SUPPLIER_ORDERED"]);
const SCALE_SAFE_FULFILLMENT_STATES = new Set(["SUPPLIER_ORDERED"]);
const SCALE_SAFE_SUPPLIER_ORDER_STATES = new Set(["PLACED"]);

/**
 * Build a read-only, deterministic advice plan from existing store evidence.
 * Browser telemetry is deliberately advisory; only a non-mock CAPTURED Order
 * can establish a sale.
 */
export function buildStoreGrowthPlan(input: BuildStoreGrowthPlanInput): StoreGrowthPlan {
  const endMs = input.now.getTime();
  if (!Number.isFinite(endMs)) throw new Error("Store growth advisor requires a valid clock.");
  const startMs = endMs - STORE_GROWTH_WINDOW_DAYS * DAY_MS;

  const telemetry = aggregateTelemetry(input.events, startMs, endMs);
  const commerce = aggregateCommerce(input.orders, startMs, endMs);
  const catalogFreshness = aggregateCatalogFreshness(input.catalogProducts);
  const live = input.store.isActive && input.store.launchStatus === "LIVE";
  const stage = classifyStage({ live, telemetry, commerce });
  const funnelDiagnosis = diagnoseFunnel(stage, telemetry);
  const scaleBlockers = scaleEligibilityBlockers({
    live,
    commerce,
    catalogFreshness,
  });
  const recommendations = buildRecommendations({
    stage,
    funnelDiagnosis,
    scaleBlockers,
  });

  return {
    version: STORE_GROWTH_ADVISOR_VERSION,
    store: {
      id: input.store.id,
      slug: input.store.slug,
      name: input.store.name,
      currency: input.store.currency,
      launchStatus: input.store.launchStatus,
    },
    window: {
      days: STORE_GROWTH_WINDOW_DAYS,
      start: new Date(startMs).toISOString(),
      end: input.now.toISOString(),
    },
    stage,
    funnelDiagnosis,
    telemetry,
    commerce,
    catalogFreshness,
    scaleEligibility: {
      eligible: stage === "TRACTION" && scaleBlockers.length === 0,
      blockers: scaleBlockers,
    },
    evidence: [
      {
        key: "commerce.captured-orders",
        trust: "VERIFIED_COMMERCE",
        value: commerce.capturedOrders,
        detail:
          "Only persisted, non-mock Orders with paymentStatus=CAPTURED count as sales.",
      },
      {
        key: "commerce.contribution-proxy",
        trust: "VERIFIED_COMMERCE",
        value: commerce.contributionProxy ?? "UNKNOWN",
        detail:
          "Item revenue minus persisted item cost. It excludes ad spend, refunds and unrecorded fees.",
      },
      {
        key: "analytics.consented-sessions",
        trust: "CONSENTED_ADVISORY",
        value: telemetry.consentedSessions,
        detail:
          "CartEvent telemetry is collected after client consent but remains unauthenticated and spoofable.",
      },
      {
        key: "analytics.client-checkout-successes",
        trust: "CONSENTED_ADVISORY",
        value: telemetry.clientCheckoutSuccesses,
        detail:
          "Client checkout_success events are funnel hints only and never count as sales.",
      },
      {
        key: "catalog.freshness",
        trust: "VERIFIED_COMMERCE",
        value: catalogFreshness,
        detail: "All indexable published products must have current supplier/catalog evidence.",
      },
    ],
    recommendations,
    limitations: [
      "CartEvent telemetry represents consented measurement, not total traffic, and can be spoofed.",
      "The schema has no payment-captured timestamp, so the window uses Order.createdAt.",
      "Contribution is a proxy because campaign spend, refunds and every payment/fulfillment cost are not modeled.",
      "Recommendations are read-only deterministic hypotheses; they never mutate catalog, SEO, domains or spend.",
    ],
  };
}

function aggregateTelemetry(
  events: readonly StoreGrowthEventInput[],
  startMs: number,
  endMs: number
): StoreGrowthTelemetryMetrics {
  const sessions = new Set<string>();
  const metrics: StoreGrowthTelemetryMetrics = {
    consentedSessions: 0,
    pageViews: 0,
    productViews: 0,
    addToCarts: 0,
    beginCheckouts: 0,
    clientCheckoutSuccesses: 0,
    malformedEvents: 0,
  };

  for (const event of events) {
    const createdAt = timestamp(event.createdAt);
    if (createdAt === null || createdAt < startMs || createdAt > endMs) continue;
    if (!FUNNEL_EVENTS.has(event.eventName)) continue;
    if (!parseEventPayload(event.payload)) {
      metrics.malformedEvents += 1;
      continue;
    }

    const sessionId = event.sessionId.trim();
    if (sessionId && sessionId !== "feed") sessions.add(sessionId);

    switch (event.eventName) {
      case "page_view":
        metrics.pageViews += 1;
        break;
      case "product_view":
        metrics.productViews += 1;
        break;
      case "add_to_cart":
        metrics.addToCarts += 1;
        break;
      case "begin_checkout":
        metrics.beginCheckouts += 1;
        break;
      case "checkout_success":
        metrics.clientCheckoutSuccesses += 1;
        break;
    }
  }

  metrics.consentedSessions = sessions.size;
  return metrics;
}

function aggregateCommerce(
  orders: readonly StoreGrowthOrderInput[],
  startMs: number,
  endMs: number
): StoreGrowthCommerceMetrics {
  const captured = orders.filter((order) => {
    const createdAt = timestamp(order.createdAt);
    const paymentProvider = order.paymentProvider?.trim().toLowerCase();
    const stripePaymentIntentId = order.stripePaymentIntentId?.trim();
    return (
      createdAt !== null &&
      createdAt >= startMs &&
      createdAt <= endMs &&
      order.paymentStatus === "CAPTURED" &&
      paymentProvider === "stripe" &&
      Boolean(stripePaymentIntentId?.startsWith("pi_"))
    );
  });

  const capturedRevenue = round2(
    captured.reduce(
      (sum, order) => sum + finiteOrZero(order.grandTotal),
      0
    )
  );
  const marginKnown =
    captured.length > 0 &&
    captured.every(
      (order) =>
        order.items.length > 0 &&
        order.items.every(
          (item) =>
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            Number.isFinite(item.unitPrice) &&
            item.unitPrice >= 0 &&
            item.unitCost !== null &&
            Number.isFinite(item.unitCost) &&
            item.unitCost >= 0
        )
    );

  const knownItemRevenue = marginKnown
    ? round2(
        captured.reduce(
          (sum, order) =>
            sum +
            order.items.reduce(
              (lineSum, item) => lineSum + item.unitPrice * item.quantity,
              0
            ),
          0
        )
      )
    : null;
  const knownItemCost = marginKnown
    ? round2(
        captured.reduce(
          (sum, order) =>
            sum +
            order.items.reduce(
              (lineSum, item) => lineSum + (item.unitCost ?? 0) * item.quantity,
              0
            ),
          0
        )
      )
    : null;
  const contributionProxy =
    knownItemRevenue !== null && knownItemCost !== null
      ? round2(knownItemRevenue - knownItemCost)
      : null;
  const marginStatus: StoreGrowthMarginStatus =
    contributionProxy === null
      ? "UNKNOWN"
      : contributionProxy > 0
        ? "POSITIVE"
        : "NON_POSITIVE";

  return {
    capturedOrders: captured.length,
    capturedRevenue,
    knownItemRevenue,
    knownItemCost,
    contributionProxy,
    marginStatus,
    fulfillmentBlockerOrders: captured.filter(hasFulfillmentBlocker).length,
  };
}

function aggregateCatalogFreshness(
  products: BuildStoreGrowthPlanInput["catalogProducts"]
): StoreGrowthCatalogFreshness {
  if (products.length === 0) return "UNKNOWN";
  if (products.some((product) => product.freshness === "STALE")) return "STALE";
  if (products.some((product) => product.freshness === "UNKNOWN")) return "UNKNOWN";
  return "FRESH";
}

function classifyStage(input: {
  live: boolean;
  telemetry: StoreGrowthTelemetryMetrics;
  commerce: StoreGrowthCommerceMetrics;
}): StoreGrowthStage {
  if (!input.live) return "NOT_LIVE";
  if (input.commerce.capturedOrders > 0) return "TRACTION";
  if (
    input.telemetry.consentedSessions < STORE_GROWTH_MIN_CONSENTED_SESSIONS ||
    input.telemetry.productViews < STORE_GROWTH_MIN_PRODUCT_VIEWS
  ) {
    return "INSUFFICIENT_EVIDENCE";
  }
  return "ZERO_SALES";
}

function diagnoseFunnel(
  stage: StoreGrowthStage,
  telemetry: StoreGrowthTelemetryMetrics
): StoreGrowthFunnelDiagnosis {
  if (stage !== "ZERO_SALES") return "NOT_APPLICABLE";

  if (telemetry.productViews < Math.ceil(telemetry.consentedSessions * 0.25)) {
    return "STORE_DISCOVERY";
  }
  if (
    telemetry.productViews === 0 ||
    telemetry.addToCarts / telemetry.productViews < 0.03
  ) {
    return "PRODUCT_OFFER";
  }
  if (
    telemetry.addToCarts > 0 &&
    telemetry.beginCheckouts / telemetry.addToCarts < 0.2
  ) {
    return "CART_FRICTION";
  }
  return "CHECKOUT_FRICTION";
}

function scaleEligibilityBlockers(input: {
  live: boolean;
  commerce: StoreGrowthCommerceMetrics;
  catalogFreshness: StoreGrowthCatalogFreshness;
}): StoreGrowthScaleBlocker[] {
  const blockers: StoreGrowthScaleBlocker[] = [];
  if (!input.live) blockers.push("STORE_NOT_LIVE");
  if (input.commerce.capturedOrders === 0) blockers.push("NO_CAPTURED_SALES");
  if (input.commerce.marginStatus === "UNKNOWN") blockers.push("MARGIN_UNKNOWN");
  if (input.commerce.marginStatus === "NON_POSITIVE") {
    blockers.push("MARGIN_NON_POSITIVE");
  }
  if (input.catalogFreshness === "STALE") blockers.push("CATALOG_STALE");
  if (input.catalogFreshness === "UNKNOWN") {
    blockers.push("CATALOG_FRESHNESS_UNKNOWN");
  }
  if (input.commerce.fulfillmentBlockerOrders > 0) {
    blockers.push("FULFILLMENT_BLOCKED");
  }
  return blockers;
}

function buildRecommendations(input: {
  stage: StoreGrowthStage;
  funnelDiagnosis: StoreGrowthFunnelDiagnosis;
  scaleBlockers: readonly StoreGrowthScaleBlocker[];
}): StoreGrowthRecommendation[] {
  const recommendations: StoreGrowthRecommendation[] = [];

  if (input.stage === "NOT_LIVE") {
    recommendations.push(
      recommendation({
        code: "COMPLETE_LAUNCH_GATES",
        area: "LAUNCH",
        priority: "P0",
        title: "Complete verified launch evidence",
        hypothesis:
          "A PREVIEW or DRAFT store must remain noindex and outside paid promotion until domain, commerce and compliance gates pass.",
        targetMetric: "All go-live hard gates PASS",
        minimumEvidence: "Verified human, domain, catalog, compliance and commerce evidence",
        evidenceRefs: ["store.launch-status"],
      })
    );
    return recommendations;
  }

  if (input.stage === "INSUFFICIENT_EVIDENCE") {
    recommendations.push(
      recommendation({
        code: "VERIFY_CONSENTED_MEASUREMENT",
        area: "MEASUREMENT",
        priority: "P0",
        title: "Verify the consented funnel before drawing conclusions",
        hypothesis:
          "The current sample is too small to distinguish a weak offer from missing or incomplete telemetry.",
        targetMetric: `${STORE_GROWTH_MIN_CONSENTED_SESSIONS} consented sessions and ${STORE_GROWTH_MIN_PRODUCT_VIEWS} product views`,
        minimumEvidence: "Valid, tenant-scoped CartEvent rows without malformed payloads",
        evidenceRefs: ["analytics.consented-sessions"],
      }),
      recommendation({
        code: "INCREASE_QUALIFIED_DISCOVERY",
        area: "DISCOVERY",
        priority: "P1",
        title: "Earn a bounded qualified traffic sample",
        hypothesis:
          "Useful niche distribution and indexable, differentiated content can establish whether the catalog attracts its intended audience.",
        targetMetric: "Qualified product views without paid-spend escalation",
        minimumEvidence: "LIVE store plus policy-compliant distribution plan",
        evidenceRefs: ["analytics.consented-sessions", "store.launch-status"],
      })
    );
    return recommendations;
  }

  if (input.stage === "ZERO_SALES") {
    const diagnosisRecommendation: Record<
      Exclude<StoreGrowthFunnelDiagnosis, "NOT_APPLICABLE">,
      StoreGrowthRecommendation
    > = {
      STORE_DISCOVERY: recommendation({
        code: "IMPROVE_STORE_DISCOVERY",
        area: "DISCOVERY",
        priority: "P0",
        title: "Improve paths from landing pages to relevant products",
        hypothesis:
          "Visitors are not reaching enough product detail pages, so navigation, positioning or catalog relevance is the likely first bottleneck.",
        targetMetric: "Product views per consented session",
        minimumEvidence: "A single bounded navigation or merchandising change",
        evidenceRefs: ["analytics.consented-sessions"],
      }),
      PRODUCT_OFFER: recommendation({
        code: "IMPROVE_PRODUCT_OFFER",
        area: "PRODUCT",
        priority: "P0",
        title: "Test one grounded product-offer improvement",
        hypothesis:
          "Product pages receive attention but price, media, copy, delivery or trust evidence is not producing add-to-cart intent.",
        targetMetric: "Add-to-cart rate per product view",
        minimumEvidence: "One product-level hypothesis with supplier-grounded claims",
        evidenceRefs: ["analytics.consented-sessions", "catalog.freshness"],
      }),
      CART_FRICTION: recommendation({
        code: "REDUCE_CART_FRICTION",
        area: "CART",
        priority: "P0",
        title: "Inspect cart, shipping and delivery friction",
        hypothesis:
          "Visitors add products but do not begin checkout, indicating an offer-total, delivery or cart-usability problem.",
        targetMetric: "Begin-checkout rate per add-to-cart",
        minimumEvidence: "Browser QA plus one reversible cart hypothesis",
        evidenceRefs: ["analytics.consented-sessions"],
      }),
      CHECKOUT_FRICTION: recommendation({
        code: "INVESTIGATE_CHECKOUT",
        area: "CHECKOUT",
        priority: "P0",
        title: "Treat checkout without captured orders as an operational incident",
        hypothesis:
          "Checkout starts or client success hints without captured Orders can indicate payment, finalization or routing failure.",
        targetMetric: "Persisted CAPTURED Orders, never client checkout_success",
        minimumEvidence: "Read-only order/payment inspection and mutation-safe browser QA",
        evidenceRefs: [
          "commerce.captured-orders",
          "analytics.client-checkout-successes",
        ],
      }),
    };
    const diagnosedFunnel =
      input.funnelDiagnosis === "NOT_APPLICABLE"
        ? "CHECKOUT_FRICTION"
        : input.funnelDiagnosis;
    recommendations.push(diagnosisRecommendation[diagnosedFunnel]);
    recommendations.push(
      recommendation({
        code: "HOLD_MARKETING_SPEND",
        area: "MARKETING",
        priority: "P0",
        title: "Do not scale paid spend on zero-sale evidence",
        hypothesis:
          "More spend would amplify an unresolved funnel problem rather than prove positive unit economics.",
        targetMetric: "At least one captured order with known positive contribution",
        minimumEvidence: "Verified commerce evidence",
        evidenceRefs: ["commerce.captured-orders", "commerce.contribution-proxy"],
      })
    );
    return recommendations;
  }

  if (input.scaleBlockers.includes("MARGIN_UNKNOWN")) {
    recommendations.push(blockerRecommendation("VERIFY_MARGIN_DATA"));
  }
  if (input.scaleBlockers.includes("MARGIN_NON_POSITIVE")) {
    recommendations.push(blockerRecommendation("RESTORE_POSITIVE_MARGIN"));
  }
  if (
    input.scaleBlockers.includes("CATALOG_STALE") ||
    input.scaleBlockers.includes("CATALOG_FRESHNESS_UNKNOWN")
  ) {
    recommendations.push(blockerRecommendation("REFRESH_CATALOG_EVIDENCE"));
  }
  if (input.scaleBlockers.includes("FULFILLMENT_BLOCKED")) {
    recommendations.push(blockerRecommendation("RESOLVE_FULFILLMENT_BLOCKERS"));
  }

  if (input.scaleBlockers.length === 0) {
    recommendations.push(
      recommendation({
        code: "REVIEW_BOUNDED_MARKETING_TEST",
        area: "MARKETING",
        priority: "P1",
        title: "Review one bounded marketing experiment",
        hypothesis:
          "Captured sales, positive known item contribution, fresh catalog evidence and clean fulfillment justify a small human-approved test.",
        targetMetric: "Incremental captured contribution, not clicks or client events",
        minimumEvidence: "Named owner, fixed budget cap, stop condition and attribution plan",
        evidenceRefs: [
          "commerce.captured-orders",
          "commerce.contribution-proxy",
          "catalog.freshness",
        ],
        marketingOrSpend: true,
        requiresHumanApproval: true,
      })
    );
  }

  return recommendations;
}

function blockerRecommendation(
  code:
    | "VERIFY_MARGIN_DATA"
    | "RESTORE_POSITIVE_MARGIN"
    | "REFRESH_CATALOG_EVIDENCE"
    | "RESOLVE_FULFILLMENT_BLOCKERS"
): StoreGrowthRecommendation {
  const definitions: Record<
    typeof code,
    {
      area: StoreGrowthActionArea;
      title: string;
      hypothesis: string;
      targetMetric: string;
      minimumEvidence: string;
      evidenceRefs: string[];
    }
  > = {
    VERIFY_MARGIN_DATA: {
      area: "MARGIN",
      title: "Verify item cost before scaling",
      hypothesis: "Captured revenue without complete cost snapshots cannot establish positive economics.",
      targetMetric: "Known positive item contribution proxy",
      minimumEvidence: "Finite unitPrice, unitCost and quantity for every captured line",
      evidenceRefs: ["commerce.contribution-proxy"],
    },
    RESTORE_POSITIVE_MARGIN: {
      area: "MARGIN",
      title: "Restore positive contribution before scaling",
      hypothesis: "Scaling a non-positive known item margin compounds losses.",
      targetMetric: "Positive item contribution proxy",
      minimumEvidence: "Repriced or replaced offer with verified supplier cost",
      evidenceRefs: ["commerce.contribution-proxy"],
    },
    REFRESH_CATALOG_EVIDENCE: {
      area: "CATALOG",
      title: "Refresh and review catalog evidence",
      hypothesis: "Stale or unknown supplier evidence makes availability, delivery and economics unsafe to promote.",
      targetMetric: "Fresh evidence for every indexable published product",
      minimumEvidence: "Provider-backed supplier and catalog evaluation timestamps",
      evidenceRefs: ["catalog.freshness"],
    },
    RESOLVE_FULFILLMENT_BLOCKERS: {
      area: "FULFILLMENT",
      title: "Resolve fulfillment blockers before adding demand",
      hypothesis: "More orders would increase customer and operational risk while captured orders remain blocked.",
      targetMetric: "Zero blocked captured orders",
      minimumEvidence: "Accepted supplier/fulfillment state for every captured order",
      evidenceRefs: ["commerce.captured-orders"],
    },
  };
  return recommendation({
    code,
    priority: "P0",
    ...definitions[code],
  });
}

function recommendation(input: {
  code: StoreGrowthActionCode;
  area: StoreGrowthActionArea;
  priority: "P0" | "P1" | "P2";
  title: string;
  hypothesis: string;
  targetMetric: string;
  minimumEvidence: string;
  evidenceRefs: string[];
  marketingOrSpend?: boolean;
  requiresHumanApproval?: boolean;
}): StoreGrowthRecommendation {
  return {
    ...input,
    marketingOrSpend: input.marketingOrSpend ?? false,
    requiresHumanApproval: input.requiresHumanApproval ?? false,
  };
}

function hasFulfillmentBlocker(order: StoreGrowthOrderInput): boolean {
  return (
    !SCALE_SAFE_ORDER_STATES.has(order.status) ||
    !SCALE_SAFE_FULFILLMENT_STATES.has(order.fulfillmentStatus) ||
    order.supplierOrders.length !== 1 ||
    order.supplierOrders.some(
      (supplierOrder) =>
        !SCALE_SAFE_SUPPLIER_ORDER_STATES.has(supplierOrder.status)
    )
  );
}

function parseEventPayload(raw: string): Record<string, unknown> | null {
  if (Buffer.byteLength(raw, "utf8") > MAX_EVENT_PAYLOAD_BYTES) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function timestamp(value: Date | string): number | null {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
