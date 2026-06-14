"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export interface ImageActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Keep Product.imageUrl/imageAlt mirroring the primary ProductImage so product
 * cards, JSON-LD and the Merchant feed stay correct without each consumer
 * needing to know about the gallery. Guarantees exactly one primary image.
 */
async function syncPrimaryImage(productId: string): Promise<void> {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  if (images.length === 0) return;

  let primary = images.find((image) => image.isPrimary);
  if (!primary) {
    primary = images[0];
    await prisma.productImage.update({
      where: { id: primary.id },
      data: { isPrimary: true },
    });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { imageUrl: primary.url, imageAlt: primary.alt },
  });
}

/** Verify the image belongs to a product in the named store; returns productId. */
async function authorizeImage(
  imageId: string,
  storeSlug: string
): Promise<string | null> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: { select: { storeId: true, store: { select: { slug: true } } } } },
  });
  if (!image || image.product.store.slug !== storeSlug) return null;
  return image.productId;
}

function revalidateStore(storeSlug: string): void {
  revalidatePath(`/s/${storeSlug}`, "layout");
}

export async function addProductImageAction(input: {
  productId: string;
  storeSlug: string;
  url: string;
  alt: string;
}): Promise<ImageActionResult> {
  await requireAdmin();

  const product = await prisma.product.findFirst({
    where: { id: input.productId, store: { slug: input.storeSlug } },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Product not found." };
  if (!input.url) return { ok: false, error: "Missing image URL." };

  const count = await prisma.productImage.count({ where: { productId: product.id } });
  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: input.url,
      alt: input.alt,
      sortOrder: count,
      isPrimary: count === 0,
    },
  });

  await syncPrimaryImage(product.id);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function updateProductImageAltAction(input: {
  imageId: string;
  storeSlug: string;
  alt: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.productImage.update({
    where: { id: input.imageId },
    data: { alt: input.alt },
  });
  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function setPrimaryProductImageAction(input: {
  imageId: string;
  storeSlug: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: input.imageId },
      data: { isPrimary: true },
    }),
  ]);
  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function deleteProductImageAction(input: {
  imageId: string;
  storeSlug: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.productImage.delete({ where: { id: input.imageId } });

  // Re-pack sortOrder so reordering stays predictable.
  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((image, index) =>
      prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: index } })
    )
  );

  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function moveProductImageAction(input: {
  imageId: string;
  storeSlug: string;
  direction: "up" | "down";
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const index = images.findIndex((image) => image.id === input.imageId);
  const swapWith = input.direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= images.length) {
    return { ok: true }; // already at the edge — no-op
  }

  const a = images[index];
  const b = images[swapWith];
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.productImage.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}
