import {
  hashString,
  matchPhotoTag,
  pickPhotoIds,
  unsplashPhotoUrl,
} from "@/lib/images/photo-catalog";
import type { ResolveProductImagesInput, ResolvedProductImages } from "@/lib/images/types";

/**
 * Resolve a primary image + gallery for a product.
 * Uses scraped URLs when present; otherwise picks niche-matched stock photography.
 */
export function resolveProductImages(input: ResolveProductImagesInput): ResolvedProductImages {
  const primaryAlt = buildImageAlt(input);

  if (input.scrapedImages && input.scrapedImages.length > 0) {
    const sorted = [...input.scrapedImages].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const urls = sorted.map((image) => image.url).filter(Boolean);
    return {
      primaryUrl: urls[0],
      primaryAlt,
      galleryUrls: urls.slice(0, 4),
      sourceKind: "scraped",
      sourceUrls: urls,
    };
  }

  const searchText = [
    input.niche,
    input.title,
    input.subtitle,
    input.brand,
    ...(input.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const tag = matchPhotoTag(searchText);
  const photoIds = pickPhotoIds(tag, `${input.sku}-${input.slug}`, 3);
  const galleryUrls = photoIds.map((id) => unsplashPhotoUrl(id));

  return {
    primaryUrl: galleryUrls[0],
    primaryAlt,
    galleryUrls,
    sourceKind: "curated",
  };
}

export function buildImageAlt(input: Pick<ResolveProductImagesInput, "title" | "subtitle" | "brand">): string {
  const parts = [input.title, input.subtitle, input.brand ? `by ${input.brand}` : ""]
    .filter(Boolean)
    .join(" — ");
  return parts.slice(0, 180);
}

/** Stable variation index 0..n for A/B image tests or multi-angle placeholders. */
export function imageVariantIndex(seed: string, modulo: number): number {
  return hashString(seed) % modulo;
}
