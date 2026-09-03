import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  evaluateCheckoutCommerceEligibility,
  parseFulfillmentModeStrict,
} from "@/lib/orders/checkout-eligibility";
import {
  deterministicRouteOrderJobId,
  deterministicSupplierOrderId,
  evaluateRoutingOrder,
  isBuyerAcceptedOrderState,
  shouldReconcileSubmitting,
  validateStripeIntentForRouting,
} from "@/lib/orders/route-order-state";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { getStripeClient } from "@/lib/payments/stripe-client";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { decideCatalogVisibilityV3 } from "@/lib/stores/catalog-visibility-v3";
import { isProductCheckoutAvailable } from "@/lib/stores/checkout-availability";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { toJson } from "@/lib/utils/json";
import {
  configuredCatalogFreshnessMaxAgeHours,
  evaluateCatalogFreshness,
} from "@/lib/catalog/catalog-freshness";

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

const routingOrderInclude = {
  items: {
    include: {
      product: { include: { variants: true } },
      variant: true,
    },
  },
  store: {
    include: {
      settings: true,
      supplierSettings: true,
    },
  },
  supplierOrders: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

type RoutingOrder = Prisma.OrderGetPayload<{ include: typeof routingOrderInclude }>;
type RoutingReader = Pick<Prisma.TransactionClient, "order">;

async function findRoutingOrder(db: RoutingReader, orderId: string): Promise<RoutingOrder | null> {
  return db.order.findUnique({
    where: { id: orderId },
    include: routingOrderInclude,
  });
}

function resultFromOrder(
  order: RoutingOrder,
  options: { ok?: boolean; publicError?: string } = {}
): RouteOrderResult {
  const ok =
    options.ok ??
    isBuyerAcceptedOrderState({
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    });
  return {
    ok,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    // Raw Stripe/provider diagnostics remain in the database/admin surface.
    // The buyer-facing PATCH response must never serialize upstream details.
    error:
      ok
        ? undefined
        : options.publicError ??
          "Order processing could not be completed safely. Contact support with your order number.",
    supplierOrders: order.supplierOrders.length,
  };
}

function missingOrderResult(orderId: string): RouteOrderResult {
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

function isTerminalOrderStatus(status: string): boolean {
  return ["SUPPLIER_ORDERED", "FULFILLMENT_PENDING", "ERROR", "CANCELLED"].includes(
    status
  );
}

function routingValidation(order: RoutingOrder) {
  const settings = parseStoreSettings(order.store.settings?.settings);
  const freshnessNow = new Date();
  const freshnessMaxAgeHours = configuredCatalogFreshnessMaxAgeHours();
  return evaluateRoutingOrder({
    orderId: order.id,
    storeId: order.storeId,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    stripePaymentIntentId: order.stripePaymentIntentId,
    store: {
      id: order.store.id,
      isActive: order.store.isActive,
      launchStatus: order.store.launchStatus,
    },
    lines: order.items.map((item) => {
      const product = item.product;
      const variant = item.variant;
      const mode = parseFulfillmentModeStrict(item.fulfillmentMode);
      const providerKey = item.providerKey ?? product.providerKey;
      const currentCost = variant?.cost ?? product.cost;
      const currentShippingCost = variant?.shippingCost ?? product.shippingCost;
      const margin = calculateGrossMargin({
        // The customer cannot be repriced after authorization. Revalidate the
        // contribution margin against the immutable amount actually charged,
        // while using current supplier costs to catch margin erosion.
        price: item.unitPrice,
        cost: currentCost,
        shippingCost: currentShippingCost,
      });
      const commerce = evaluateCheckoutCommerceEligibility({
        mode: mode === "MOCK" ? "MOCK" : "LIVE",
        store: {
          isActive: order.store.isActive,
          launchStatus: order.store.launchStatus,
          generation: settings.generation,
        },
        product: {
          isPublished: product.isPublished,
          catalogVisible: decideCatalogVisibilityV3(order.store, product).visible,
          mediaStatus: product.mediaStatus,
          qualityStatus: product.qualityStatus,
          supplierDataJson: product.supplierDataJson,
        },
        contributionMarginPercent: margin.grossMarginPercent,
        minimumContributionMarginPercent: settings.monetization.minMarginPercent,
      });
      const catalogFreshness = evaluateCatalogFreshness({
        mode: mode === "MOCK" ? "MOCK" : "LIVE",
        lastSupplierSyncAt: product.lastSupplierSyncAt,
        supplierDataJson: product.supplierDataJson,
        maxAgeHours: freshnessMaxAgeHours,
        now: freshnessNow,
      });

      let providerCheckoutAvailable = mode !== "DROPSHIP";
      if (mode === "DROPSHIP" && providerKey) {
        try {
          const provider = getCommerceProvider(providerKey);
          providerCheckoutAvailable = Boolean(
            provider.capabilities.checkout && provider.createDropshipOrder
          );
        } catch {
          providerCheckoutAvailable = false;
        }
      }
      const supplierSetting = providerKey
        ? order.store.supplierSettings.find(
            (candidate) => candidate.providerKey === providerKey
          )
        : null;
      const checkoutEnvironment =
        mode === "MOCK"
          ? process.env
          : { ...process.env, MOCK_CHECKOUT: "false" };

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        externalVariantId: item.externalVariantId,
        skuSnapshot: item.skuSnapshot,
        fulfillmentMode: item.fulfillmentMode,
        providerKey: item.providerKey,
        externalId: item.externalId,
        commerceEligible: commerce.allowed,
        catalogFresh: catalogFreshness.allowed,
        checkoutAvailable: isProductCheckoutAvailable(product, checkoutEnvironment),
        supplierSettingEnabled:
          mode !== "DROPSHIP" ||
          Boolean(
            supplierSetting?.isEnabled &&
              supplierSetting.fulfillmentMode === "DROPSHIP"
          ),
        providerCheckoutAvailable,
        product: {
          id: product.id,
          storeId: product.storeId,
          isPublished: product.isPublished,
          stockStatus: product.stockStatus,
          fulfillmentMode: product.fulfillmentMode,
          providerKey: product.providerKey,
          externalId: product.externalId,
          sku: product.sku,
          currency: product.currency,
          variantCount: product.variants.length,
        },
        variant: variant
          ? {
              id: variant.id,
              productId: variant.productId,
              stockStatus: variant.stockStatus,
              externalVariantId: variant.externalVariantId,
              sku: variant.sku,
            }
          : null,
      };
    }),
  });
}

function supplierRequest(order: RoutingOrder, providerKey: string | null) {
  return {
    version: "supplier-route.v1",
    merchantReference: order.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    providerKey,
    shippingAddress: parseShippingAddress(order.shippingAddressJson),
    items: order.items.map((item) => ({
      orderItemId: item.id,
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
    })),
  };
}

function parseShippingAddress(raw: string): Record<string, unknown> {
  const value = JSON.parse(raw) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Shipping address is invalid.");
  }
  const address = value as Record<string, unknown>;
  for (const key of ["name", "email", "addressLine1", "city", "postalCode", "country"]) {
    if (typeof address[key] !== "string" || !address[key]?.trim()) {
      throw new Error(`Shipping address is missing ${key}.`);
    }
  }
  return address;
}

/**
 * Atomically claims a confirmed order, persists one durable route before any
 * supplier write, and makes retries state-driven. SUBMITTING is never replayed.
 */
export async function routeOrder(orderId: string): Promise<RouteOrderResult> {
  let order = await findRoutingOrder(prisma, orderId);
  if (!order) return missingOrderResult(orderId);

  if (isTerminalOrderStatus(order.status)) return resultFromOrder(order);
  if (order.status === "FULFILLMENT_ROUTING") {
    return resumeRoutingOrder(order);
  }
  if (order.supplierOrders.length > 0) {
    return resultFromOrder(order, {
      ok: false,
      publicError:
        "Order has a fulfillment route without the matching routing state and requires reconciliation.",
    });
  }
  if (order.status !== "CONFIRMED") {
    return resultFromOrder(order, {
      ok: false,
      publicError: "Order is not confirmed for fulfillment.",
    });
  }

  const claim = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        status: "CONFIRMED",
        fulfillmentStatus: "NOT_STARTED",
        paymentStatus: { in: ["AUTHORIZED", "CAPTURED"] },
      },
      data: {
        status: "FULFILLMENT_ROUTING",
        fulfillmentStatus: "PENDING",
        paymentError: null,
      },
    });
    if (claimed.count !== 1) return "LOST" as const;

    const current = await findRoutingOrder(tx, orderId);
    if (!current) throw new Error("Claimed order disappeared.");
    const validation = routingValidation(current);
    if (!validation.allowed) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "ERROR",
          fulfillmentStatus: "ERROR",
          paymentError: `Fulfillment revalidation failed: ${validation.reasonCodes.join(", ")}`,
        },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: "REVALIDATION_FAILED" },
      });
      return "INVALID" as const;
    }

    if (validation.mode === "MOCK") {
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: "MOCK_FULFILLED" },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "SUPPLIER_ORDERED",
          paymentStatus: "CAPTURED",
          fulfillmentStatus: "MOCK",
          paymentError: null,
        },
      });
      return "MOCK_DONE" as const;
    }

    const supplierOrderId = deterministicSupplierOrderId(
      current.id,
      validation.routeKey
    );
    const initialStatus =
      validation.mode === "MANUAL" ? "MANUAL_ACTION_REQUIRED" : "PREPARED";
    let request: ReturnType<typeof supplierRequest>;
    try {
      request = supplierRequest(current, validation.providerKey);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Shipping address is invalid.";
      await tx.order.update({
        where: { id: orderId },
        data: { status: "ERROR", fulfillmentStatus: "ERROR", paymentError: reason },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: "REVALIDATION_FAILED" },
      });
      return "INVALID" as const;
    }
    await tx.supplierOrder.create({
      data: {
        id: supplierOrderId,
        orderId: current.id,
        providerKey: validation.providerKey ?? "manual",
        status: initialStatus,
        requestJson: toJson(request),
      },
    });
    await tx.orderItem.updateMany({
      where: { orderId },
      data: {
        supplierOrderId,
        status:
          validation.mode === "MANUAL" ? "MANUAL_ACTION_REQUIRED" : "PREPARED",
      },
    });
    // Durable recovery is created in the same transaction as the fulfillment
    // route. A process crash can no longer leave PREPARED/PLACED/capture work
    // dependent on a browser request or a duplicate Stripe webhook.
    await tx.catalogJob.upsert({
      where: { id: deterministicRouteOrderJobId(current.id) },
      create: {
        id: deterministicRouteOrderJobId(current.id),
        storeId: current.storeId,
        providerKey: validation.providerKey ?? "manual",
        jobType: "ROUTE_ORDER",
        payloadJson: toJson({ orderId: current.id }),
        maxAttempts: 8,
      },
      update: {},
    });
    return validation.mode === "MANUAL" ? "MANUAL_READY" as const : "PREPARED" as const;
  });

  order = await findRoutingOrder(prisma, orderId);
  if (!order) return missingOrderResult(orderId);
  if (claim === "INVALID") {
    await cancelAuthorizedPayment(order);
    const failed = await findRoutingOrder(prisma, orderId);
    return failed ? resultFromOrder(failed, { ok: false }) : missingOrderResult(orderId);
  }
  if (claim === "MOCK_DONE") return resultFromOrder(order);
  return resumeRoutingOrder(order);
}

async function resumeRoutingOrder(order: RoutingOrder): Promise<RouteOrderResult> {
  if (isTerminalOrderStatus(order.status)) return resultFromOrder(order);
  if (order.supplierOrders.length !== 1) {
    if (order.supplierOrders.length === 0) {
      await prisma.order.updateMany({
        where: { id: order.id, status: "FULFILLMENT_ROUTING" },
        data: {
          status: "FULFILLMENT_PENDING",
          fulfillmentStatus: "PENDING",
          paymentError: "Fulfillment route requires reconciliation: durable route is missing.",
        },
      });
    }
    const current = await findRoutingOrder(prisma, order.id);
    return current
      ? resultFromOrder(current, {
          ok: false,
          publicError: "Order fulfillment requires operator review.",
        })
      : missingOrderResult(order.id);
  }

  const supplierOrder = order.supplierOrders[0];
  switch (supplierOrder.status) {
    case "PREPARED":
      return submitPreparedOrder(order, supplierOrder.id);
    case "SUBMITTING":
      if (shouldReconcileSubmitting(supplierOrder.updatedAt)) {
        return markReconcileRequired(
          order.id,
          supplierOrder.id,
          "Supplier submission outcome is unknown after an interrupted attempt."
        );
      }
      return resultFromOrder(order);
    case "PLACED":
      return captureAndFinalizePlaced(order);
    case "MANUAL_ACTION_REQUIRED":
      return finalizeManualOrder(order);
    case "PENDING":
    case "RECONCILE_REQUIRED":
      await ensurePendingOrder(order.id, supplierOrder.status);
      break;
    default:
      return markReconcileRequired(
        order.id,
        supplierOrder.id,
        `Unknown supplier route state: ${supplierOrder.status}`
      );
  }
  const current = await findRoutingOrder(prisma, order.id);
  return current ? resultFromOrder(current) : missingOrderResult(order.id);
}

async function submitPreparedOrder(
  order: RoutingOrder,
  supplierOrderId: string
): Promise<RouteOrderResult> {
  const stripeErrors = await validateCurrentStripePayment(order);
  if (stripeErrors.length > 0) {
    const transitionWon = await failBeforeSupplierCall(
      order.id,
      supplierOrderId,
      stripeErrors.join(", ")
    );
    const current = await findRoutingOrder(prisma, order.id);
    if (transitionWon && current) await cancelAuthorizedPayment(current);
    const refreshed = await findRoutingOrder(prisma, order.id);
    return refreshed
      ? resultFromOrder(refreshed, { ok: false })
      : missingOrderResult(order.id);
  }

  const submission = await prisma.$transaction(async (tx) => {
    const current = await findRoutingOrder(tx, order.id);
    if (!current) return { kind: "MISSING" as const };
    const validation = routingValidation(current);
    if (!validation.allowed || validation.mode !== "DROPSHIP" || !validation.providerKey) {
      const reason = validation.allowed
        ? "Route is no longer a dropship route."
        : validation.reasonCodes.join(", ");
      const supplierFailed = await tx.supplierOrder.updateMany({
        where: { id: supplierOrderId, status: "PREPARED" },
        data: { status: "REVALIDATION_FAILED", errorMessage: reason },
      });
      if (supplierFailed.count !== 1) return { kind: "LOST" as const };
      await tx.orderItem.updateMany({
        where: { orderId: current.id, supplierOrderId },
        data: { status: "REVALIDATION_FAILED" },
      });
      await tx.order.updateMany({
        where: { id: current.id, status: "FULFILLMENT_ROUTING" },
        data: { status: "ERROR", fulfillmentStatus: "ERROR", paymentError: reason },
      });
      return { kind: "INVALID" as const };
    }

    try {
      parseShippingAddress(current.shippingAddressJson);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Shipping address is invalid.";
      const supplierFailed = await tx.supplierOrder.updateMany({
        where: { id: supplierOrderId, status: "PREPARED" },
        data: { status: "REVALIDATION_FAILED", errorMessage: reason },
      });
      if (supplierFailed.count !== 1) return { kind: "LOST" as const };
      await tx.orderItem.updateMany({
        where: { orderId: current.id, supplierOrderId },
        data: { status: "REVALIDATION_FAILED" },
      });
      await tx.order.updateMany({
        where: { id: current.id, status: "FULFILLMENT_ROUTING" },
        data: { status: "ERROR", fulfillmentStatus: "ERROR", paymentError: reason },
      });
      return { kind: "INVALID" as const };
    }
    const claimed = await tx.supplierOrder.updateMany({
      where: { id: supplierOrderId, orderId: current.id, status: "PREPARED" },
      data: { status: "SUBMITTING", errorMessage: null },
    });
    if (claimed.count !== 1) return { kind: "LOST" as const };
    await tx.orderItem.updateMany({
      where: { orderId: current.id, supplierOrderId },
      data: { status: "SUBMITTING" },
    });
    return { kind: "CLAIMED" as const, order: current, providerKey: validation.providerKey };
  });

  if (submission.kind !== "CLAIMED") {
    const current = await findRoutingOrder(prisma, order.id);
    if (!current) return missingOrderResult(order.id);
    if (submission.kind === "INVALID") await cancelAuthorizedPayment(current);
    const refreshed = await findRoutingOrder(prisma, order.id);
    return refreshed ? resumeRoutingOrder(refreshed) : missingOrderResult(order.id);
  }

  let provider;
  try {
    provider = getCommerceProvider(submission.providerKey);
  } catch {
    return markReconcileRequired(
      order.id,
      supplierOrderId,
      "Provider disappeared after submission was claimed."
    );
  }
  if (!provider.capabilities.checkout || !provider.createDropshipOrder) {
    return markReconcileRequired(
      order.id,
      supplierOrderId,
      "Provider checkout became unavailable after submission was claimed."
    );
  }

  const shippingAddress = parseShippingAddress(submission.order.shippingAddressJson);
  try {
    const result = await provider.createDropshipOrder({
      orderId: submission.order.id,
      items: submission.order.items.map((item) => ({
        externalId: item.externalId!,
        externalVariantId: item.externalVariantId ?? undefined,
        sku: item.skuSnapshot,
        optionSummary: item.optionSummarySnapshot ?? undefined,
        quantity: item.quantity,
        title: item.titleSnapshot,
        unitPrice: item.unitPrice,
      })),
      shippingAddress,
    });

    if (result.status === "ERROR") {
      return markReconcileRequired(
        order.id,
        supplierOrderId,
        result.errorMessage ?? "Supplier submission returned an ambiguous error."
      );
    }
    if (result.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        const stored = await tx.supplierOrder.updateMany({
          where: { id: supplierOrderId, status: "SUBMITTING" },
          data: {
            status: "PENDING",
            externalOrderId: result.externalOrderId ?? null,
            responseJson: toJson(result.responseJson ?? {}),
            errorMessage: result.errorMessage ?? null,
          },
        });
        if (stored.count !== 1) return;
        await tx.orderItem.updateMany({
          where: { orderId: order.id, supplierOrderId },
          data: { status: "PENDING" },
        });
        await tx.order.updateMany({
          where: { id: order.id, status: "FULFILLMENT_ROUTING" },
          data: {
            status: "FULFILLMENT_PENDING",
            fulfillmentStatus: "PENDING",
            paymentError: "Supplier order is awaiting provider confirmation.",
          },
        });
      });
    } else {
      await prisma.supplierOrder.updateMany({
        where: { id: supplierOrderId, status: "SUBMITTING" },
        data: {
          status: "PLACED",
          externalOrderId: result.externalOrderId ?? null,
          responseJson: toJson(result.responseJson ?? {}),
          errorMessage: result.errorMessage ?? null,
        },
      });
    }
  } catch (error) {
    return markReconcileRequired(
      order.id,
      supplierOrderId,
      error instanceof Error ? error.message : "Supplier submission outcome is unknown."
    );
  }

  const current = await findRoutingOrder(prisma, order.id);
  return current ? resumeRoutingOrder(current) : missingOrderResult(order.id);
}

async function validateCurrentStripePayment(order: RoutingOrder): Promise<string[]> {
  if (order.paymentProvider !== "stripe") return [];
  if (!order.stripePaymentIntentId) return ["STRIPE_PAYMENT_INTENT_MISSING"];
  try {
    const intent = await getStripeClient().paymentIntents.retrieve(
      order.stripePaymentIntentId
    );
    return validateStripeIntentForRouting({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      stripePaymentIntentId: order.stripePaymentIntentId,
      grandTotal: order.grandTotal,
      currency: order.currency,
      intent: {
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        metadata: intent.metadata,
      },
    });
  } catch (error) {
    return [error instanceof Error ? error.message : "STRIPE_RETRIEVE_FAILED"];
  }
}

async function captureAndFinalizePlaced(order: RoutingOrder): Promise<RouteOrderResult> {
  const captured = await capturePaymentIfNeeded(order);
  if (!captured) {
    const current = await findRoutingOrder(prisma, order.id);
    return current ? resultFromOrder(current) : missingOrderResult(order.id);
  }
  await prisma.$transaction(async (tx) => {
    const finalized = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["FULFILLMENT_ROUTING", "CONFIRMED"] } },
      data: {
        status: "SUPPLIER_ORDERED",
        paymentStatus: "CAPTURED",
        fulfillmentStatus: "SUPPLIER_ORDERED",
        paymentError: null,
      },
    });
    if (finalized.count !== 1) return;
    await tx.orderItem.updateMany({
      where: { orderId: order.id, supplierOrderId: order.supplierOrders[0].id },
      data: { status: "SUPPLIER_ORDERED" },
    });
  });
  const current = await findRoutingOrder(prisma, order.id);
  return current ? resultFromOrder(current) : missingOrderResult(order.id);
}

async function finalizeManualOrder(order: RoutingOrder): Promise<RouteOrderResult> {
  const stripeErrors = await validateCurrentStripePayment(order);
  if (stripeErrors.length > 0) {
    await prisma.order.updateMany({
      where: { id: order.id, status: "FULFILLMENT_ROUTING" },
      data: { paymentError: `Payment revalidation failed: ${stripeErrors.join(", ")}` },
    });
    return resultFromOrder(order, {
      ok: false,
      publicError: "Payment could not be safely verified for fulfillment.",
    });
  }
  const captured = await capturePaymentIfNeeded(order);
  if (!captured) {
    const current = await findRoutingOrder(prisma, order.id);
    return current ? resultFromOrder(current) : missingOrderResult(order.id);
  }
  await prisma.$transaction(async (tx) => {
    const finalized = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["FULFILLMENT_ROUTING", "CONFIRMED"] } },
      data: {
        status: "FULFILLMENT_PENDING",
        paymentStatus: "CAPTURED",
        fulfillmentStatus: "MANUAL",
        paymentError: "Manual fulfillment action is required.",
      },
    });
    if (finalized.count !== 1) return;
    await tx.orderItem.updateMany({
      where: { orderId: order.id, supplierOrderId: order.supplierOrders[0].id },
      data: { status: "MANUAL_QUEUED" },
    });
  });
  const current = await findRoutingOrder(prisma, order.id);
  return current ? resultFromOrder(current) : missingOrderResult(order.id);
}

async function capturePaymentIfNeeded(order: RoutingOrder): Promise<boolean> {
  if (order.paymentStatus === "CAPTURED") return true;
  if (
    order.paymentStatus !== "AUTHORIZED" ||
    order.paymentProvider !== "stripe" ||
    !order.stripePaymentIntentId
  ) {
    return false;
  }
  try {
    const intent = await getStripeClient().paymentIntents.capture(
      order.stripePaymentIntentId,
      {},
      { idempotencyKey: `capture-v1:${order.id}` }
    );
    if (intent.status !== "succeeded") throw new Error(`Unexpected capture status ${intent.status}`);
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "AUTHORIZED" },
      data: { paymentStatus: "CAPTURED" },
    });
    order.paymentStatus = "CAPTURED";
    return true;
  } catch (error) {
    try {
      const intent = await getStripeClient().paymentIntents.retrieve(
        order.stripePaymentIntentId
      );
      if (intent.status === "succeeded") {
        await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: "AUTHORIZED" },
          data: { paymentStatus: "CAPTURED" },
        });
        order.paymentStatus = "CAPTURED";
        return true;
      }
    } catch {
      // Preserve the routing state for an idempotent capture retry.
    }
    await prisma.order.updateMany({
      where: { id: order.id, status: "FULFILLMENT_ROUTING" },
      data: {
        fulfillmentStatus: "PENDING",
        paymentError:
          error instanceof Error ? error.message : "Payment capture requires retry.",
      },
    });
    return false;
  }
}

async function failBeforeSupplierCall(
  orderId: string,
  supplierOrderId: string,
  reason: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const supplierFailed = await tx.supplierOrder.updateMany({
      where: { id: supplierOrderId, status: "PREPARED" },
      data: { status: "REVALIDATION_FAILED", errorMessage: reason },
    });
    // A different worker may already have advanced to SUBMITTING/PLACED. A
    // stale worker must not overwrite order/items or cancel its authorization.
    if (supplierFailed.count !== 1) return false;
    await tx.orderItem.updateMany({
      where: { orderId, supplierOrderId },
      data: { status: "REVALIDATION_FAILED" },
    });
    await tx.order.updateMany({
      where: { id: orderId, status: "FULFILLMENT_ROUTING" },
      data: { status: "ERROR", fulfillmentStatus: "ERROR", paymentError: reason },
    });
    return true;
  });
}

async function cancelAuthorizedPayment(order: RoutingOrder): Promise<void> {
  if (
    order.paymentStatus !== "AUTHORIZED" ||
    order.paymentProvider !== "stripe" ||
    !order.stripePaymentIntentId
  ) {
    return;
  }
  try {
    await getStripeClient().paymentIntents.cancel(
      order.stripePaymentIntentId,
      {},
      { idempotencyKey: `cancel-fulfillment-v1:${order.id}` }
    );
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "AUTHORIZED" },
      data: { paymentStatus: "CANCELLED" },
    });
  } catch {
    // Keep AUTHORIZED visible for operations; never claim cancellation succeeded.
  }
}

async function markReconcileRequired(
  orderId: string,
  supplierOrderId: string,
  reason: string
): Promise<RouteOrderResult> {
  await prisma.$transaction(async (tx) => {
    const supplierReconciled = await tx.supplierOrder.updateMany({
      where: { id: supplierOrderId, status: { in: ["SUBMITTING", "PREPARED"] } },
      data: { status: "RECONCILE_REQUIRED", errorMessage: reason },
    });
    // Do not let a stale error path regress a route another worker already
    // advanced (especially PLACED) or mutate its order/payment state.
    if (supplierReconciled.count !== 1) return;
    await tx.orderItem.updateMany({
      where: { orderId, supplierOrderId },
      data: { status: "PENDING" },
    });
    await tx.order.updateMany({
      where: { id: orderId, status: { in: ["FULFILLMENT_ROUTING", "CONFIRMED"] } },
      data: {
        status: "FULFILLMENT_PENDING",
        fulfillmentStatus: "PENDING",
        paymentError: reason,
      },
    });
  });
  const current = await findRoutingOrder(prisma, orderId);
  return current ? resultFromOrder(current) : missingOrderResult(orderId);
}

async function ensurePendingOrder(orderId: string, supplierStatus: string): Promise<void> {
  await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["FULFILLMENT_ROUTING", "CONFIRMED"] } },
    data: {
      status: "FULFILLMENT_PENDING",
      fulfillmentStatus: "PENDING",
      paymentError:
        supplierStatus === "RECONCILE_REQUIRED"
          ? "Supplier order requires reconciliation before any retry."
          : "Supplier order is awaiting provider confirmation.",
    },
  });
}
