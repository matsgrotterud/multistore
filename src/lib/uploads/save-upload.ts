import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Local image upload helper. In development (and simple single-server
 * deployments) uploads are written under public/uploads/<storeSlug>/ and served
 * statically. For multi-instance production, swap the body of `saveUpload` for
 * an S3/R2 put and return the CDN URL — the call sites and return shape stay
 * the same.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export interface SaveUploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export async function saveUpload(
  file: File,
  storeSlug: string
): Promise<SaveUploadResult> {
  const safeSlug = sanitizeSlug(storeSlug);
  if (!safeSlug) return { ok: false, error: "Invalid store." };

  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return { ok: false, error: "Unsupported image type. Use PNG, JPEG, WebP, GIF or AVIF." };
  }
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is larger than 5 MB." };
  }

  const directory = path.join(process.cwd(), "public", "uploads", safeSlug);
  await mkdir(directory, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);

  return { ok: true, url: `/uploads/${safeSlug}/${filename}` };
}
