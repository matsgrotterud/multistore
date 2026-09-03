import assert from "node:assert/strict";
import test from "node:test";
import { persistOrderFromCheckout } from "./persist-order";
import type { PreparedCheckout } from "./types";

function checkout(addressLine1 = "Storgata 1"): PreparedCheckout {
  return {
    checkoutAttemptId: "550e8400-e29b-41d4-a716-446655440000",
    storeId: "store-a",
    storeSlug: "fluffy-slippers",
    currency: "NOK",
    subtotal: 299,
    shippingTotal: 0,
    grandTotal: 299,
    orderNumber: "ORD-TEST",
    customer: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      addressLine1,
      city: "Oslo",
      postalCode: "0151",
      country: "Norway",
    },
    lines: [
      {
        productId: "product-a",
        variantId: null,
        title: "Plush slippers",
        slug: "plush-slippers",
        sku: "PLUSH-BASE",
        variantTitle: null,
        optionSummary: null,
        externalVariantId: null,
        variantSnapshot: {},
        quantity: 1,
        unitPrice: 299,
        unitCost: 90,
        fulfillmentMode: "DROPSHIP",
        providerKey: "cj",
        externalId: "supplier-a",
        shippingDaysMin: 5,
        shippingDaysMax: 9,
        countryOfOrigin: "CN",
      },
    ],
  };
}

function storedOrder(original: PreparedCheckout) {
  return {
    id: "checkout_existing",
    storeId: original.storeId,
    customerId: "customer-a",
    orderNumber: "ORD-FIRST",
    status: "DRAFT",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "NOT_STARTED",
    paymentProvider: "stripe",
    stripePaymentIntentId: null,
    paymentError: null,
    currency: original.currency,
    subtotal: original.subtotal,
    shippingTotal: original.shippingTotal,
    taxTotal: 0,
    grandTotal: original.grandTotal,
    shippingAddressJson: JSON.stringify(original.customer),
    billingAddressJson: JSON.stringify(original.customer),
    notes: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    customer: {
      id: "customer-a",
      storeId: original.storeId,
      email: original.customer.email,
      name: original.customer.name,
      phone: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
    items: original.lines.map((line) => ({
      id: "item-a",
      orderId: "checkout_existing",
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      titleSnapshot: line.title,
      skuSnapshot: line.sku,
      variantSnapshotJson: JSON.stringify(line.variantSnapshot),
      externalVariantId: line.externalVariantId,
      optionSummarySnapshot: line.optionSummary,
      unitPrice: line.unitPrice,
      unitCost: line.unitCost,
      providerKey: line.providerKey,
      externalId: line.externalId,
      fulfillmentMode: line.fulfillmentMode,
      supplierOrderId: null,
      status: "PENDING",
    })),
  };
}

const options = {
  orderId: "checkout_existing",
  paymentProvider: "stripe",
  paymentStatus: "UNPAID",
  orderStatus: "DRAFT",
};

test("a mismatched existing attempt is rejected before any create mutation", async () => {
  const original = checkout();
  let createCalls = 0;
  const db = {
    order: {
      findUnique: async () => storedOrder(original),
      create: async () => {
        createCalls += 1;
        throw new Error("must not create");
      },
    },
  } as unknown as Parameters<typeof persistOrderFromCheckout>[0];

  await assert.rejects(
    persistOrderFromCheckout(db, checkout("Different address 2"), options),
    /already used with different order details/
  );
  assert.equal(createCalls, 0);
});

test("new order creation couples customer connect-or-create to the order write", async () => {
  const prepared = checkout();
  let createData: Record<string, unknown> | null = null;
  const created = storedOrder(prepared);
  const db = {
    order: {
      findUnique: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        createData = args.data;
        return created;
      },
    },
  } as unknown as Parameters<typeof persistOrderFromCheckout>[0];

  const result = await persistOrderFromCheckout(db, prepared, options);
  assert.equal(result.reused, false);
  assert.ok(createData);
  assert.ok("customer" in createData);
  assert.equal("customerId" in createData, false);
});
