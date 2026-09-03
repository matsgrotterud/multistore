"use client";

import { useActionState } from "react";
import {
  runCatalogShadowRefreshJobAction,
} from "@/lib/actions/admin-catalog-autopilot";
import type { CatalogAutopilotManualRunState } from "@/lib/admin/catalog-autopilot-manual-run";

const INITIAL_STATE: CatalogAutopilotManualRunState = {
  status: "idle",
  message: null,
};

export function RunCatalogAutopilotJobForm({
  jobId,
  runnable,
  waiting,
}: {
  jobId: string;
  runnable: boolean;
  waiting: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    runCatalogShadowRefreshJobAction,
    INITIAL_STATE
  );

  return (
    <div className="space-y-2">
      {runnable ? (
        <form action={formAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <button type="submit" className="btn-secondary" disabled={isPending}>
            {isPending ? "Running selected job…" : "Run this job"}
          </button>
        </form>
      ) : (
        <span className="text-slate-400">{waiting ? "Waiting" : "—"}</span>
      )}
      {state.message ? (
        <p
          role={state.status === "not-runnable" ? "alert" : "status"}
          className={`max-w-72 whitespace-normal rounded-md border px-2 py-1.5 text-[10px] leading-4 ${noticeClass(state.status)}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function noticeClass(status: CatalogAutopilotManualRunState["status"]): string {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-900";
}
