import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shared admin-session primitives for server components and Node middleware.
 * This module deliberately has no dependency on next/headers so middleware can
 * validate the signed cookie before exposing an internal preview route.
 */

export const ADMIN_COOKIE_NAME = "msdf_admin" as const;

export interface AdminAuthEnvironment {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  NODE_ENV?: string;
}

interface AdminAuthConfig {
  password: string;
  sessionSecret: string;
}

function adminAuthConfig(
  environment: AdminAuthEnvironment = process.env
): AdminAuthConfig | null {
  const password = environment.ADMIN_PASSWORD?.trim() ?? "";
  if (password.length < 12 || password.toLowerCase() === "changeme") {
    return null;
  }

  const configuredSecret = environment.ADMIN_SESSION_SECRET?.trim() ?? "";
  if (environment.NODE_ENV === "production" && configuredSecret.length < 32) {
    return null;
  }

  return {
    password,
    // Development can use one secret to keep localhost setup light. Production
    // requires separation so a leaked cookie token does not disclose a password verifier.
    sessionSecret: configuredSecret || password,
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function expectedToken(config: AdminAuthConfig): string {
  return createHmac("sha256", config.sessionSecret)
    .update(`msdf-admin-session:${config.password}`)
    .digest("hex");
}

/** Return the opaque signed session token, or null when auth is misconfigured. */
export function createAdminSessionToken(
  environment: AdminAuthEnvironment = process.env
): string | null {
  const config = adminAuthConfig(environment);
  return config ? expectedToken(config) : null;
}

/** Validate a cookie value cryptographically; mere cookie presence is never enough. */
export function isAdminSessionTokenValid(
  token: string | null | undefined,
  environment: AdminAuthEnvironment = process.env
): boolean {
  const expected = createAdminSessionToken(environment);
  return Boolean(token && expected && safeEqual(token, expected));
}

export function isAdminPasswordValid(
  password: string,
  environment: AdminAuthEnvironment = process.env
): boolean {
  const config = adminAuthConfig(environment);
  return Boolean(config && safeEqual(password, config.password));
}

export function isAdminAuthEnvironmentConfigured(
  environment: AdminAuthEnvironment = process.env
): boolean {
  return adminAuthConfig(environment) !== null;
}
