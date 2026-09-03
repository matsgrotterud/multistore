import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredCatalogFreshnessMaxAgeHours,
  DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS,
  evaluateCatalogFreshness,
} from "./catalog-freshness";

const NOW = new Date("2026-08-25T12:00:00.000Z");

function supplierData(evaluatedAt: string): string {
  return JSON.stringify({ candidateEvaluationV1: { evaluatedAt } });
}

test("fresh supplier and catalog evidence passes live commerce", () => {
  assert.deepEqual(
    evaluateCatalogFreshness({
      mode: "LIVE",
      lastSupplierSyncAt: new Date("2026-08-25T11:00:00.000Z"),
      supplierDataJson: supplierData("2026-08-25T11:02:00.000Z"),
      maxAgeHours: 48,
      now: NOW,
    }),
    { allowed: true, reasonCodes: [] }
  );
});

test("missing, invalid and stale evidence fail closed", () => {
  const missing = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: null,
    supplierDataJson: "{}",
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(missing.reasonCodes, [
    "SUPPLIER_SYNC_MISSING",
    "CATALOG_EVALUATION_MISSING",
  ]);

  const invalid = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: "not-a-date",
    supplierDataJson: "not-json",
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(invalid.reasonCodes, [
    "SUPPLIER_SYNC_INVALID",
    "CATALOG_EVALUATION_INVALID",
  ]);

  const nonStringEvaluation = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: "2026-08-25T11:00:00.000Z",
    supplierDataJson: JSON.stringify({
      candidateEvaluationV1: { evaluatedAt: 123 },
    }),
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(nonStringEvaluation.reasonCodes, [
    "CATALOG_EVALUATION_INVALID",
  ]);

  const stale = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: "2026-08-23T11:59:59.999Z",
    supplierDataJson: supplierData("2026-08-23T11:59:59.999Z"),
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(stale.reasonCodes, [
    "SUPPLIER_SYNC_STALE",
    "CATALOG_EVALUATION_STALE",
  ]);
});

test("future evidence and an evaluation older than a new sync fail closed", () => {
  const future = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: "2026-08-25T12:06:00.000Z",
    supplierDataJson: supplierData("2026-08-25T12:06:00.000Z"),
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(future.reasonCodes, [
    "SUPPLIER_SYNC_IN_FUTURE",
    "CATALOG_EVALUATION_IN_FUTURE",
  ]);

  const superseded = evaluateCatalogFreshness({
    mode: "LIVE",
    lastSupplierSyncAt: "2026-08-25T11:30:00.000Z",
    supplierDataJson: supplierData("2026-08-25T11:20:00.000Z"),
    maxAgeHours: 48,
    now: NOW,
  });
  assert.deepEqual(superseded.reasonCodes, [
    "CATALOG_EVALUATION_PRECEDES_SUPPLIER_SYNC",
  ]);
});

test("mock mode deliberately bypasses live freshness evidence", () => {
  assert.deepEqual(
    evaluateCatalogFreshness({
      mode: "MOCK",
      lastSupplierSyncAt: null,
      supplierDataJson: "not-json",
      maxAgeHours: Number.NaN,
      now: new Date("invalid"),
    }),
    { allowed: true, reasonCodes: [] }
  );
});

test("configuration is bounded and falls back safely", () => {
  assert.equal(configuredCatalogFreshnessMaxAgeHours({}), 48);
  assert.equal(
    configuredCatalogFreshnessMaxAgeHours({
      CATALOG_FRESHNESS_MAX_AGE_HOURS: "72",
    }),
    72
  );
  for (const value of ["0", "169", "not-a-number"]) {
    assert.equal(
      configuredCatalogFreshnessMaxAgeHours({
        CATALOG_FRESHNESS_MAX_AGE_HOURS: value,
      }),
      DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS
    );
  }
});
