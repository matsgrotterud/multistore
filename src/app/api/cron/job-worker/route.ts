import { NextResponse } from "next/server";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  const summary = await runQueuedCatalogJobs({
    batchSize: Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20),
    timeboxMs: 25_000,
    workerId: "cron-job-worker",
  });
  const completelyFailed = summary.failed > 0 && summary.succeeded === 0;
  return NextResponse.json(
    { ok: !completelyFailed, summary },
    { status: completelyFailed ? 503 : 200 }
  );
}
