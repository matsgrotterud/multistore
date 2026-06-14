import { PrismaClient } from "@prisma/client";
import {
  syncSupplierImagesForAllStores,
  syncSupplierImagesForStore,
} from "../src/lib/suppliers/sync-supplier-images";

/**
 * Deprecated legacy image sync shim.
 * Runtime supplier media now flows through provider adapters and catalog jobs.
 *
 *   npm run sync:supplier-images
 *   npm run sync:supplier-images -- --store=pet-grooming
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const storeSlug = storeArg?.split("=")[1];
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "800");

  if (storeSlug) {
    console.log(`Syncing supplier images for store: ${storeSlug}${limit ? ` (limit ${limit})` : ""}`);
    const results = await syncSupplierImagesForStore(prisma, storeSlug, { delayMs, limit });
    const ok = results.filter((result) => result.imageCount > 0).length;
    console.log(`Updated ${ok}/${results.length} products.`);
    for (const result of results) {
      if (result.error) {
        console.warn(`  ✗ ${result.slug}: ${result.error}`);
      } else {
        console.log(`  ✓ ${result.slug}: ${result.imageCount} images`);
      }
    }
    return;
  }

  console.log("Syncing supplier images for all active stores...");
  const batches = await syncSupplierImagesForAllStores(prisma, { delayMs, limitPerStore: 999 });
  let totalOk = 0;
  let totalProducts = 0;
  for (const batch of batches) {
    const ok = batch.results.filter((result) => result.imageCount > 0).length;
    totalOk += ok;
    totalProducts += batch.results.length;
    console.log(`  ${batch.storeSlug}: ${ok}/${batch.results.length} products updated`);
  }
  console.log(`\nDone. ${totalOk}/${totalProducts} products updated by legacy image shim.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
