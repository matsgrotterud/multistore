import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CORE_TABLES, getSanitizedDatabaseTarget } from "@/lib/db/env-sanitize";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const target = getSanitizedDatabaseTarget();

  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC
    `;
    const tables = rows.map((row) => row.tablename);
    const hasStoreTable = tables.includes("Store");
    const hasProductTable = tables.includes("Product");

    let storeCount: number | null = null;
    let productCount: number | null = null;

    if (hasStoreTable) {
      storeCount = await prisma.store.count();
    }
    if (hasProductTable) {
      productCount = await prisma.product.count();
    }

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV ?? null,
      vercel: process.env.VERCEL ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      database: {
        host: target.host,
        pathname: target.pathname,
        isPooler: target.isPooler,
        redacted: target.redacted,
      },
      tables,
      coreTables: Object.fromEntries(CORE_TABLES.map((table) => [table, tables.includes(table)])),
      hasStoreTable,
      storeCount,
      productCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        nodeEnv: process.env.NODE_ENV ?? null,
        vercel: process.env.VERCEL ?? null,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        database: {
          host: target.host,
          pathname: target.pathname,
          isPooler: target.isPooler,
          redacted: target.redacted,
        },
        error: error instanceof Error ? error.message : "Database probe failed",
        hasStoreTable: false,
        storeCount: null,
        productCount: null,
      },
      { status: 500 }
    );
  }
}
