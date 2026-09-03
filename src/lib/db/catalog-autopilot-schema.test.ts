import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  databaseTargetFingerprint,
  catalogCheckDefinitionFingerprint,
  catalogFunctionSemanticFingerprint,
  decideCatalogAutopilotSchemaApply,
  inspectCatalogAutopilotDdl,
  inspectCatalogAutopilotSchema,
  makeCompleteCatalogAutopilotInspection,
} from "./catalog-autopilot-schema";

test("an empty database is ABSENT and can only be expanded after exact target confirmation", () => {
  const report = inspectCatalogAutopilotSchema({
    tables: [],
    columns: [],
    checks: [],
    triggers: [],
    indexes: [],
  });
  const fingerprint = databaseTargetFingerprint(
    "postgresql://schema-user:secret@db.example.test:5432/multistore?sslmode=require"
  );

  assert.equal(report.status, "ABSENT");
  assert.equal(
    decideCatalogAutopilotSchemaApply({ report, targetFingerprint: fingerprint }),
    "REFUSE_TARGET_CONFIRMATION"
  );
  assert.equal(
    decideCatalogAutopilotSchemaApply({
      report,
      targetFingerprint: fingerprint,
      confirmedTargetFingerprint: `${fingerprint.slice(0, -1)}0`,
    }),
    "REFUSE_TARGET_CONFIRMATION"
  );
  assert.equal(
    decideCatalogAutopilotSchemaApply({
      report,
      targetFingerprint: fingerprint,
      confirmedTargetFingerprint: fingerprint,
    }),
    "APPLY"
  );
});

test("a complete schema is an idempotent no-op and accepts unrelated extra artifacts", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    tables: [...inspection.tables, "UnrelatedTable"],
    indexes: [
      ...inspection.indexes,
      {
        tableName: "UnrelatedTable",
        name: "UnrelatedTable_extra_idx",
        columns: ["id"],
        unique: false,
        valid: true,
        ready: true,
      },
    ],
  });
  const fingerprint = databaseTargetFingerprint("postgresql://user:secret@db.test/multistore");

  assert.equal(report.status, "COMPLETE");
  assert.equal(report.missing.length, 0);
  assert.equal(report.incompatible.length, 0);
  assert.equal(
    decideCatalogAutopilotSchemaApply({
      report,
      targetFingerprint: fingerprint,
      confirmedTargetFingerprint: fingerprint,
    }),
    "NOOP_COMPLETE"
  );
});

test("a partial schema is refused even with exact target confirmation", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    columns: inspection.columns.filter(
      (column) =>
        !(column.tableName === "CatalogProductState" && column.columnName === "openProposalId")
    ),
  });
  const fingerprint = databaseTargetFingerprint("postgresql://user:secret@db.test/multistore");

  assert.equal(report.status, "PARTIAL");
  assert.ok(report.missing.includes("column public.CatalogProductState.openProposalId"));
  assert.equal(
    decideCatalogAutopilotSchemaApply({
      report,
      targetFingerprint: fingerprint,
      confirmedTargetFingerprint: fingerprint,
    }),
    "REFUSE_PARTIAL"
  );
});

test("an observation table without storefront revision evidence is never complete", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    columns: inspection.columns.filter(
      (column) =>
        !(
          column.tableName === "CatalogSupplierObservation" &&
          column.columnName === "storefrontRevisionFingerprint"
        )
    ),
  });

  assert.equal(report.status, "PARTIAL");
  assert.ok(
    report.missing.includes(
      "column public.CatalogSupplierObservation.storefrontRevisionFingerprint"
    )
  );
});

test("disabled triggers and malformed indexes make an installation partial", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    triggers: inspection.triggers.map((trigger, index) =>
      index === 0 ? { ...trigger, enabledMode: "D" } : trigger
    ),
    indexes: inspection.indexes.map((schemaIndex, index) =>
      index === 0 ? { ...schemaIndex, columns: [...schemaIndex.columns].reverse() } : schemaIndex
    ),
  });

  assert.equal(report.status, "PARTIAL");
  assert.equal(report.incompatible.length, 2);
});

test("same-named validated checks do not hide changed SQL semantics", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    checks: inspection.checks.map((check, index) =>
      index === 0
        ? { ...check, definitionFingerprint: catalogCheckDefinitionFingerprint("CHECK (true)") }
        : check
    ),
  });

  assert.equal(report.status, "PARTIAL");
  assert.ok(report.incompatible.some((problem) => problem.includes("check")));
});

test("same-named enabled triggers do not hide changed function bodies or trigger events", () => {
  const inspection = makeCompleteCatalogAutopilotInspection();
  const report = inspectCatalogAutopilotSchema({
    ...inspection,
    triggers: inspection.triggers.map((trigger, index) => {
      if (index === 0) {
        return {
          ...trigger,
          functionSourceFingerprint: catalogFunctionSemanticFingerprint("BEGIN RETURN NEW; END;"),
        };
      }
      if (index === 1) return { ...trigger, events: ["UPDATE"] };
      return trigger;
    }),
  });

  assert.equal(report.status, "PARTIAL");
  assert.equal(
    report.incompatible.filter((problem) => problem.includes("trigger")).length,
    2
  );
});

test("function fingerprints ignore formatting and error copy, but detect predicate drift", () => {
  const formatted = `
    BEGIN
      IF NEW."storeId" IS NULL THEN
        RAISE EXCEPTION 'First message';
      END IF;
      RETURN NEW;
    END;
  `;
  const reformatted = `BEGIN IF NEW."storeId" IS NULL THEN
    RAISE EXCEPTION 'Different human message'; END IF; RETURN NEW; END;`;
  const weakened = `BEGIN IF NEW."storeId" IS NOT NULL THEN
    RAISE EXCEPTION 'Different human message'; END IF; RETURN NEW; END;`;

  assert.equal(
    catalogFunctionSemanticFingerprint(formatted),
    catalogFunctionSemanticFingerprint(reformatted)
  );
  assert.notEqual(
    catalogFunctionSemanticFingerprint(formatted),
    catalogFunctionSemanticFingerprint(weakened)
  );
});

test("fingerprints are deterministic, exact, and do not expose connection credentials", () => {
  const firstUrl = "postgresql://schema-user:super-secret@db.example.test/multistore";
  const secondUrl = "postgresql://schema-user:different@db.example.test/multistore";
  const first = databaseTargetFingerprint(firstUrl);

  assert.match(first, /^sha256:[0-9a-f]{64}$/);
  assert.equal(first, databaseTargetFingerprint(firstUrl));
  assert.notEqual(first, databaseTargetFingerprint(secondUrl));
  assert.equal(first.includes("schema-user"), false);
  assert.equal(first.includes("super-secret"), false);
  assert.throws(() => databaseTargetFingerprint("https://example.test"), /PostgreSQL URL/);
});

test("the DDL preflight requires one additive transaction and every contracted artifact", () => {
  const validSql = fs.readFileSync(
    new URL("../../../prisma/schema-changes/20260831_catalog_autopilot_v1.sql", import.meta.url),
    "utf8"
  );

  assert.deepEqual(inspectCatalogAutopilotDdl(validSql), { valid: true, problems: [] });
  const destructive = inspectCatalogAutopilotDdl(`${validSql}\nDROP TABLE "Store";`);
  assert.equal(destructive.valid, false);
  assert.ok(destructive.problems.some((problem) => problem.includes("COMMIT")));
  assert.ok(destructive.problems.some((problem) => problem.includes("destructive")));
});

test("the DDL preflight rejects a changed guard predicate even when every object name remains", () => {
  const validSql = fs.readFileSync(
    new URL("../../../prisma/schema-changes/20260831_catalog_autopilot_v1.sql", import.meta.url),
    "utf8"
  );
  const weakenedSql = validSql.replace(
    'AND "attempts" = NEW."catalogJobAttempt"',
    'AND "attempts" <> NEW."catalogJobAttempt"'
  );
  const report = inspectCatalogAutopilotDdl(weakenedSql);

  assert.equal(report.valid, false);
  assert.ok(
    report.problems.includes(
      "DDL function guardCatalogRefreshExecutionScope has semantic drift"
    )
  );
});

test("the checked-in canonical DDL passes the offline additive-contract preflight", () => {
  const ddl = fs.readFileSync(
    new URL("../../../prisma/schema-changes/20260831_catalog_autopilot_v1.sql", import.meta.url),
    "utf8"
  );

  assert.deepEqual(inspectCatalogAutopilotDdl(ddl), { valid: true, problems: [] });
});
