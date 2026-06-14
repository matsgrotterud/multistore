/**
 * Curated product photography per commerce niche.
 *
 * Source photos are verified Unsplash IDs, downloaded once into
 * `public/catalog/{tag}/` by `npm run catalog:download` so storefronts
 * serve stable self-hosted URLs (required before AI enhancement / re-hosting
 * scraped supplier images).
 */

/** Verified Unsplash photo IDs — must return HTTP 200 before adding here. */
export const CATALOG_SOURCE_BY_TAG: Record<string, string[]> = {
  drone: [
    "1724406096690-9fdf908faa87",
    "1706380003139-7471c33ca2b2",
    "1581092160607-ee22621dd758",
    "1511707171634-5f897ff02aa9",
    "1516035069371-29a1b244cc32",
  ],
  fpv: [
    "1724406096690-9fdf908faa87",
    "1581092160607-ee22621dd758",
    "1706380003139-7471c33ca2b2",
  ],
  camera: [
    "1516035069371-29a1b244cc32",
    "1511707171634-5f897ff02aa9",
    "1526170375885-4d8ecf77b99f",
  ],
  battery: [
    "1526170375885-4d8ecf77b99f",
    "1560472354-b33ff0c44a43",
    "1527864550417-7fd91fc51a46",
  ],
  bamboo: [
    "1542601906990-b4d3fb778b09",
    "1556742049-0cfed4f6a45d",
    "1441974231531-c6227db76b6e",
  ],
  toothbrush: [
    "1542601906990-b4d3fb778b09",
    "1556742049-0cfed4f6a45d",
    "1526170375885-4d8ecf77b99f",
  ],
  eco: [
    "1542601906990-b4d3fb778b09",
    "1441974231531-c6227db76b6e",
    "1556742049-0cfed4f6a45d",
  ],
  office: [
    "1497366216548-37526070297c",
    "1586023492125-27b2c045efd7",
    "1527864550417-7fd91fc51a46",
    "1441986300917-64674bd600d8",
  ],
  ergonomic: [
    "1586023492125-27b2c045efd7",
    "1497366216548-37526070297c",
    "1527864550417-7fd91fc51a46",
  ],
  chair: [
    "1586023492125-27b2c045efd7",
    "1497366216548-37526070297c",
    "1485827404703-89b55fcc595e",
  ],
  desk: [
    "1497366216548-37526070297c",
    "1527864550417-7fd91fc51a46",
    "1441986300917-64674bd600d8",
  ],
  pet: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
    "1534528741775-53994a69daeb",
  ],
  grooming: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
  ],
  dog: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1534528741775-53994a69daeb",
  ],
  cat: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
  ],
  hiking: [
    "1551698618-1dfe5d97d256",
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
  ],
  backpack: [
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1551698618-1dfe5d97d256",
  ],
  camping: [
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
  ],
  poles: [
    "1551698618-1dfe5d97d256",
    "1506905925346-21bda4d32df4",
    "1470071459604-3b5ec3a7fe05",
  ],
  product: [
    "1523275335684-37898b6baf30",
    "1505740420928-5e560c06d30e",
    "1542291026-7eec264c27ff",
    "1560472354-b33ff0c44a43",
    "1556742049-0cfed4f6a45d",
  ],
};

export function unsplashPhotoUrl(photoId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

export function catalogPhotoPath(tag: string, fileIndex: number): string {
  const num = String(fileIndex + 1).padStart(2, "0");
  return `/catalog/${tag}/${num}.jpg`;
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Score photo tags against tokenized product text; return best-matching tag. */
export function matchPhotoTag(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let bestTag = "product";
  let bestScore = 0;

  for (const tag of Object.keys(CATALOG_SOURCE_BY_TAG)) {
    let score = 0;
    if (tokens.includes(tag)) score += 3;
    if (text.toLowerCase().includes(tag)) score += 2;
    for (const token of tokens) {
      if (tag.includes(token) || token.includes(tag)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTag = tag;
    }
  }

  return bestTag;
}

/** Pick self-hosted catalog paths for a product (stable per sku+slug seed). */
export function pickCatalogPaths(tag: string, seed: string, count: number): string[] {
  const poolTag = tag in CATALOG_SOURCE_BY_TAG ? tag : "product";
  const poolSize = CATALOG_SOURCE_BY_TAG[poolTag].length;
  const start = hashString(seed) % poolSize;
  const paths: string[] = [];

  for (let index = 0; index < count; index++) {
    const fileIndex = (start + index) % poolSize;
    paths.push(catalogPhotoPath(poolTag, fileIndex));
  }

  return [...new Set(paths)];
}
