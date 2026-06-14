import { PrismaClient } from "@prisma/client";
import {
  syncSupplierImagesForAllStores,
  syncSupplierImagesForStore,
} from "../src/lib/suppliers/sync-supplier-images";

/**
 * Scrape supplier listing images for all products and store CDN URLs in the DB.
 * Safe to re-run daily — does not touch product copy or pricing.
 *
 *   npm run sync:supplier-images
 *   npm run sync:supplier-images -- --store=pet-grooming
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const storeSlug = storeArg?.split("=")[1];
  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "1500");

  if (storeSlug) {
    console.log(`Syncing supplier images for store: ${storeSlug}`);
    const results = await syncSupplierImagesForStore(prisma, storeSlug, { delayMs });
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
  console.log(`\nDone. ${totalOk}/${totalProducts} products now have scraped supplier images.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
