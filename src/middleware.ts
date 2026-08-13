import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_STORE_SLUG,
  STORE_COOKIE,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";
import {
  allowInternalStorePath,
  selectEdgeTenant,
} from "@/lib/tenant/edge-routing";

/**
 * Multi-tenant routing.
 *
 * Storefront pages live under /s/[storeSlug] internally, but visitors always
 * see clean URLs (/, /p/some-product, /guides/foo). This middleware rewrites
 * every storefront request to the internal path based on:
 *
 *   1. Host header        authoritative in every environment
 *   2. ?store=<slug>      local development convenience only
 *   3. msdf_store cookie  local development convenience only
 *   4. NEXT_PUBLIC_DEFAULT_STORE (local development only)
 *
 * Unknown production hosts and direct /s/[slug] production paths fail closed.
 */

const PASSTHROUGH_PREFIXES = ["/api", "/admin", "/_next", "/s/"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";

  // Static files (robots.txt, sitemap.xml, favicon.ico, images, ...) and
  // metadata routes resolve their own tenant from the Host header.
  if (/\.[A-Za-z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Direct internal-path access: pass through but remember the store so that
  // subsequent clean-URL navigation stays on the same tenant in dev.
  if (pathname === "/s" || pathname.startsWith("/s/")) {
    if (!allowInternalStorePath(isProduction)) {
      return new NextResponse("Not Found", { status: 404 });
    }
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
  const cookieStore = request.cookies.get(STORE_COOKIE)?.value ?? null;

  const decision = selectEdgeTenant({
    isProduction,
    hostStore,
    queryStore,
    cookieStore,
    defaultStore: DEFAULT_STORE_SLUG,
  });
  if (decision.kind === "NOT_FOUND") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/s/${decision.slug}${pathname === "/" ? "" : pathname}`;
  url.searchParams.delete("store");

  const response = NextResponse.rewrite(url);
  if (decision.rememberInCookie) {
    response.cookies.set(STORE_COOKIE, decision.slug, { path: "/", sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
