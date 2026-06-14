import type { PrismaClient } from "@prisma/client";
import { resolveProductImages } from "@/lib/images/resolve-product-images";

type DbClient = Pick<PrismaClient, "product" | "productImage" | "store">;

/**
 * Write resolved images onto a product: updates imageUrl/imageAlt and rebuilds
 * ProductImage gallery rows (used by seed, refresh script and import pipeline).
 */
export async function syncProductImages(
  db: DbClient,
  productId: string,
  options: {
    title: string;
    subtitle?: string;
    slug: string;
    sku: string;
    niche: string;
    brand?: string;
    keywords?: string[];
  }
): Promise<{ primaryUrl: string; galleryCount: number }> {
  const resolved = resolveProductImages(options);

  await db.productImage.deleteMany({ where: { productId } });

  await db.productImage.createMany({
    data: resolved.galleryUrls.map((url, index) => ({
      productId,
      url,
      alt: index === 0 ? resolved.primaryAlt : `${resolved.primaryAlt} — view ${index + 1}`,
      sortOrder: index,
      isPrimary: index === 0,
    })),
  });

  await db.product.update({
    where: { id: productId },
    data: {
      imageUrl: resolved.primaryUrl,
      imageAlt: resolved.primaryAlt,
    },
  });

  return { primaryUrl: resolved.primaryUrl, galleryCount: resolved.galleryUrls.length };
}
