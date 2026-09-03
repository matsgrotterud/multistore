import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminAuthEnvironmentConfigured,
  isAdminPasswordValid,
  isAdminSessionTokenValid,
} from "./auth-token";

/**
 * Minimal password gate for local/staging operation. Production fails closed
 * unless both a strong password and a separate session secret are configured.
 * Replace this with an identity provider and per-user audit trail before a
 * multi-operator production launch.
 */

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isAdminSessionTokenValid(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value
  );
}

/** Call at the top of every admin page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (!isAdminPasswordValid(password)) return false;
  const token = createAdminSessionToken();
  if (!token) return false;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}

/** Read-only status for health/admin diagnostics; never returns secret values. */
export function isAdminAuthConfigured(): boolean {
  return isAdminAuthEnvironmentConfigured();
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
