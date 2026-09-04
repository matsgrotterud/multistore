export type EdgeTenantDecision =
  | { kind: "STORE"; slug: string; rememberInCookie: boolean }
  | { kind: "NOT_FOUND" };

export interface EdgeTenantInput {
  isProduction: boolean;
  hostStore: string | null;
  queryStore: string | null;
  cookieStore: string | null;
  defaultStore: string;
}

export interface MiddlewareHostStoreInput {
  isProduction: boolean;
  host: string;
  staticStore: string | null;
  resolveProductionHost: (host: string) => Promise<string | null>;
}

function normalizeVercelDeploymentHost(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) return null;

  try {
    const url = new URL(
      candidate.includes("://") ? candidate : `https://${candidate}`
    );
    if (!url.hostname.toLowerCase().endsWith(".vercel.app")) return null;
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The shared deployment host is the control-plane entry point, not a tenant.
 * Match it exactly so lookalike or unknown production hosts still fail closed.
 */
export function isDeploymentControlPlaneRoot(input: {
  isProduction: boolean;
  pathname: string;
  requestHost: string;
  configuredHosts: Array<string | null | undefined>;
}): boolean {
  if (!input.isProduction || input.pathname !== "/") return false;

  const requestHost = normalizeVercelDeploymentHost(input.requestHost);
  if (!requestHost) return false;

  return input.configuredHosts.some(
    (configuredHost) =>
      Boolean(configuredHost) &&
      normalizeVercelDeploymentHost(configuredHost ?? "") === requestHost
  );
}

/**
 * Production always uses the durable Domain resolver as its single authority.
 * The static map is development-only. Resolver errors are deliberately
 * converted to no tenant so production routing fails closed.
 */
export async function resolveMiddlewareHostStore(
  input: MiddlewareHostStoreInput
): Promise<string | null> {
  if (!input.isProduction) return input.staticStore;
  if (!input.host.trim()) return null;

  try {
    return await input.resolveProductionHost(input.host);
  } catch {
    return null;
  }
}

/**
 * A recognized host is authoritative in every environment. Development-only
 * helpers are never allowed to override it and never exist in production.
 */
export function selectEdgeTenant(input: EdgeTenantInput): EdgeTenantDecision {
  if (input.hostStore) {
    return { kind: "STORE", slug: input.hostStore, rememberInCookie: false };
  }

  if (input.isProduction) return { kind: "NOT_FOUND" };

  return {
    kind: "STORE",
    slug: input.queryStore || input.cookieStore || input.defaultStore,
    rememberInCookie: true,
  };
}

export function allowInternalStorePath(input: {
  isProduction: boolean;
  hasVerifiedAdminSession: boolean;
}): boolean {
  return !input.isProduction || input.hasVerifiedAdminSession;
}
