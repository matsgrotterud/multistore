export const PRODUCT_IMAGE_FALLBACK = "/api/placeholder?label=Product%20image";

/** Root-relative URLs are first-party; protocol-relative supplier URLs are not. */
export function isFirstPartyMediaUrl(url: string | null | undefined): boolean {
  const value = url?.trim() ?? "";
  return value.startsWith("/") && !value.startsWith("//");
}

/**
 * Select only media with durable storage provenance. The denormalized
 * Product.imageUrl is accepted as a fallback only when it is first-party.
 */
export function selectPublicProductImage(input: {
  productImageUrl?: string | null;
  storedAssetUrls?: Array<string | null | undefined>;
  storedGalleryUrls?: Array<string | null | undefined>;
  fallbackUrl?: string;
}): string {
  for (const value of [
    ...(input.storedAssetUrls ?? []),
    ...(input.storedGalleryUrls ?? []),
  ]) {
    if (value?.trim()) return value.trim();
  }
  if (isFirstPartyMediaUrl(input.productImageUrl)) {
    return input.productImageUrl!.trim();
  }
  return input.fallbackUrl ?? PRODUCT_IMAGE_FALLBACK;
}
