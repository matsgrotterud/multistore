import { z } from "zod";

export const WISHLIST_CONTRACT_VERSION = "wishlist.v2" as const;
export const WISHLIST_IDENTITY_VERSION = "wishlist-identity.v1" as const;

export const wishlistItemIdentitySchema = z.object({
  productId: z.string().trim().min(1).max(191),
  variantId: z.string().trim().min(1).max(191).nullable().default(null),
});

export const wishlistIdentityPayloadSchema = z.object({
  version: z.literal(WISHLIST_IDENTITY_VERSION),
  storeId: z.string().trim().min(1).max(191),
  storeSlug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  anonymousId: z.string().uuid(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const wishlistMutationSchema = z.object({
  storeSlug: wishlistIdentityPayloadSchema.shape.storeSlug,
  productId: wishlistItemIdentitySchema.shape.productId,
  variantId: wishlistItemIdentitySchema.shape.variantId.optional(),
});

export type WishlistItemIdentity = z.infer<typeof wishlistItemIdentitySchema>;
export type WishlistIdentityPayload = z.infer<
  typeof wishlistIdentityPayloadSchema
>;
export type WishlistMutationInput = z.infer<typeof wishlistMutationSchema>;

export interface WishlistPublicItem {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  categorySlug: string | null;
  title: string;
  optionSummary: string | null;
  imageUrl: string;
  imageAlt: string;
  priceMinor: number | null;
  currency: string | null;
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
  addedAt: string;
}

export interface WishlistSnapshotV2 {
  version: typeof WISHLIST_CONTRACT_VERSION;
  storeSlug: string;
  anonymous: boolean;
  items: WishlistPublicItem[];
}

export function wishlistItemKey(input: WishlistItemIdentity): string {
  const value = wishlistItemIdentitySchema.parse(input);
  return value.variantId
    ? `product:${value.productId}:variant:${value.variantId}`
    : `product:${value.productId}`;
}
