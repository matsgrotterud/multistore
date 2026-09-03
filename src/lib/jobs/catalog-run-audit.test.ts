import assert from "node:assert/strict";
import test from "node:test";
import {
  boundedCatalogJobAuditStaleMs,
  catalogJobAuditCasWhere,
  CATALOG_JOB_RUN_SUMMARY_PREFIX,
  CATALOG_JOB_RUN_SUMMARY_VERSION,
  DEFAULT_CATALOG_JOB_AUDIT_STALE_MS,
  isCatalogJobRunnerAuditCandidate,
  MAX_CATALOG_JOB_AUDIT_REAP_BATCH,
  MAX_CATALOG_JOB_AUDIT_STALE_MS,
  MIN_CATALOG_JOB_AUDIT_STALE_MS,
  reapStaleCatalogJobAuditRuns,
  type CatalogJobAuditCandidate,
} from "./catalog-run-audit";

const now = new Date("2026-09-01T12:00:00.000Z");
const staleStartedAt = new Date("2026-09-01T10:00:00.000Z");

function catalogAudit(
  overrides: Partial<CatalogJobAuditCandidate> = {}
): CatalogJobAuditCandidate {
  return {
    id: "run-catalog-stale",
    status: "RUNNING",
    startedAt: staleStartedAt,
    finishedAt: null,
    requestedBy: "cron-catalog-sync-019ff9b6-2f6b-4453-a3d0-68e01559d98a",
    summaryJson: JSON.stringify({
      version: CATALOG_JOB_RUN_SUMMARY_VERSION,
      processed: 1,
      succeeded: 0,
      failed: 0,
      degraded: 0,
      recovered: 0,
      reapedAudits: 0,
      errors: [],
      executions: [],
    }),
    ...overrides,
  };
}

test("catalog audit stale age is bounded away from active work and unbounded retention", () => {
  assert.equal(boundedCatalogJobAuditStaleMs(undefined), DEFAULT_CATALOG_JOB_AUDIT_STALE_MS);
  assert.equal(boundedCatalogJobAuditStaleMs(Number.NaN), DEFAULT_CATALOG_JOB_AUDIT_STALE_MS);
  assert.equal(boundedCatalogJobAuditStaleMs(1), MIN_CATALOG_JOB_AUDIT_STALE_MS);
  assert.equal(
    boundedCatalogJobAuditStaleMs(Number.MAX_SAFE_INTEGER),
    MAX_CATALOG_JOB_AUDIT_STALE_MS
  );
});

test("only stale versioned catalog-run audits qualify; generator and import runs never do", () => {
  const cutoff = new Date("2026-09-01T11:00:00.000Z");
  assert.equal(isCatalogJobRunnerAuditCandidate(catalogAudit(), cutoff), true);
  assert.equal(
    isCatalogJobRunnerAuditCandidate(
      catalogAudit({ requestedBy: "admin-generator-v3" }),
      cutoff
    ),
    false
  );
  assert.equal(
    isCatalogJobRunnerAuditCandidate(
      catalogAudit({
        requestedBy: "admin-import",
        summaryJson: JSON.stringify({ version: CATALOG_JOB_RUN_SUMMARY_VERSION }),
      }),
      cutoff
    ),
    false
  );
  assert.equal(
    isCatalogJobRunnerAuditCandidate(
      catalogAudit({ summaryJson: JSON.stringify({ version: "generator-v3" }) }),
      cutoff
    ),
    false
  );
  assert.equal(
    isCatalogJobRunnerAuditCandidate(
      catalogAudit({ startedAt: new Date("2026-09-01T11:30:00.000Z") }),
      cutoff
    ),
    false
  );
});

test("catalog audit reaper is prefix-scoped, bounded, and counts only successful CAS updates", async () => {
  const eligible = catalogAudit();
  const generator = catalogAudit({
    id: "run-generator",
    requestedBy: "admin-generator-v3",
  });
  const casLoser = catalogAudit({ id: "run-cas-loser" });
  const terminalized: string[] = [];

  const count = await reapStaleCatalogJobAuditRuns(
    { now, staleMs: DEFAULT_CATALOG_JOB_AUDIT_STALE_MS, limit: 1_000 },
    {
      findCandidates: async (input) => {
        assert.equal(input.summaryPrefix, CATALOG_JOB_RUN_SUMMARY_PREFIX);
        assert.equal(input.limit, MAX_CATALOG_JOB_AUDIT_REAP_BATCH);
        assert.equal(input.cutoff.toISOString(), "2026-09-01T11:00:00.000Z");
        return [eligible, generator, casLoser];
      },
      terminalizeCandidate: async (input) => {
        terminalized.push(input.candidate.id);
        const summary = JSON.parse(input.summaryJson) as Record<string, unknown>;
        assert.equal(summary.version, CATALOG_JOB_RUN_SUMMARY_VERSION);
        assert.equal(summary.fatalError, input.errorMessage);
        assert.equal(summary.auditReapedAt, now.toISOString());
        return input.candidate.id !== "run-cas-loser";
      },
    }
  );

  assert.deepEqual(terminalized, ["run-catalog-stale", "run-cas-loser"]);
  assert.equal(count, 1);
});

test("catalog audit terminalization CAS binds exact identity and prior summary", () => {
  const candidate = catalogAudit();
  assert.deepEqual(catalogJobAuditCasWhere(candidate), {
    id: candidate.id,
    status: "RUNNING",
    finishedAt: null,
    startedAt: candidate.startedAt,
    requestedBy: candidate.requestedBy,
    summaryJson: candidate.summaryJson,
  });
  assert.notDeepEqual(
    catalogJobAuditCasWhere({ ...candidate, summaryJson: "changed concurrently" }),
    catalogJobAuditCasWhere(candidate)
  );
});
