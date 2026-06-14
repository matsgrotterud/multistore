import { prisma } from "@/lib/db";
import { completeCatalogJob, failCatalogJob, claimCatalogJobs } from "@/lib/jobs/queue";
import { runCatalogJob } from "@/lib/jobs/catalog-jobs";

export interface RunCatalogJobsOptions {
  batchSize?: number;
  timeboxMs?: number;
  workerId?: string;
}

export async function runQueuedCatalogJobs(options: RunCatalogJobsOptions = {}) {
  const workerId = options.workerId ?? `catalog-${Date.now()}`;
  const batchSize = options.batchSize ?? Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20);
  const deadline = Date.now() + (options.timeboxMs ?? 25_000);
  const summary = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };

  while (Date.now() < deadline && summary.processed < batchSize) {
    const jobs = await claimCatalogJobs(workerId, Math.min(5, batchSize - summary.processed));
    if (jobs.length === 0) break;

    for (const job of jobs) {
      summary.processed += 1;
      try {
        await runCatalogJob(job);
        await completeCatalogJob(job.id);
        summary.succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown job error";
        await failCatalogJob(job.id, message);
        summary.failed += 1;
        summary.errors.push(message);
      }
      if (Date.now() >= deadline) break;
    }
  }

  await prisma.catalogSyncRun.create({
    data: {
      status: summary.failed > 0 ? (summary.succeeded > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
      finishedAt: new Date(),
      requestedBy: workerId,
      summaryJson: JSON.stringify(summary),
      errorMessage: summary.errors.join(" "),
    },
  });

  return summary;
}

