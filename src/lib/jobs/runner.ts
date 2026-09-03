import { randomUUID } from "node:crypto";
import { settleCatalogRefreshJob } from "@/lib/catalog/catalog-refresh-persistence";
import { prisma } from "@/lib/db";
import {
  catalogJobAuditCasWhere,
  CATALOG_JOB_RUN_SUMMARY_VERSION,
  reapStaleCatalogJobAuditRuns,
  type CatalogJobAuditCandidate,
} from "@/lib/jobs/catalog-run-audit";
import {
  catalogJobErrorCode,
  isPermanentCatalogJobError,
} from "@/lib/jobs/errors";
import {
  claimCatalogJobById,
  claimCatalogJobs,
  completeCatalogJob,
  failCatalogJob,
  recoverStaleCatalogJobs,
  type CatalogJobLease,
} from "@/lib/jobs/queue";
import { runCatalogJob } from "@/lib/jobs/catalog-jobs";

export { CATALOG_JOB_RUN_SUMMARY_VERSION } from "@/lib/jobs/catalog-run-audit";
const MAX_RESULT_BYTES = 200_000;
export const MAX_CATALOG_JOB_RUN_SUMMARY_BYTES = 500_000;
const MAX_ERROR_COUNT = 50;
const ESSENTIAL_RESULT_STRING_KEYS = [
  "version",
  "mode",
  "outcome",
  "storeId",
  "providerKey",
  "startedAt",
  "completedAt",
  "scanCursorStart",
  "scanCursorNext",
  "orderId",
  "status",
  "paymentStatus",
  "fulfillmentStatus",
] as const;

export interface RunCatalogJobsOptions {
  batchSize?: number;
  timeboxMs?: number;
  workerId?: string;
}

export interface RunCatalogJobByIdOptions {
  jobId: string;
  allowedJobTypes: readonly string[];
  timeboxMs?: number;
  workerId?: string;
}

export class CatalogJobNotRunnableError extends Error {
  readonly code = "CATALOG_JOB_NOT_RUNNABLE" as const;

  constructor(jobId: string) {
    super(
      `Catalog job ${jobId} is missing, ineligible, already claimed, or not allowed for this runner.`
    );
    this.name = "CatalogJobNotRunnableError";
  }
}

export class CatalogJobAuditLeaseLostError extends Error {
  readonly code = "CATALOG_JOB_AUDIT_LEASE_LOST" as const;

  constructor(runId: string) {
    super(`Catalog job audit ${runId} was already terminalized by another worker.`);
    this.name = "CatalogJobAuditLeaseLostError";
  }
}

interface CatalogJobRunnerDependencies {
  createAuditRun(input: {
    status: string;
    startedAt: Date;
    requestedBy: string;
    summaryJson: string;
  }): Promise<{ id: string }>;
  updateAuditRun(
    auditLease: CatalogJobAuditCandidate,
    input: {
      status: string;
      finishedAt: Date;
      summaryJson: string;
      errorMessage: string | null;
    }
  ): Promise<boolean>;
  recoverStaleJobs: typeof recoverStaleCatalogJobs;
  reapStaleAuditRuns: typeof reapStaleCatalogJobAuditRuns;
  claimJobs: typeof claimCatalogJobs;
  claimJobById: typeof claimCatalogJobById;
  executeJob: typeof runCatalogJob;
  completeJob: typeof completeCatalogJob;
  failJob: typeof failCatalogJob;
  settleRefreshJob: typeof settleCatalogRefreshJob;
}

const defaultRunnerDependencies: CatalogJobRunnerDependencies = {
  createAuditRun: async (input) =>
    prisma.catalogSyncRun.create({ data: input }),
  updateAuditRun: async (auditLease, input) => {
    const updated = await prisma.catalogSyncRun.updateMany({
      where: catalogJobAuditCasWhere(auditLease),
      data: input,
    });
    return updated.count === 1;
  },
  recoverStaleJobs: recoverStaleCatalogJobs,
  reapStaleAuditRuns: reapStaleCatalogJobAuditRuns,
  claimJobs: claimCatalogJobs,
  claimJobById: claimCatalogJobById,
  executeJob: runCatalogJob,
  completeJob: completeCatalogJob,
  failJob: failCatalogJob,
  settleRefreshJob: settleCatalogRefreshJob,
};

export interface CatalogJobExecutionSummary {
  jobId: string;
  storeId: string;
  providerKey: string;
  jobType: string;
  attempt: number;
  outcome: "SUCCESS" | "DEGRADED" | "FAILED" | "RETRY" | "LEASE_LOST";
  code: string;
  result?: Record<string, unknown>;
}

export async function runQueuedCatalogJobs(
  options: RunCatalogJobsOptions = {},
  dependencyOverrides: Partial<CatalogJobRunnerDependencies> = {}
) {
  return runCatalogJobsInternal(options, dependencyOverrides);
}

export async function runCatalogJobById(
  options: RunCatalogJobByIdOptions,
  dependencyOverrides: Partial<CatalogJobRunnerDependencies> = {}
) {
  const jobId = options.jobId.trim();
  const allowedJobTypes = [
    ...new Set(
      options.allowedJobTypes
        .map((jobType) => jobType.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
  if (!jobId || allowedJobTypes.length === 0) {
    throw new CatalogJobNotRunnableError(jobId || "<missing>");
  }

  return runCatalogJobsInternal(
    {
      batchSize: 1,
      timeboxMs: options.timeboxMs,
      workerId: options.workerId ?? "catalog-exact-job",
    },
    dependencyOverrides,
    { exactJob: { jobId, allowedJobTypes } }
  );
}

async function runCatalogJobsInternal(
  options: RunCatalogJobsOptions,
  dependencyOverrides: Partial<CatalogJobRunnerDependencies>,
  scope: {
    exactJob?: { jobId: string; allowedJobTypes: readonly string[] };
  } = {}
) {
  // The narrow injection seam keeps recovery/audit failure behavior testable
  // without connecting unit tests to the catalog database.
  const dependencies = { ...defaultRunnerDependencies, ...dependencyOverrides };
  const workerLabel =
    (options.workerId ?? "catalog").replace(/[^a-zA-Z0-9_-]/g, "-") || "catalog";
  const workerId = `${workerLabel}-${randomUUID()}`;
  const batchSize = boundedInteger(
    options.batchSize ?? Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20),
    20,
    1,
    100
  );
  const timeboxMs = boundedInteger(options.timeboxMs, 25_000, 1_000, 300_000);
  const startedAt = new Date();
  const initialAuditSummaryJson = JSON.stringify({
    version: CATALOG_JOB_RUN_SUMMARY_VERSION,
    processed: 0,
    succeeded: 0,
    failed: 0,
    degraded: 0,
    recovered: 0,
    reapedAudits: 0,
    errors: [],
    executions: [],
  });
  const run = await dependencies.createAuditRun({
    status: "RUNNING",
    startedAt,
    requestedBy: workerId,
    summaryJson: initialAuditSummaryJson,
  });
  const auditLease: CatalogJobAuditCandidate = {
    id: run.id,
    status: "RUNNING",
    startedAt,
    finishedAt: null,
    requestedBy: workerId,
    summaryJson: initialAuditSummaryJson,
  };
  const deadline = Date.now() + timeboxMs;
  const summary = {
    version: CATALOG_JOB_RUN_SUMMARY_VERSION,
    runId: run.id,
    workerId,
    processed: 0,
    succeeded: 0,
    failed: 0,
    degraded: 0,
    recovered: 0,
    reapedAudits: 0,
    errors: [] as string[],
    executions: [] as CatalogJobExecutionSummary[],
  };

  try {
    // Recovery belongs inside the terminal-audit boundary. If it fails, this
    // invocation must not leave the just-created CatalogSyncRun as RUNNING.
    if (!scope.exactJob) {
      summary.reapedAudits = await dependencies.reapStaleAuditRuns();
      summary.recovered = await dependencies.recoverStaleJobs();
    }
    while (Date.now() < deadline && summary.processed < batchSize) {
      // Execution is sequential, so claiming one at a time prevents unstarted
      // leases from being stranded when the timebox expires.
      const jobs = scope.exactJob
        ? [
            await dependencies.claimJobById(workerId, scope.exactJob.jobId, {
              allowedJobTypes: scope.exactJob.allowedJobTypes,
            }),
          ].filter((job) => job !== null)
        : await dependencies.claimJobs(workerId, 1);
      if (scope.exactJob && jobs.length === 0) {
        throw new CatalogJobNotRunnableError(scope.exactJob.jobId);
      }
      if (jobs.length === 0) break;
      const job = jobs[0];
      summary.processed += 1;
      const lease = leaseFromClaimedJob(job, workerId);

      try {
        // Durable refresh evidence must see the complete normalized result.
        // Bounded summaries remain diagnostics only and are built afterwards.
        const rawResult = await dependencies.executeJob(job);
        const handlerOutcome =
          typeof rawResult.outcome === "string" ? rawResult.outcome : "SUCCESS";
        if (job.jobType === "REFRESH_EXISTING") {
          const settlement = await dependencies.settleRefreshJob({
            catalogSyncRunId: run.id,
            job,
            lease,
            result: rawResult,
          });
          const result = boundCatalogJobResult(rawResult);
          const degraded =
            handlerOutcome === "PARTIAL" || handlerOutcome === "SOURCE_UNAVAILABLE";
          if (settlement.outcome === "SUCCESS") {
            summary.succeeded += 1;
          } else {
            summary.failed += 1;
            if (degraded) summary.degraded += 1;
            if (summary.errors.length < MAX_ERROR_COUNT) {
              summary.errors.push(
                settlement.outcome === "LEASE_LOST"
                  ? `Lease lost before recording refresh evidence for ${job.id}.`
                  : `${job.jobType}/${job.providerKey} settled as ${settlement.outcome} (${settlement.code}).`
              );
            }
          }
          summary.executions.push({
            jobId: job.id,
            storeId: job.storeId,
            providerKey: job.providerKey,
            jobType: job.jobType,
            attempt: job.attempts,
            outcome: settlement.outcome,
            code: settlement.code,
            result,
          });
          continue;
        }

        const result = boundCatalogJobResult(rawResult);
        const degraded =
          handlerOutcome === "PARTIAL" || handlerOutcome === "SOURCE_UNAVAILABLE";
        if (degraded) {
          const recorded = await dependencies.failJob(
            lease,
            `Handler completed with ${handlerOutcome}.`,
            { retryable: true }
          );
          summary.failed += 1;
          summary.degraded += 1;
          if (summary.errors.length < MAX_ERROR_COUNT) {
            summary.errors.push(
              `${job.jobType}/${job.providerKey} completed with ${handlerOutcome}.`
            );
          }
          summary.executions.push({
            jobId: job.id,
            storeId: job.storeId,
            providerKey: job.providerKey,
            jobType: job.jobType,
            attempt: job.attempts,
            outcome: recorded
              ? job.attempts < job.maxAttempts
                ? "RETRY"
                : "FAILED"
              : "LEASE_LOST",
            code: recorded
              ? `HANDLER_${handlerOutcome}`
              : "CATALOG_JOB_LEASE_LOST",
            result,
          });
          continue;
        }
        const completed = await dependencies.completeJob(lease);
        if (!completed) {
          summary.failed += 1;
          summary.errors.push(`Lease lost before completing ${job.id}.`);
          summary.executions.push({
            jobId: job.id,
            storeId: job.storeId,
            providerKey: job.providerKey,
            jobType: job.jobType,
            attempt: job.attempts,
            outcome: "LEASE_LOST",
            code: "CATALOG_JOB_LEASE_LOST",
          });
          continue;
        }
        summary.succeeded += 1;
        summary.executions.push({
          jobId: job.id,
          storeId: job.storeId,
          providerKey: job.providerKey,
          jobType: job.jobType,
          attempt: job.attempts,
          outcome: "SUCCESS",
          code: "OK",
          result,
        });
      } catch (error) {
        const message = safeErrorMessage(error);
        const retryable = !isPermanentCatalogJobError(error);
        const failed = await dependencies.failJob(lease, message, { retryable });
        summary.failed += 1;
        if (summary.errors.length < MAX_ERROR_COUNT) summary.errors.push(message);
        summary.executions.push({
          jobId: job.id,
          storeId: job.storeId,
          providerKey: job.providerKey,
          jobType: job.jobType,
          attempt: job.attempts,
          outcome: failed
            ? retryable && job.attempts < job.maxAttempts
              ? "RETRY"
              : "FAILED"
            : "LEASE_LOST",
          code: failed ? catalogJobErrorCode(error) : "CATALOG_JOB_LEASE_LOST",
        });
      }
    }

    const status =
      summary.failed > 0
        ? summary.succeeded > 0
          ? "PARTIAL"
          : "FAILED"
        : summary.degraded > 0
          ? "PARTIAL"
          : "SUCCESS";
    const auditFinalized = await dependencies.updateAuditRun(auditLease, {
      status,
      finishedAt: new Date(),
      summaryJson: JSON.stringify(boundCatalogJobRunSummary(summary)),
      errorMessage: summary.errors.join(" ").slice(0, 4_000) || null,
    });
    if (!auditFinalized) throw new CatalogJobAuditLeaseLostError(run.id);
    return summary;
  } catch (error) {
    const message = safeErrorMessage(error);
    if (!(error instanceof CatalogJobAuditLeaseLostError)) {
      await dependencies.updateAuditRun(auditLease, {
        status: "FAILED",
        finishedAt: new Date(),
        summaryJson: JSON.stringify(
          boundCatalogJobRunSummary({
            ...summary,
            fatalError: message,
          })
        ),
        errorMessage: message,
      });
    }
    throw error;
  }
}

export function boundCatalogJobResult(
  result: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = sanitizeResultValue(result) as Record<string, unknown>;
  const bytes = Buffer.byteLength(JSON.stringify(sanitized), "utf8");
  if (bytes <= MAX_RESULT_BYTES) return sanitized;

  const proposals = Array.isArray(sanitized.proposals)
    ? [...sanitized.proposals]
    : null;
  if (proposals) {
    while (proposals.length > 0) {
      proposals.pop();
      const candidate = {
        ...sanitized,
        proposals,
        proposalsTruncated: true,
        originalResultBytes: bytes,
      };
      if (Buffer.byteLength(JSON.stringify(candidate), "utf8") <= MAX_RESULT_BYTES) {
        return candidate;
      }
    }
  }

  return {
    ...compactCatalogJobResult(sanitized),
    resultTruncated: true,
    originalResultBytes: bytes,
  };
}

export function boundCatalogJobRunSummary(
  summary: unknown
): Record<string, unknown> {
  const sanitized = sanitizeResultValue(summary) as Record<string, unknown>;
  const bytes = jsonByteLength(sanitized);
  if (bytes <= MAX_CATALOG_JOB_RUN_SUMMARY_BYTES) return sanitized;

  const compactExecutions = Array.isArray(sanitized.executions)
    ? sanitized.executions.map(compactCatalogJobExecution)
    : [];
  const compact = {
    ...sanitized,
    executions: compactExecutions,
    summaryTruncated: true,
    originalSummaryBytes: bytes,
  };
  if (jsonByteLength(compact) <= MAX_CATALOG_JOB_RUN_SUMMARY_BYTES) return compact;

  // This fallback is intentionally an allowlist. It preserves run counters and
  // every execution's compact result (including refresh cursors), while
  // bounding human-readable errors and untrusted identifiers.
  const minimal = {
    version: boundedSummaryString(sanitized.version),
    runId: boundedSummaryString(sanitized.runId),
    workerId: boundedSummaryString(sanitized.workerId),
    processed: finiteSummaryNumber(sanitized.processed),
    succeeded: finiteSummaryNumber(sanitized.succeeded),
    failed: finiteSummaryNumber(sanitized.failed),
    degraded: finiteSummaryNumber(sanitized.degraded),
    recovered: finiteSummaryNumber(sanitized.recovered),
    reapedAudits: finiteSummaryNumber(sanitized.reapedAudits),
    fatalError: boundedSummaryString(sanitized.fatalError, 2_000),
    errors: Array.isArray(sanitized.errors)
      ? sanitized.errors.slice(0, MAX_ERROR_COUNT).map((entry) =>
          boundedSummaryString(entry, 500)
        )
      : [],
    executions: compactExecutions,
    summaryTruncated: true,
    originalSummaryBytes: bytes,
  };
  if (jsonByteLength(minimal) <= MAX_CATALOG_JOB_RUN_SUMMARY_BYTES) return minimal;

  return {
    ...minimal,
    errors: [],
  };
}

function compactCatalogJobExecution(value: unknown): Record<string, unknown> {
  const execution =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const result =
    execution.result &&
    typeof execution.result === "object" &&
    !Array.isArray(execution.result)
      ? compactCatalogJobResult(execution.result as Record<string, unknown>)
      : undefined;
  return {
    jobId: boundedSummaryString(execution.jobId),
    storeId: boundedSummaryString(execution.storeId),
    providerKey: boundedSummaryString(execution.providerKey),
    jobType: boundedSummaryString(execution.jobType),
    attempt: finiteSummaryNumber(execution.attempt),
    outcome: boundedSummaryString(execution.outcome),
    code: boundedSummaryString(execution.code),
    ...(result ? { result: { ...result, resultTruncated: true } } : {}),
  };
}

function compactCatalogJobResult(
  result: Record<string, unknown>
): Record<string, unknown> {
  const compact: Record<string, unknown> = {};
  for (const key of ESSENTIAL_RESULT_STRING_KEYS) {
    const value = result[key];
    if (value === null && (key === "scanCursorStart" || key === "scanCursorNext")) {
      compact[key] = null;
    } else if (typeof value === "string") {
      compact[key] = boundedSummaryString(value);
    }
  }

  let counterCount = 0;
  for (const key of Object.keys(result).sort()) {
    if (counterCount >= 64 || key in compact) continue;
    const value = result[key];
    if (typeof value === "boolean") {
      compact[key] = value;
      counterCount += 1;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      compact[key] = value;
      counterCount += 1;
    }
  }
  return compact;
}

function boundedSummaryString(value: unknown, maxLength = 512): string | undefined {
  return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

function finiteSummaryNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function leaseFromClaimedJob(
  job: {
    id: string;
    lockedAt: Date | null;
    attempts: number;
    maxAttempts: number;
  },
  workerId: string
): CatalogJobLease {
  if (!job.lockedAt) throw new Error(`Claimed catalog job ${job.id} has no lease timestamp.`);
  return {
    jobId: job.id,
    lockedBy: workerId,
    lockedAt: job.lockedAt,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  };
}

function sanitizeResultValue(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[depth-limited]";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeResultValue(entry, depth + 1));
  }
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/^(rawData|requestJson|responseJson)$/i.test(key)) continue;
    output[key] = sanitizeResultValue(entry, depth + 1);
  }
  return output;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown job error";
  return message.replace(/[\r\n]+/g, " ").slice(0, 2_000);
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), min), max)
    : fallback;
}
