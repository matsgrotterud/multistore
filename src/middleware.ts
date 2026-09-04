import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_STORE_SLUG,
  STORE_COOKIE,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";
import {
  allowInternalStorePath,
  isDeploymentControlPlaneRoot,
  resolveMiddlewareHostStore,
  selectEdgeTenant,
} from "@/lib/tenant/edge-routing";
import {
  ADMIN_COOKIE_NAME,
  isAdminSessionTokenValid,
} from "@/lib/admin/auth-token";

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
 * Unknown production hosts fail closed. Direct /s/[slug] production paths are
 * available only to a cryptographically verified admin preview session.
 */

const PASSTHROUGH_PREFIXES = [
  "/api",
  "/admin",
  "/admin-preview",
  "/_next",
  "/s/",
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";
  const host = request.headers.get("host") ?? request.nextUrl.host;

  // Static files (robots.txt, sitemap.xml, favicon.ico, images, ...) and
  // metadata routes resolve their own tenant from the Host header.
  if (/\.[A-Za-z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // The shared Vercel/deployment hostname belongs to the control plane, not a
  // storefront tenant. Keep this exception limited to the exact root path;
  // clean storefront paths still require an authoritative LIVE Domain row.
  if (
    isDeploymentControlPlaneRoot({
      isProduction,
      pathname,
      requestHost: host,
      configuredHosts: [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL,
      ],
    })
  ) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  // Direct internal-path access: pass through but remember the store so that
  // subsequent clean-URL navigation stays on the same tenant in dev. In
  // production this path is an authenticated admin-preview capability only;
  // public traffic still receives the same fail-closed 404.
  if (pathname === "/s" || pathname.startsWith("/s/")) {
    const hasVerifiedAdminSession = isAdminSessionTokenValid(
      request.cookies.get(ADMIN_COOKIE_NAME)?.value
    );
    if (
      !allowInternalStorePath({
        isProduction,
        hasVerifiedAdminSession,
      })
    ) {
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
  // The checked-in map is a development convenience only. Production uses
  // the Domain table as the single routing authority.
  const staticHostStore = isProduction ? null : resolveStoreSlugFromHost(host);
  const hostStore = await resolveMiddlewareHostStore({
    isProduction,
    host,
    staticStore: staticHostStore,
    resolveProductionHost: async (hostname) => {
      // Node.js middleware permits the existing Prisma-backed resolver. Keep
      // it lazy so development never initializes the database from middleware.
      const { resolveStoreSlugFromHostname } = await import(
        "@/lib/tenant/resolve-tenant"
      );
      return resolveStoreSlugFromHostname(hostname, {
        requireLive: true,
        databaseAuthority: true,
      });
    },
  });
  const cookieStore = request.cookies.get(STORE_COOKIE)?.value ?? null;

  const decision = selectEdgeTenant({
    isProduction,
    hostStore,
    queryStore,
    cookieStore,
    defaultStore: DEFAULT_STORE_SLUG,
  });
  if (decision.kind === "NOT_FOUND") {
    // Unknown hosts and resolver outages intentionally share the same public
    // 404 response: neither may fall through to a default or another tenant.
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
  runtime: "nodejs",
};
