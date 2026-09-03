import type {
  StorefrontMediaV2,
  StorefrontProductV2,
} from "@/lib/catalog-v2/contracts";

export const REFERENCE_STORE_MEDIA_SOURCE_V2 =
  "openai-imagegen-synthetic-reference.v1" as const;

interface ReferenceMediaRegistryEntryV2 {
  productId: string;
  src: string;
  role: "PRIMARY" | "VARIANT";
  variantId: string | null;
}

const primaryEntries: ReadonlyArray<readonly [string, ReferenceMediaRegistryEntryV2]> = [
  ...[
    "aero-fold",
    "cinema-pro",
    "creator-fpv",
    "indoor-guard",
    "night-explorer",
    "scout-mini",
    "survey-long-range",
    "trail-mapper",
    "vista-4k",
    "wind-master",
  ].map((slug) => [
    `media:drones:${slug}:primary`,
    {
      productId: `product:drone:${slug}`,
      src: `/reference-store-factory-v2/drones/${slug}.webp`,
      role: "PRIMARY" as const,
      variantId: null,
    },
  ] as const),
  ...[
    ["ridge-trail-shoe", "navy"],
    ["harbor-shell-jacket", "moss"],
    ["meridian-base-layer", "berry"],
    ["coast-walk-sandal", "coral"],
  ].map(([slug, color]) => [
    `media:apparel:${slug}:primary`,
    {
      productId: `product:apparel:${slug}`,
      src: `/reference-store-factory-v2/apparel/${slug}-${color}.webp`,
      role: "PRIMARY" as const,
      variantId: null,
    },
  ] as const),
  ...[
    "fjord-roast-beans",
    "morning-filter-blend",
    "night-decaf-beans",
    "winter-reserve-beans",
  ].map((slug) => [
    `media:consumables:${slug}:primary`,
    {
      productId: `product:consumable:${slug}`,
      src: `/reference-store-factory-v2/consumables/${slug}.webp`,
      role: "PRIMARY" as const,
      variantId: null,
    },
  ] as const),
];

const apparelVariants = [
  { slug: "ridge-trail-shoe", sizes: ["38", "40", "42"], colors: ["navy", "sand"] },
  { slug: "harbor-shell-jacket", sizes: ["s", "m", "l"], colors: ["moss", "slate"] },
  { slug: "meridian-base-layer", sizes: ["s", "m", "l"], colors: ["berry", "graphite"] },
  { slug: "coast-walk-sandal", sizes: ["38", "40", "42"], colors: ["coral", "black"] },
] as const;

const variantEntries: ReadonlyArray<
  readonly [string, ReferenceMediaRegistryEntryV2]
> = apparelVariants.flatMap(({ slug, sizes, colors }) =>
  colors.flatMap((color) =>
    sizes.map((size) => {
      const variantId = `variant:apparel:${slug}:${size}-${color}`;
      return [
        `media:apparel:${slug}:${color}-${size}`,
        {
          productId: `product:apparel:${slug}`,
          src: `/reference-store-factory-v2/apparel/${slug}-${color}.webp`,
          role: "VARIANT" as const,
          variantId,
        },
      ] as const;
    })
  )
);

const mediaRegistry = new Map([...primaryEntries, ...variantEntries]);

export interface ResolvedReferenceStoreMediaV2 {
  src: string;
  mediaId: string;
  role: StorefrontMediaV2["role"];
  altText: string;
  width: number;
  height: number;
  focalPoint: StorefrontMediaV2["focalPoint"];
  variantIds: readonly string[];
  rights: "VERIFIED_SYNTHETIC";
  source: typeof REFERENCE_STORE_MEDIA_SOURCE_V2;
}

/**
 * Resolve only the reviewed local reference bundle. Unknown media deliberately
 * returns null so an admin preview never follows a provider or remote URL.
 */
export function resolveReferenceStoreMediaV2(
  product: StorefrontProductV2,
  media: StorefrontMediaV2
): ResolvedReferenceStoreMediaV2 | null {
  const registered = mediaRegistry.get(media.mediaId);
  const registeredVariant = registered?.variantId
    ? product.variants.find(
        (variant) =>
          variant.variantId === registered.variantId &&
          variant.mediaIds.includes(media.mediaId)
      )
    : null;
  if (
    !registered ||
    registered.productId !== product.productId ||
    registered.role !== media.role ||
    media.kind !== "IMAGE" ||
    typeof media.width !== "number" ||
    typeof media.height !== "number" ||
    media.width !== 1254 ||
    media.height !== 1254 ||
    !product.media.some((candidate) => candidate === media) ||
    (registered.variantId === null && media.variantIds.length !== 0) ||
    (registered.variantId !== null &&
      (!registeredVariant ||
        media.variantIds.length !== 1 ||
        media.variantIds[0] !== registered.variantId))
  ) {
    return null;
  }
  return {
    src: registered.src,
    mediaId: media.mediaId,
    role: media.role,
    altText: media.altText || product.title,
    width: media.width,
    height: media.height,
    focalPoint: media.focalPoint,
    variantIds: [...media.variantIds],
    rights: "VERIFIED_SYNTHETIC",
    source: REFERENCE_STORE_MEDIA_SOURCE_V2,
  };
}

/** Pick an explicitly bound variant image first, then the product primary. */
export function selectReferenceStoreMediaV2(
  product: StorefrontProductV2,
  variantId: string | null = null
): ResolvedReferenceStoreMediaV2 | null {
  const candidates = variantId
    ? [
        ...product.media.filter((media) => media.variantIds.includes(variantId)),
        ...product.media.filter((media) => media.role === "PRIMARY"),
      ]
    : [
        ...product.media.filter((media) => media.role === "PRIMARY"),
        ...product.media,
      ];
  for (const media of candidates) {
    const resolved = resolveReferenceStoreMediaV2(product, media);
    if (resolved) return resolved;
  }
  return null;
}

export const referenceStoreMediaAssetCountV2 = new Set(
  [...mediaRegistry.values()].map((entry) => entry.src)
).size;
