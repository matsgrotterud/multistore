import fs from "node:fs";
import path from "node:path";
import { Client, type ClientBase } from "pg";
import {
  STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
  STORE_FACTORY_V2_SCHEMA_VERSION,
  canonicalStoreFactoryV2ConnectionTarget,
  decideStoreFactoryV2SchemaApply,
  formatStoreFactoryV2ConnectionTarget,
  inspectStoreFactoryV2DdlBundle,
  readStoreFactoryV2SchemaCapability,
  storeFactoryV2DatabaseTargetFingerprint,
  storeFactoryV2DdlBundleFingerprint,
  validateStoreFactoryV2ApplyTarget,
  type StoreFactoryV2DatabaseIdentity,
  type StoreFactoryV2SchemaReport,
} from "../src/lib/db/store-factory-v2-schema";

export const STORE_FACTORY_V2_DDL_FILENAMES = [
  "20260903_catalog_core_v2_v1.sql",
  "20260903_store_factory_v2_revision_v1.sql",
  "20260903_store_factory_v2_persistence_hardening_v2_1.sql",
] as const;

const APPLY_LOCK_NAMESPACE = "multistore";
const APPLY_LOCK_NAME = STORE_FACTORY_V2_DDL_BUNDLE_VERSION;
const URL_ENV_KEYS = ["DIRECT_URL", "DATABASE_URL_UNPOOLED", "DATABASE_URL"] as const;

type Command = "verify" | "apply";
type UrlEnvKey = (typeof URL_ENV_KEYS)[number];

export interface StoreFactoryV2SchemaCliOptions {
  command: Command;
  urlEnv: UrlEnvKey;
  confirmedTargetFingerprint?: string;
  confirmedDdlFingerprint?: string;
}

function usage(): string {
  return [
    "Store Factory V2.1 schema gate",
    "",
    "Read only (prints target and DDL fingerprints):",
    "  tsx scripts/store-factory-v2-schema.ts verify [--url-env=DIRECT_URL]",
    "",
    "Explicit expansion:",
    "  tsx scripts/store-factory-v2-schema.ts apply --confirm-target=sha256:<64 hex> --confirm-ddl=sha256:<64 hex> [--url-env=DIRECT_URL]",
    "",
    `Allowed URL env keys: ${URL_ENV_KEYS.join(", ")}`,
    "DIRECT_URL is the default. Apply accepts only DIRECT_URL or DATABASE_URL_UNPOOLED.",
    "Recognizable pooler/PgBouncer targets are refused before apply connects.",
    "Only the secret-free scheme/host/port/database target descriptor is printed.",
    "Apply holds an advisory lock, refuses PARTIAL, and executes the reviewed bundle atomically.",
  ].join("\n");
}

export function parseStoreFactoryV2SchemaCliArgs(
  argv: readonly string[]
): StoreFactoryV2SchemaCliOptions {
  const [commandValue, ...rawOptions] = argv;
  if (commandValue !== "verify" && commandValue !== "apply") {
    throw new Error("Expected the explicit command verify or apply.");
  }

  let urlEnv: UrlEnvKey = "DIRECT_URL";
  let confirmedTargetFingerprint: string | undefined;
  let confirmedDdlFingerprint: string | undefined;

  for (let index = 0; index < rawOptions.length; index += 1) {
    const option = rawOptions[index];
    if (!option) continue;
    if (option === "--") continue;
    if (option === "--help" || option === "-h") throw new Error("HELP");

    const [name, inlineValue] = option.split("=", 2);
    const nextValue = inlineValue ?? rawOptions[index + 1];
    if (
      !inlineValue &&
      (name === "--url-env" ||
        name === "--confirm-target" ||
        name === "--confirm-ddl")
    ) {
      index += 1;
    }

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
    if (name === "--confirm-ddl") {
      if (!nextValue) throw new Error("--confirm-ddl requires the full fingerprint.");
      confirmedDdlFingerprint = nextValue;
      continue;
    }
    throw new Error(`Unknown option ${name}.`);
  }

  if (
    commandValue === "verify" &&
    (confirmedTargetFingerprint || confirmedDdlFingerprint)
  ) {
    throw new Error("verify does not accept confirmation arguments.");
  }

  return {
    command: commandValue,
    urlEnv,
    confirmedTargetFingerprint,
    confirmedDdlFingerprint,
  };
}

export function readStoreFactoryV2DdlBundle(root = process.cwd()): {
  version: typeof STORE_FACTORY_V2_DDL_BUNDLE_VERSION;
  files: { name: string; sql: string }[];
  fingerprint: string;
} {
  const files = STORE_FACTORY_V2_DDL_FILENAMES.map((name) => ({
    name,
    sql: fs.readFileSync(path.resolve(root, "prisma/schema-changes", name), "utf8"),
  }));
  return {
    version: STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
    files,
    fingerprint: storeFactoryV2DdlBundleFingerprint({
      version: STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
      files,
    }),
  };
}

export function stripStoreFactoryV2DdlTransaction(sql: string): string {
  const normalized = sql.replace(/\r\n/g, "\n").trim();
  return normalized
    .replace(/^BEGIN\s*;\s*/i, "")
    .replace(/\s*COMMIT\s*;$/i, "")
    .trim();
}

async function readDatabaseIdentity(
  client: ClientBase
): Promise<StoreFactoryV2DatabaseIdentity> {
  const result = await client.query<{
    server_address: string | null;
    server_port: number | null;
    database_name: string;
    database_user: string;
    server_version_number: string;
  }>(
    `SELECT inet_server_addr()::text AS server_address,
            inet_server_port() AS server_port,
            current_database()::text AS database_name,
            current_user::text AS database_user,
            current_setting('server_version_num')::text AS server_version_number`
  );
  const row = result.rows[0];
  if (!row) throw new Error("DATABASE_IDENTITY_UNAVAILABLE");
  return {
    serverAddress: row.server_address,
    serverPort: row.server_port,
    databaseName: row.database_name,
    databaseUser: row.database_user,
    serverVersionNumber: row.server_version_number,
  };
}

async function inspectDatabase(client: ClientBase): Promise<StoreFactoryV2SchemaReport> {
  let pending = Promise.resolve();
  return readStoreFactoryV2SchemaCapability({
    async $queryRawUnsafe<T>(query: string, ...values: unknown[]) {
      const operation = pending.then(async () => {
        const result = await client.query(query, values);
        return result.rows as T;
      });
      pending = operation.then(
        () => undefined,
        () => undefined
      );
      return operation;
    },
  });
}

function printReport(report: StoreFactoryV2SchemaReport): void {
  console.log(`Schema version: ${STORE_FACTORY_V2_SCHEMA_VERSION}`);
  console.log(`Schema status: ${report.status}`);
  console.log(`Contract artifacts: ${report.satisfied}/${report.expected}`);
  if (report.status === "PARTIAL") {
    for (const problem of [...report.missing, ...report.incompatible]) {
      console.log(`- ${problem}`);
    }
  }
}

async function main(): Promise<void> {
  let options: StoreFactoryV2SchemaCliOptions;
  try {
    options = parseStoreFactoryV2SchemaCliArgs(process.argv.slice(2));
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

  let bundle: ReturnType<typeof readStoreFactoryV2DdlBundle>;
  try {
    bundle = readStoreFactoryV2DdlBundle();
  } catch {
    console.error("Command refused: the complete canonical V2.1 DDL bundle could not be read.");
    process.exitCode = 66;
    return;
  }
  const ddlReport = inspectStoreFactoryV2DdlBundle(bundle);
  if (!ddlReport.valid) {
    console.error("Command refused: the canonical DDL bundle failed its additive-contract preflight.");
    for (const problem of ddlReport.problems) console.error(`- ${problem}`);
    process.exitCode = 65;
    return;
  }

  const databaseUrl = process.env[options.urlEnv]?.trim();
  if (!databaseUrl) {
    console.error(`${options.urlEnv} is not set. No database connection was attempted.`);
    process.exitCode = 64;
    return;
  }
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    console.error(`${options.urlEnv} is not a valid PostgreSQL URL. No connection was attempted.`);
    process.exitCode = 64;
    return;
  }

  let connectionTarget: ReturnType<typeof canonicalStoreFactoryV2ConnectionTarget>;
  try {
    connectionTarget = canonicalStoreFactoryV2ConnectionTarget(databaseUrl);
  } catch {
    console.error(`${options.urlEnv} does not identify a complete PostgreSQL host and database. No connection was attempted.`);
    process.exitCode = 64;
    return;
  }

  if (options.command === "apply") {
    const applyTargetRefusal = validateStoreFactoryV2ApplyTarget({
      urlEnv: options.urlEnv,
      connectionString: databaseUrl,
    });
    if (applyTargetRefusal === "APPLY_URL_ENV_NOT_DIRECT") {
      console.error("Apply refused before connection: use only DIRECT_URL or DATABASE_URL_UNPOOLED.");
      process.exitCode = 64;
      return;
    }
    if (applyTargetRefusal === "APPLY_TARGET_RECOGNIZABLY_POOLED") {
      console.error("Apply refused before connection: the target is recognizably pooled/PgBouncer.");
      process.exitCode = 64;
      return;
    }
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: `multistore-${STORE_FACTORY_V2_SCHEMA_VERSION}-gate`,
  });
  let applyLockHeld = false;

  try {
    await client.connect();
    const databaseIdentity = await readDatabaseIdentity(client);
    const targetFingerprint = storeFactoryV2DatabaseTargetFingerprint({
      connectionTarget,
      databaseIdentity,
    });
    console.log(`Target env: ${options.urlEnv}`);
    console.log(`Target descriptor: ${formatStoreFactoryV2ConnectionTarget(connectionTarget)}`);
    console.log(`Target fingerprint: ${targetFingerprint}`);
    console.log(`DDL bundle version: ${bundle.version}`);
    console.log(`DDL bundle fingerprint: ${bundle.fingerprint}`);

    if (options.command === "verify") {
      const report = await inspectDatabase(client);
      printReport(report);
      process.exitCode =
        report.status === "COMPLETE" ? 0 : report.status === "ABSENT" ? 2 : 3;
      return;
    }

    const confirmationDecision = decideStoreFactoryV2SchemaApply({
      report: {
        version: STORE_FACTORY_V2_SCHEMA_VERSION,
        status: "ABSENT",
        expected: 0,
        satisfied: 0,
        missing: [],
        incompatible: [],
        persistenceEnabled: false,
      },
      targetFingerprint,
      confirmedTargetFingerprint: options.confirmedTargetFingerprint,
      ddlFingerprint: bundle.fingerprint,
      confirmedDdlFingerprint: options.confirmedDdlFingerprint,
    });
    if (confirmationDecision === "REFUSE_TARGET_CONFIRMATION") {
      console.error("Apply refused: copy the exact target fingerprint from verify into --confirm-target.");
      process.exitCode = 64;
      return;
    }
    if (confirmationDecision === "REFUSE_DDL_CONFIRMATION") {
      console.error("Apply refused: copy the exact DDL fingerprint from verify into --confirm-ddl.");
      process.exitCode = 64;
      return;
    }

    await client.query("SELECT pg_advisory_lock(hashtext($1), hashtext($2))", [
      APPLY_LOCK_NAMESPACE,
      APPLY_LOCK_NAME,
    ]);
    applyLockHeld = true;

    const before = await inspectDatabase(client);
    printReport(before);
    const decision = decideStoreFactoryV2SchemaApply({
      report: before,
      targetFingerprint,
      confirmedTargetFingerprint: options.confirmedTargetFingerprint,
      ddlFingerprint: bundle.fingerprint,
      confirmedDdlFingerprint: options.confirmedDdlFingerprint,
    });
    if (decision === "REFUSE_PARTIAL") {
      console.error("Apply refused: schema is PARTIAL. Reconcile it manually before any DDL runs.");
      process.exitCode = 3;
      return;
    }
    if (decision === "NOOP_COMPLETE") {
      console.log("No-op: the exact complete schema contract is already installed.");
      return;
    }
    if (decision !== "APPLY") throw new Error(`UNEXPECTED_APPLY_DECISION_${decision}`);

    console.log("Applying the additive V2.1 bundle in one transaction...");
    try {
      await client.query("BEGIN");
      for (const file of bundle.files) {
        await client.query(stripStoreFactoryV2DdlTransaction(file.sql));
      }
      const after = await inspectDatabase(client);
      if (after.status !== "COMPLETE") {
        printReport(after);
        throw new Error("POST_APPLY_VERIFICATION_FAILED");
      }
      await client.query("COMMIT");
      printReport(after);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }
    console.log("Expansion complete and verified. No feature flag or pilot store was changed.");
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
