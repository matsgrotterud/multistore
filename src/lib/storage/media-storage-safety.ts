/**
 * Production-safety guard for media ingestion.
 *
 * The failure mode this prevents: generating/importing while connected to a
 * REMOTE database (Neon/Supabase/etc.) but with `MEDIA_STORAGE_PROVIDER=local`.
 * That writes `/uploads/dev-media/...` URLs (which only exist on the developer
 * machine) into the remote DB, so live Vercel images break.
 *
 * This module reads env only — no secrets are exposed (only the DB *hostname*).
 */

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "file"]);

/**
 * True when a stored media URL points at the local dev filesystem
 * (`/uploads/dev-media/...`) rather than a durable remote/Blob URL. Such URLs
 * only exist on the developer machine and must never be reused/served from a
 * remote DB. Remote URLs (Vercel Blob, CDNs) are absolute `https://` URLs.
 */
export function isLocalDevMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("/uploads")) return true;
  // Any root-relative path (but not protocol-relative "//host") is local.
  return value.startsWith("/") && !value.startsWith("//");
}

export interface MediaStorageSafetyReport {
  /** DB hostname only (no credentials), or null if unknown. */
  dbHost: string | null;
  dbIsLocal: boolean;
  dbIsRemote: boolean;
  /** What MEDIA_STORAGE_PROVIDER was explicitly set to, if anything. */
  requestedProvider: string | null;
  /** What getStorageProvider() will actually use given current env. */
  effectiveProvider: "local" | "vercel-blob";
  hasBlobToken: boolean;
  isVercelRuntime: boolean;
  /** Unsafe = remote DB + effective local storage, without an explicit override. */
  unsafe: boolean;
  /** ALLOW_REMOTE_DB_LOCAL_MEDIA=true escape hatch. */
  overrideEnabled: boolean;
  message: string;
}

export const REMOTE_DB_LOCAL_MEDIA_MESSAGE =
  "This generator is connected to a remote database but media storage is local. " +
  "Use MEDIA_STORAGE_PROVIDER=vercel-blob or generate from the deployed admin. " +
  "(Set ALLOW_REMOTE_DB_LOCAL_MEDIA=true only if you accept that local /uploads/dev-media " +
  "URLs will be written to the remote database.)";

function parseDbHost(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (value.startsWith("file:")) return "file";
  try {
    return new URL(value).hostname || null;
  } catch {
    // Fallback for connection strings URL() can't parse.
    const match = value.match(/@([^:/?]+)/);
    return match ? match[1] : null;
  }
}

function hostIsLocal(host: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  if (LOCAL_DB_HOSTS.has(h)) return true;
  return h.endsWith(".local") || h.endsWith(".localhost");
}

function effectiveProvider(hasBlobToken: boolean, isVercelRuntime: boolean): "local" | "vercel-blob" {
  // Mirrors getStorageProvider() resolution so the report never drifts from it.
  const requested = process.env.MEDIA_STORAGE_PROVIDER?.trim();
  const hasBlobAuth = hasBlobToken || Boolean(process.env.VERCEL_OIDC_TOKEN?.trim()) || isVercelRuntime;
  if (requested === "vercel-blob" || (!requested && hasBlobAuth)) return "vercel-blob";
  return "local";
}

export function getMediaStorageSafetyReport(): MediaStorageSafetyReport {
  // The pooled DATABASE_URL is what the app uses at runtime; fall back to DIRECT_URL.
  const dbHost = parseDbHost(process.env.DATABASE_URL) ?? parseDbHost(process.env.DIRECT_URL);
  const dbIsLocal = hostIsLocal(dbHost);
  // Safe-by-default: anything we cannot prove is local is treated as remote,
  // EXCEPT a fully-absent DB URL (no DB configured -> nothing to protect).
  const dbIsRemote = dbHost !== null && !dbIsLocal;

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const isVercelRuntime = Boolean(process.env.VERCEL);
  const provider = effectiveProvider(hasBlobToken, isVercelRuntime);
  const overrideEnabled = process.env.ALLOW_REMOTE_DB_LOCAL_MEDIA === "true";

  const unsafe = dbIsRemote && provider === "local" && !overrideEnabled;

  const message = unsafe
    ? REMOTE_DB_LOCAL_MEDIA_MESSAGE
    : dbIsRemote && provider === "local" && overrideEnabled
      ? "UNSAFE OVERRIDE ACTIVE: writing local /uploads/dev-media URLs into a remote database."
      : `Media storage OK: db=${dbIsRemote ? "remote" : "local"}, provider=${provider}.`;

  return {
    dbHost,
    dbIsLocal,
    dbIsRemote,
    requestedProvider: process.env.MEDIA_STORAGE_PROVIDER?.trim() || null,
    effectiveProvider: provider,
    hasBlobToken,
    isVercelRuntime,
    unsafe,
    overrideEnabled,
    message,
  };
}

/**
 * Throws when the current context would write local media URLs into a remote
 * DB. Call before any code path that persists ProductMediaAsset.storageUrl.
 * Honors the ALLOW_REMOTE_DB_LOCAL_MEDIA override (with a loud warning).
 */
export function assertSafeMediaWriteContext(): void {
  const report = getMediaStorageSafetyReport();
  if (report.unsafe) {
    throw new Error(REMOTE_DB_LOCAL_MEDIA_MESSAGE);
  }
  if (report.dbIsRemote && report.effectiveProvider === "local" && report.overrideEnabled) {
    console.warn(
      `[media-storage-safety] ${report.message} (override via ALLOW_REMOTE_DB_LOCAL_MEDIA)`
    );
  }
}
