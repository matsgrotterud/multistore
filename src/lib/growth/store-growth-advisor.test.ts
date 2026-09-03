import assert from "node:assert/strict";
import test from "node:test";
import { buildStoreGrowthPlan } from "./store-growth-advisor";
import {
  STORE_GROWTH_WINDOW_DAYS,
  type BuildStoreGrowthPlanInput,
  type StoreGrowthEventInput,
  type StoreGrowthOrderInput,
} from "./types";

const NOW = new Date("2026-09-01T12:00:00.000Z");
const RECENT = "2026-08-31T12:00:00.000Z";

function baseInput(
  overrides: Partial<BuildStoreGrowthPlanInput> = {}
): BuildStoreGrowthPlanInput {
  return {
    now: NOW,
    store: {
      id: "store_1",
      slug: "drone-store",
      name: "Drone Store",
      currency: "USD",
      launchStatus: "LIVE",
      isActive: true,
    },
    events: [],
    orders: [],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" }],
    ...overrides,
  };
}

function event(
  eventName: string,
  sessionId: string,
  payload = "{}",
  createdAt: Date | string = RECENT
): StoreGrowthEventInput {
  return { eventName, sessionId, payload, createdAt };
}

function exposure(input: {
  sessions: number;
  productViews: number;
  addToCarts?: number;
  beginCheckouts?: number;
  clientSuccesses?: number;
}): StoreGrowthEventInput[] {
  const events: StoreGrowthEventInput[] = [];
  for (let index = 0; index < input.sessions; index += 1) {
    events.push(event("page_view", `session_${index}`));
  }
  for (let index = 0; index < input.productViews; index += 1) {
    events.push(event("product_view", `session_${index % input.sessions}`));
  }
  for (let index = 0; index < (input.addToCarts ?? 0); index += 1) {
    events.push(event("add_to_cart", `session_${index % input.sessions}`));
  }
  for (let index = 0; index < (input.beginCheckouts ?? 0); index += 1) {
    events.push(event("begin_checkout", `session_${index % input.sessions}`));
  }
  for (let index = 0; index < (input.clientSuccesses ?? 0); index += 1) {
    events.push(event("checkout_success", `session_${index % input.sessions}`));
  }
  return events;
}

function capturedOrder(
  overrides: Partial<StoreGrowthOrderInput> = {}
): StoreGrowthOrderInput {
  return {
    id: "order_1",
    paymentStatus: "CAPTURED",
    paymentProvider: "stripe",
    stripePaymentIntentId: "pi_verified_1",
    status: "SUPPLIER_ORDERED",
    fulfillmentStatus: "SUPPLIER_ORDERED",
    grandTotal: 100,
    taxTotal: 0,
    createdAt: RECENT,
    items: [{ quantity: 1, unitPrice: 100, unitCost: 45 }],
    supplierOrders: [{ status: "PLACED" }],
    ...overrides,
  };
}

for (const launchStatus of ["PREVIEW", "DRAFT"]) {
  test(`${launchStatus} stores never receive marketing or spend recommendations`, () => {
    const plan = buildStoreGrowthPlan(
      baseInput({
        store: {
          ...baseInput().store,
          launchStatus,
        },
        events: exposure({
          sessions: 150,
          productViews: 100,
          addToCarts: 20,
          beginCheckouts: 10,
        }),
        orders: [capturedOrder()],
      })
    );

    assert.equal(plan.stage, "NOT_LIVE");
    assert.equal(plan.scaleEligibility.eligible, false);
    assert.ok(plan.scaleEligibility.blockers.includes("STORE_NOT_LIVE"));
    assert.equal(
      plan.recommendations.some((recommendation) => recommendation.marketingOrSpend),
      false
    );
  });
}

test("client checkout_success and authorized orders never count as sales", () => {
  const plan = buildStoreGrowthPlan(
    baseInput({
      events: exposure({
        sessions: 100,
        productViews: 100,
        addToCarts: 10,
        beginCheckouts: 3,
        clientSuccesses: 12,
      }),
      orders: [capturedOrder({ paymentStatus: "AUTHORIZED" })],
    })
  );

  assert.equal(plan.telemetry.clientCheckoutSuccesses, 12);
  assert.equal(plan.commerce.capturedOrders, 0);
  assert.equal(plan.stage, "ZERO_SALES");
  assert.equal(plan.funnelDiagnosis, "CHECKOUT_FRICTION");
  assert.ok(
    plan.recommendations.some(
      (recommendation) => recommendation.code === "INVESTIGATE_CHECKOUT"
    )
  );
});

test("mock captured orders are test evidence and never establish traction", () => {
  const plan = buildStoreGrowthPlan(
    baseInput({
      events: exposure({ sessions: 10, productViews: 10 }),
      orders: [
        capturedOrder({ paymentProvider: "mock" }),
        capturedOrder({ paymentProvider: " MOCK " }),
        capturedOrder({ paymentProvider: null }),
        capturedOrder({ paymentProvider: "manual" }),
        capturedOrder({ stripePaymentIntentId: null }),
      ],
    })
  );

  assert.equal(plan.commerce.capturedOrders, 0);
  assert.equal(plan.stage, "INSUFFICIENT_EVIDENCE");
});

test("small consented samples remain insufficient evidence", () => {
  const plan = buildStoreGrowthPlan(
    baseInput({
      events: exposure({ sessions: 99, productViews: 49 }),
    })
  );

  assert.equal(plan.stage, "INSUFFICIENT_EVIDENCE");
  assert.equal(plan.funnelDiagnosis, "NOT_APPLICABLE");
  assert.ok(
    plan.recommendations.some(
      (recommendation) => recommendation.code === "VERIFY_CONSENTED_MEASUREMENT"
    )
  );
});

for (const scenario of [
  {
    name: "store discovery",
    input: { sessions: 300, productViews: 50, addToCarts: 10, beginCheckouts: 3 },
    diagnosis: "STORE_DISCOVERY",
    action: "IMPROVE_STORE_DISCOVERY",
  },
  {
    name: "product offer",
    input: { sessions: 100, productViews: 100, addToCarts: 2, beginCheckouts: 0 },
    diagnosis: "PRODUCT_OFFER",
    action: "IMPROVE_PRODUCT_OFFER",
  },
  {
    name: "cart friction",
    input: { sessions: 100, productViews: 100, addToCarts: 10, beginCheckouts: 1 },
    diagnosis: "CART_FRICTION",
    action: "REDUCE_CART_FRICTION",
  },
  {
    name: "checkout friction",
    input: { sessions: 100, productViews: 100, addToCarts: 10, beginCheckouts: 3 },
    diagnosis: "CHECKOUT_FRICTION",
    action: "INVESTIGATE_CHECKOUT",
  },
] as const) {
  test(`zero-sales funnel diagnoses ${scenario.name}`, () => {
    const plan = buildStoreGrowthPlan(
      baseInput({ events: exposure(scenario.input) })
    );

    assert.equal(plan.stage, "ZERO_SALES");
    assert.equal(plan.funnelDiagnosis, scenario.diagnosis);
    assert.ok(
      plan.recommendations.some(
        (recommendation) => recommendation.code === scenario.action
      )
    );
    assert.equal(plan.scaleEligibility.eligible, false);
  });
}

test("positive captured commerce with fresh catalog and clean fulfillment is scale-review eligible", () => {
  const plan = buildStoreGrowthPlan(
    baseInput({ orders: [capturedOrder()] })
  );

  assert.equal(plan.stage, "TRACTION");
  assert.equal(plan.commerce.capturedOrders, 1);
  assert.equal(plan.commerce.contributionProxy, 55);
  assert.equal(plan.commerce.marginStatus, "POSITIVE");
  assert.deepEqual(plan.scaleEligibility.blockers, []);
  assert.equal(plan.scaleEligibility.eligible, true);
  const marketing = plan.recommendations.find(
    (recommendation) => recommendation.code === "REVIEW_BOUNDED_MARKETING_TEST"
  );
  assert.equal(marketing?.marketingOrSpend, true);
  assert.equal(marketing?.requiresHumanApproval, true);
});

for (const scenario of [
  {
    name: "unknown margin",
    orders: [capturedOrder({ items: [{ quantity: 1, unitPrice: 100, unitCost: null }] })],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" as const }],
    blocker: "MARGIN_UNKNOWN",
    action: "VERIFY_MARGIN_DATA",
  },
  {
    name: "non-positive margin",
    orders: [capturedOrder({ items: [{ quantity: 1, unitPrice: 40, unitCost: 50 }] })],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" as const }],
    blocker: "MARGIN_NON_POSITIVE",
    action: "RESTORE_POSITIVE_MARGIN",
  },
  {
    name: "stale catalog",
    orders: [capturedOrder()],
    catalogProducts: [{ productId: "product_1", freshness: "STALE" as const }],
    blocker: "CATALOG_STALE",
    action: "REFRESH_CATALOG_EVIDENCE",
  },
  {
    name: "unknown catalog freshness",
    orders: [capturedOrder()],
    catalogProducts: [{ productId: "product_1", freshness: "UNKNOWN" as const }],
    blocker: "CATALOG_FRESHNESS_UNKNOWN",
    action: "REFRESH_CATALOG_EVIDENCE",
  },
  {
    name: "fulfillment blocker",
    orders: [
      capturedOrder({
        status: "FULFILLMENT_PENDING",
        fulfillmentStatus: "MANUAL",
        supplierOrders: [{ status: "MANUAL_ACTION_REQUIRED" }],
      }),
    ],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" as const }],
    blocker: "FULFILLMENT_BLOCKED",
    action: "RESOLVE_FULFILLMENT_BLOCKERS",
  },
  {
    name: "unknown fulfillment strings",
    orders: [
      capturedOrder({
        status: "SOMETHING_NEW",
        fulfillmentStatus: "UNKNOWN_SUCCESS",
        supplierOrders: [{ status: "SUBMITTED" }],
      }),
    ],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" as const }],
    blocker: "FULFILLMENT_BLOCKED",
    action: "RESOLVE_FULFILLMENT_BLOCKERS",
  },
  {
    name: "multiple placed supplier orders",
    orders: [
      capturedOrder({
        supplierOrders: [{ status: "PLACED" }, { status: "PLACED" }],
      }),
    ],
    catalogProducts: [{ productId: "product_1", freshness: "FRESH" as const }],
    blocker: "FULFILLMENT_BLOCKED",
    action: "RESOLVE_FULFILLMENT_BLOCKERS",
  },
] as const) {
  test(`traction scale is blocked by ${scenario.name}`, () => {
    const plan = buildStoreGrowthPlan(
      baseInput({
        orders: scenario.orders,
        catalogProducts: scenario.catalogProducts,
      })
    );

    assert.equal(plan.stage, "TRACTION");
    assert.equal(plan.scaleEligibility.eligible, false);
    assert.ok(plan.scaleEligibility.blockers.includes(scenario.blocker));
    assert.ok(
      plan.recommendations.some(
        (recommendation) => recommendation.code === scenario.action
      )
    );
    assert.equal(
      plan.recommendations.some((recommendation) => recommendation.marketingOrSpend),
      false
    );
  });
}

test("malformed payloads are isolated and the plan remains deterministic", () => {
  const validEvents = exposure({ sessions: 100, productViews: 50 });
  const input = baseInput({
    events: [
      ...validEvents,
      event("page_view", "malformed_json", "{"),
      event("product_view", "array_payload", "[]"),
      event("add_to_cart", "oversized", JSON.stringify({ value: "x".repeat(17_000) })),
    ],
  });

  const first = buildStoreGrowthPlan(input);
  const second = buildStoreGrowthPlan(input);

  assert.equal(first.telemetry.malformedEvents, 3);
  assert.equal(first.telemetry.consentedSessions, 100);
  assert.deepEqual(first, second);
});

test("the fixed 28-day window excludes older events and orders", () => {
  const olderThanWindow = new Date(
    NOW.getTime() - (STORE_GROWTH_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1_000
  );
  const plan = buildStoreGrowthPlan(
    baseInput({
      events: [event("page_view", "old_session", "{}", olderThanWindow)],
      orders: [capturedOrder({ createdAt: olderThanWindow })],
    })
  );

  assert.equal(plan.window.days, 28);
  assert.equal(plan.telemetry.consentedSessions, 0);
  assert.equal(plan.commerce.capturedOrders, 0);
  assert.equal(plan.stage, "INSUFFICIENT_EVIDENCE");
});
