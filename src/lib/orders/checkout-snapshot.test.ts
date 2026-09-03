import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesPreparedCheckoutSnapshot,
  persistedCheckoutFingerprint,
  preparedCheckoutFingerprint,
  type ExpectedCheckoutPersistenceState,
  type PersistedCheckoutSnapshot,
} from "./checkout-snapshot";
import type { PreparedCheckout } from "./types";

const expected: ExpectedCheckoutPersistenceState = {
  orderStatus: "DRAFT",
  paymentStatus: "UNPAID",
  paymentProvider: "stripe",
  paymentError: null,
};

function preparedCheckout(): PreparedCheckout {
  return {
    checkoutAttemptId: "550e8400-e29b-41d4-a716-446655440000",
    storeId: "store-a",
    storeSlug: "fluffy-slippers",
    currency: "NOK",
    subtotal: 798,
    shippingTotal: 0,
    grandTotal: 798,
    orderNumber: "ORD-FIRST",
    customer: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      addressLine1: "Storgata 1",
      city: "Oslo",
      postalCode: "0151",
      country: "Norway",
    },
    lines: [
      {
        productId: "product-b",
        variantId: null,
        title: "Cloud slippers",
        slug: "cloud-slippers",
        sku: "CLOUD-BASE",
        variantTitle: null,
        optionSummary: null,
        externalVariantId: null,
        variantSnapshot: {},
        quantity: 1,
        unitPrice: 499,
        unitCost: 120,
        fulfillmentMode: "DROPSHIP",
        providerKey: "cj",
        externalId: "supplier-b",
        shippingDaysMin: 5,
        shippingDaysMax: 9,
        countryOfOrigin: "CN",
      },
      {
        productId: "product-a",
        variantId: "variant-a",
        title: "Plush slippers",
        slug: "plush-slippers",
        sku: "PLUSH-PINK-38",
        variantTitle: "Pink / 38",
        optionSummary: "Color: Pink, Size: 38",
        externalVariantId: "supplier-variant-a",
        variantSnapshot: {
          options: { Size: "38", Color: "Pink" },
          title: "Pink / 38",
        },
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

function persistedOrder(checkout: PreparedCheckout): PersistedCheckoutSnapshot {
  return {
    storeId: checkout.storeId,
    status: "DRAFT",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "NOT_STARTED",
    paymentProvider: "stripe",
    paymentError: null,
    currency: checkout.currency,
    subtotal: checkout.subtotal,
    shippingTotal: checkout.shippingTotal,
    taxTotal: 0,
    grandTotal: checkout.grandTotal,
    // Deliberately use a different object-key order to prove semantic JSON matching.
    shippingAddressJson: JSON.stringify({
      country: checkout.customer.country,
      postalCode: checkout.customer.postalCode,
      city: checkout.customer.city,
      addressLine1: checkout.customer.addressLine1,
      email: checkout.customer.email,
      name: checkout.customer.name,
    }),
    billingAddressJson: JSON.stringify(checkout.customer),
    // Deliberately reverse line order; item order is not commercially meaningful.
    items: [...checkout.lines].reverse().map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      titleSnapshot: line.optionSummary
        ? `${line.title} (${line.optionSummary})`
        : line.title,
      skuSnapshot: line.sku,
      variantSnapshotJson: JSON.stringify(line.variantSnapshot),
      externalVariantId: line.externalVariantId,
      optionSummarySnapshot: line.optionSummary,
      unitPrice: line.unitPrice,
      unitCost: line.unitCost,
      providerKey: line.providerKey,
      externalId: line.externalId,
      fulfillmentMode: line.fulfillmentMode,
    })),
  };
}

function copyCheckout(checkout: PreparedCheckout): PreparedCheckout {
  return structuredClone(checkout);
}

test("an exact retry matches despite a new order number and non-semantic ordering", () => {
  const first = preparedCheckout();
  const retry = copyCheckout(first);
  retry.orderNumber = "ORD-RETRY";
  const stored = persistedOrder(first);

  assert.equal(matchesPreparedCheckoutSnapshot(stored, retry, expected), true);
  assert.equal(
    persistedCheckoutFingerprint(stored),
    preparedCheckoutFingerprint(retry, expected)
  );
});

test("the same attempt ID cannot be reused after changing the address", () => {
  const first = preparedCheckout();
  const changed = copyCheckout(first);
  changed.customer.addressLine1 = "Karl Johans gate 99";

  assert.equal(
    matchesPreparedCheckoutSnapshot(persistedOrder(first), changed, expected),
    false
  );
});

test("the same attempt ID cannot be reused after changing cart contents", () => {
  const first = preparedCheckout();
  const changedQuantity = copyCheckout(first);
  changedQuantity.lines[0].quantity = 2;
  changedQuantity.subtotal = 1_297;
  changedQuantity.grandTotal = 1_297;

  assert.equal(
    matchesPreparedCheckoutSnapshot(
      persistedOrder(first),
      changedQuantity,
      expected
    ),
    false
  );

  const changedVariant = copyCheckout(first);
  changedVariant.lines[1].externalVariantId = "different-supplier-variant";
  assert.equal(
    matchesPreparedCheckoutSnapshot(
      persistedOrder(first),
      changedVariant,
      expected
    ),
    false
  );
});

test("malformed persisted address or variant JSON fails closed", () => {
  const checkout = preparedCheckout();
  const badAddress = persistedOrder(checkout);
  badAddress.shippingAddressJson = "not-json";
  assert.equal(matchesPreparedCheckoutSnapshot(badAddress, checkout, expected), false);

  const badVariant = persistedOrder(checkout);
  badVariant.items[0].variantSnapshotJson = "not-json";
  assert.equal(matchesPreparedCheckoutSnapshot(badVariant, checkout, expected), false);
});
