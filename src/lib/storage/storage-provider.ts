import { LocalStorageProvider } from "@/lib/storage/local-storage-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

export function getStorageProvider(): StorageProvider {
  const requested = process.env.MEDIA_STORAGE_PROVIDER ?? "local";
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (requested === "vercel-blob" || hasBlobToken) {
    return new VercelBlobStorageProvider();
  }

  if (process.env.NODE_ENV === "production" && requested !== "local") {
    throw new Error(
      "Production media ingestion requires BLOB_READ_WRITE_TOKEN or MEDIA_STORAGE_PROVIDER=local."
    );
  }

  return new LocalStorageProvider();
}

