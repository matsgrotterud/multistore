import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold">Admin login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the value of <code className="rounded bg-slate-100 px-1">ADMIN_PASSWORD</code>{" "}
        from your environment.
      </p>
      <div className="mt-5">
        <AdminLoginForm />
      </div>
    </div>
  );
}
