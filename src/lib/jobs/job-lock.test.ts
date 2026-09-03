import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_JOB_LOCK_STALE_MS,
  catalogJobLockCutoff,
} from "./job-lock";

test("catalog job cutoff is deterministic and exceeds supplier ambiguity window", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");
  assert.equal(
    catalogJobLockCutoff(now).toISOString(),
    new Date(now.getTime() - CATALOG_JOB_LOCK_STALE_MS).toISOString()
  );
  assert.ok(CATALOG_JOB_LOCK_STALE_MS > 15 * 60 * 1000);
});

test("invalid catalog job cutoff fails closed", () => {
  assert.throws(() => catalogJobLockCutoff(new Date("invalid")));
  assert.throws(() => catalogJobLockCutoff(new Date(), 0));
});
