import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueCatalogJob } from "@/lib/jobs/queue";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";
import { syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  await syncProviderRegistryToDb();
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { settings: true, categories: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  let enqueued = 0;
  for (const store of stores) {
    const settings = await prisma.storeSupplierSettings.findMany({
      where: { storeId: store.id, isEnabled: true },
      orderBy: [{ priority: "desc" }],
      take: 3,
    });
    const providerSettings =
      settings.length > 0
        ? settings
        : [
            {
              providerKey: "mock",
              importQueries: JSON.stringify([store.niche]),
              storeId: store.id,
            },
          ];

    for (const setting of providerSettings) {
      const queries = parseQueries(setting.importQueries);
      for (const query of queries.slice(0, 2)) {
        await enqueueCatalogJob({
          storeId: store.id,
          providerKey: setting.providerKey,
          jobType: "DISCOVER",
          payload: { query, categoryId: store.categories[0]?.id },
        });
        enqueued += 1;
      }
    }
  }

  const summary = await runQueuedCatalogJobs({
    batchSize: Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20),
    timeboxMs: 25_000,
    workerId: "cron-catalog-sync",
  });

  return NextResponse.json({ ok: true, enqueued, summary });
}

function parseQueries(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}

