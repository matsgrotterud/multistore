import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdmin();
  const summary = await runQueuedCatalogJobs({ workerId: "admin-run-jobs" });
  return NextResponse.json({ ok: true, summary });
}

