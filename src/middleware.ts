import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_STORE_SLUG,
  STORE_COOKIE,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";

/**
 * Multi-tenant routing.
 *
 * Storefront pages live under /s/[storeSlug] internally, but visitors always
 * see clean URLs (/, /p/some-product, /guides/foo). This middleware rewrites
 * every storefront request to the internal path based on, in priority order:
 *
 *   1. ?store=<slug>      local development convenience
 *   2. Host header        production domain -> slug via src/config/domain-map.ts
 *   3. msdf_store cookie  remembers the tenant across clean-URL navigation
 *   4. NEXT_PUBLIC_DEFAULT_STORE
 *
 * Direct /s/[slug] access is allowed (useful in dev) but is never the
 * canonical URL: every page emits a canonical tag pointing at the store's
 * primary domain with the clean path.
 */

const PASSTHROUGH_PREFIXES = ["/api", "/admin", "/_next", "/s/"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Static files (robots.txt, sitemap.xml, favicon.ico, images, ...) and
  // metadata routes resolve their own tenant from the Host header.
  if (/\.[A-Za-z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Direct internal-path access: pass through but remember the store so that
  // subsequent clean-URL navigation stays on the same tenant in dev.
  if (pathname === "/s" || pathname.startsWith("/s/")) {
    const slug = pathname.split("/")[2];
    const response = NextResponse.next();
    if (slug) {
      response.cookies.set(STORE_COOKIE, slug, { path: "/", sameSite: "lax" });
    }
    return response;
  }

  for (const prefix of PASSTHROUGH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const queryStore = searchParams.get("store");
  const host = request.headers.get("host") ?? "";
  const hostStore = resolveStoreSlugFromHost(host);
  const cookieStore = request.cookies.get(STORE_COOKIE)?.value;

  const slug = queryStore || hostStore || cookieStore || DEFAULT_STORE_SLUG;

  const url = request.nextUrl.clone();
  url.pathname = `/s/${slug}${pathname === "/" ? "" : pathname}`;
  url.searchParams.delete("store");

  const response = NextResponse.rewrite(url);
  response.cookies.set(STORE_COOKIE, slug, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
