import { PrismaClient } from "@prisma/client";
import { syncProductImages } from "../src/lib/images/sync-product-images";
import { parseStringArray } from "../src/lib/utils/json";

/**
 * Refresh all product images to curated photographic URLs + gallery rows.
 * Safe to re-run — does not delete products or change copy.
 *
 *   npm run db:refresh-images
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    include: { store: { select: { niche: true } } },
  });

  let updated = 0;
  for (const product of products) {
    await syncProductImages(prisma, product.id, {
      title: product.title,
      subtitle: product.subtitle,
      slug: product.slug,
      sku: product.sku,
      niche: product.store.niche,
      brand: product.brand,
      keywords: parseStringArray(product.useCases),
    });
    updated += 1;
  }

  console.log(`Refreshed images for ${updated} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
