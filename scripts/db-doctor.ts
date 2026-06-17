import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  CORE_TABLES,
  DB_ENV_KEYS,
  extractDatabaseUrlsFromText,
  sanitizeDatabaseUrl,
  uniqueUrlKey,
  type DatabaseEnvKey,
} from "../src/lib/db/env-sanitize";

const ROOT = process.cwd();
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.vercel",
  ".env.production.local",
] as const;

interface UrlProbe {
  source: string;
  key: DatabaseEnvKey;
  line?: number;
  url: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
}

interface ProbeResult {
  urlKey: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
  sources: string[];
  tables: string[];
  tableStatus: Record<(typeof CORE_TABLES)[number], boolean>;
  storeCount: number | null;
  productCount: number | null;
  error?: string;
}

function readEnvFile(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function collectRawEnvValues(): Array<{ source: string; key: DatabaseEnvKey; line?: number; url: string }> {
  const collected: Array<{ source: string; key: DatabaseEnvKey; line?: number; url: string }> = [];

  for (const file of ENV_FILES) {
    const contents = readEnvFile(file);
    if (!contents) continue;
    for (const entry of extractDatabaseUrlsFromText(contents)) {
      collected.push({
        source: `${file}:${entry.line}`,
        key: entry.key,
        line: entry.line,
        url: entry.url,
      });
    }
  }

  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      collected.push({ source: "process.env", key, url: value });
    }
  }

  return collected;
}

function printHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}

async function probeDatabase(url: string): Promise<Omit<ProbeResult, "urlKey" | "sanitized" | "sources">> {
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
    const tableStatus = Object.fromEntries(
      CORE_TABLES.map((table) => [table, tables.includes(table)])
    ) as Record<(typeof CORE_TABLES)[number], boolean>;

    let storeCount: number | null = null;
    let productCount: number | null = null;

    if (tableStatus.Store) {
      storeCount = await prisma.store.count();
    }
    if (tableStatus.Product) {
      productCount = await prisma.product.count();
    }

    return { tables, tableStatus, storeCount, productCount };
  } catch (error) {
    return {
      tables: [],
      tableStatus: Object.fromEntries(CORE_TABLES.map((table) => [table, false])) as Record<
        (typeof CORE_TABLES)[number],
        boolean
      >,
      storeCount: null,
      productCount: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  printHeader("Next.js development env load order");
  loadEnvConfig(ROOT, true);
  console.log("Loaded via @next/env loadEnvConfig(cwd, dev=true)");
  console.log(`NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}`);
  console.log(`VERCEL=${process.env.VERCEL ?? "(unset)"}`);

  printHeader("Raw DATABASE_URL sources (sanitized)");
  const rawValues = collectRawEnvValues();
  const duplicateKeys = new Map<string, number>();

  for (const entry of rawValues) {
    const sanitized = sanitizeDatabaseUrl(entry.url);
    if (!sanitized) continue;
    console.log(
      `- ${entry.source} ${entry.key} -> ${sanitized.redacted}${
        sanitized.isPooler ? " [pooler]" : ""
      }`
    );
    duplicateKeys.set(entry.key, (duplicateKeys.get(entry.key) ?? 0) + 1);
  }

  const duplicateWarnings = [...duplicateKeys.entries()].filter(([, count]) => count > 1);
  if (duplicateWarnings.length > 0) {
    printHeader("Duplicate env keys detected");
    for (const [key, count] of duplicateWarnings) {
      console.log(`- ${key} appears ${count} times across inspected sources`);
      console.log("  Last parsed value wins in dotenv/Next — this often causes wrong DB connections.");
    }
  }

  printHeader("Effective process.env after Next dev load");
  for (const key of DB_ENV_KEYS) {
    const sanitized = sanitizeDatabaseUrl(process.env[key]);
    if (!sanitized) {
      console.log(`- ${key}: (unset)`);
      continue;
    }
    console.log(`- ${key}: ${sanitized.redacted}${sanitized.isPooler ? " [pooler]" : ""}`);
  }

  const probesByUrl = new Map<string, UrlProbe>();
  for (const entry of rawValues) {
    const sanitized = sanitizeDatabaseUrl(entry.url);
    if (!sanitized) continue;
    const urlKey = uniqueUrlKey(entry.url);
    if (!probesByUrl.has(urlKey)) {
      probesByUrl.set(urlKey, {
        source: entry.source,
        key: entry.key,
        line: entry.line,
        url: entry.url,
        sanitized,
      });
    }
  }

  printHeader("Database probes");
  const results: ProbeResult[] = [];

  for (const [urlKey, probe] of probesByUrl) {
    console.log(`\nProbing ${probe.sanitized.redacted}`);
    const measured = await probeDatabase(probe.url);
    const sources = rawValues
      .filter((entry) => uniqueUrlKey(entry.url) === urlKey)
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

    console.log(`  Tables (${result.tables.length}): ${result.tables.join(", ") || "(none)"}`);
    for (const table of CORE_TABLES) {
      console.log(`  - ${table}: ${result.tableStatus[table] ? "yes" : "no"}`);
    }
    console.log(`  Store count: ${result.storeCount ?? "n/a"}`);
    console.log(`  Product count: ${result.productCount ?? "n/a"}`);
    console.log(`  Referenced from: ${sources.join(", ")}`);
  }

  printHeader("Recommendation");
  const effective = sanitizeDatabaseUrl(process.env.DATABASE_URL);
  const seeded = results.filter((result) => (result.storeCount ?? 0) > 0);
  const effectiveResult = results.find((result) => result.urlKey === uniqueUrlKey(process.env.DATABASE_URL ?? ""));

  if (seeded.length > 0) {
    const best = seeded.sort((a, b) => (b.storeCount ?? 0) - (a.storeCount ?? 0))[0]!;
    console.log(`This is the database your app should use:`);
    console.log(`  ${best.sanitized.redacted} (${best.storeCount} stores)`);
    if (effective && uniqueUrlKey(process.env.DATABASE_URL ?? "") !== best.urlKey) {
      console.log(`This env file appears wrong for local dev:`);
      console.log(`  Effective DATABASE_URL points to ${effective.redacted}`);
      console.log(`  Remove duplicate DATABASE_URL/DIRECT_URL lines from .env.local and keep the seeded database.`);
    }
  } else {
    console.log("No probed database contains Store rows.");
    console.log("Run npm run db:push:local && npm run db:seed:local against the intended database.");
  }

  if (duplicateWarnings.length > 0) {
    console.log("Duplicate DATABASE_URL entries found — keep only one URL per key in .env.local.");
  }

  if (effectiveResult && !effectiveResult.tableStatus.Store) {
    console.log("Current effective DATABASE_URL is missing the Store table.");
  }

  if (seeded.length > 0 && effectiveResult && (effectiveResult.storeCount ?? 0) > 0) {
    console.log("Effective DATABASE_URL matches a seeded database. You should be good for npm run dev:local.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
