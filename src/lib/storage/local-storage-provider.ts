import { promises as fs } from "node:fs";
import path from "node:path";
import type { PutObjectInput, StorageProvider, StoredObject } from "@/lib/storage/types";

const UPLOAD_PREFIX = "/uploads/dev-media";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;
  private readonly rootDir: string;

  constructor(rootDir = path.join(process.cwd(), "public", "uploads", "dev-media")) {
    this.rootDir = rootDir;
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const key = sanitizeKey(input.key);
    const fullPath = path.join(this.rootDir, key);
    if (!fullPath.startsWith(this.rootDir)) {
      throw new Error("Invalid storage key.");
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.body);

    return { key, url: this.publicUrl(key) };
  }

  async existsByHash(hash: string): Promise<StoredObject | null> {
    const safeHash = hash.replace(/[^a-f0-9]/gi, "");
    if (!safeHash) return null;
    const hit = await findFileByPrefix(this.rootDir, safeHash).catch(() => null);
    return hit ? { key: hit, url: this.publicUrl(hit) } : null;
  }

  publicUrl(key: string): string {
    return `${UPLOAD_PREFIX}/${sanitizeKey(key)}`;
  }
}

function sanitizeKey(key: string): string {
  return key
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

async function findFileByPrefix(rootDir: string, prefix: string): Promise<string | null> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const child = await findFileByPrefix(fullPath, prefix);
      if (child) return path.join(entry.name, child).replace(/\\/g, "/");
    } else if (entry.name.startsWith(prefix)) {
      return entry.name;
    }
  }
  return null;
}
