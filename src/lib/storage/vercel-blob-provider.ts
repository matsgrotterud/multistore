import { list, put } from "@vercel/blob";
import type { PutObjectInput, StorageProvider, StoredObject } from "@/lib/storage/types";

type BlobAuthOptions = {
  token?: string;
  oidcToken?: string;
  storeId?: string;
};

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob" as const;
  private readonly authOptions: BlobAuthOptions;

  constructor(authOptions = getVercelBlobAuthOptions()) {
    if (!hasVercelBlobAuth()) {
      throw new Error(
        "Vercel Blob storage requires BLOB_READ_WRITE_TOKEN, VERCEL_OIDC_TOKEN, or a Vercel runtime."
      );
    }
    this.authOptions = authOptions;
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const blob = await put(input.key, input.body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: input.contentType,
      ...this.authOptions,
    });

    return { key: input.key, url: blob.url };
  }

  async existsByHash(hash: string): Promise<StoredObject | null> {
    const result = await list({
      prefix: `media/${hash}`,
      limit: 1,
      ...this.authOptions,
    });
    const blob = result.blobs[0];
    return blob ? { key: blob.pathname, url: blob.url } : null;
  }

  publicUrl(key: string): string {
    const storeId = process.env.BLOB_STORE_ID?.trim().replace(/^store_/, "");
    if (storeId) {
      return `https://${storeId}.public.blob.vercel-storage.com/${key}`;
    }
    return key;
  }
}

export function getVercelBlobAuthOptions(): BlobAuthOptions {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) return { token };

  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  return {
    ...(oidcToken ? { oidcToken } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

export function hasVercelBlobAuth(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL
  );
}
