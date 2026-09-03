import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { catalogJobLockCutoff } from "@/lib/jobs/job-lock";
import { toJson } from "@/lib/utils/json";

const CATALOG_JOB_INSERT_BATCH_SIZE = 500;

export interface EnqueueCatalogJobInput {
  storeId: string;
  providerKey: string;
  jobType:
    | "DISCOVER"
    | "ENRICH"
    | "IMPORT_APPROVED"
    | "REFRESH_EXISTING"
    | "MEDIA_SYNC"
    | "ROUTE_ORDER";
  payload?: unknown;
  runAfter?: Date;
}

export interface CatalogJobLease {
  jobId: string;
  lockedBy: string;
  lockedAt: Date;
  attempts: number;
  maxAttempts: number;
}

export function catalogJobLeaseWhere(lease: CatalogJobLease) {
  return {
    id: lease.jobId,
    status: "RUNNING",
    lockedBy: lease.lockedBy,
    lockedAt: lease.lockedAt,
  } as const;
}

interface ExactCatalogJobClaimCandidate {
  id: string;
  jobType: string;
  status: string;
  runAfter: Date;
  lockedAt: Date | null;
  attempts: number;
  maxAttempts: number;
}

export function isCatalogJobEligibleForExactClaim(
  job: ExactCatalogJobClaimCandidate,
  allowedJobTypes: readonly string[],
  now: Date
): boolean {
  return (
    allowedJobTypes.includes(job.jobType) &&
    (job.status === "QUEUED" || job.status === "RETRY") &&
    job.lockedAt === null &&
    job.runAfter.getTime() <= now.getTime() &&
    job.attempts < job.maxAttempts
  );
}

/**
 * Optimistic identity for the single row inspected by an exact manual claim.
 * Every mutable eligibility field is repeated in the update so a concurrent
 * worker or reschedule wins cleanly instead of handing out a stale lease.
 */
export function catalogJobExactClaimWhere(job: ExactCatalogJobClaimCandidate) {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    runAfter: job.runAfter,
    lockedAt: null,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  } as const;
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

export interface EnqueueCatalogJobOnceResult {
  id: string;
  enqueued: boolean;
}

export type EnqueueCatalogJobOnceInput = EnqueueCatalogJobInput & {
  dedupeKey: string;
};

export interface EnqueueCatalogJobsOnceResult {
  attempted: number;
  unique: number;
  enqueued: number;
  deduplicated: number;
  ids: string[];
}

interface PreparedCatalogJob {
  id: string;
  storeId: string;
  providerKey: string;
  jobType: EnqueueCatalogJobInput["jobType"];
  payloadJson: string;
  runAfter: Date;
}

/**
 * Migration-free cadence dedupe. The deterministic primary key makes repeated
 * scheduler invocations converge on one job for the same scope and bucket.
 */
export async function enqueueCatalogJobOnce(
  input: EnqueueCatalogJobOnceInput
): Promise<EnqueueCatalogJobOnceResult> {
  const result = await enqueueCatalogJobsOnce([input]);
  return { id: result.ids[0], enqueued: result.enqueued === 1 };
}

/**
 * Bulk variant used by the portfolio scheduler. A 100-store plan becomes one
 * bounded INSERT per job group instead of hundreds of serial round trips. The
 * primary keys remain the dedupe boundary, including for concurrent cron runs.
 */
export async function enqueueCatalogJobsOnce(
  inputs: readonly EnqueueCatalogJobOnceInput[]
): Promise<EnqueueCatalogJobsOnceResult> {
  const prepared = prepareCatalogJobsOnce(inputs);
  if (prepared.jobs.length === 0) {
    return {
      attempted: inputs.length,
      unique: 0,
      enqueued: 0,
      deduplicated: inputs.length,
      ids: [],
    };
  }

  let createdCount = 0;
  for (
    let offset = 0;
    offset < prepared.jobs.length;
    offset += CATALOG_JOB_INSERT_BATCH_SIZE
  ) {
    const created = await prisma.catalogJob.createMany({
      data: prepared.jobs.slice(offset, offset + CATALOG_JOB_INSERT_BATCH_SIZE),
      skipDuplicates: true,
    });
    createdCount += created.count;
  }
  return {
    attempted: inputs.length,
    unique: prepared.jobs.length,
    enqueued: createdCount,
    deduplicated: inputs.length - createdCount,
    ids: prepared.jobs.map((job) => job.id),
  };
}

export function prepareCatalogJobsOnce(
  inputs: readonly EnqueueCatalogJobOnceInput[],
  defaultRunAfter: Date = new Date()
): { jobs: PreparedCatalogJob[]; duplicateInputs: number } {
  const jobsById = new Map<string, PreparedCatalogJob>();
  for (const input of inputs) {
    const id = deterministicCatalogJobId(input);
    if (jobsById.has(id)) continue;
    jobsById.set(id, {
      id,
      storeId: input.storeId.trim(),
      providerKey: input.providerKey.trim().toLowerCase(),
      jobType: input.jobType,
      payloadJson: toJson(input.payload ?? {}),
      runAfter: input.runAfter ?? defaultRunAfter,
    });
  }
  const jobs = [...jobsById.values()];
  return { jobs, duplicateInputs: inputs.length - jobs.length };
}

export function deterministicCatalogJobId(input: {
  storeId: string;
  providerKey: string;
  jobType: string;
  dedupeKey: string;
}): string {
  const identity = [
    input.storeId.trim(),
    input.providerKey.trim().toLowerCase(),
    input.jobType.trim().toUpperCase(),
    input.dedupeKey.trim(),
  ].join("\u001f");
  return `catalog-${createHash("sha256").update(identity).digest("hex").slice(0, 48)}`;
}

export async function claimCatalogJobs(
  workerId: string,
  limit: number,
  options: { jobTypes?: string[] } = {}
) {
  const now = new Date();
  const claimLimit = boundedCatalogClaimLimit(limit);
  const candidateLimit = catalogJobCandidateWindow(claimLimit);
  const baseWhere = {
    status: { in: ["QUEUED", "RETRY"] },
    runAfter: { lte: now },
  };
  const requestedTypes = options.jobTypes?.filter(Boolean);
  const claimed = [];

  // A second bounded pass prevents two simultaneous workers from both seeing
  // the same oldest row and one of them incorrectly concluding the queue is
  // empty after losing the optimistic update race.
  for (let pass = 0; pass < 2 && claimed.length < claimLimit; pass += 1) {
    const jobs = requestedTypes?.length
      ? await prisma.catalogJob.findMany({
          where: { ...baseWhere, jobType: { in: requestedTypes } },
          orderBy: [{ runAfter: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          take: candidateLimit,
        })
      : await findPriorityCatalogJobs(baseWhere, candidateLimit);

    if (jobs.length === 0) break;
    for (const job of jobs) {
      if (claimed.length >= claimLimit) break;
      const lockedAt = new Date();
      const updated = await prisma.catalogJob.updateMany({
        where: {
          id: job.id,
          status: job.status,
          lockedAt: null,
        },
        data: {
          status: "RUNNING",
          lockedAt,
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });
      if (updated.count === 1) {
        const claimedJob = await prisma.catalogJob.findUnique({ where: { id: job.id } });
        if (claimedJob) claimed.push(claimedJob);
      }
    }
  }
  return claimed;
}

/**
 * Claim exactly one explicitly selected job. Unlike the queue worker, this
 * path never scans the backlog and never recovers unrelated stale leases.
 */
export async function claimCatalogJobById(
  workerId: string,
  jobId: string,
  options: { allowedJobTypes: readonly string[] },
  now: Date = new Date()
) {
  const exactJobId = jobId.trim();
  const allowedJobTypes = [
    ...new Set(
      options.allowedJobTypes
        .map((jobType) => jobType.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
  if (!exactJobId || allowedJobTypes.length === 0) return null;

  return prisma.$transaction(async (tx) => {
    const candidate = await tx.catalogJob.findUnique({
      where: { id: exactJobId },
    });
    if (
      !candidate ||
      !isCatalogJobEligibleForExactClaim(candidate, allowedJobTypes, now)
    ) {
      return null;
    }

    const lockedAt = new Date();
    const claimed = await tx.catalogJob.updateMany({
      where: catalogJobExactClaimWhere(candidate),
      data: {
        status: "RUNNING",
        lockedAt,
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (claimed.count !== 1) return null;

    const claimedJob = await tx.catalogJob.findUnique({
      where: { id: exactJobId },
    });
    if (!claimedJob) {
      // Throwing inside the transaction rolls the claim back instead of
      // committing a lease that no runner can fence and settle.
      throw new Error(`Claimed catalog job ${exactJobId} could not be reloaded.`);
    }
    return claimedJob;
  });
}

export function boundedCatalogClaimLimit(limit: number): number {
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 1;
}

export function catalogJobCandidateWindow(limit: number): number {
  const bounded = boundedCatalogClaimLimit(limit);
  return Math.min(Math.max(bounded * 4, bounded + 8), 100);
}

export function catalogJobPriorityAllocation(
  urgentAvailable: number,
  limit: number
): { urgent: number; catalog: number } {
  const boundedLimit = boundedCatalogClaimLimit(limit);
  const available = Number.isInteger(urgentAvailable)
    ? Math.max(urgentAvailable, 0)
    : 0;
  const urgent = Math.min(available, boundedLimit);
  return { urgent, catalog: boundedLimit - urgent };
}

async function findPriorityCatalogJobs(
  baseWhere: {
    status: { in: string[] };
    runAfter: { lte: Date };
  },
  limit: number
) {
  const urgent = await prisma.catalogJob.findMany({
    where: { ...baseWhere, jobType: "ROUTE_ORDER" },
    orderBy: [{ runAfter: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });
  const allocation = catalogJobPriorityAllocation(urgent.length, limit);
  if (allocation.catalog === 0) return urgent.slice(0, allocation.urgent);
  const catalog = await prisma.catalogJob.findMany({
    where: { ...baseWhere, jobType: { not: "ROUTE_ORDER" } },
    orderBy: [{ runAfter: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    take: allocation.catalog,
  });
  return [...urgent.slice(0, allocation.urgent), ...catalog];
}

/**
 * Recover worker crashes without blindly replaying an in-flight supplier call.
 * The lock timeout exceeds the route SUBMITTING ambiguity window; routeOrder's
 * own state machine will reconcile that state instead of submitting twice.
 */
export async function recoverStaleCatalogJobs(now: Date = new Date()): Promise<number> {
  const cutoff = catalogJobLockCutoff(now);
  const stale = await prisma.catalogJob.findMany({
    where: { status: "RUNNING", lockedAt: { lt: cutoff } },
    select: {
      id: true,
      attempts: true,
      maxAttempts: true,
      lockedAt: true,
      lockedBy: true,
    },
  });
  let recovered = 0;
  for (const job of stale) {
    const update = await prisma.catalogJob.updateMany({
      where: {
        id: job.id,
        status: "RUNNING",
        lockedAt: job.lockedAt,
        lockedBy: job.lockedBy,
      },
      data: {
        status: job.attempts >= job.maxAttempts ? "FAILED" : "RETRY",
        lockedAt: null,
        lockedBy: null,
        lastError: "Worker lock expired before the job reached a terminal state.",
        runAfter: now,
      },
    });
    recovered += update.count;
  }
  return recovered;
}

export async function completeCatalogJob(lease: CatalogJobLease): Promise<boolean> {
  const result = await prisma.catalogJob.updateMany({
    where: catalogJobLeaseWhere(lease),
    data: {
      status: "SUCCESS",
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
  return result.count === 1;
}

export async function failCatalogJob(
  lease: CatalogJobLease,
  error: string,
  options: { retryable?: boolean } = {}
): Promise<boolean> {
  const shouldRetry = shouldRetryCatalogJob(lease, options.retryable !== false);
  const result = await prisma.catalogJob.updateMany({
    where: catalogJobLeaseWhere(lease),
    data: {
      status: shouldRetry ? "RETRY" : "FAILED",
      lockedAt: null,
      lockedBy: null,
      lastError: error.slice(0, 2_000),
      runAfter: catalogJobRetryAt(lease),
    },
  });
  return result.count === 1;
}

export function catalogJobRetryAt(
  lease: Pick<CatalogJobLease, "attempts">,
  now: Date = new Date()
): Date {
  return new Date(
    now.getTime() + Math.min(lease.attempts + 1, 5) * 60 * 1000
  );
}

export function shouldRetryCatalogJob(
  lease: Pick<CatalogJobLease, "attempts" | "maxAttempts">,
  retryable: boolean
): boolean {
  return retryable && lease.attempts < lease.maxAttempts;
}
