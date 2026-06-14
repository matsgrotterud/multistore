import { prisma } from "@/lib/db";

export async function publishProductIfReady(productId: string): Promise<{ published: boolean; reason?: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { mediaAssets: true },
  });
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const imageCount = product.mediaAssets.filter(
    (asset) => asset.mediaType === "IMAGE" && asset.ingestionStatus === "STORED"
  ).length;

  if (product.qualityStatus !== "READY") {
    return { published: false, reason: "Product qualityStatus is not READY." };
  }
  if (imageCount < 3 && product.mediaStatus !== "OK") {
    return { published: false, reason: "Product media is incomplete." };
  }
  if (!product.sourceUrl || !product.externalId) {
    return { published: false, reason: "Missing supplier source info." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { isPublished: true, noindex: false },
  });
  return { published: true };
}

