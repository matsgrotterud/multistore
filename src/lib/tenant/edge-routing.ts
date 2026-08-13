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

export function allowInternalStorePath(isProduction: boolean): boolean {
  return !isProduction;
}
