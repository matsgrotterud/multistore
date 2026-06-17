import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  DB_ENV_KEYS,
  extractDatabaseAssignmentsFromText,
  sanitizeDatabaseUrl,
  uniqueUrlKey,
  type DatabaseEnvKey,
} from "../src/lib/db/env-sanitize";

const ROOT = process.cwd();
const LOCAL_ENV_FILE = ".env.local";
const INSPECTED_ENV_FILES = [".env", ".env.local", ".env.vercel", ".env.production.local"] as const;
const MANAGED_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "MEDIA_STORAGE_PROVIDER",
  "NEXT_PUBLIC_SITE_URL",
] as const;

interface CandidateUrl {
  value: string;
  key: DatabaseEnvKey;
  source: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
  urlKey: string;
  storeCount: number | null;
  productCount: number | null;
  hasStoreTable: boolean;
  error?: string;
}

function assertNotProduction() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production"
  ) {
    throw new Error("Refusing to repair .env.local while running in a production/Vercel context.");
  }
}

function discoverEnvFiles(): string[] {
  const backups = fs
    .readdirSync(ROOT)
    .filter((file) => file.startsWith(".env.local.backup"))
    .sort();
  return [...new Set([...INSPECTED_ENV_FILES, ...backups])];
}

function readFileIfExists(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : null;
}

function isPostgresUrl(value: string): boolean {
  return /^postgres(?:ql)?:\/\//i.test(value.trim().replace(/^["']|["']$/g, ""));
}

function redact(value: string): string {
  return sanitizeDatabaseUrl(value)?.redacted ?? "(invalid)";
}

function collectCandidateUrls(): Array<Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">> {
  const candidates: Array<Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">> = [];

  for (const file of discoverEnvFiles()) {
    const contents = readFileIfExists(file);
    if (contents === null) continue;
    for (const assignment of extractDatabaseAssignmentsFromText(contents)) {
      if (!isPostgresUrl(assignment.value)) continue;
      const sanitized = sanitizeDatabaseUrl(assignment.value);
      if (!sanitized || sanitized.host === "invalid-url") continue;
      candidates.push({
        value: assignment.value,
        key: assignment.key,
        source: `${file}:${assignment.line}`,
        sanitized,
        urlKey: uniqueUrlKey(assignment.value),
      });
    }
  }

  const unique = new Map<string, Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.urlKey)) unique.set(candidate.urlKey, candidate);
  }
  return [...unique.values()];
}

async function probeCandidate(
  candidate: Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">
): Promise<CandidateUrl> {
  const prisma = new PrismaClient({
    datasources: { db: { url: candidate.value } },
    log: [],
  });

  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `;
    const tableNames = new Set(tables.map((table) => table.tablename));
    const hasStoreTable = tableNames.has("Store");
    const hasProductTable = tableNames.has("Product");
    return {
      ...candidate,
      hasStoreTable,
      storeCount: hasStoreTable ? await prisma.store.count() : null,
      productCount: hasProductTable ? await prisma.product.count() : null,
    };
  } catch (error) {
    return {
      ...candidate,
      hasStoreTable: false,
      storeCount: null,
      productCount: null,
      error: error instanceof Error ? error.message.split(candidate.value).join(redact(candidate.value)) : String(error),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function parseLocalAssignments(contents: string): Map<string, string[]> {
  const values = new Map<string, string[]>();
  const lines = contents.split("\n");
  for (const line of lines) {
    const trimmed = line.trim().startsWith("export ")
      ? line.trim().slice("export ".length).trim()
      : line.trim();
    for (const key of MANAGED_KEYS) {
      if (trimmed.startsWith(`${key}=`)) {
        const value = trimmed.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
        values.set(key, [...(values.get(key) ?? []), value]);
      }
    }
  }
  return values;
}

function sameDatabaseFamily(a: CandidateUrl, b: CandidateUrl): boolean {
  return a.sanitized.pathname === b.sanitized.pathname;
}

function chooseSeededCandidate(candidates: CandidateUrl[]): CandidateUrl | null {
  return (
    candidates
      .filter((candidate) => !candidate.error)
      .sort((a, b) => {
        const storeDelta = (b.storeCount ?? 0) - (a.storeCount ?? 0);
        if (storeDelta !== 0) return storeDelta;
        if (a.sanitized.isPooler !== b.sanitized.isPooler) return a.sanitized.isPooler ? 1 : -1;
        return (b.productCount ?? 0) - (a.productCount ?? 0);
      })[0] ?? null
  );
}

function chooseUrls(candidates: CandidateUrl[], localValues: Map<string, string[]>): {
  databaseUrl: string;
  directUrl: string;
  unpooledUrl: string;
  reason: string;
  selected: CandidateUrl | null;
} {
  const seeded = candidates.filter((candidate) => (candidate.storeCount ?? 0) > 0);
  const selected = chooseSeededCandidate(seeded) ?? chooseSeededCandidate(candidates);
  if (selected) {
    const sameFamily = candidates.filter((candidate) => sameDatabaseFamily(candidate, selected));
    const pooler = sameFamily.find((candidate) => candidate.sanitized.isPooler && !candidate.error);
    const unpooled = sameFamily.find((candidate) => !candidate.sanitized.isPooler && !candidate.error);
    return {
      databaseUrl: (pooler ?? selected).value,
      directUrl: (unpooled ?? selected).value,
      unpooledUrl: (unpooled ?? selected).value,
      reason:
        (selected.storeCount ?? 0) > 0
          ? "selected database with existing Store rows"
          : "selected first reachable database because no Store rows were found",
      selected,
    };
  }

  const localUnpooled = localValues.get("DATABASE_URL_UNPOOLED")?.find(isPostgresUrl);
  const localDatabaseUrl = localValues.get("DATABASE_URL")?.find(isPostgresUrl);
  const fallback = localUnpooled ?? localDatabaseUrl;
  if (fallback) {
    return {
      databaseUrl: fallback,
      directUrl: fallback,
      unpooledUrl: fallback,
      reason: "copied valid local DATABASE_URL_UNPOOLED/DATABASE_URL fallback",
      selected: null,
    };
  }

  throw new Error("No valid Postgres URL found in .env, .env.local, .env.vercel, .env.production.local or .env.local.backup*.");
}

function isManagedLine(line: string): boolean {
  const trimmed = line.trim().startsWith("export ")
    ? line.trim().slice("export ".length).trim()
    : line.trim();
  return MANAGED_KEYS.some((key) => trimmed.startsWith(`${key}=`));
}

function renderLocalEnv(contents: string, values: { databaseUrl: string; directUrl: string; unpooledUrl: string }): string {
  const preservedLines = contents
    .split("\n")
    .filter((line) => !isManagedLine(line))
    .join("\n")
    .replace(/\s+$/g, "");

  const managedBlock = [
    "# Local database/media settings managed by pnpm run db:repair-local",
    `DATABASE_URL=${values.databaseUrl}`,
    `DIRECT_URL=${values.directUrl}`,
    `DATABASE_URL_UNPOOLED=${values.unpooledUrl}`,
    "MEDIA_STORAGE_PROVIDER=local",
    "NEXT_PUBLIC_SITE_URL=http://localhost:3010",
  ].join("\n");

  return `${preservedLines ? `${preservedLines}\n\n` : ""}${managedBlock}\n`;
}

function backupLocalEnv(contents: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const backupFile = `${LOCAL_ENV_FILE}.backup-db-repair-${stamp}`;
  fs.writeFileSync(path.join(ROOT, backupFile), contents);
  return backupFile;
}

async function main() {
  assertNotProduction();

  const localPath = path.join(ROOT, LOCAL_ENV_FILE);
  const localContents = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8") : "";
  const localValues = parseLocalAssignments(localContents);
  const candidates = await Promise.all(collectCandidateUrls().map(probeCandidate));
  const selectedUrls = chooseUrls(candidates, localValues);
  const nextContents = renderLocalEnv(localContents, selectedUrls);

  if (nextContents === localContents) {
    console.log(".env.local is already normalized.");
    console.log(`DATABASE_URL: ${redact(selectedUrls.databaseUrl)}`);
    return;
  }

  const backupFile = backupLocalEnv(localContents);
  fs.writeFileSync(localPath, nextContents);

  console.log(`Backed up .env.local to ${backupFile}`);
  console.log(`Repaired .env.local (${selectedUrls.reason}).`);
  console.log(`DATABASE_URL: ${redact(selectedUrls.databaseUrl)}`);
  console.log(`DIRECT_URL: ${redact(selectedUrls.directUrl)}`);
  console.log("MEDIA_STORAGE_PROVIDER=local");
  console.log("NEXT_PUBLIC_SITE_URL=http://localhost:3010");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
