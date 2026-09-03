export const DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS = 48;
export const MAX_CONFIGURABLE_CATALOG_FRESHNESS_HOURS = 7 * 24;
export const CATALOG_FRESHNESS_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type CatalogFreshnessMode = "LIVE" | "MOCK";

export type CatalogFreshnessReasonCode =
  | "FRESHNESS_WINDOW_INVALID"
  | "SUPPLIER_SYNC_MISSING"
  | "SUPPLIER_SYNC_INVALID"
  | "SUPPLIER_SYNC_STALE"
  | "SUPPLIER_SYNC_IN_FUTURE"
  | "CATALOG_EVALUATION_MISSING"
  | "CATALOG_EVALUATION_INVALID"
  | "CATALOG_EVALUATION_STALE"
  | "CATALOG_EVALUATION_IN_FUTURE"
  | "CATALOG_EVALUATION_PRECEDES_SUPPLIER_SYNC";

export interface CatalogFreshnessInput {
  mode: CatalogFreshnessMode;
  lastSupplierSyncAt: Date | string | null | undefined;
  supplierDataJson: string;
  maxAgeHours: number;
  now: Date;
}

export interface CatalogFreshnessDecision {
  allowed: boolean;
  reasonCodes: CatalogFreshnessReasonCode[];
}

type ParsedTimestamp =
  | { kind: "MISSING" }
  | { kind: "INVALID" }
  | { kind: "VALID"; value: number };

/**
 * Reads the live freshness window without allowing a typo to disable the gate.
 * The bounded default intentionally matches the existing two-day stale marker.
 */
export function configuredCatalogFreshnessMaxAgeHours(
  env: Record<string, string | undefined> = process.env
): number {
  const raw = env.CATALOG_FRESHNESS_MAX_AGE_HOURS?.trim();
  if (!raw) return DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS;

  const hours = Number(raw);
  if (
    !Number.isFinite(hours) ||
    hours < 1 ||
    hours > MAX_CONFIGURABLE_CATALOG_FRESHNESS_HOURS
  ) {
    return DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS;
  }
  return hours;
}

/**
 * Pure, fail-closed live-commerce gate. Both the supplier snapshot and the V3
 * commerce evaluation must be current. MOCK deliberately bypasses this live
 * requirement so preview checkout does not pretend to have fresh inventory.
 */
export function evaluateCatalogFreshness(
  input: CatalogFreshnessInput
): CatalogFreshnessDecision {
  if (input.mode === "MOCK") return { allowed: true, reasonCodes: [] };

  const reasonCodes: CatalogFreshnessReasonCode[] = [];
  const nowMs = input.now.getTime();
  const maxAgeMs = input.maxAgeHours * 60 * 60 * 1000;
  if (
    !Number.isFinite(nowMs) ||
    !Number.isFinite(maxAgeMs) ||
    maxAgeMs <= 0
  ) {
    return { allowed: false, reasonCodes: ["FRESHNESS_WINDOW_INVALID"] };
  }

  const supplierSync = parseTimestamp(input.lastSupplierSyncAt);
  const catalogEvaluation = parseCatalogEvaluationTimestamp(
    input.supplierDataJson
  );

  appendTimestampReasons({
    parsed: supplierSync,
    missingReason: "SUPPLIER_SYNC_MISSING",
    invalidReason: "SUPPLIER_SYNC_INVALID",
    staleReason: "SUPPLIER_SYNC_STALE",
    futureReason: "SUPPLIER_SYNC_IN_FUTURE",
    nowMs,
    maxAgeMs,
    reasonCodes,
  });
  appendTimestampReasons({
    parsed: catalogEvaluation,
    missingReason: "CATALOG_EVALUATION_MISSING",
    invalidReason: "CATALOG_EVALUATION_INVALID",
    staleReason: "CATALOG_EVALUATION_STALE",
    futureReason: "CATALOG_EVALUATION_IN_FUTURE",
    nowMs,
    maxAgeMs,
    reasonCodes,
  });

  if (
    supplierSync.kind === "VALID" &&
    catalogEvaluation.kind === "VALID" &&
    catalogEvaluation.value + CATALOG_FRESHNESS_CLOCK_SKEW_MS <
      supplierSync.value
  ) {
    reasonCodes.push("CATALOG_EVALUATION_PRECEDES_SUPPLIER_SYNC");
  }

  return { allowed: reasonCodes.length === 0, reasonCodes };
}

function appendTimestampReasons(input: {
  parsed: ParsedTimestamp;
  missingReason: CatalogFreshnessReasonCode;
  invalidReason: CatalogFreshnessReasonCode;
  staleReason: CatalogFreshnessReasonCode;
  futureReason: CatalogFreshnessReasonCode;
  nowMs: number;
  maxAgeMs: number;
  reasonCodes: CatalogFreshnessReasonCode[];
}): void {
  if (input.parsed.kind === "MISSING") {
    input.reasonCodes.push(input.missingReason);
    return;
  }
  if (input.parsed.kind === "INVALID") {
    input.reasonCodes.push(input.invalidReason);
    return;
  }
  if (input.parsed.value > input.nowMs + CATALOG_FRESHNESS_CLOCK_SKEW_MS) {
    input.reasonCodes.push(input.futureReason);
  } else if (input.nowMs - input.parsed.value > input.maxAgeMs) {
    input.reasonCodes.push(input.staleReason);
  }
}

function parseTimestamp(value: Date | string | null | undefined): ParsedTimestamp {
  if (value == null) return { kind: "MISSING" };
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp)
    ? { kind: "VALID", value: timestamp }
    : { kind: "INVALID" };
}

function parseCatalogEvaluationTimestamp(rawSupplierData: string): ParsedTimestamp {
  let supplierData: unknown;
  try {
    supplierData = JSON.parse(rawSupplierData);
  } catch {
    return { kind: "INVALID" };
  }
  if (!isObject(supplierData)) return { kind: "INVALID" };
  const evaluation = supplierData.candidateEvaluationV1;
  if (evaluation == null) return { kind: "MISSING" };
  if (
    !isObject(evaluation) ||
    typeof evaluation.evaluatedAt !== "string"
  ) {
    return { kind: "INVALID" };
  }
  return parseTimestamp(evaluation.evaluatedAt);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
