export const CATALOG_JOB_LOCK_STALE_MS = 20 * 60 * 1000;

export function catalogJobLockCutoff(
  now: Date = new Date(),
  staleMs: number = CATALOG_JOB_LOCK_STALE_MS
): Date {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs) || !Number.isFinite(staleMs) || staleMs <= 0) {
    throw new Error("Catalog job lock cutoff is invalid.");
  }
  return new Date(nowMs - staleMs);
}
