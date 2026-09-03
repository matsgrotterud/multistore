import { prisma } from "@/lib/db";
import {
  configuredCatalogFreshnessMaxAgeHours,
  evaluateCatalogFreshness,
} from "@/lib/catalog/catalog-freshness";
import { buildStoreGrowthPlan } from "@/lib/growth/store-growth-advisor";
import {
  STORE_GROWTH_WINDOW_DAYS,
  type StoreGrowthCatalogFreshness,
  type StoreGrowthPlan,
} from "@/lib/growth/types";

const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * Read-only collector for the admin growth advisor. It performs no provider,
 * payment, AI or network calls and never writes recommendations to the store.
 */
export async function getStoreGrowthAdvisorPlans(
  options: { storeSlug?: string; now?: Date } = {}
): Promise<StoreGrowthPlan[]> {
  const now = options.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("Store growth advisor requires a valid clock.");
  }
  const windowStart = new Date(
    now.getTime() - STORE_GROWTH_WINDOW_DAYS * DAY_MS
  );

  const stores = await prisma.store.findMany({
    where: options.storeSlug ? { slug: options.storeSlug } : undefined,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      currency: true,
      launchStatus: true,
      isActive: true,
    },
  });
  if (stores.length === 0) return [];

  const storeIds = stores.map((store) => store.id);
  const [events, orders, products] = await Promise.all([
    prisma.cartEvent.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: windowStart, lte: now },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        storeId: true,
        eventName: true,
        sessionId: true,
        payload: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: windowStart, lte: now },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        storeId: true,
        paymentStatus: true,
        paymentProvider: true,
        stripePaymentIntentId: true,
        status: true,
        fulfillmentStatus: true,
        grandTotal: true,
        taxTotal: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            unitCost: true,
          },
        },
        supplierOrders: { select: { status: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        isPublished: true,
        noindex: false,
      },
      orderBy: [{ storeId: "asc" }, { id: "asc" }],
      select: {
        id: true,
        storeId: true,
        lastSupplierSyncAt: true,
        supplierDataJson: true,
      },
    }),
  ]);

  const freshnessMaxAgeHours = configuredCatalogFreshnessMaxAgeHours();
  return stores.map((store) =>
    buildStoreGrowthPlan({
      now,
      store,
      events: events.filter((event) => event.storeId === store.id),
      orders: orders.filter((order) => order.storeId === store.id),
      catalogProducts: products
        .filter((product) => product.storeId === store.id)
        .map((product) => ({
          productId: product.id,
          freshness: productFreshness({
            now,
            maxAgeHours: freshnessMaxAgeHours,
            lastSupplierSyncAt: product.lastSupplierSyncAt,
            supplierDataJson: product.supplierDataJson,
          }),
        })),
    })
  );
}

function productFreshness(input: {
  now: Date;
  maxAgeHours: number;
  lastSupplierSyncAt: Date | null;
  supplierDataJson: string;
}): StoreGrowthCatalogFreshness {
  const decision = evaluateCatalogFreshness({
    mode: "LIVE",
    now: input.now,
    maxAgeHours: input.maxAgeHours,
    lastSupplierSyncAt: input.lastSupplierSyncAt,
    supplierDataJson: input.supplierDataJson,
  });
  if (decision.allowed) return "FRESH";
  return decision.reasonCodes.some((reason) => reason.endsWith("_STALE"))
    ? "STALE"
    : "UNKNOWN";
}
