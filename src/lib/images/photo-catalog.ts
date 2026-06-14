/**
 * Curated Unsplash photo IDs grouped by commerce niche tags.
 * Each ID is used as: https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=800&h=800&q=80
 *
 * Replace with scraped supplier URLs once the import pipeline is wired to
 * Ali/Temu/eBay adapters; keep these as fallbacks when scrape fails.
 */

export const UNSPLASH_PHOTOS_BY_TAG: Record<string, string[]> = {
  drone: [
    "1473968512647-3edb047325b9",
    "1508617349838-50600750fdc4",
    "1581091228775-ef9b1f878663",
    "1511707171634-5f897ff02aa9",
    "1524143989755-3154c9f47c86",
  ],
  fpv: [
    "1581092160607-ee22621dd758",
    "1524143989755-3154c9f47c86",
    "1473968512647-3edb047325b9",
  ],
  camera: [
    "1516035069371-29a1b244cc32",
    "1511707171634-5f897ff02aa9",
    "1502920917128-1aa500764b81",
  ],
  battery: [
    "1609091839311-03d0f8f0e239",
    "1581091228775-ef9b1f878663",
  ],
  bamboo: [
    "1607613009820-a38f781a5630",
    "1559591935-cfe9c39b2a36",
    "1522335789203-aabd1fc0544c",
  ],
  toothbrush: [
    "1607613009820-a38f781a5630",
    "1559591935-cfe9c39b2a36",
    "1522337360788-8b13bef204ed",
  ],
  eco: [
    "1542601906990-b4d3fb778b09",
    "1522335789203-aabd1fc0544c",
    "1559591935-cfe9c39b2a36",
  ],
  office: [
    "1586023492125-27b2c045efd7",
    "1541557536629-80da8773714c",
    "1497366216548-37526070297c",
  ],
  ergonomic: [
    "1541557536629-80da8773714c",
    "1586023492125-27b2c045efd7",
    "1592078619762-3c2a6d2550d8",
  ],
  chair: [
    "1586023492125-27b2c045efd7",
    "1541557536629-80da8773714c",
  ],
  desk: [
    "1497366216548-37526070297c",
    "1592078619762-3c2a6d2550d8",
  ],
  pet: [
    "1583339795763-f0a775bd6949",
    "1516734212188-a067f81ed577",
    "1601758228041-f3b2795255f1",
  ],
  grooming: [
    "1583511655852-d9633eaa0ae2",
    "1601758228041-f3b2795255f1",
    "1516734212188-a067f81ed577",
  ],
  dog: [
    "1583339795763-f0a775bd6949",
    "1516734212188-a067f81ed577",
  ],
  cat: [
    "1514884799127-4eb4c7f4a3f4",
    "1601758228041-f3b2795255f1",
  ],
  hiking: [
    "1551698618-1dfe5d97d256",
    "1478131141031-14418a10a092",
    "1504280390360-397f6f983f58",
  ],
  backpack: [
    "1553062407-98aebc8fa20f",
    "1622260614693-aa1e213375f3",
    "1478131141031-14418a10a092",
  ],
  camping: [
    "1504280390360-397f6f983f58",
    "1478131141031-14418a10a092",
    "1523987351523-f7d1479a3a5e",
  ],
  poles: [
    "1551698618-1dfe5d97d256",
    "1478131141031-14418a10a092",
  ],
  product: [
    "1523275335684-37898b6baf30",
    "1560343090-d0404922a906",
    "1542291026-7eec264c27ff",
    "1505740420928-5e560c06d30e",
  ],
};

export function unsplashPhotoUrl(photoId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
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

  for (const tag of Object.keys(UNSPLASH_PHOTOS_BY_TAG)) {
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

export function pickPhotoIds(tag: string, seed: string, count: number): string[] {
  const pool = UNSPLASH_PHOTOS_BY_TAG[tag] ?? UNSPLASH_PHOTOS_BY_TAG.product;
  const start = hashString(seed) % pool.length;
  const ids: string[] = [];
  for (let index = 0; index < count; index++) {
    ids.push(pool[(start + index) % pool.length]);
  }
  return [...new Set(ids)];
}
