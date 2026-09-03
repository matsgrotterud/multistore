import assert from "node:assert/strict";
import test from "node:test";
import { prioritizePortfolioGrowth } from "./portfolio-prioritizer";
import {
  STORE_GROWTH_ADVISOR_VERSION,
  type StoreGrowthPlan,
} from "./types";

function plan(
  slug: string,
  overrides: Partial<StoreGrowthPlan> = {}
): StoreGrowthPlan {
  return {
    version: STORE_GROWTH_ADVISOR_VERSION,
    store: {
      id: `id_${slug}`,
      slug,
      name: slug,
      currency: "USD",
      launchStatus: "LIVE",
    },
    window: {
      days: 28,
      start: "2026-08-04T12:00:00.000Z",
      end: "2026-09-01T12:00:00.000Z",
    },
    stage: "INSUFFICIENT_EVIDENCE",
    funnelDiagnosis: "NOT_APPLICABLE",
    telemetry: {
      consentedSessions: 0,
      pageViews: 0,
      productViews: 0,
      addToCarts: 0,
      beginCheckouts: 0,
      clientCheckoutSuccesses: 0,
      malformedEvents: 0,
    },
    commerce: {
      capturedOrders: 0,
      capturedRevenue: 0,
      knownItemRevenue: null,
      knownItemCost: null,
      contributionProxy: null,
      marginStatus: "UNKNOWN",
      fulfillmentBlockerOrders: 0,
    },
    catalogFreshness: "UNKNOWN",
    scaleEligibility: {
      eligible: false,
      blockers: ["NO_CAPTURED_SALES", "MARGIN_UNKNOWN"],
    },
    evidence: [
      {
        key: "commerce.captured-orders",
        trust: "VERIFIED_COMMERCE",
        value: 0,
        detail: "fixture",
      },
      {
        key: "analytics.consented-sessions",
        trust: "CONSENTED_ADVISORY",
        value: 0,
        detail: "fixture",
      },
    ],
    recommendations: [],
    limitations: [],
    ...overrides,
  };
}

test("the portfolio queue is stable regardless of input order", () => {
  const inputs = [
    plan("measure-z"),
    plan("launch-a", {
      store: {
        id: "id_launch-a",
        slug: "launch-a",
        name: "launch-a",
        currency: "NOK",
        launchStatus: "PREVIEW",
      },
      stage: "NOT_LIVE",
      scaleEligibility: { eligible: false, blockers: ["STORE_NOT_LIVE"] },
    }),
    plan("scale-b", {
      stage: "TRACTION",
      commerce: {
        capturedOrders: 1,
        capturedRevenue: 100,
        knownItemRevenue: 100,
        knownItemCost: 40,
        contributionProxy: 60,
        marginStatus: "POSITIVE",
        fulfillmentBlockerOrders: 0,
      },
      catalogFreshness: "FRESH",
      scaleEligibility: { eligible: true, blockers: [] },
    }),
  ];

  const first = prioritizePortfolioGrowth(inputs);
  const second = prioritizePortfolioGrowth([...inputs].reverse());

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.items.map((item) => [item.rank, item.plan.store.slug, item.lane]),
    [
      [1, "scale-b", "SCALE_REVIEW"],
      [2, "measure-z", "MEASURE"],
      [3, "launch-a", "LAUNCH_BLOCKED"],
    ]
  );
});

test("ordinary PREVIEW and DRAFT stores remain launch-blocked and never scale", () => {
  for (const launchStatus of ["PREVIEW", "DRAFT"]) {
    const input = plan(`not-live-${launchStatus.toLowerCase()}`, {
      store: {
        id: `id_${launchStatus}`,
        slug: `not-live-${launchStatus.toLowerCase()}`,
        name: launchStatus,
        currency: "USD",
        launchStatus,
      },
      stage: "NOT_LIVE",
      telemetry: {
        consentedSessions: 500,
        pageViews: 500,
        productViews: 400,
        addToCarts: 100,
        beginCheckouts: 80,
        clientCheckoutSuccesses: 75,
        malformedEvents: 0,
      },
      commerce: {
        capturedOrders: 0,
        capturedRevenue: 0,
        knownItemRevenue: null,
        knownItemCost: null,
        contributionProxy: null,
        marginStatus: "UNKNOWN",
        fulfillmentBlockerOrders: 0,
      },
      scaleEligibility: {
        eligible: false,
        blockers: ["STORE_NOT_LIVE", "NO_CAPTURED_SALES", "MARGIN_UNKNOWN"],
      },
    });

    assert.equal(
      prioritizePortfolioGrowth([input]).items[0]?.lane,
      "LAUNCH_BLOCKED"
    );
  }
});

test("verified commerce incidents outrank launch state even for non-LIVE stores", () => {
  const input = plan("preview-fulfillment-incident", {
    store: {
      id: "id_preview-fulfillment-incident",
      slug: "preview-fulfillment-incident",
      name: "Preview incident",
      currency: "USD",
      launchStatus: "PREVIEW",
    },
    stage: "NOT_LIVE",
    commerce: {
      capturedOrders: 1,
      capturedRevenue: 100,
      knownItemRevenue: 100,
      knownItemCost: 40,
      contributionProxy: 60,
      marginStatus: "POSITIVE",
      fulfillmentBlockerOrders: 1,
    },
    scaleEligibility: {
      eligible: false,
      blockers: ["STORE_NOT_LIVE", "FULFILLMENT_BLOCKED"],
    },
  });

  const item = prioritizePortfolioGrowth([input]).items[0];
  assert.equal(item?.lane, "INCIDENT");
  assert.equal(item?.reasonCode, "FULFILLMENT_INCIDENT");
});

test("client checkout hints create an investigation but never a scale review", () => {
  const input = plan("checkout-hints", {
    stage: "ZERO_SALES",
    funnelDiagnosis: "CHECKOUT_FRICTION",
    telemetry: {
      consentedSessions: 100,
      pageViews: 100,
      productViews: 100,
      addToCarts: 10,
      beginCheckouts: 4,
      clientCheckoutSuccesses: 9,
      malformedEvents: 0,
    },
  });

  const item = prioritizePortfolioGrowth([input]).items[0];
  assert.equal(item?.lane, "INCIDENT");
  assert.equal(item?.reasonCode, "CHECKOUT_EVIDENCE_INCIDENT");
  assert.equal(item?.plan.commerce.capturedOrders, 0);
});

test("fulfillment and non-positive margin override traction", () => {
  const fulfillment = plan("fulfillment", {
    stage: "TRACTION",
    commerce: {
      capturedOrders: 1,
      capturedRevenue: 100,
      knownItemRevenue: 100,
      knownItemCost: 40,
      contributionProxy: 60,
      marginStatus: "POSITIVE",
      fulfillmentBlockerOrders: 1,
    },
    scaleEligibility: { eligible: false, blockers: ["FULFILLMENT_BLOCKED"] },
  });
  const margin = plan("margin", {
    stage: "TRACTION",
    commerce: {
      capturedOrders: 1,
      capturedRevenue: 100,
      knownItemRevenue: 100,
      knownItemCost: 110,
      contributionProxy: -10,
      marginStatus: "NON_POSITIVE",
      fulfillmentBlockerOrders: 0,
    },
    scaleEligibility: { eligible: false, blockers: ["MARGIN_NON_POSITIVE"] },
  });

  const queue = prioritizePortfolioGrowth([margin, fulfillment]);
  assert.deepEqual(
    queue.items.map((item) => item.reasonCode),
    ["FULFILLMENT_INCIDENT", "NON_POSITIVE_MARGIN_INCIDENT"]
  );
});

test("unknown margin and mixed currencies remain blocked without a money ranking", () => {
  const usd = plan("usd-store", {
    stage: "TRACTION",
    commerce: {
      capturedOrders: 10,
      capturedRevenue: 100_000,
      knownItemRevenue: null,
      knownItemCost: null,
      contributionProxy: null,
      marginStatus: "UNKNOWN",
      fulfillmentBlockerOrders: 0,
    },
    scaleEligibility: { eligible: false, blockers: ["MARGIN_UNKNOWN"] },
  });
  const nok = plan("nok-store", {
    store: {
      id: "id_nok-store",
      slug: "nok-store",
      name: "nok-store",
      currency: "NOK",
      launchStatus: "LIVE",
    },
    stage: "TRACTION",
    commerce: {
      capturedOrders: 1,
      capturedRevenue: 50,
      knownItemRevenue: null,
      knownItemCost: null,
      contributionProxy: null,
      marginStatus: "UNKNOWN",
      fulfillmentBlockerOrders: 0,
    },
    scaleEligibility: { eligible: false, blockers: ["MARGIN_UNKNOWN"] },
  });

  const queue = prioritizePortfolioGrowth([usd, nok]);
  assert.deepEqual(
    queue.items.map((item) => item.plan.store.slug),
    ["nok-store", "usd-store"]
  );
  assert.ok(queue.items.every((item) => item.lane === "OPTIMIZE"));
});

test("an empty portfolio returns a complete empty summary", () => {
  const queue = prioritizePortfolioGrowth([]);
  assert.deepEqual(queue.summary, {
    totalStores: 0,
    incidents: 0,
    scaleReviews: 0,
    optimizationReviews: 0,
    measurementReviews: 0,
    launchBlocked: 0,
  });
  assert.deepEqual(queue.items, []);
});
