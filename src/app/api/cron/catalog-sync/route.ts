import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildCatalogSchedulePlan,
  catalogCadenceBucket,
  catalogStoreProviderKey,
  DEFAULT_CATALOG_DISCOVERY_CADENCE_HOURS,
  DEFAULT_CATALOG_REFRESH_CADENCE_HOURS,
} from "@/lib/jobs/catalog-schedule";
import { enqueueCatalogJobsOnce } from "@/lib/jobs/queue";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const allowMockAutomation = process.env.CATALOG_ALLOW_MOCK_AUTOMATION === "true";
  const refreshCadenceHours = boundedEnvInteger(
    "CATALOG_REFRESH_CADENCE_HOURS",
    DEFAULT_CATALOG_REFRESH_CADENCE_HOURS,
    1,
    7 * 24
  );
  const discoveryCadenceHours = boundedEnvInteger(
    "CATALOG_DISCOVERY_CADENCE_HOURS",
    DEFAULT_CATALOG_DISCOVERY_CADENCE_HOURS,
    24,
    31 * 24
  );
  const refreshLimit = boundedEnvInteger("CATALOG_REFRESH_LIMIT", 6, 1, 20);
  const refreshBucket = catalogCadenceBucket(now, refreshCadenceHours);
  const discoveryBucket = catalogCadenceBucket(now, discoveryCadenceHours);

  // Enqueue every configured store. The deterministic job IDs make this safe
  // to call repeatedly while FIFO processing prevents the newest stores from
  // permanently starving older ones.
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 500,
    include: {
      supplierSettings: {
        where: { isEnabled: true },
        orderBy: [{ priority: "desc" }, { providerKey: "asc" }],
      },
      categories: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const productBindings = await prisma.product.findMany({
    where: {
      storeId: { in: stores.map((store) => store.id) },
      providerKey: { not: null },
      externalId: { not: null },
    },
    select: { storeId: true, providerKey: true },
    distinct: ["storeId", "providerKey"],
  });
  const boundStoreProviders = new Set(
    productBindings
      .filter(
        (binding): binding is { storeId: string; providerKey: string } =>
          typeof binding.providerKey === "string"
      )
      .map((binding) =>
        catalogStoreProviderKey(binding.storeId, binding.providerKey)
      )
  );
  const plan = buildCatalogSchedulePlan({
    stores,
    boundStoreProviders,
    allowMockAutomation,
    refreshBucket,
    discoveryBucket,
    refreshLimit,
    refreshCadenceHours,
    now,
  });
  const [refreshEnqueue, discoveryEnqueue] = await Promise.all([
    enqueueCatalogJobsOnce(plan.refreshJobs),
    enqueueCatalogJobsOnce(plan.discoveryJobs),
  ]);
  const scheduling = {
    storesConsidered: stores.length,
    storesWithoutProvider: plan.storesWithoutProvider,
    providersSkipped: plan.providersSkipped,
    refreshPlanned: plan.refreshJobs.length,
    discoveryPlanned: plan.discoveryJobs.length,
    refreshJobs: refreshEnqueue.enqueued,
    discoveryJobs: discoveryEnqueue.enqueued,
    deduplicated:
      refreshEnqueue.deduplicated + discoveryEnqueue.deduplicated,
  };

  const summary = await runQueuedCatalogJobs({
    batchSize: Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20),
    timeboxMs: 25_000,
    workerId: "cron-catalog-sync",
  });

  const completelyFailed = summary.failed > 0 && summary.succeeded === 0;
  return NextResponse.json(
    {
      ok: !completelyFailed,
      enqueued: scheduling.refreshJobs + scheduling.discoveryJobs,
      scheduling,
      summary,
    },
    { status: completelyFailed ? 503 : 200 }
  );
}

function boundedEnvInteger(
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(process.env[key]);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : fallback;
}
