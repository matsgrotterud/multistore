import type { PrismaClient } from "@prisma/client";
import type { PreparedCheckout } from "@/lib/orders/types";
import { toJson } from "@/lib/utils/json";

type Db = Pick<PrismaClient, "customer" | "order" | "orderItem">;

export interface PersistOrderOptions {
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
  const customer = await db.customer.upsert({
    where: {
      storeId_email: {
        storeId: checkout.storeId,
        email: checkout.customer.email.toLowerCase(),
      },
    },
    update: {
      name: checkout.customer.name,
    },
    create: {
      storeId: checkout.storeId,
      email: checkout.customer.email.toLowerCase(),
      name: checkout.customer.name,
    },
  });

  const order = await db.order.create({
    data: {
      storeId: checkout.storeId,
      customerId: customer.id,
      orderNumber: checkout.orderNumber,
      status: options.orderStatus ?? "DRAFT",
      paymentStatus: options.paymentStatus,
      fulfillmentStatus: "NOT_STARTED",
      paymentProvider: options.paymentProvider,
      stripePaymentIntentId: options.stripePaymentIntentId ?? null,
      paymentError: options.paymentError ?? null,
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
          quantity: line.quantity,
          titleSnapshot: line.title,
          skuSnapshot: line.sku,
          unitPrice: line.unitPrice,
          unitCost: line.unitCost,
          providerKey: line.providerKey,
          externalId: line.externalId,
          fulfillmentMode: line.fulfillmentMode,
          status: "PENDING",
        })),
      },
    },
    include: { items: true },
  });

  return { customer, order };
}
