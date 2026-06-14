import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Deprecated scraping sync is disabled. Use /api/cron/catalog-sync for provider-backed catalog jobs.",
    },
    { status: 410 }
  );
}

