import fs from "node:fs";
import path from "node:path";
import { Client, type ClientBase } from "pg";
import {
  CATALOG_AUTOPILOT_CHECKS,
  CATALOG_AUTOPILOT_INDEXES,
  CATALOG_AUTOPILOT_SCHEMA_VERSION,
  CATALOG_AUTOPILOT_TABLES,
  CATALOG_AUTOPILOT_TRIGGERS,
  catalogCheckDefinitionFingerprint,
  catalogFunctionSemanticFingerprint,
  databaseTargetFingerprint,
  decideCatalogAutopilotSchemaApply,
  inspectCatalogAutopilotDdl,
  inspectCatalogAutopilotSchema,
  type CatalogAutopilotSchemaInspection,
  type CatalogAutopilotSchemaReport,
} from "../src/lib/db/catalog-autopilot-schema";

const DDL_PATH = path.resolve(
  process.cwd(),
  "prisma/schema-changes/20260831_catalog_autopilot_v1.sql"
);
const APPLY_LOCK_NAMESPACE = "multistore";
const APPLY_LOCK_NAME = CATALOG_AUTOPILOT_SCHEMA_VERSION;
const URL_ENV_KEYS = ["DATABASE_URL", "DIRECT_URL", "DATABASE_URL_UNPOOLED"] as const;

type Command = "verify" | "apply";
type UrlEnvKey = (typeof URL_ENV_KEYS)[number];

interface CliOptions {
  command: Command;
  urlEnv: UrlEnvKey;
  confirmedTargetFingerprint?: string;
}

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  table_name: string;
  column_name: string;
}

interface CheckRow {
  table_name: string;
  constraint_name: string;
  validated: boolean;
  definition: string;
}

interface TriggerRow {
  table_name: string;
  trigger_name: string;
  function_name: string;
  function_source: string;
  function_language: string;
  function_schema: string;
  function_return_type: string;
  function_volatility: string;
  function_security_definer: boolean;
  function_leakproof: boolean;
  function_strict: boolean;
  function_parallel: string;
  function_config_is_null: boolean;
  function_argument_count: number;
  enabled_mode: string;
  timing: string;
  events: string[];
  row_level: boolean;
  when_expression: string | null;
  argument_count: number;
}

interface IndexRow {
  table_name: string;
  index_name: string;
  columns: string[];
  unique: boolean;
  valid: boolean;
  ready: boolean;
}

function usage(): string {
  return [
    "Catalog Autopilot schema gate",
    "",
    "Read only:",
    "  tsx scripts/catalog-autopilot-schema.ts verify [--url-env=DATABASE_URL]",
    "",
    "Explicit expansion:",
    "  tsx scripts/catalog-autopilot-schema.ts apply --confirm-target=sha256:<64 hex>",
    "",
    `Allowed URL env keys: ${URL_ENV_KEYS.join(", ")}`,
    "The connection URL is never printed. Apply refuses a partial schema.",
  ].join("\n");
}

export function parseCatalogSchemaCliArgs(argv: readonly string[]): CliOptions {
  const [commandValue, ...rawOptions] = argv;
  if (commandValue !== "verify" && commandValue !== "apply") {
    throw new Error("Expected the explicit command verify or apply.");
  }

  let urlEnv: UrlEnvKey = "DATABASE_URL";
  let confirmedTargetFingerprint: string | undefined;

  for (let index = 0; index < rawOptions.length; index += 1) {
    const option = rawOptions[index];
    if (!option) continue;
    if (option === "--help" || option === "-h") throw new Error("HELP");

    const [name, inlineValue] = option.split("=", 2);
    const nextValue = inlineValue ?? rawOptions[index + 1];
    if (!inlineValue && (name === "--url-env" || name === "--confirm-target")) index += 1;

    if (name === "--url-env") {
      if (!URL_ENV_KEYS.includes(nextValue as UrlEnvKey)) {
        throw new Error("--url-env must name an allowed database environment variable.");
      }
      urlEnv = nextValue as UrlEnvKey;
      continue;
    }
    if (name === "--confirm-target") {
      if (!nextValue) throw new Error("--confirm-target requires the full fingerprint.");
      confirmedTargetFingerprint = nextValue;
      continue;
    }
    throw new Error(`Unknown option ${name}.`);
  }

  if (commandValue === "verify" && confirmedTargetFingerprint) {
    throw new Error("verify does not accept --confirm-target.");
  }

  return { command: commandValue, urlEnv, confirmedTargetFingerprint };
}

async function inspectDatabase(client: ClientBase): Promise<CatalogAutopilotSchemaInspection> {
  const tableNames = [...CATALOG_AUTOPILOT_TABLES];
  const checkNames = CATALOG_AUTOPILOT_CHECKS.map((check) => check.name);
  const triggerNames = CATALOG_AUTOPILOT_TRIGGERS.map((trigger) => trigger.name);
  const indexNames = CATALOG_AUTOPILOT_INDEXES.map((schemaIndex) => schemaIndex.name);

  // A single pg Client is deliberately used so apply can hold one session-level
  // advisory lock. Keep its catalog reads sequential; pg does not promise
  // concurrent queries on one Client.
  const tables = await client.query<TableRow>(
      `SELECT c.relname AS table_name
       FROM pg_catalog.pg_class c
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind IN ('r', 'p')
         AND c.relname = ANY($1::text[])`,
      [tableNames]
    );
  const columns = await client.query<ColumnRow>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [tableNames]
    );
  const checks = await client.query<CheckRow>(
      `SELECT rel.relname AS table_name,
              con.conname AS constraint_name,
              con.convalidated AS validated,
              pg_get_constraintdef(con.oid, true) AS definition
       FROM pg_catalog.pg_constraint con
       JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public'
         AND con.contype = 'c'
         AND con.conname = ANY($1::text[])`,
      [checkNames]
    );
  const triggers = await client.query<TriggerRow>(
      `SELECT rel.relname AS table_name,
              trg.tgname AS trigger_name,
              proc.proname AS function_name,
              proc.prosrc AS function_source,
              lang.lanname AS function_language,
              proc_ns.nspname AS function_schema,
              pg_get_function_result(proc.oid) AS function_return_type,
              proc.provolatile AS function_volatility,
              proc.prosecdef AS function_security_definer,
              proc.proleakproof AS function_leakproof,
              proc.proisstrict AS function_strict,
              proc.proparallel AS function_parallel,
              proc.proconfig IS NULL AS function_config_is_null,
              proc.pronargs::integer AS function_argument_count,
              trg.tgenabled AS enabled_mode,
              CASE
                WHEN (trg.tgtype::integer & 64) <> 0 THEN 'INSTEAD OF'
                WHEN (trg.tgtype::integer & 2) <> 0 THEN 'BEFORE'
                ELSE 'AFTER'
              END AS timing,
              to_json(array_remove(ARRAY[
                CASE WHEN (trg.tgtype::integer & 4) <> 0 THEN 'INSERT'::text END,
                CASE WHEN (trg.tgtype::integer & 16) <> 0 THEN 'UPDATE'::text END,
                CASE WHEN (trg.tgtype::integer & 8) <> 0 THEN 'DELETE'::text END,
                CASE WHEN (trg.tgtype::integer & 32) <> 0 THEN 'TRUNCATE'::text END
              ], NULL)) AS events,
              (trg.tgtype::integer & 1) <> 0 AS row_level,
              pg_get_expr(trg.tgqual, trg.tgrelid, true) AS when_expression,
              trg.tgnargs::integer AS argument_count
       FROM pg_catalog.pg_trigger trg
       JOIN pg_catalog.pg_class rel ON rel.oid = trg.tgrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
       JOIN pg_catalog.pg_proc proc ON proc.oid = trg.tgfoid
       JOIN pg_catalog.pg_namespace proc_ns ON proc_ns.oid = proc.pronamespace
       JOIN pg_catalog.pg_language lang ON lang.oid = proc.prolang
       WHERE n.nspname = 'public'
         AND NOT trg.tgisinternal
         AND trg.tgname = ANY($1::text[])`,
      [triggerNames]
    );
  const indexes = await client.query<IndexRow>(
      `SELECT rel.relname AS table_name,
              idx.relname AS index_name,
              to_json(ARRAY(
                SELECT attr.attname::text
                FROM unnest(ind.indkey::smallint[]) WITH ORDINALITY AS key(attnum, ordinal)
                JOIN pg_catalog.pg_attribute attr
                  ON attr.attrelid = rel.oid AND attr.attnum = key.attnum
                WHERE key.ordinal <= ind.indnkeyatts
                ORDER BY key.ordinal
              )) AS columns,
              ind.indisunique AS unique,
              ind.indisvalid AS valid,
              ind.indisready AS ready
       FROM pg_catalog.pg_index ind
       JOIN pg_catalog.pg_class rel ON rel.oid = ind.indrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
       JOIN pg_catalog.pg_class idx ON idx.oid = ind.indexrelid
       WHERE n.nspname = 'public'
         AND idx.relname = ANY($1::text[])`,
      [indexNames]
    );

  return {
    tables: tables.rows.map((row) => row.table_name),
    columns: columns.rows.map((row) => ({
      tableName: row.table_name,
      columnName: row.column_name,
    })),
    checks: checks.rows.map((row) => ({
      tableName: row.table_name,
      name: row.constraint_name,
      validated: row.validated,
      definitionFingerprint: catalogCheckDefinitionFingerprint(row.definition),
    })),
    triggers: triggers.rows.map((row) => ({
      tableName: row.table_name,
      name: row.trigger_name,
      functionName: row.function_name,
      functionSourceFingerprint: catalogFunctionSemanticFingerprint(row.function_source),
      functionLanguage: row.function_language,
      functionSchema: row.function_schema,
      functionReturnType: row.function_return_type,
      functionVolatility: row.function_volatility,
      functionSecurityDefiner: row.function_security_definer,
      functionLeakproof: row.function_leakproof,
      functionStrict: row.function_strict,
      functionParallel: row.function_parallel,
      functionConfigIsNull: row.function_config_is_null,
      functionArgumentCount: row.function_argument_count,
      enabledMode: row.enabled_mode,
      timing: row.timing,
      events: row.events,
      rowLevel: row.row_level,
      whenExpression: row.when_expression,
      argumentCount: row.argument_count,
    })),
    indexes: indexes.rows.map((row) => ({
      tableName: row.table_name,
      name: row.index_name,
      columns: row.columns,
      unique: row.unique,
      valid: row.valid,
      ready: row.ready,
    })),
  };
}

function printReport(report: CatalogAutopilotSchemaReport): void {
  console.log(`Schema version: ${CATALOG_AUTOPILOT_SCHEMA_VERSION}`);
  console.log(`Schema status: ${report.status}`);
  console.log(`Contract artifacts: ${report.satisfied}/${report.expected}`);

  if (report.status === "PARTIAL") {
    for (const problem of [...report.missing, ...report.incompatible]) {
      console.log(`- ${problem}`);
    }
  }
}

function assertTargetConfirmation(
  targetFingerprint: string,
  confirmedTargetFingerprint: string | undefined
): void {
  const placeholder: CatalogAutopilotSchemaReport = {
    status: "ABSENT",
    missing: [],
    incompatible: [],
    satisfied: 0,
    expected: 0,
  };
  const decision = decideCatalogAutopilotSchemaApply({
    report: placeholder,
    targetFingerprint,
    confirmedTargetFingerprint,
  });
  if (decision !== "APPLY") {
    throw new Error("TARGET_CONFIRMATION_REQUIRED");
  }
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseCatalogSchemaCliArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof Error && error.message === "HELP") {
      console.log(usage());
      return;
    }
    console.error(error instanceof Error ? error.message : "Invalid command.");
    console.error(usage());
    process.exitCode = 64;
    return;
  }

  const databaseUrl = process.env[options.urlEnv]?.trim();
  if (!databaseUrl) {
    console.error(`${options.urlEnv} is not set. No database connection was attempted.`);
    process.exitCode = 64;
    return;
  }

  let targetFingerprint: string;
  try {
    targetFingerprint = databaseTargetFingerprint(databaseUrl);
  } catch {
    console.error(`${options.urlEnv} is not a valid PostgreSQL URL. No connection was attempted.`);
    process.exitCode = 64;
    return;
  }

  console.log(`Target env: ${options.urlEnv}`);
  console.log(`Target fingerprint: ${targetFingerprint}`);

  let ddl: string | null = null;
  if (options.command === "apply") {
    try {
      assertTargetConfirmation(targetFingerprint, options.confirmedTargetFingerprint);
    } catch {
      console.error("Apply refused: copy the exact full fingerprint from verify into --confirm-target.");
      console.error("No database connection was attempted.");
      process.exitCode = 64;
      return;
    }

    try {
      ddl = fs.readFileSync(DDL_PATH, "utf8");
    } catch {
      console.error("Apply refused: the canonical Catalog Autopilot DDL file could not be read.");
      process.exitCode = 66;
      return;
    }
    const ddlReport = inspectCatalogAutopilotDdl(ddl);
    if (!ddlReport.valid) {
      console.error("Apply refused: the canonical DDL failed its additive-contract preflight.");
      for (const problem of ddlReport.problems) console.error(`- ${problem}`);
      process.exitCode = 65;
      return;
    }
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: `multistore-${CATALOG_AUTOPILOT_SCHEMA_VERSION}-gate`,
  });
  let applyLockHeld = false;

  try {
    await client.connect();
    if (options.command === "apply") {
      await client.query("SELECT pg_advisory_lock(hashtext($1), hashtext($2))", [
        APPLY_LOCK_NAMESPACE,
        APPLY_LOCK_NAME,
      ]);
      applyLockHeld = true;
    }

    const before = inspectCatalogAutopilotSchema(await inspectDatabase(client));
    printReport(before);

    if (options.command === "verify") {
      process.exitCode = before.status === "COMPLETE" ? 0 : before.status === "ABSENT" ? 2 : 3;
      return;
    }

    const decision = decideCatalogAutopilotSchemaApply({
      report: before,
      targetFingerprint,
      confirmedTargetFingerprint: options.confirmedTargetFingerprint,
    });
    if (decision === "REFUSE_PARTIAL") {
      console.error("Apply refused: schema is PARTIAL. Reconcile it manually before any DDL runs.");
      process.exitCode = 3;
      return;
    }
    if (decision === "NOOP_COMPLETE") {
      console.log("No-op: the complete schema contract is already installed.");
      return;
    }
    if (decision !== "APPLY" || !ddl) {
      throw new Error("UNEXPECTED_APPLY_DECISION");
    }

    console.log("Applying the additive V1 expansion in its canonical transaction...");
    try {
      await client.query(ddl);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }

    const after = inspectCatalogAutopilotSchema(await inspectDatabase(client));
    if (after.status !== "COMPLETE") {
      printReport(after);
      throw new Error("POST_APPLY_VERIFICATION_FAILED");
    }
    printReport(after);
    console.log("Expansion complete and verified. It is now safe to deploy the matching code.");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "unknown")
        : "unknown";
    console.error(`Schema command failed safely (error code: ${code}).`);
    console.error("No connection URL or credentials were printed.");
    process.exitCode = 1;
  } finally {
    if (applyLockHeld) {
      await client
        .query("SELECT pg_advisory_unlock(hashtext($1), hashtext($2))", [
          APPLY_LOCK_NAMESPACE,
          APPLY_LOCK_NAME,
        ])
        .catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

void main();
