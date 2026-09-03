export interface WishlistRequestContext {
  method: string;
  origin: string | null;
  host: string | null;
  forwardedHost?: string | null;
  secFetchSite?: string | null;
}

/**
 * Browser mutations must be same-origin. GET/HEAD are read-only and may pass;
 * mutation clients without an Origin are rejected instead of guessed safe.
 */
export function canMutateWishlist(context: WishlistRequestContext): boolean {
  const method = context.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  if (!context.origin) return false;
  if (context.secFetchSite && context.secFetchSite !== "same-origin") return false;

  const expectedHost = normalizeHost(context.forwardedHost ?? context.host);
  if (!expectedHost) return false;
  try {
    const origin = new URL(context.origin);
    if (origin.protocol !== "http:" && origin.protocol !== "https:") return false;
    return normalizeHost(origin.host) === expectedHost;
  } catch {
    return false;
  }
}

function normalizeHost(value: string | null | undefined): string | null {
  const first = value?.split(",")[0]?.trim().toLowerCase();
  if (!first || first.includes("/") || first.includes("@")) return null;
  return first;
}
