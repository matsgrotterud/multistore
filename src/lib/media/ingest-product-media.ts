import { prisma } from "@/lib/db";
import { fetchMedia } from "@/lib/media/fetch-media";
import { syncProductGallery } from "@/lib/media/sync-product-gallery";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import {
  assertSafeMediaWriteContext,
  isLocalDevMediaUrl,
} from "@/lib/storage/media-storage-safety";
import type { SupplierMedia } from "@/lib/suppliers/providers/types";

export interface IngestProductMediaInput {
  productId?: string;
  candidateId?: string;
  providerKey?: string;
  externalId?: string;
  title: string;
  media: SupplierMedia[];
}

export interface IngestProductMediaResult {
  stored: number;
  failed: number;
  skipped: number;
}

export async function ingestProductMedia(
  input: IngestProductMediaInput
): Promise<IngestProductMediaResult> {
  if (!input.productId && !input.candidateId) {
    throw new Error("ingestProductMedia requires productId or candidateId.");
  }

  // Backstop: never write local /uploads/dev-media URLs into a remote DB. The
  // admin generator also preflights this, but this protects direct/script paths.
  assertSafeMediaWriteContext();

  const storage = getStorageProvider();
  const result: IngestProductMediaResult = { stored: 0, failed: 0, skipped: 0 };
  const sortedMedia = [...input.media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const [index, item] of sortedMedia.entries()) {
    try {
      const existingForTarget = await prisma.productMediaAsset.findFirst({
        where: {
          sourceUrl: item.url,
          ...(input.productId ? { productId: input.productId } : {}),
          ...(input.candidateId ? { candidateId: input.candidateId } : {}),
        },
      });
      if (existingForTarget?.ingestionStatus === "STORED") {
        result.skipped += 1;
        continue;
      }

      const fetched = await fetchMedia(item.url);
      const existingByHash = await prisma.productMediaAsset.findFirst({
        where: {
          contentHash: fetched.contentHash,
          storageUrl: { not: null },
          ingestionStatus: "STORED",
        },
        orderBy: { createdAt: "asc" },
      });

      // Reuse an existing identical asset to avoid re-uploading — EXCEPT when it
      // points at local dev media (`/uploads/dev-media/...`) while the active
      // provider is not local. Reusing it would copy a machine-only URL into a
      // remote/Blob-backed DB and break live images. In that case re-store fresh.
      const canReuse =
        existingByHash != null &&
        !(isLocalDevMediaUrl(existingByHash.storageUrl) && storage.name !== "local");

      const storageKey = canReuse
        ? existingByHash!.storageKey ?? `media/${fetched.contentHash}.${fetched.extension}`
        : `media/${fetched.contentHash}.${fetched.extension}`;
      const storageUrl = canReuse
        ? existingByHash!.storageUrl!
        : (
            await storage.putObject({
              key: storageKey,
              body: fetched.body,
              contentType: fetched.contentType,
            })
          ).url;

      await prisma.productMediaAsset.create({
        data: {
          productId: input.productId,
          candidateId: input.candidateId,
          providerKey: input.providerKey,
          externalId: input.externalId,
          mediaType: item.mediaType ?? fetched.mediaType,
          sourceUrl: item.url,
          storageUrl,
          storageKey,
          thumbnailUrl: item.thumbnailUrl,
          alt: item.alt ?? `${input.title} image ${index + 1}`,
          sortOrder: item.sortOrder ?? index,
          isPrimary: index === 0,
          width: item.width,
          height: item.height,
          contentType: fetched.contentType,
          contentHash: fetched.contentHash,
          fileSize: fetched.fileSize,
          ingestionStatus: "STORED",
        },
      });
      result.stored += 1;
    } catch (error) {
      await prisma.productMediaAsset.create({
        data: {
          productId: input.productId,
          candidateId: input.candidateId,
          providerKey: input.providerKey,
          externalId: input.externalId,
          mediaType: item.mediaType ?? "IMAGE",
          sourceUrl: item.url,
          thumbnailUrl: item.thumbnailUrl,
          alt: item.alt ?? `${input.title} image ${index + 1}`,
          sortOrder: item.sortOrder ?? index,
          isPrimary: index === 0,
          ingestionStatus: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown media ingestion error",
        },
      });
      result.failed += 1;
    }
  }

  if (input.productId) {
    await syncProductGallery(input.productId);
  }

  return result;
}
