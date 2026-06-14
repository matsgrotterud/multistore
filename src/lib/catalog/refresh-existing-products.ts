import { prisma } from "@/lib/db";

export async function markStaleSupplierProducts(storeId: string, olderThanDays = 2): Promise<number> {
  const threshold = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await prisma.product.updateMany({
    where: {
      storeId,
      providerKey: { not: null },
      OR: [{ lastSupplierSyncAt: null }, { lastSupplierSyncAt: { lt: threshold } }],
    },
    data: { qualityStatus: "NEEDS_REVIEW" },
  });
  return result.count;
}

