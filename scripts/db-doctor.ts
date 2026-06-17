import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  CORE_TABLES,
  DB_ENV_KEYS,
  extractDatabaseAssignmentsFromText,
  sanitizeDatabaseUrl,
  uniqueUrlKey,
  type DatabaseEnvKey,
} from "../src/lib/db/env-sanitize";

const ROOT = process.cwd();
const BASE_ENV_FILES = [".env", ".env.local", ".env.vercel", ".env.production.local"] as const;

interface RawEnvValue {
  source: string;
  key: DatabaseEnvKey;
  line?: number;
  value: string;
}

interface UrlProbe {
  url: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
}

interface ProbeResult {
  urlKey: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
  sources: string[];
  publicTableCount: number;
  hasStoreTable: boolean;
  hasProductTable: boolean;
  coreTables: Record<(typeof CORE_TABLES)[number], boolean>;
  storeCount: number | null;
  productCount: number | null;
  error?: string;
}

function discoverEnvFiles(): string[] {
  const backups = fs
    .readdirSync(ROOT)
    .filter((file) => file.startsWith(".env.local.backup"))
    .sort();
  return [...new Set([...BASE_ENV_FILES, ...backups])];
}

function readEnvFile(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function collectRawEnvValues(): RawEnvValue[] {
  const collected: RawEnvValue[] = [];

  for (const file of discoverEnvFiles()) {
    const contents = readEnvFile(file);
    if (contents === null) continue;
    for (const entry of extractDatabaseAssignmentsFromText(contents)) {
      collected.push({
        source: `${file}:${entry.line}`,
        key: entry.key,
        line: entry.line,
        value: entry.value,
      });
    }
  }

  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      collected.push({ source: "process.env", key, value });
    }
  }

  return collected;
}

function printHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}

function isPostgresUrl(value: string): boolean {
  return /^postgres(?:ql)?:\/\//i.test(value.trim().replace(/^["']|["']$/g, ""));
}

function sanitizeForOutput(value: string): string {
  if (!value.trim()) return "(empty)";
  const sanitized = sanitizeDatabaseUrl(value);
  return sanitized ? `${sanitized.redacted}${sanitized.isPooler ? " [pooler]" : ""}` : "(invalid)";
}

function redactKnownUrls(message: string, rawValues: RawEnvValue[]): string {
  let redacted = message;
  for (const entry of rawValues) {
    const value = entry.value.trim();
    if (!value) continue;
    const sanitized = sanitizeDatabaseUrl(value);
    if (!sanitized) continue;
    redacted = redacted.split(value).join(sanitized.redacted);
  }
  return redacted;
}

async function probeDatabase(
  url: string,
  rawValues: RawEnvValue[]
): Promise<Omit<ProbeResult, "urlKey" | "sanitized" | "sources">> {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: [],
  });

  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC
    `;
    const tables = rows.map((row) => row.tablename);
    const coreTables = Object.fromEntries(
      CORE_TABLES.map((table) => [table, tables.includes(table)])
    ) as Record<(typeof CORE_TABLES)[number], boolean>;
    const hasStoreTable = tables.includes("Store");
    const hasProductTable = tables.includes("Product");

    let storeCount: number | null = null;
    let productCount: number | null = null;

    if (hasStoreTable) {
      storeCount = await prisma.store.count();
    }
    if (hasProductTable) {
      productCount = await prisma.product.count();
    }

    return {
      publicTableCount: tables.length,
      hasStoreTable,
      hasProductTable,
      coreTables,
      storeCount,
      productCount,
    };
  } catch (error) {
    return {
      publicTableCount: 0,
      hasStoreTable: false,
      hasProductTable: false,
      coreTables: Object.fromEntries(CORE_TABLES.map((table) => [table, false])) as Record<
        (typeof CORE_TABLES)[number],
        boolean
      >,
      storeCount: null,
      productCount: null,
      error: redactKnownUrls(error instanceof Error ? error.message : String(error), rawValues),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function chooseBestDatabase(results: ProbeResult[]): ProbeResult | null {
  return (
    results
      .filter((result) => !result.error)
      .sort((a, b) => {
        const storeDelta = (b.storeCount ?? 0) - (a.storeCount ?? 0);
        if (storeDelta !== 0) return storeDelta;
        const tableDelta = b.publicTableCount - a.publicTableCount;
        if (tableDelta !== 0) return tableDelta;
        return (b.productCount ?? 0) - (a.productCount ?? 0);
      })[0] ?? null
  );
}

async function main() {
  printHeader("Inspected env files");
  const envFiles = discoverEnvFiles();
  for (const file of envFiles) {
    console.log(`- ${file}: ${fs.existsSync(path.join(ROOT, file)) ? "found" : "missing"}`);
  }

  printHeader("Next.js development env load order");
  loadEnvConfig(ROOT, true);
  console.log("Loaded via @next/env loadEnvConfig(cwd, dev=true)");
  console.log(`NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}`);
  console.log(`VERCEL=${process.env.VERCEL ?? "(unset)"}`);

  printHeader("DATABASE_URL sources (redacted)");
  const rawValues = collectRawEnvValues();
  const duplicateKeys = new Map<string, number>();

  if (rawValues.length === 0) {
    console.log("No DATABASE_URL, DIRECT_URL or DATABASE_URL_UNPOOLED assignments found.");
  }

  for (const entry of rawValues) {
    console.log(`- ${entry.source} ${entry.key} -> ${sanitizeForOutput(entry.value)}`);
    duplicateKeys.set(entry.key, (duplicateKeys.get(entry.key) ?? 0) + 1);
  }

  const duplicateWarnings = [...duplicateKeys.entries()].filter(([, count]) => count > 1);
  if (duplicateWarnings.length > 0) {
    printHeader("Duplicate env keys detected");
    for (const [key, count] of duplicateWarnings) {
      console.log(`- ${key} appears ${count} times across inspected sources/process env`);
      console.log("  Last parsed value wins in dotenv/Next, so empty late values can break Prisma.");
    }
  }

  printHeader("Effective process.env after Next dev load");
  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    console.log(`- ${key}: ${value === undefined ? "(unset)" : sanitizeForOutput(value)}`);
  }

  const probesByUrl = new Map<string, UrlProbe>();
  for (const entry of rawValues) {
    if (!isPostgresUrl(entry.value)) continue;
    const sanitized = sanitizeDatabaseUrl(entry.value);
    if (!sanitized || sanitized.host === "invalid-url") continue;
    const urlKey = uniqueUrlKey(entry.value);
    if (!probesByUrl.has(urlKey)) {
      probesByUrl.set(urlKey, { url: entry.value, sanitized });
    }
  }

  printHeader("Database probes");
  const results: ProbeResult[] = [];

  if (probesByUrl.size === 0) {
    console.log("No unique Postgres URLs found to probe.");
  }

  for (const [urlKey, probe] of probesByUrl) {
    console.log(`\nProbing ${probe.sanitized.redacted}`);
    const measured = await probeDatabase(probe.url, rawValues);
    const sources = rawValues
      .filter((entry) => uniqueUrlKey(entry.value) === urlKey)
      .map((entry) => `${entry.source} (${entry.key})`);

    const result: ProbeResult = {
      urlKey,
      sanitized: probe.sanitized,
      sources,
      ...measured,
    };
    results.push(result);

    if (result.error) {
      console.log(`  ERROR: ${result.error}`);
      continue;
    }

    console.log(`  public schema table count: ${result.publicTableCount}`);
    console.log(`  hasStoreTable: ${result.hasStoreTable ? "yes" : "no"}`);
    console.log(`  hasProductTable: ${result.hasProductTable ? "yes" : "no"}`);
    console.log(`  Store row count: ${result.storeCount ?? "n/a"}`);
    console.log(`  Product row count: ${result.productCount ?? "n/a"}`);
    console.log(
      `  Core tables: ${CORE_TABLES.map((table) => `${table}=${result.coreTables[table] ? "yes" : "no"}`).join(", ")}`
    );
    console.log(`  Referenced from: ${sources.join(", ")}`);
  }

  printHeader("Recommendation");
  const effectiveValue = process.env.DATABASE_URL ?? "";
  const effective = sanitizeDatabaseUrl(effectiveValue);
  const effectiveResult = results.find((result) => result.urlKey === uniqueUrlKey(effectiveValue));
  const best = chooseBestDatabase(results);

  if (best && (best.storeCount ?? 0) > 0) {
    console.log("Recommended Multistore database:");
    console.log(`  ${best.sanitized.redacted} (${best.storeCount} stores, ${best.productCount ?? 0} products)`);
    if (effective && effective.host !== "invalid-url" && uniqueUrlKey(effectiveValue) !== best.urlKey) {
      console.log("Current effective DATABASE_URL points somewhere else:");
      console.log(`  ${effective.redacted}`);
      console.log("Run pnpm run db:repair-local to rewrite .env.local toward the seeded database.");
    }
  } else if (best?.hasStoreTable) {
    console.log("A database has the Store table, but no Store rows yet:");
    console.log(`  ${best.sanitized.redacted}`);
    console.log("Seed only after confirming this is the intended local database.");
  } else {
    console.log("No probed database contains Store rows.");
    console.log("After confirming the intended DB, run pnpm run db:push:local and pnpm run db:seed:local manually.");
  }

  if (rawValues.some((entry) => DB_ENV_KEYS.includes(entry.key) && !entry.value.trim())) {
    console.log("One or more DB env assignments are empty. Empty late values are a common Prisma failure mode.");
  }

  if (duplicateWarnings.length > 0) {
    console.log("Duplicate DB env keys found. Keep one value per key in .env.local.");
  }

  if (effectiveResult && !effectiveResult.hasStoreTable) {
    console.log("Current effective DATABASE_URL is missing the Store table.");
  }

  if (best && effectiveResult?.urlKey === best.urlKey && (effectiveResult.storeCount ?? 0) > 0) {
    console.log("Effective DATABASE_URL matches a seeded Multistore database. Local DB looks healthy.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
