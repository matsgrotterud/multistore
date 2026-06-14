import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncSupplierImagesForAllStores } from "@/lib/suppliers/sync-supplier-images";

/**
 * Daily cron: re-scrape supplier images for every active store.
 * Protected by CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
 *
 * vercel.json:
 *   { "crons": [{ "path": "/api/cron/sync-supplier-catalog", "schedule": "0 4 * * *" }] }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "1500");
  const limitPerStore = Number(process.env.SUPPLIER_SYNC_LIMIT_PER_STORE ?? "50");

  try {
    const batches = await syncSupplierImagesForAllStores(prisma, { delayMs, limitPerStore });
    const summary = batches.map((batch) => ({
      store: batch.storeSlug,
      updated: batch.results.filter((result) => result.imageCount > 0).length,
      total: batch.results.length,
      errors: batch.results.filter((result) => result.error).length,
    }));

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      stores: summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
