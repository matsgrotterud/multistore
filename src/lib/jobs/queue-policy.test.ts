import assert from "node:assert/strict";
import test from "node:test";
import {
  boundedCatalogClaimLimit,
  catalogJobExactClaimWhere,
  catalogJobLeaseWhere,
  catalogJobRetryAt,
  catalogJobCandidateWindow,
  catalogJobPriorityAllocation,
  deterministicCatalogJobId,
  isCatalogJobEligibleForExactClaim,
  prepareCatalogJobsOnce,
  shouldRetryCatalogJob,
  type CatalogJobLease,
  type EnqueueCatalogJobOnceInput,
} from "./queue";

const lease: CatalogJobLease = {
  jobId: "job-1",
  lockedBy: "worker-1",
  lockedAt: new Date("2026-08-29T12:00:00.000Z"),
  attempts: 1,
  maxAttempts: 3,
};

test("terminal catalog writes are fenced to the exact active lease", () => {
  assert.deepEqual(catalogJobLeaseWhere(lease), {
    id: "job-1",
    status: "RUNNING",
    lockedBy: "worker-1",
    lockedAt: new Date("2026-08-29T12:00:00.000Z"),
  });
  assert.notDeepEqual(
    catalogJobLeaseWhere({ ...lease, lockedBy: "worker-2" }),
    catalogJobLeaseWhere(lease)
  );
  assert.notDeepEqual(
    catalogJobLeaseWhere({
      ...lease,
      lockedAt: new Date("2026-08-29T12:20:00.000Z"),
    }),
    catalogJobLeaseWhere(lease)
  );
});

test("exact manual claims fence every mutable eligibility field to one id", () => {
  const candidate = {
    id: "job-selected",
    jobType: "REFRESH_EXISTING",
    status: "QUEUED",
    runAfter: new Date("2026-08-29T11:59:00.000Z"),
    lockedAt: null,
    attempts: 0,
    maxAttempts: 3,
  };

  assert.deepEqual(catalogJobExactClaimWhere(candidate), {
    id: "job-selected",
    jobType: "REFRESH_EXISTING",
    status: "QUEUED",
    runAfter: candidate.runAfter,
    lockedAt: null,
    attempts: 0,
    maxAttempts: 3,
  });
  assert.equal(
    isCatalogJobEligibleForExactClaim(
      candidate,
      ["REFRESH_EXISTING"],
      new Date("2026-08-29T12:00:00.000Z")
    ),
    true
  );
});

test("exact manual claims reject wrong type, active lease, delay, and exhausted attempts", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  const candidate = {
    id: "job-selected",
    jobType: "REFRESH_EXISTING",
    status: "QUEUED",
    runAfter: now,
    lockedAt: null,
    attempts: 0,
    maxAttempts: 3,
  };

  assert.equal(isCatalogJobEligibleForExactClaim(candidate, ["DISCOVER"], now), false);
  assert.equal(
    isCatalogJobEligibleForExactClaim(
      { ...candidate, lockedAt: new Date("2026-08-29T11:59:00.000Z") },
      ["REFRESH_EXISTING"],
      now
    ),
    false
  );
  assert.equal(
    isCatalogJobEligibleForExactClaim(
      { ...candidate, runAfter: new Date("2026-08-29T12:01:00.000Z") },
      ["REFRESH_EXISTING"],
      now
    ),
    false
  );
  assert.equal(
    isCatalogJobEligibleForExactClaim(
      { ...candidate, attempts: 3 },
      ["REFRESH_EXISTING"],
      now
    ),
    false
  );
});

test("permanent failures and exhausted attempts cannot retry", () => {
  assert.equal(shouldRetryCatalogJob(lease, true), true);
  assert.equal(shouldRetryCatalogJob(lease, false), false);
  assert.equal(
    shouldRetryCatalogJob({ attempts: 3, maxAttempts: 3 }, true),
    false
  );
});

test("retry scheduling is deterministic when the transaction supplies its clock", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(
    catalogJobRetryAt(lease, now).toISOString(),
    "2026-08-29T12:02:00.000Z"
  );
  assert.equal(
    catalogJobRetryAt({ attempts: 99 }, now).toISOString(),
    "2026-08-29T12:05:00.000Z"
  );
});

test("deterministic identities canonicalize provider and job casing", () => {
  const canonical = deterministicCatalogJobId({
    storeId: "store-1",
    providerKey: "cj",
    jobType: "REFRESH_EXISTING",
    dedupeKey: "refresh:123",
  });
  assert.equal(
    canonical,
    deterministicCatalogJobId({
      storeId: " store-1 ",
      providerKey: " CJ ",
      jobType: "refresh_existing",
      dedupeKey: "refresh:123",
    })
  );
});

test("a 100-store cadence plan prepares 300 unique jobs in one bounded batch", () => {
  const now = new Date("2026-08-29T03:00:00.000Z");
  const inputs: EnqueueCatalogJobOnceInput[] = Array.from(
    { length: 100 },
    (_, index) => {
      const storeId = `store-${String(index + 1).padStart(3, "0")}`;
      return [
        {
          storeId,
          providerKey: "CJ",
          jobType: "REFRESH_EXISTING" as const,
          dedupeKey: "refresh:123",
          runAfter: now,
        },
        {
          storeId,
          providerKey: "cj",
          jobType: "DISCOVER" as const,
          dedupeKey: "discover:17:query-a:auto",
          runAfter: now,
        },
        {
          storeId,
          providerKey: "cj",
          jobType: "DISCOVER" as const,
          dedupeKey: "discover:17:query-b:auto",
          runAfter: now,
        },
      ];
    }
  ).flat();

  const first = prepareCatalogJobsOnce(inputs, now);
  const repeated = prepareCatalogJobsOnce([...inputs, ...inputs], now);

  assert.equal(first.jobs.length, 300);
  assert.equal(first.duplicateInputs, 0);
  assert.equal(new Set(first.jobs.map((job) => job.id)).size, 300);
  assert.equal(repeated.jobs.length, 300);
  assert.equal(repeated.duplicateInputs, 300);
  assert.ok(repeated.jobs.every((job) => job.providerKey === "cj"));
});

test("claim limits and collision candidate windows stay bounded", () => {
  assert.equal(boundedCatalogClaimLimit(0), 1);
  assert.equal(boundedCatalogClaimLimit(20), 20);
  assert.equal(boundedCatalogClaimLimit(1_000), 100);
  assert.equal(boundedCatalogClaimLimit(Number.NaN), 1);

  assert.equal(catalogJobCandidateWindow(1), 9);
  assert.equal(catalogJobCandidateWindow(20), 80);
  assert.equal(catalogJobCandidateWindow(100), 100);
});

test("route-order work consumes priority capacity before catalog backlog", () => {
  assert.deepEqual(catalogJobPriorityAllocation(20, 20), {
    urgent: 20,
    catalog: 0,
  });
  assert.deepEqual(catalogJobPriorityAllocation(3, 20), {
    urgent: 3,
    catalog: 17,
  });
  assert.deepEqual(catalogJobPriorityAllocation(0, 20), {
    urgent: 0,
    catalog: 20,
  });
});
