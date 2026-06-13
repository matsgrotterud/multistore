import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal admin protection for local/staging use: a session cookie holding a
 * salted hash of ADMIN_PASSWORD. Replace with a real auth provider before
 * exposing /admin on the public internet.
 */

const COOKIE_NAME = "msdf_admin";

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  return createHash("sha256").update(`msdf-admin:${password}`).digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === expectedToken();
}

/** Call at the top of every admin page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== (process.env.ADMIN_PASSWORD ?? "changeme")) {
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
