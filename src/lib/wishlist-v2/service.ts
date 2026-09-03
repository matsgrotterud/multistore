import {
  WISHLIST_CONTRACT_VERSION,
  wishlistItemKey,
  type WishlistPublicItem,
  type WishlistSnapshotV2,
} from "./contracts";

export interface WishlistCatalogItem {
  storeId: string;
  productId: string;
  variantId: string | null;
  visible: boolean;
  publicItem: Omit<WishlistPublicItem, "key" | "addedAt">;
}

export interface WishlistOwner {
  storeId: string;
  storeSlug: string;
  anonymousId?: string;
  customerId?: string;
}

export interface WishlistRepositoryV2 {
  resolveCatalogItem(input: {
    storeId: string;
    productId: string;
    variantId: string | null;
  }): Promise<WishlistCatalogItem | null>;
  list(owner: WishlistOwner): Promise<WishlistPublicItem[]>;
  add(input: {
    owner: WishlistOwner;
    item: WishlistCatalogItem;
    itemKey: string;
  }): Promise<WishlistPublicItem[]>;
  remove(input: {
    owner: WishlistOwner;
    itemKey: string;
  }): Promise<WishlistPublicItem[]>;
  mergeAnonymousIntoCustomer(input: {
    storeId: string;
    storeSlug: string;
    anonymousId: string;
    customerId: string;
  }): Promise<WishlistPublicItem[]>;
}

export async function readWishlist(input: {
  repository: WishlistRepositoryV2;
  owner: WishlistOwner;
}): Promise<WishlistSnapshotV2> {
  assertExactlyOneOwner(input.owner);
  return snapshot(input.owner, await input.repository.list(input.owner));
}

export async function addWishlistItem(input: {
  repository: WishlistRepositoryV2;
  owner: WishlistOwner;
  productId: string;
  variantId?: string | null;
}): Promise<WishlistSnapshotV2> {
  assertExactlyOneOwner(input.owner);
  const variantId = input.variantId ?? null;
  const item = await input.repository.resolveCatalogItem({
    storeId: input.owner.storeId,
    productId: input.productId,
    variantId,
  });
  if (!item || item.storeId !== input.owner.storeId || !item.visible) {
    throw new WishlistServiceError("WISHLIST_ITEM_NOT_AVAILABLE");
  }
  if (item.productId !== input.productId || item.variantId !== variantId) {
    throw new WishlistServiceError("WISHLIST_ITEM_IDENTITY_MISMATCH");
  }
  const itemKey = wishlistItemKey({ productId: input.productId, variantId });
  return snapshot(
    input.owner,
    await input.repository.add({ owner: input.owner, item, itemKey })
  );
}

export async function removeWishlistItem(input: {
  repository: WishlistRepositoryV2;
  owner: WishlistOwner;
  productId: string;
  variantId?: string | null;
}): Promise<WishlistSnapshotV2> {
  assertExactlyOneOwner(input.owner);
  const itemKey = wishlistItemKey({
    productId: input.productId,
    variantId: input.variantId ?? null,
  });
  return snapshot(
    input.owner,
    await input.repository.remove({ owner: input.owner, itemKey })
  );
}

export async function mergeWishlist(input: {
  repository: WishlistRepositoryV2;
  storeId: string;
  storeSlug: string;
  anonymousId: string;
  customerId: string;
}): Promise<WishlistSnapshotV2> {
  const items = await input.repository.mergeAnonymousIntoCustomer(input);
  return snapshot(
    {
      storeId: input.storeId,
      storeSlug: input.storeSlug,
      customerId: input.customerId,
    },
    items
  );
}

export class WishlistServiceError extends Error {
  constructor(
    readonly code:
      | "WISHLIST_OWNER_INVALID"
      | "WISHLIST_ITEM_NOT_AVAILABLE"
      | "WISHLIST_ITEM_IDENTITY_MISMATCH"
  ) {
    super(code);
    this.name = "WishlistServiceError";
  }
}

function assertExactlyOneOwner(owner: WishlistOwner): void {
  if (Boolean(owner.anonymousId) === Boolean(owner.customerId)) {
    throw new WishlistServiceError("WISHLIST_OWNER_INVALID");
  }
}

function snapshot(
  owner: WishlistOwner,
  items: WishlistPublicItem[]
): WishlistSnapshotV2 {
  return {
    version: WISHLIST_CONTRACT_VERSION,
    storeSlug: owner.storeSlug,
    anonymous: Boolean(owner.anonymousId),
    items: [...items].sort(
      (left, right) =>
        Date.parse(right.addedAt) - Date.parse(left.addedAt) ||
        left.key.localeCompare(right.key)
    ),
  };
}
