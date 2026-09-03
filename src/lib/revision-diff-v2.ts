export const STORE_REVISION_DIFF_V2 = "store-revision-diff.v2" as const;

export interface StoreRevisionDiffEntryV2 {
  path: string;
  kind: "ADDED" | "REMOVED" | "CHANGED";
  before: unknown;
  after: unknown;
}

export interface StoreRevisionDiffV2 {
  version: typeof STORE_REVISION_DIFF_V2;
  changed: boolean;
  totalChanges: number;
  truncated: boolean;
  entries: StoreRevisionDiffEntryV2[];
}

/**
 * Deterministic structural diff for review UI. Values are snapshots only; the
 * result is never interpreted as an instruction or executable patch.
 */
export function diffStoreRevisionV2(
  before: unknown,
  after: unknown,
  options: { maxEntries?: number } = {}
): StoreRevisionDiffV2 {
  const maxEntries = Math.max(1, Math.min(options.maxEntries ?? 250, 2_000));
  const entries: StoreRevisionDiffEntryV2[] = [];
  let totalChanges = 0;

  walk("$", before, after, (entry) => {
    totalChanges += 1;
    if (entries.length < maxEntries) entries.push(entry);
  });

  return {
    version: STORE_REVISION_DIFF_V2,
    changed: totalChanges > 0,
    totalChanges,
    truncated: totalChanges > entries.length,
    entries,
  };
}

function walk(
  path: string,
  before: unknown,
  after: unknown,
  record: (entry: StoreRevisionDiffEntryV2) => void
): void {
  if (Object.is(before, after)) return;

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      const hasBefore = index < before.length;
      const hasAfter = index < after.length;
      const nextPath = `${path}[${index}]`;
      if (!hasBefore) {
        record({ path: nextPath, kind: "ADDED", before: undefined, after: after[index] });
      } else if (!hasAfter) {
        record({ path: nextPath, kind: "REMOVED", before: before[index], after: undefined });
      } else {
        walk(nextPath, before[index], after[index], record);
      }
    }
    return;
  }

  if (isPlainRecord(before) && isPlainRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort()) {
      const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(after, key);
      const nextPath = `${path}.${key}`;
      if (!hasBefore) {
        record({ path: nextPath, kind: "ADDED", before: undefined, after: after[key] });
      } else if (!hasAfter) {
        record({ path: nextPath, kind: "REMOVED", before: before[key], after: undefined });
      } else {
        walk(nextPath, before[key], after[key], record);
      }
    }
    return;
  }

  record({ path, kind: "CHANGED", before, after });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
