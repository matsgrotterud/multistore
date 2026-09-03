import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { AuditEvidence } from "./types";

interface ReadOnlyRow {
  transaction_read_only: string;
}

export interface DatabaseAuditSnapshot {
  evidence: AuditEvidence[];
  counts: Record<string, number>;
}

/**
 * Collects aggregate evidence only. It refuses to query portfolio data unless
 * Postgres proves that the current transaction is read-only.
 */
export async function collectDatabaseEvidence(
  auditDatabaseUrl: string | undefined = process.env.AUDIT_DATABASE_URL
): Promise<DatabaseAuditSnapshot> {
  if (!auditDatabaseUrl) return unknownDatabaseSnapshot("AUDIT_DATABASE_URL is not configured.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: auditDatabaseUrl }),
    log: [],
  });

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const mode = await tx.$queryRaw<ReadOnlyRow[]>`SHOW transaction_read_only`;
      if (mode[0]?.transaction_read_only !== "on") {
        throw new Error("Database did not attest transaction_read_only=on.");
      }

      const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [
        storeCount,
        domainCount,
        productCount,
        orderCount,
        jobCount,
        stuckJobs,
        manualOrders,
        previewPublishedProducts,
        domains,
      ] = await Promise.all([
        tx.store.count(),
        tx.domain.count(),
        tx.product.count(),
        tx.order.count(),
        tx.catalogJob.count(),
        tx.catalogJob.count({
          where: { status: "RUNNING", lockedAt: { lt: staleBefore } },
        }),
        tx.order.count({ where: { fulfillmentStatus: "MANUAL_ACTION_REQUIRED" } }),
        tx.product.count({
          where: { isPublished: true, store: { launchStatus: { not: "LIVE" } } },
        }),
        tx.domain.findMany({ select: { hostname: true, store: { select: { slug: true } } } }),
      ]);

      const databaseRoutes = new Map<string, string>();
      const drift = new Set<string>();
      for (const domain of domains) {
        const normalized = normalizeHost(domain.hostname);
        if (normalized !== domain.hostname) drift.add(domain.hostname);
        const existing = databaseRoutes.get(normalized);
        if (existing && existing !== domain.store.slug) drift.add(normalized);
        databaseRoutes.set(normalized, domain.store.slug);
      }

      return {
        counts: {
          catalogJobs: jobCount,
          domains: domainCount,
          manualActionOrders: manualOrders,
          orders: orderCount,
          previewPublishedProducts,
          products: productCount,
          stores: storeCount,
          stuckRunningJobs: stuckJobs,
        },
        evidence: sortEvidence([
          pass("database.read-only-attested", true, "Postgres returned transaction_read_only=on."),
          pass(
            "database.no-stuck-jobs",
            stuckJobs === 0,
            `${stuckJobs} RUNNING catalog jobs have locks older than 24 hours.`
          ),
          pass(
            "database.no-manual-action-orders",
            manualOrders === 0,
            `${manualOrders} orders require manual fulfillment action.`
          ),
          pass(
            "database.no-preview-published-products",
            previewPublishedProducts === 0,
            `${previewPublishedProducts} published products belong to non-LIVE stores.`
          ),
          pass(
            "domain.no-routing-drift",
            drift.size === 0,
            `${drift.size} database hostnames are unnormalized or map ambiguously.`
          ),
        ]),
      };
    });
  } catch (error) {
    return unknownDatabaseSnapshot(
      `Read-only database attestation failed: ${safeError(error)}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

function pass(key: string, value: boolean, detail: string): AuditEvidence {
  return {
    key,
    state: value ? "PASS" : "FAIL",
    provenance: "VERIFIED",
    value,
    detail,
  };
}

function unknownDatabaseSnapshot(detail: string): DatabaseAuditSnapshot {
  const keys = [
    "database.no-manual-action-orders",
    "database.no-preview-published-products",
    "database.no-stuck-jobs",
    "database.read-only-attested",
    "domain.no-routing-drift",
  ];
  return {
    counts: {},
    evidence: keys.map((key) => ({
      key,
      state: "UNKNOWN" as const,
      provenance: "VERIFIED" as const,
      detail,
    })),
  };
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown database error";
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]").slice(0, 500);
}

function sortEvidence(evidence: AuditEvidence[]): AuditEvidence[] {
  return evidence.sort((left, right) =>
    left.key < right.key ? -1 : left.key > right.key ? 1 : 0
  );
}
