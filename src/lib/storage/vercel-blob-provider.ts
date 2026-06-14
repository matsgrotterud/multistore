import { list, put } from "@vercel/blob";
import type { PutObjectInput, StorageProvider, StoredObject } from "@/lib/storage/types";

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob" as const;

  constructor(private readonly token = process.env.BLOB_READ_WRITE_TOKEN) {
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required for Vercel Blob storage.");
    }
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const blob = await put(input.key, input.body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: input.contentType,
      token: this.token,
    });

    return { key: input.key, url: blob.url };
  }

  async existsByHash(hash: string): Promise<StoredObject | null> {
    const result = await list({
      prefix: `media/${hash}`,
      limit: 1,
      token: this.token,
    });
    const blob = result.blobs[0];
    return blob ? { key: blob.pathname, url: blob.url } : null;
  }

  publicUrl(key: string): string {
    return `https://blob.vercel-storage.com/${key}`;
  }
}

