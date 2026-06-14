import { prisma } from "@/lib/db";
import { getCommerceProviders } from "@/lib/suppliers/providers/registry";
import type { ProviderHealth } from "@/lib/suppliers/providers/types";

export interface AdminProviderRow {
  key: string;
  name: string;
  health: ProviderHealth;
  enabledStores: number;
  lastSync: string | null;
  orderApiStatus: string;
}

export async function getAdminProviderDashboard(): Promise<AdminProviderRow[]> {
  const providers = getCommerceProviders();
  const storeSettings = await prisma.storeSupplierSettings.findMany({
    where: { isEnabled: true },
    select: { providerKey: true, storeId: true, fulfillmentMode: true },
  });

  const syncRuns = await prisma.catalogSyncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    select: { providerKey: true, startedAt: true, status: true },
  });

  const rows: AdminProviderRow[] = [];
  for (const provider of providers) {
    const health = await provider.getHealth();
    const enabledStores = new Set(
      storeSettings.filter((setting) => setting.providerKey === provider.key).map((s) => s.storeId)
    ).size;
    const lastRun = syncRuns.find((run) => run.providerKey === provider.key);

    let orderApiStatus = "Not supported";
    if (provider.capabilities.checkout && provider.createDropshipOrder) {
      orderApiStatus = health.status === "OK" ? "Ready" : "Configured but unhealthy";
    } else if (provider.key === "cj") {
      orderApiStatus =
        process.env.CJ_ORDER_API_ENABLED === "true"
          ? "Enabled — verify CJ contract"
          : "Disabled until CJ_ORDER_API_ENABLED=true";
    } else if (provider.key === "doba") {
      orderApiStatus = "Scaffold only";
    }

    rows.push({
      key: provider.key,
      name: provider.name,
      health,
      enabledStores,
      lastSync: lastRun?.startedAt.toISOString() ?? null,
      orderApiStatus,
    });
  }

  return rows;
}

export async function getAdminOrders(limit = 50) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      store: { select: { slug: true, name: true } },
      customer: { select: { email: true, name: true } },
      supplierOrders: true,
      items: { select: { titleSnapshot: true, quantity: true, status: true, fulfillmentMode: true } },
    },
  });
}
