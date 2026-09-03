import type { PrismaClient } from "@prisma/client";
import { matchesPreparedCheckoutSnapshot } from "@/lib/orders/checkout-snapshot";
import type { PreparedCheckout } from "@/lib/orders/types";
import { toJson } from "@/lib/utils/json";

type Db = Pick<PrismaClient, "order">;

export interface PersistOrderOptions {
  orderId?: string;
  paymentProvider: string;
  paymentStatus: string;
  orderStatus?: string;
  stripePaymentIntentId?: string | null;
  paymentError?: string | null;
}

export async function persistOrderFromCheckout(
  db: Db,
  checkout: PreparedCheckout,
  options: PersistOrderOptions
) {
  const expected = {
    orderStatus: options.orderStatus ?? "DRAFT",
    paymentStatus: options.paymentStatus,
    paymentProvider: options.paymentProvider,
    paymentError: options.paymentError ?? null,
  };
  const include = { items: true, customer: true } as const;

  const existing = options.orderId
    ? await db.order.findUnique({ where: { id: options.orderId }, include })
    : null;
  if (existing) {
    if (
      !existing.customer ||
      !matchesPreparedCheckoutSnapshot(existing, checkout, expected)
    ) {
      throw checkoutAttemptMismatchError();
    }
    return { customer: existing.customer, order: existing, reused: true };
  }

  try {
    const order = await db.order.create({
      data: {
        ...(options.orderId ? { id: options.orderId } : {}),
        store: { connect: { id: checkout.storeId } },
        customer: {
          connectOrCreate: {
            where: {
              storeId_email: {
                storeId: checkout.storeId,
                email: checkout.customer.email.toLowerCase(),
              },
            },
            create: {
              storeId: checkout.storeId,
              email: checkout.customer.email.toLowerCase(),
              name: checkout.customer.name,
            },
          },
        },
        orderNumber: checkout.orderNumber,
        status: expected.orderStatus,
        paymentStatus: expected.paymentStatus,
        fulfillmentStatus: "NOT_STARTED",
        paymentProvider: expected.paymentProvider,
        stripePaymentIntentId: options.stripePaymentIntentId ?? null,
        paymentError: expected.paymentError,
        currency: checkout.currency,
        subtotal: checkout.subtotal,
        shippingTotal: checkout.shippingTotal,
        taxTotal: 0,
        grandTotal: checkout.grandTotal,
        shippingAddressJson: toJson(checkout.customer),
        billingAddressJson: toJson(checkout.customer),
        items: {
          create: checkout.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            titleSnapshot:
              line.optionSummary ? `${line.title} (${line.optionSummary})` : line.title,
            skuSnapshot: line.sku,
            variantSnapshotJson: toJson(line.variantSnapshot),
            externalVariantId: line.externalVariantId,
            optionSummarySnapshot: line.optionSummary,
            unitPrice: line.unitPrice,
            unitCost: line.unitCost,
            providerKey: line.providerKey,
            externalId: line.externalId,
            fulfillmentMode: line.fulfillmentMode,
            status: "PENDING",
          })),
        },
      },
      include,
    });
    if (!order.customer) throw new Error("Checkout order customer was not attached.");
    return { customer: order.customer, order, reused: false };
  } catch (error) {
    const racedOrder = options.orderId
      ? await db.order.findUnique({
          where: { id: options.orderId },
          include,
        })
      : null;
    if (!racedOrder) throw error;
    if (
      !racedOrder.customer ||
      !matchesPreparedCheckoutSnapshot(racedOrder, checkout, expected)
    ) {
      throw checkoutAttemptMismatchError();
    }
    return { customer: racedOrder.customer, order: racedOrder, reused: true };
  }
}

function checkoutAttemptMismatchError(): Error {
  return new Error(
    "This checkout attempt was already used with different order details. Start a new checkout attempt."
  );
}
