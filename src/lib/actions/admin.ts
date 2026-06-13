"use server";

import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/admin/auth";

export async function adminLoginAction(
  _previousState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = String(formData.get("password") ?? "");
  const ok = await loginAdmin(password);
  if (!ok) {
    return { error: "Wrong password." };
  }
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}
