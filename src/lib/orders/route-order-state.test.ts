import assert from "node:assert/strict";
import test from "node:test";
import {
  deterministicRouteOrderJobId,
  deterministicSupplierOrderId,
  evaluateRoutingOrder,
  isBuyerAcceptedOrderState,
  ROUTE_SUBMISSION_STALE_MS,
  shouldReconcileSubmitting,
  validateStripeIntentForRouting,
  type RoutingOrderValidationInput,
} from "./route-order-state";

function eligibleOrder(): RoutingOrderValidationInput {
  return {
    orderId: "order-1",
    storeId: "store-1",
    currency: "USD",
    paymentStatus: "AUTHORIZED",
    paymentProvider: "stripe",
    stripePaymentIntentId: "pi_1",
    store: { id: "store-1", isActive: true, launchStatus: "LIVE" },
    lines: [
      {
        id: "line-1",
        productId: "product-1",
        variantId: "variant-1",
        externalVariantId: "supplier-variant-1",
        skuSnapshot: "SKU-1",
        fulfillmentMode: "DROPSHIP",
        providerKey: "cj",
        externalId: "supplier-product-1",
        commerceEligible: true,
        catalogFresh: true,
        checkoutAvailable: true,
        supplierSettingEnabled: true,
        providerCheckoutAvailable: true,
        product: {
          id: "product-1",
          storeId: "store-1",
          isPublished: true,
          stockStatus: "IN_STOCK",
          fulfillmentMode: "DROPSHIP",
          providerKey: "cj",
          externalId: "supplier-product-1",
          sku: "BASE-SKU",
          currency: "USD",
          variantCount: 1,
        },
        variant: {
          id: "variant-1",
          productId: "product-1",
          stockStatus: "IN_STOCK",
          externalVariantId: "supplier-variant-1",
          sku: "SKU-1",
        },
      },
    ],
  };
}

test("eligible single-provider route passes and has a deterministic supplier id", () => {
  const decision = evaluateRoutingOrder(eligibleOrder());
  assert.equal(decision.allowed, true);
  if (!decision.allowed) return;
  assert.equal(decision.routeKey, "DROPSHIP:cj");
  assert.equal(
    deterministicSupplierOrderId("order-1", decision.routeKey),
    deterministicSupplierOrderId("order-1", decision.routeKey)
  );
});

test("mixed routes and changed supplier identity fail closed", () => {
  const input = eligibleOrder();
  input.lines[0].product.externalId = "changed";
  input.lines.push({
    ...input.lines[0],
    id: "line-2",
    fulfillmentMode: "MANUAL",
    providerKey: null,
    externalId: null,
    product: {
      ...input.lines[0].product,
      fulfillmentMode: "MANUAL",
      providerKey: null,
      externalId: null,
    },
  });
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.ok(decision.reasonCodes.includes("PRODUCT_IDENTITY_CHANGED"));
  assert.ok(decision.reasonCodes.includes("MULTIPLE_FULFILLMENT_ROUTES"));
});

test("current store, commerce, stock and variant gates fail before routing", () => {
  const input = eligibleOrder();
  input.store.isActive = false;
  input.lines[0].commerceEligible = false;
  input.lines[0].product.stockStatus = "OUT_OF_STOCK";
  input.lines[0].variant!.externalVariantId = "changed";
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.deepEqual(decision.reasonCodes, [
    "STORE_INACTIVE",
    "PRODUCT_OUT_OF_STOCK",
    "PRODUCT_COMMERCE_INELIGIBLE",
    "VARIANT_IDENTITY_CHANGED",
  ]);
});

test("stale catalog evidence fails immediately before supplier routing", () => {
  const input = eligibleOrder();
  input.lines[0].catalogFresh = false;
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.deepEqual(decision.reasonCodes, ["PRODUCT_CATALOG_NOT_FRESH"]);
});

test("mock routing can never be backed by a Stripe payment", () => {
  const input = eligibleOrder();
  const line = input.lines[0];
  line.fulfillmentMode = "MOCK";
  line.providerKey = "mock";
  line.product.fulfillmentMode = "MOCK";
  line.product.providerKey = "mock";
  line.supplierSettingEnabled = false;
  line.providerCheckoutAvailable = false;
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.ok(decision.reasonCodes.includes("MOCK_PAYMENT_INVALID"));
});

test("non-mock routing requires the stored Stripe payment identity", () => {
  const input = eligibleOrder();
  input.paymentProvider = "mock";
  input.stripePaymentIntentId = null;
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.ok(decision.reasonCodes.includes("LIVE_PAYMENT_INVALID"));
});

test("variant SKU snapshots use the same product-SKU fallback as checkout", () => {
  const input = eligibleOrder();
  input.lines[0].skuSnapshot = "BASE-SKU";
  input.lines[0].variant!.sku = null;
  const decision = evaluateRoutingOrder(input);
  assert.equal(decision.allowed, true);
});

test("Stripe routing validation binds intent, order, amount, currency and state", () => {
  const valid = validateStripeIntentForRouting({
    orderId: "order-1",
    paymentStatus: "AUTHORIZED",
    stripePaymentIntentId: "pi_1",
    grandTotal: 49.95,
    currency: "USD",
    intent: {
      id: "pi_1",
      amount: 4995,
      currency: "usd",
      status: "requires_capture",
      metadata: { orderId: "order-1" },
    },
  });
  assert.deepEqual(valid, []);

  const invalid = validateStripeIntentForRouting({
    orderId: "order-1",
    paymentStatus: "CAPTURED",
    stripePaymentIntentId: "pi_1",
    grandTotal: 49.95,
    currency: "USD",
    intent: {
      id: "pi_other",
      amount: 1,
      currency: "nok",
      status: "requires_capture",
      metadata: { orderId: "other" },
    },
  });
  assert.equal(invalid.length, 5);
});

test("fresh SUBMITTING waits while stale SUBMITTING requires reconciliation", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");
  assert.equal(shouldReconcileSubmitting(new Date(now.getTime() - 1_000), now), false);
  assert.equal(
    shouldReconcileSubmitting(
      new Date(now.getTime() - ROUTE_SUBMISSION_STALE_MS),
      now
    ),
    true
  );
});

test("routing retry job id is deterministic and filesystem-neutral", () => {
  assert.equal(
    deterministicRouteOrderJobId("Checkout_ABC/123"),
    "route-order-v1_checkout_abc-123"
  );
});

test("buyer success requires captured payment and an accepted fulfillment state", () => {
  assert.equal(
    isBuyerAcceptedOrderState({
      status: "SUPPLIER_ORDERED",
      paymentStatus: "CAPTURED",
      fulfillmentStatus: "SUPPLIER_ORDERED",
    }),
    true
  );
  assert.equal(
    isBuyerAcceptedOrderState({
      status: "FULFILLMENT_PENDING",
      paymentStatus: "CAPTURED",
      fulfillmentStatus: "MANUAL",
    }),
    true
  );
  for (const state of [
    {
      status: "FULFILLMENT_ROUTING",
      paymentStatus: "AUTHORIZED",
      fulfillmentStatus: "PENDING",
    },
    {
      status: "FULFILLMENT_PENDING",
      paymentStatus: "AUTHORIZED",
      fulfillmentStatus: "PENDING",
    },
    {
      status: "ERROR",
      paymentStatus: "CAPTURED",
      fulfillmentStatus: "ERROR",
    },
  ]) {
    assert.equal(isBuyerAcceptedOrderState(state), false);
  }
});
