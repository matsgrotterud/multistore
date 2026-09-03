import { prisma } from "@/lib/db";
import { CATALOG_JOB_LOCK_STALE_MS } from "@/lib/jobs/job-lock";

export const CATALOG_JOB_RUN_SUMMARY_VERSION = "catalog-job-run-summary.v1" as const;
export const CATALOG_JOB_RUN_SUMMARY_PREFIX =
  `{"version":"${CATALOG_JOB_RUN_SUMMARY_VERSION}",` as const;
export const MIN_CATALOG_JOB_AUDIT_STALE_MS =
  CATALOG_JOB_LOCK_STALE_MS + 10 * 60 * 1000;
export const DEFAULT_CATALOG_JOB_AUDIT_STALE_MS = Math.max(
  60 * 60 * 1000,
  MIN_CATALOG_JOB_AUDIT_STALE_MS
);
export const MAX_CATALOG_JOB_AUDIT_STALE_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_CATALOG_JOB_AUDIT_REAP_BATCH = 100;

const CATALOG_RUN_WORKER_ID =
  /^[A-Za-z0-9_-]+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REAP_ERROR = "Catalog job runner audit expired before terminal settlement.";

export interface CatalogJobAuditCandidate {
  id: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  requestedBy: string;
  summaryJson: string;
}

interface CatalogJobAuditReaperDependencies {
  findCandidates(input: {
    cutoff: Date;
    limit: number;
    summaryPrefix: string;
  }): Promise<CatalogJobAuditCandidate[]>;
  terminalizeCandidate(input: {
    candidate: CatalogJobAuditCandidate;
    finishedAt: Date;
    summaryJson: string;
    errorMessage: string;
  }): Promise<boolean>;
}

const defaultAuditReaperDependencies: CatalogJobAuditReaperDependencies = {
  findCandidates: async ({ cutoff, limit, summaryPrefix }) =>
    prisma.catalogSyncRun.findMany({
      where: {
        status: "RUNNING",
        finishedAt: null,
        startedAt: { lt: cutoff },
        summaryJson: { startsWith: summaryPrefix },
      },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        requestedBy: true,
        summaryJson: true,
      },
    }),
  terminalizeCandidate: async ({ candidate, finishedAt, summaryJson, errorMessage }) => {
    const result = await prisma.catalogSyncRun.updateMany({
      where: catalogJobAuditCasWhere(candidate),
      data: {
        status: "FAILED",
        finishedAt,
        summaryJson,
        errorMessage,
      },
    });
    return result.count === 1;
  },
};

export function catalogJobAuditCasWhere(candidate: CatalogJobAuditCandidate) {
  return {
    id: candidate.id,
    status: "RUNNING",
    finishedAt: null,
    startedAt: candidate.startedAt,
    requestedBy: candidate.requestedBy,
    summaryJson: candidate.summaryJson,
  } as const;
}

export function boundedCatalogJobAuditStaleMs(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CATALOG_JOB_AUDIT_STALE_MS;
  }
  return Math.min(
    Math.max(Math.floor(value), MIN_CATALOG_JOB_AUDIT_STALE_MS),
    MAX_CATALOG_JOB_AUDIT_STALE_MS
  );
}

export function catalogJobAuditCutoff(
  now: Date,
  staleMs: number = DEFAULT_CATALOG_JOB_AUDIT_STALE_MS
): Date {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error("Catalog job audit cutoff is invalid.");
  return new Date(nowMs - boundedCatalogJobAuditStaleMs(staleMs));
}

export function isCatalogJobRunnerAuditCandidate(
  candidate: CatalogJobAuditCandidate,
  cutoff: Date
): boolean {
  if (
    candidate.status !== "RUNNING" ||
    candidate.finishedAt !== null ||
    candidate.startedAt.getTime() >= cutoff.getTime() ||
    !CATALOG_RUN_WORKER_ID.test(candidate.requestedBy)
  ) {
    return false;
  }
  try {
    const summary = JSON.parse(candidate.summaryJson) as unknown;
    return (
      Boolean(summary) &&
      typeof summary === "object" &&
      !Array.isArray(summary) &&
      (summary as Record<string, unknown>).version === CATALOG_JOB_RUN_SUMMARY_VERSION
    );
  } catch {
    return false;
  }
}

export async function reapStaleCatalogJobAuditRuns(
  options: { now?: Date; staleMs?: number; limit?: number } = {},
  dependencyOverrides: Partial<CatalogJobAuditReaperDependencies> = {}
): Promise<number> {
  const dependencies = {
    ...defaultAuditReaperDependencies,
    ...dependencyOverrides,
  };
  const now = options.now ?? new Date();
  const cutoff = catalogJobAuditCutoff(
    now,
    options.staleMs ?? Number(process.env.CATALOG_JOB_AUDIT_STALE_MS)
  );
  const limit = boundedReapLimit(options.limit);
  const candidates = await dependencies.findCandidates({
    cutoff,
    limit,
    summaryPrefix: CATALOG_JOB_RUN_SUMMARY_PREFIX,
  });

  let reaped = 0;
  for (const candidate of candidates.slice(0, limit)) {
    if (!isCatalogJobRunnerAuditCandidate(candidate, cutoff)) continue;
    const summaryJson = terminalCatalogJobAuditSummary(candidate.summaryJson, now);
    if (
      await dependencies.terminalizeCandidate({
        candidate,
        finishedAt: now,
        summaryJson,
        errorMessage: REAP_ERROR,
      })
    ) {
      reaped += 1;
    }
  }
  return reaped;
}

function terminalCatalogJobAuditSummary(summaryJson: string, now: Date): string {
  const parsed = JSON.parse(summaryJson) as Record<string, unknown>;
  return JSON.stringify({
    version: CATALOG_JOB_RUN_SUMMARY_VERSION,
    processed: finiteNumber(parsed.processed),
    succeeded: finiteNumber(parsed.succeeded),
    failed: finiteNumber(parsed.failed),
    degraded: finiteNumber(parsed.degraded),
    recovered: finiteNumber(parsed.recovered),
    reapedAudits: finiteNumber(parsed.reapedAudits),
    errors: [],
    executions: [],
    fatalError: REAP_ERROR,
    auditReapedAt: now.toISOString(),
  });
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function boundedReapLimit(value: number | undefined): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.min(Math.max(value, 1), MAX_CATALOG_JOB_AUDIT_REAP_BATCH)
    : MAX_CATALOG_JOB_AUDIT_REAP_BATCH;
}
