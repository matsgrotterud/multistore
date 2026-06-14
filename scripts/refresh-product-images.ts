import { PrismaClient } from "@prisma/client";
import { syncSupplierImagesForAllStores } from "../src/lib/suppliers/sync-supplier-images";

/**
 * @deprecated Use provider-backed catalog jobs. This shim does not fetch marketplace pages.
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.warn("db:refresh-images is deprecated. Running sync:supplier-images instead...");
  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "1500");
  const batches = await syncSupplierImagesForAllStores(prisma, { delayMs });
  let total = 0;
  for (const batch of batches) {
    total += batch.results.filter((result) => result.imageCount > 0).length;
  }
  console.log(`Updated ${total} products through the legacy image shim.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
