import { prisma } from "@/lib/db";
import { enqueueCatalogJob } from "@/lib/jobs/queue";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";
import { getProviderHealthReport } from "@/lib/suppliers/catalog/provider-health";

async function main() {
  const command = process.argv[2] ?? "sync";

  if (command === "health") {
    const report = await getProviderHealthReport();
    console.table(
      report.map((provider) => ({
        key: provider.key,
        status: provider.status,
        mode: provider.defaultFulfillmentMode,
        checkout: provider.capabilities.checkout,
        message: provider.message,
      }))
    );
    return;
  }
  

  if (command === "discover" || command === "sync") {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      take: 10,
      include: { categories: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    for (const store of stores) {
      await enqueueCatalogJob({
        storeId: store.id,
        providerKey: "mock",
        jobType: "DISCOVER",
        payload: { query: store.niche, categoryId: store.categories[0]?.id },
      });
    }
  }

  if (command === "run-jobs" || command === "sync" || command === "discover") {
    const summary = await runQueuedCatalogJobs({ workerId: `script-${command}`, timeboxMs: 60_000 });
    console.log(summary);
    return;
  }

  throw new Error(`Unknown catalog command: ${command}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

