import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";

export interface EnqueueCatalogJobInput {
  storeId: string;
  providerKey: string;
  jobType: "DISCOVER" | "ENRICH" | "IMPORT_APPROVED" | "REFRESH_EXISTING" | "MEDIA_SYNC";
  payload?: unknown;
  runAfter?: Date;
}

export async function enqueueCatalogJob(input: EnqueueCatalogJobInput): Promise<string> {
  const job = await prisma.catalogJob.create({
    data: {
      storeId: input.storeId,
      providerKey: input.providerKey,
      jobType: input.jobType,
      payloadJson: toJson(input.payload ?? {}),
      runAfter: input.runAfter ?? new Date(),
    },
  });
  return job.id;
}

export async function claimCatalogJobs(workerId: string, limit: number) {
  const jobs = await prisma.catalogJob.findMany({
    where: {
      status: { in: ["QUEUED", "RETRY"] },
      runAfter: { lte: new Date() },
    },
    orderBy: { runAfter: "asc" },
    take: limit,
  });

  const claimed = [];
  for (const job of jobs) {
    const updated = await prisma.catalogJob.updateMany({
      where: {
        id: job.id,
        status: job.status,
        lockedAt: null,
      },
      data: {
        status: "RUNNING",
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 1) {
      const claimedJob = await prisma.catalogJob.findUnique({ where: { id: job.id } });
      if (claimedJob) claimed.push(claimedJob);
    }
  }
  return claimed;
}

export async function completeCatalogJob(jobId: string): Promise<void> {
  await prisma.catalogJob.update({
    where: { id: jobId },
    data: { status: "SUCCESS", lockedAt: null, lockedBy: null, lastError: null },
  });
}

export async function failCatalogJob(jobId: string, error: string): Promise<void> {
  const job = await prisma.catalogJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const shouldRetry = job.attempts < job.maxAttempts;
  await prisma.catalogJob.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? "RETRY" : "FAILED",
      lockedAt: null,
      lockedBy: null,
      lastError: error,
      runAfter: new Date(Date.now() + Math.min(job.attempts + 1, 5) * 60 * 1000),
    },
  });
}

