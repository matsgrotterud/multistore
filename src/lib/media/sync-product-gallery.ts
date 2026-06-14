import { prisma } from "@/lib/db";

export async function syncProductGallery(productId: string): Promise<void> {
  const assets = await prisma.productMediaAsset.findMany({
    where: {
      productId,
      mediaType: "IMAGE",
      ingestionStatus: "STORED",
      storageUrl: { not: null },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (assets.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { mediaStatus: "NEEDS_ENHANCEMENT" },
    });
    return;
  }

  const primary = assets.find((asset) => asset.isPrimary) ?? assets[0];

  await prisma.$transaction([
    prisma.productImage.deleteMany({
      where: { productId, ingestionStatus: { not: "LEGACY" } },
    }),
    prisma.productImage.createMany({
      data: assets.map((asset, index) => ({
        productId,
        url: asset.storageUrl ?? asset.sourceUrl,
        alt: asset.alt,
        sortOrder: index,
        isPrimary: asset.id === primary.id,
        sourceUrl: asset.sourceUrl,
        storageKey: asset.storageKey,
        providerKey: asset.providerKey,
        externalId: asset.externalId,
        contentHash: asset.contentHash,
        width: asset.width,
        height: asset.height,
        contentType: asset.contentType,
        ingestionStatus: asset.ingestionStatus,
      })),
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl: primary.storageUrl ?? primary.sourceUrl,
        imageAlt: primary.alt,
        mediaStatus: assets.length >= 2 ? "OK" : "NEEDS_ENHANCEMENT",
      },
    }),
  ]);
}

