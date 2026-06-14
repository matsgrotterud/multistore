import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { adminLogoutAction } from "@/lib/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | Multi-Store Dropship Factory",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-extrabold tracking-tight">
            MSDF <span className="font-normal text-slate-500">Admin</span>
          </Link>
          {authenticated && (
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 underline hover:text-slate-900"
              >
                Log out
              </button>
            </form>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[180px_1fr]">
        {authenticated && (
          <aside className="mb-6 lg:mb-0">
            <AdminNav />
          </aside>
        )}
        <main className={authenticated ? "" : "lg:col-span-2"}>{children}</main>
      </div>
    </div>
  );
}
