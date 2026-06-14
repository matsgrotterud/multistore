import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Quick DB connectivity check for Vercel/Neon debugging.
 * Open /api/health after deploy — does not expose secrets.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const usesPooler = process.env.DATABASE_URL?.includes("-pooler") ?? false;
  const looksLikeSqlite = process.env.DATABASE_URL?.startsWith("file:") ?? false;

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not set in this environment.",
        hint: "Add it in Vercel → Settings → Environment Variables → Redeploy.",
      },
      { status: 503 }
    );
  }

  if (looksLikeSqlite) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL points to SQLite (file:...) — Vercel requires Postgres.",
        hint: "Paste your Neon pooled connection string in Vercel env vars.",
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const storeCount = await prisma.store.count();
    return NextResponse.json({
      ok: true,
      storeCount,
      usesPooler,
      hint:
        storeCount === 0
          ? "DB connects but is empty — run `npx prisma db push` and `npm run db:seed` against Neon locally."
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        usesPooler,
        hints: [
          "Run `npx prisma db push` with DIRECT_URL + DATABASE_URL against your Neon project.",
          "On Vercel, DATABASE_URL should be the Neon *pooled* string (host contains -pooler).",
          "Ensure ?sslmode=require is on the connection string.",
        ],
      },
      { status: 503 }
    );
  }
}
