import assert from "node:assert/strict";
import test from "node:test";
import {
  boundCatalogJobResult,
  boundCatalogJobRunSummary,
  CatalogJobAuditLeaseLostError,
  CatalogJobNotRunnableError,
  MAX_CATALOG_JOB_RUN_SUMMARY_BYTES,
  runCatalogJobById,
  runQueuedCatalogJobs,
} from "./runner";

test("job result telemetry strips provider raw payloads recursively", () => {
  const result = boundCatalogJobResult({
    version: "test.v1",
    rawData: { secret: "top-level" },
    proposals: [
      {
        productId: "product-1",
        snapshot: {
          rawData: { secret: "nested" },
          facts: { title: "Safe" },
        },
      },
    ],
  });
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("top-level"), false);
  assert.equal(serialized.includes("nested"), false);
  assert.equal(serialized.includes("Safe"), true);
});

test("oversized proposal results are bounded before audit persistence", () => {
  const result = boundCatalogJobResult({
    version: "catalog-refresh-shadow.v1",
    outcome: "SUCCESS",
    proposals: Array.from({ length: 300 }, (_, index) => ({
      productId: `product-${index}`,
      evidence: "x".repeat(2_000),
    })),
  });
  const size = Buffer.byteLength(JSON.stringify(result), "utf8");

  assert.ok(size <= 200_000);
  assert.equal(result.proposalsTruncated, true);
});

test("hard result truncation retains the refresh cursor", () => {
  const result = boundCatalogJobResult({
    version: "catalog-refresh-shadow.v1",
    outcome: "SOURCE_UNAVAILABLE",
    scanned: 20,
    scanCursorStart: "product-20",
    scanCursorNext: "product-40",
    scanWrapped: true,
    errors: ["x".repeat(250_000)],
  });

  assert.equal(result.resultTruncated, true);
  assert.equal(result.scanned, 20);
  assert.equal(result.scanCursorStart, "product-20");
  assert.equal(result.scanCursorNext, "product-40");
  assert.equal(result.scanWrapped, true);
});

test("stale-job recovery failure terminalizes the already-created audit run", async () => {
  const updates: Array<{
    runId: string;
    input: {
      status: string;
      finishedAt: Date;
      summaryJson: string;
      errorMessage: string | null;
    };
  }> = [];

  await assert.rejects(
    runQueuedCatalogJobs(
      { workerId: "recovery-test", batchSize: 1, timeboxMs: 1_000 },
      {
        createAuditRun: async () => ({ id: "run-recovery-failure" }),
        updateAuditRun: async (auditLease, input) => {
          updates.push({ runId: auditLease.id, input });
          return true;
        },
        reapStaleAuditRuns: async () => 0,
        recoverStaleJobs: async () => {
          throw new Error("stale recovery unavailable");
        },
      }
    ),
    /stale recovery unavailable/
  );

  assert.equal(updates.length, 1);
  assert.equal(updates[0].runId, "run-recovery-failure");
  assert.equal(updates[0].input.status, "FAILED");
  assert.equal(updates[0].input.errorMessage, "stale recovery unavailable");
  const summary = JSON.parse(updates[0].input.summaryJson) as {
    recovered: number;
    fatalError: string;
  };
  assert.equal(summary.recovered, 0);
  assert.equal(summary.fatalError, "stale recovery unavailable");
});

test("global queue runner reaps stale versioned audits before scanning jobs", async () => {
  const callOrder: string[] = [];
  const result = await runQueuedCatalogJobs(
    { workerId: "global-audit-test", batchSize: 1, timeboxMs: 1_000 },
    {
      createAuditRun: async () => ({ id: "run-global-audit" }),
      updateAuditRun: async () => true,
      reapStaleAuditRuns: async () => {
        callOrder.push("audit-reaper");
        return 2;
      },
      recoverStaleJobs: async () => {
        callOrder.push("job-recovery");
        return 0;
      },
      claimJobs: async () => {
        callOrder.push("queue-claim");
        return [];
      },
    }
  );

  assert.deepEqual(callOrder, ["audit-reaper", "job-recovery", "queue-claim"]);
  assert.equal(result.reapedAudits, 2);
  assert.equal(result.processed, 0);
});

test("a late runner cannot overwrite an audit already terminalized by the reaper", async () => {
  let finalizationAttempts = 0;

  await assert.rejects(
    runQueuedCatalogJobs(
      { workerId: "late-runner-test", batchSize: 1, timeboxMs: 1_000 },
      {
        createAuditRun: async () => ({ id: "run-already-reaped" }),
        updateAuditRun: async (auditLease) => {
          finalizationAttempts += 1;
          assert.equal(auditLease.id, "run-already-reaped");
          assert.equal(auditLease.status, "RUNNING");
          assert.equal(auditLease.finishedAt, null);
          assert.match(auditLease.requestedBy, /^late-runner-test-/);
          return false;
        },
        reapStaleAuditRuns: async () => 0,
        recoverStaleJobs: async () => 0,
        claimJobs: async () => [],
      }
    ),
    CatalogJobAuditLeaseLostError
  );

  assert.equal(finalizationAttempts, 1);
});

test("source-unavailable handler result is retried and audited as degraded", async () => {
  const lockedAt = new Date("2026-08-29T12:00:00.000Z");
  const job = {
    id: "job-source-unavailable",
    storeId: "store-1",
    providerKey: "cj",
    jobType: "REFRESH_EXISTING",
    status: "RUNNING",
    payloadJson: "{}",
    attempts: 1,
    maxAttempts: 3,
    lockedAt,
    lockedBy: "worker",
    runAfter: lockedAt,
    lastError: null,
    createdAt: lockedAt,
    updatedAt: lockedAt,
  };
  let claims = 0;
  let settled = false;
  let completed = false;
  const auditUpdates: Array<{ status: string; summaryJson: string }> = [];

  const result = await runQueuedCatalogJobs(
    { workerId: "degraded-test", batchSize: 1, timeboxMs: 1_000 },
    {
      createAuditRun: async () => ({ id: "run-degraded" }),
      updateAuditRun: async (_auditLease, input) => {
        auditUpdates.push(input);
        return true;
      },
      reapStaleAuditRuns: async () => 0,
      recoverStaleJobs: async () => 0,
      claimJobs: async () => (claims++ === 0 ? [job] : []),
      executeJob: async () => ({
        version: "catalog-refresh-shadow.v1",
        outcome: "SOURCE_UNAVAILABLE",
        scanned: 1,
        scanCursorStart: "product-1",
        scanCursorNext: "product-2",
        scanWrapped: false,
      }),
      completeJob: async () => {
        completed = true;
        return true;
      },
      failJob: async () => {
        throw new Error("durable refresh settlement must own the job transition");
      },
      settleRefreshJob: async (input) => {
        settled = true;
        assert.equal(input.catalogSyncRunId, "run-degraded");
        assert.equal(input.lease.jobId, job.id);
        assert.equal(
          (input.result as { outcome?: string }).outcome,
          "SOURCE_UNAVAILABLE"
        );
        return {
          executionId: "execution-degraded",
          recorded: true,
          outcome: "RETRY",
          code: "HANDLER_SOURCE_UNAVAILABLE",
        };
      },
    }
  );

  assert.equal(completed, false);
  assert.equal(settled, true);
  assert.equal(result.failed, 1);
  assert.equal(result.degraded, 1);
  assert.equal(result.executions[0]?.outcome, "RETRY");
  assert.equal(result.executions[0]?.code, "HANDLER_SOURCE_UNAVAILABLE");
  assert.equal(auditUpdates.length, 1);
  assert.equal(auditUpdates[0].status, "FAILED");
});

test("aggregate audit cap preserves counters and refresh cursors", () => {
  const bounded = boundCatalogJobRunSummary({
    version: "catalog-job-run-summary.v1",
    runId: "run-large",
    workerId: "worker-large",
    processed: 100,
    succeeded: 0,
    failed: 100,
    degraded: 100,
    recovered: 2,
    errors: Array.from({ length: 50 }, () => "provider error ".repeat(200)),
    executions: Array.from({ length: 100 }, (_, index) => ({
      jobId: `job-${index}`,
      storeId: `store-${index}`,
      providerKey: "cj",
      jobType: "REFRESH_EXISTING",
      attempt: 1,
      outcome: "RETRY",
      code: "HANDLER_SOURCE_UNAVAILABLE",
      result: {
        version: "catalog-refresh-shadow.v1",
        outcome: "SOURCE_UNAVAILABLE",
        scanned: index + 1,
        selected: 1,
        scanCursorStart: `product-${index}`,
        scanCursorNext: `product-${index + 1}`,
        scanWrapped: false,
        proposals: [{ evidence: "x".repeat(20_000) }],
      },
    })),
  });
  const serialized = JSON.stringify(bounded);
  const executions = bounded.executions as Array<{
    result: {
      scanned: number;
      scanCursorStart: string;
      scanCursorNext: string;
      resultTruncated: boolean;
    };
  }>;

  assert.ok(Buffer.byteLength(serialized, "utf8") <= MAX_CATALOG_JOB_RUN_SUMMARY_BYTES);
  assert.equal(bounded.processed, 100);
  assert.equal(bounded.degraded, 100);
  assert.equal(executions.length, 100);
  assert.equal(executions[49].result.scanned, 50);
  assert.equal(executions[49].result.scanCursorStart, "product-49");
  assert.equal(executions[49].result.scanCursorNext, "product-50");
  assert.equal(executions[49].result.resultTruncated, true);
});

test("exact runner isolates the selected refresh job and preserves its lease in settlement", async () => {
  const lockedAt = new Date("2026-08-31T12:00:00.000Z");
  let globalClaims = 0;
  let staleRecoveries = 0;
  let auditReaps = 0;
  let executedJobId: string | undefined;
  let claimedWorkerId: string | undefined;
  let auditStatus: string | undefined;

  const summary = await runCatalogJobById(
    {
      jobId: "job-selected-refresh",
      allowedJobTypes: ["REFRESH_EXISTING"],
      workerId: "admin-exact-test",
      timeboxMs: 1_000,
    },
    {
      createAuditRun: async () => ({ id: "run-exact" }),
      updateAuditRun: async (_auditLease, input) => {
        auditStatus = input.status;
        return true;
      },
      recoverStaleJobs: async () => {
        staleRecoveries += 1;
        return 99;
      },
      reapStaleAuditRuns: async () => {
        auditReaps += 1;
        return 99;
      },
      claimJobs: async () => {
        globalClaims += 1;
        throw new Error("global backlog must not be scanned");
      },
      claimJobById: async (workerId, jobId, options) => {
        assert.equal(jobId, "job-selected-refresh");
        assert.deepEqual(options.allowedJobTypes, ["REFRESH_EXISTING"]);
        assert.match(workerId, /^admin-exact-test-/);
        claimedWorkerId = workerId;
        return {
          id: jobId,
          storeId: "store-selected",
          providerKey: "mock",
          jobType: "REFRESH_EXISTING",
          status: "RUNNING",
          payloadJson: "{}",
          attempts: 1,
          maxAttempts: 3,
          lockedAt,
          lockedBy: workerId,
          runAfter: lockedAt,
          lastError: null,
          createdAt: lockedAt,
          updatedAt: lockedAt,
        };
      },
      executeJob: async (job) => {
        executedJobId = (job as { id?: string }).id;
        return {
          version: "catalog-refresh-shadow.v1",
          outcome: "SUCCESS",
        };
      },
      settleRefreshJob: async ({ catalogSyncRunId, job, lease }) => {
        assert.equal(catalogSyncRunId, "run-exact");
        assert.equal(job.id, "job-selected-refresh");
        assert.deepEqual(lease, {
          jobId: "job-selected-refresh",
          lockedBy: claimedWorkerId,
          lockedAt,
          attempts: 1,
          maxAttempts: 3,
        });
        return {
          executionId: "execution-exact",
          recorded: true,
          outcome: "SUCCESS",
          code: "OK",
        };
      },
      completeJob: async () => {
        throw new Error("refresh settlement owns the terminal transition");
      },
      failJob: async () => {
        throw new Error("refresh settlement owns the failure transition");
      },
    }
  );

  assert.equal(globalClaims, 0);
  assert.equal(staleRecoveries, 0);
  assert.equal(auditReaps, 0);
  assert.equal(executedJobId, "job-selected-refresh");
  assert.equal(summary.processed, 1);
  assert.equal(summary.succeeded, 1);
  assert.equal(summary.recovered, 0);
  assert.equal(auditStatus, "SUCCESS");
});

test("exact runner fails closed without recovery or execution when the selected job is ineligible", async () => {
  let globalClaims = 0;
  let staleRecoveries = 0;
  let auditReaps = 0;
  let executions = 0;
  const auditUpdates: Array<{ status: string; errorMessage: string | null }> = [];

  await assert.rejects(
    runCatalogJobById(
      {
        jobId: "job-wrong-type",
        allowedJobTypes: ["REFRESH_EXISTING"],
        workerId: "admin-ineligible-test",
        timeboxMs: 1_000,
      },
      {
        createAuditRun: async () => ({ id: "run-ineligible" }),
        updateAuditRun: async (_auditLease, input) => {
          auditUpdates.push({
            status: input.status,
            errorMessage: input.errorMessage,
          });
          return true;
        },
        recoverStaleJobs: async () => {
          staleRecoveries += 1;
          return 1;
        },
        reapStaleAuditRuns: async () => {
          auditReaps += 1;
          return 1;
        },
        claimJobs: async () => {
          globalClaims += 1;
          return [];
        },
        claimJobById: async (_workerId, jobId, options) => {
          assert.equal(jobId, "job-wrong-type");
          assert.deepEqual(options.allowedJobTypes, ["REFRESH_EXISTING"]);
          return null;
        },
        executeJob: async () => {
          executions += 1;
          return {};
        },
      }
    ),
    CatalogJobNotRunnableError
  );

  assert.equal(globalClaims, 0);
  assert.equal(staleRecoveries, 0);
  assert.equal(auditReaps, 0);
  assert.equal(executions, 0);
  assert.equal(auditUpdates.length, 1);
  assert.equal(auditUpdates[0].status, "FAILED");
  assert.match(auditUpdates[0].errorMessage ?? "", /missing, ineligible/);
});
