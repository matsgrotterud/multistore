import fs from "node:fs/promises";
import path from "node:path";
import {
  CATALOG_SOURCE_BY_TAG,
  unsplashPhotoUrl,
} from "../src/lib/images/photo-catalog";

/**
 * Download verified catalog photos into public/catalog/{tag}/NN.jpg
 *
 *   npm run catalog:download
 */

const ROOT = path.join(process.cwd(), "public", "catalog");

async function downloadTag(tag: string, photoIds: string[]): Promise<number> {
  const dir = path.join(ROOT, tag);
  await fs.mkdir(dir, { recursive: true });

  let saved = 0;
  for (let index = 0; index < photoIds.length; index++) {
    const photoId = photoIds[index];
    const fileName = `${String(index + 1).padStart(2, "0")}.jpg`;
    const filePath = path.join(dir, fileName);
    const url = unsplashPhotoUrl(photoId, 800, 800);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${tag}/${fileName} (${photoId}): HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    saved += 1;
    console.log(`  ✓ ${tag}/${fileName}`);
  }

  return saved;
}

async function main(): Promise<void> {
  let total = 0;
  for (const [tag, photoIds] of Object.entries(CATALOG_SOURCE_BY_TAG)) {
    console.log(`Downloading ${tag} (${photoIds.length} images)...`);
    total += await downloadTag(tag, photoIds);
  }
  console.log(`\nSaved ${total} catalog images to public/catalog/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
