import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { adminLogoutAction } from "@/lib/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | Multi-Store Dropship Factory",
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/generator", label: "Generator" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-extrabold tracking-tight">
              MSDF <span className="font-normal text-slate-500">Admin</span>
            </Link>
            {authenticated && (
              <nav aria-label="Admin">
                <ul className="flex items-center gap-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
