import { LocalStorageProvider } from "@/lib/storage/local-storage-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

export function getStorageProvider(): StorageProvider {
  const requested = process.env.MEDIA_STORAGE_PROVIDER;
  const hasBlobAuth = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL
  );

  if (requested === "vercel-blob" || (!requested && hasBlobAuth)) {
    return new VercelBlobStorageProvider();
  }

  if (process.env.NODE_ENV === "production" && requested !== "local") {
    throw new Error(
      "Production media ingestion requires Vercel Blob auth or MEDIA_STORAGE_PROVIDER=local."
    );
  }

  return new LocalStorageProvider();
}
