"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/lib/actions/admin";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
