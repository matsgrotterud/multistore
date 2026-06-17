import { prisma } from "@/lib/db";
import { getStripeClient, paymentCaptureMode } from "@/lib/payments/stripe-client";
import { isCjManualFulfillmentEnabled } from "@/lib/suppliers/providers/cj-auth";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import { toJson } from "@/lib/utils/json";

export interface RouteOrderResult {
  ok: boolean;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  error?: string;
  supplierOrders: number;
}

function manualFulfillmentEnabled(): boolean {
  return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
}

export async function routeOrder(orderId: string): Promise<RouteOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      store: true,
    },
  });

  if (!order) {
    return {
      ok: false,
      orderId,
      orderNumber: "unknown",
      status: "ERROR",
      paymentStatus: "FAILED",
      fulfillmentStatus: "ERROR",
      error: "Order not found",
      supplierOrders: 0,
    };
  }

  if (
    order.status === "SUPPLIER_ORDERED" ||
    order.status === "FULFILLMENT_PENDING" ||
    order.status === "ERROR" ||
    order.status === "CANCELLED"
  ) {
    const supplierOrders = await prisma.supplierOrder.count({ where: { orderId: order.id } });
    return {
      ok: order.status === "SUPPLIER_ORDERED" || order.status === "FULFILLMENT_PENDING",
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      error: order.paymentError ?? undefined,
      supplierOrders,
    };
  }

  const shippingAddress = JSON.parse(order.shippingAddressJson) as Record<string, unknown>;
  const errors: string[] = [];
  let supplierOrdersCreated = 0;
  let pendingSupplierOrders = 0;
  let manualActionRequired = false;

  for (const item of order.items) {
    if (item.fulfillmentMode === "AFFILIATE") {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "AFFILIATE", fulfillmentMode: "AFFILIATE" },
      });
      continue;
    }

    if (item.fulfillmentMode === "MANUAL") {
      if (!manualFulfillmentEnabled()) {
        errors.push(`Manual fulfillment disabled for ${item.titleSnapshot}`);
        continue;
      }
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "MANUAL_QUEUED" },
      });
      continue;
    }

    if (item.fulfillmentMode === "MOCK") {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "MOCK_FULFILLED" },
      });
      continue;
    }

    if (item.fulfillmentMode !== "DROPSHIP") {
      errors.push(`Unsupported fulfillment mode ${item.fulfillmentMode} for ${item.titleSnapshot}`);
      continue;
    }

    const providerKey = item.providerKey ?? item.product.providerKey ?? "mock";
    let provider;
    try {
      provider = getCommerceProvider(providerKey);
    } catch {
      errors.push(`Unknown provider ${providerKey} for ${item.titleSnapshot}`);
      continue;
    }

    const canUseManualCjFallback = provider.key === "cj" && isCjManualFulfillmentEnabled();
    if ((!provider.capabilities.checkout || !provider.createDropshipOrder) && canUseManualCjFallback) {
      const supplierOrder = await prisma.supplierOrder.create({
        data: {
          orderId: order.id,
          providerKey: provider.key,
          status: "MANUAL_ACTION_REQUIRED",
          requestJson: toJson({
            orderId: order.id,
            orderNumber: order.orderNumber,
            shippingAddress,
            item: {
              productId: item.productId,
              productSlug: item.product.slug,
              sourceUrl: item.product.sourceUrl,
              externalId: item.externalId,
              externalVariantId: item.externalVariantId,
              sku: item.skuSnapshot,
              quantity: item.quantity,
              title: item.titleSnapshot,
              optionSummary: item.optionSummarySnapshot,
              unitPrice: item.unitPrice,
            },
          }),
        },
      });

      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          supplierOrderId: supplierOrder.id,
          status: "MANUAL_ACTION_REQUIRED",
        },
      });
      supplierOrdersCreated += 1;
      manualActionRequired = true;
      continue;
    }

    if (!provider.capabilities.checkout || !provider.createDropshipOrder) {
      errors.push(
        `Provider ${provider.name} does not support checkout API for ${item.titleSnapshot}`
      );
      continue;
    }

    if (!item.externalId) {
      errors.push(`Missing supplier external id for ${item.titleSnapshot}`);
      continue;
    }

    try {
      const result = await provider.createDropshipOrder({
        orderId: order.id,
        items: [
          {
            externalId: item.externalId,
            externalVariantId: item.externalVariantId ?? undefined,
            sku: item.skuSnapshot,
            optionSummary: item.optionSummarySnapshot ?? undefined,
            quantity: item.quantity,
            title: item.titleSnapshot,
            unitPrice: item.unitPrice,
          },
        ],
        shippingAddress,
      });

      if (result.status === "ERROR") {
        errors.push(result.errorMessage ?? `Supplier order failed for ${item.titleSnapshot}`);
        continue;
      }

      const supplierOrder = await prisma.supplierOrder.create({
        data: {
          orderId: order.id,
          providerKey: provider.key,
          externalOrderId: result.externalOrderId ?? null,
          status: result.status === "PLACED" ? "PLACED" : "PENDING",
          requestJson: toJson(result.requestJson ?? {}),
          responseJson: toJson(result.responseJson ?? {}),
          errorMessage: result.errorMessage ?? null,
        },
      });

      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          supplierOrderId: supplierOrder.id,
          status: result.status === "PLACED" ? "SUPPLIER_ORDERED" : "PENDING",
        },
      });
      supplierOrdersCreated += 1;
      if (result.status === "PENDING") pendingSupplierOrders += 1;
    } catch (error) {
      const message =
        error instanceof UnsupportedCapabilityError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Supplier order failed";
      errors.push(`${item.titleSnapshot}: ${message}`);
    }
  }

  const hasBlockingErrors = errors.length > 0;
  const captureMode = paymentCaptureMode();

  if (hasBlockingErrors) {
    if (order.stripePaymentIntentId && captureMode === "manual") {
      try {
        const stripe = getStripeClient();
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
      } catch (cancelError) {
        console.error("[route-order] Failed to cancel PaymentIntent:", cancelError);
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "ERROR",
        paymentStatus:
          order.stripePaymentIntentId && captureMode === "manual"
            ? "CANCELLED"
            : order.paymentStatus === "CAPTURED"
              ? "CAPTURED"
              : "FAILED",
        fulfillmentStatus: "ERROR",
        paymentError: errors.join("; "),
      },
    });

    return {
      ok: false,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
      error: errors.join("; "),
      supplierOrders: supplierOrdersCreated,
    };
  }

  if (pendingSupplierOrders > 0) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FULFILLMENT_PENDING",
        paymentStatus:
          order.stripePaymentIntentId && captureMode === "manual"
            ? "AUTHORIZED"
            : order.stripePaymentIntentId
              ? "CAPTURED"
              : order.paymentStatus,
        fulfillmentStatus: "PENDING",
        paymentError:
          "Supplier order was created but still requires provider confirmation before capture.",
      },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
      supplierOrders: supplierOrdersCreated,
    };
  }

  if (
    order.stripePaymentIntentId &&
    captureMode === "manual" &&
    order.paymentStatus !== "CAPTURED"
  ) {
    try {
      const stripe = getStripeClient();
      await stripe.paymentIntents.capture(order.stripePaymentIntentId);
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : "Payment capture failed";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "ERROR",
          paymentStatus: "FAILED",
          fulfillmentStatus: "ERROR",
          paymentError: message,
        },
      });
      return {
        ok: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "ERROR",
        paymentStatus: "FAILED",
        fulfillmentStatus: "ERROR",
        error: message,
        supplierOrders: supplierOrdersCreated,
      };
    }
  }

  const fulfillmentStatus =
    manualActionRequired
      ? "MANUAL_ACTION_REQUIRED"
      : order.items.some((item) => item.fulfillmentMode === "MANUAL") && manualFulfillmentEnabled()
      ? "MANUAL"
      : "SUPPLIER_ORDERED";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: manualActionRequired ? "FULFILLMENT_PENDING" : "SUPPLIER_ORDERED",
      paymentStatus: order.stripePaymentIntentId ? "CAPTURED" : "CAPTURED",
      fulfillmentStatus,
      paymentError: manualActionRequired
        ? "CJ supplier order requires manual placement by an admin."
        : null,
    },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: updated.status,
    paymentStatus: updated.paymentStatus,
    fulfillmentStatus: updated.fulfillmentStatus,
    supplierOrders: supplierOrdersCreated,
  };
}
