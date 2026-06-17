const DB_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
] as const;

export type DatabaseEnvKey = (typeof DB_ENV_KEYS)[number];

export interface SanitizedDatabaseTarget {
  host: string;
  pathname: string;
  isPooler: boolean;
  redacted: string;
}

export const CORE_TABLES = [
  "Store",
  "Supplier",
  "Product",
  "ProductImage",
  "StoreSettings",
  "Order",
] as const;

export function sanitizeDatabaseUrl(raw: string | undefined | null): SanitizedDatabaseTarget | null {
  if (!raw?.trim()) return null;

  try {
    const normalized = raw.trim().replace(/^["']|["']$/g, "");
    const parsed = new URL(
      normalized.replace(/^postgresql:\/\//, "https://").replace(/^postgres:\/\//, "https://")
    );
    const host = parsed.hostname || "unknown-host";
    const pathname = parsed.pathname || "/";
    const user = parsed.username ? decodeURIComponent(parsed.username) : "";
    const redactedUser = user ? `${user.slice(0, 2)}***` : "user";
    return {
      host,
      pathname,
      isPooler: host.includes("pooler"),
      redacted: `postgresql://${redactedUser}:***@${host}${pathname}`,
    };
  } catch {
    return {
      host: "invalid-url",
      pathname: "/",
      isPooler: false,
      redacted: "postgresql://***:***@invalid-url/",
    };
  }
}

export function getSanitizedDatabaseTarget(
  env: NodeJS.ProcessEnv = process.env
): SanitizedDatabaseTarget {
  return (
    sanitizeDatabaseUrl(env.DATABASE_URL) ?? {
      host: "missing",
      pathname: "/",
      isPooler: false,
      redacted: "DATABASE_URL is not set",
    }
  );
}

export function extractDatabaseUrlsFromText(text: string): Array<{
  key: DatabaseEnvKey;
  line: number;
  url: string;
}> {
  const entries: Array<{ key: DatabaseEnvKey; line: number; url: string }> = [];
  const lines = text.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line || line.startsWith("#")) continue;

    for (const key of DB_ENV_KEYS) {
      const prefix = `${key}=`;
      if (!line.startsWith(prefix)) continue;
      const value = line.slice(prefix.length).trim().replace(/^["']|["']$/g, "");
      if (value) {
        entries.push({ key, line: index + 1, url: value });
      }
    }
  }

  return entries;
}

export function uniqueUrlKey(url: string): string {
  const sanitized = sanitizeDatabaseUrl(url);
  return sanitized ? `${sanitized.host}${sanitized.pathname}` : url;
}

export { DB_ENV_KEYS };
