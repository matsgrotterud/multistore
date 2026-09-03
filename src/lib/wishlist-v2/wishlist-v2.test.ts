import assert from "node:assert/strict";
import test from "node:test";
import {
  addWishlistItem,
  canMutateWishlist,
  createWishlistIdentity,
  decideWishlistFeature,
  removeWishlistItem,
  verifyWishlistIdentity,
  wishlistCookieName,
  wishlistItemKey,
  wishlistSigningSecret,
  WishlistServiceError,
  type WishlistCatalogItem,
  type WishlistOwner,
  type WishlistPublicItem,
  type WishlistRepositoryV2,
} from ".";

const secret = "wishlist-test-secret-that-is-at-least-32-characters";
const target = { storeId: "store-a", storeSlug: "drone-lab" };
const now = new Date("2026-09-03T10:00:00.000Z");

test("signed identities round-trip only for the exact tenant and lifetime", () => {
  const issued = createWishlistIdentity({
    target,
    secret,
    now,
    ttlSeconds: 60,
    createId: () => "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(
    verifyWishlistIdentity({ token: issued.token, target, secret, now })?.anonymousId,
    issued.payload.anonymousId
  );
  assert.equal(
    verifyWishlistIdentity({
      token: issued.token,
      target: { ...target, storeId: "store-b" },
      secret,
      now,
    }),
    null
  );
  assert.equal(
    verifyWishlistIdentity({
      token: `${issued.token.slice(0, -1)}x`,
      target,
      secret,
      now,
    }),
    null
  );
  assert.equal(
    verifyWishlistIdentity({
      token: issued.token,
      target,
      secret,
      now: new Date("2026-09-03T10:01:01.000Z"),
    }),
    null
  );
  assert.notEqual(wishlistCookieName("drone-lab"), wishlistCookieName("shoe-lab"));
});

test("production signing config fails closed without a dedicated secret", () => {
  assert.equal(
    wishlistSigningSecret({ NODE_ENV: "production", ADMIN_SESSION_SECRET: secret }),
    null
  );
  assert.equal(
    wishlistSigningSecret({ NODE_ENV: "production", WISHLIST_SIGNING_SECRET: secret }),
    secret
  );
});

test("wishlist feature requires manifest, deployment flag and signing secret", () => {
  assert.deepEqual(
    decideWishlistFeature({
      manifestEnabled: true,
      env: { NODE_ENV: "production" },
    }),
    { enabled: false, reason: "FEATURE_FLAG_DISABLED" }
  );
  assert.deepEqual(
    decideWishlistFeature({
      manifestEnabled: true,
      env: {
        NODE_ENV: "production",
        STOREFRONT_V2_WISHLIST_ENABLED: "true",
      },
    }),
    { enabled: false, reason: "SIGNING_SECRET_NOT_CONFIGURED" }
  );
  assert.deepEqual(
    decideWishlistFeature({
      manifestEnabled: true,
      env: {
        NODE_ENV: "production",
        STOREFRONT_V2_WISHLIST_ENABLED: "true",
        WISHLIST_SIGNING_SECRET: secret,
      },
    }),
    { enabled: true, reason: "ENABLED" }
  );
  assert.equal(
    decideWishlistFeature({
      manifestEnabled: false,
      env: {
        NODE_ENV: "production",
        STOREFRONT_V2_WISHLIST_ENABLED: "true",
        WISHLIST_SIGNING_SECRET: secret,
      },
    }).reason,
    "MANIFEST_DISABLED"
  );
});

test("mutation policy requires an exact same-origin browser request", () => {
  assert.equal(
    canMutateWishlist({
      method: "POST",
      origin: "https://shop.example.no",
      host: "shop.example.no",
      secFetchSite: "same-origin",
    }),
    true
  );
  assert.equal(
    canMutateWishlist({
      method: "POST",
      origin: "https://evil.example",
      host: "shop.example.no",
      secFetchSite: "cross-site",
    }),
    false
  );
  assert.equal(
    canMutateWishlist({ method: "DELETE", origin: null, host: "shop.example.no" }),
    false
  );
});

test("variant identity is stable and different from the default product", () => {
  assert.equal(
    wishlistItemKey({ productId: "product-1", variantId: null }),
    "product:product-1"
  );
  assert.equal(
    wishlistItemKey({ productId: "product-1", variantId: "variant-blue" }),
    "product:product-1:variant:variant-blue"
  );
});

test("service rejects cross-tenant and invisible catalog entries", async () => {
  const repository = new FakeWishlistRepository();
  repository.catalog.set("product:product-foreign", catalogItem({ storeId: "store-b" }));
  repository.catalog.set(
    "product:product-hidden",
    catalogItem({ productId: "product-hidden", visible: false })
  );
  const owner = anonymousOwner();

  await assert.rejects(
    addWishlistItem({
      repository,
      owner,
      productId: "product-foreign",
    }),
    (error) =>
      error instanceof WishlistServiceError &&
      error.code === "WISHLIST_ITEM_NOT_AVAILABLE"
  );
  await assert.rejects(
    addWishlistItem({ repository, owner, productId: "product-hidden" }),
    (error) =>
      error instanceof WishlistServiceError &&
      error.code === "WISHLIST_ITEM_NOT_AVAILABLE"
  );
});

test("add is idempotent per product variant and remove is exact", async () => {
  const repository = new FakeWishlistRepository();
  repository.catalog.set(
    "product:product-1:variant:blue",
    catalogItem({ variantId: "blue" })
  );
  repository.catalog.set(
    "product:product-1:variant:red",
    catalogItem({ variantId: "red" })
  );
  const owner = anonymousOwner();

  await addWishlistItem({ repository, owner, productId: "product-1", variantId: "blue" });
  const afterReplay = await addWishlistItem({
    repository,
    owner,
    productId: "product-1",
    variantId: "blue",
  });
  const afterRed = await addWishlistItem({
    repository,
    owner,
    productId: "product-1",
    variantId: "red",
  });
  assert.equal(afterReplay.items.length, 1);
  assert.equal(afterRed.items.length, 2);

  const afterRemove = await removeWishlistItem({
    repository,
    owner,
    productId: "product-1",
    variantId: "blue",
  });
  assert.deepEqual(afterRemove.items.map((item) => item.variantId), ["red"]);
});

function anonymousOwner(): WishlistOwner {
  return {
    storeId: target.storeId,
    storeSlug: target.storeSlug,
    anonymousId: "11111111-1111-4111-8111-111111111111",
  };
}

function catalogItem(
  overrides: Partial<WishlistCatalogItem> = {}
): WishlistCatalogItem {
  const productId = overrides.productId ?? "product-1";
  const variantId = overrides.variantId ?? null;
  return {
    storeId: target.storeId,
    productId,
    variantId,
    visible: true,
    publicItem: {
      productId,
      variantId,
      slug: "reference-product",
      categorySlug: "reference",
      title: "Reference product",
      optionSummary: variantId,
      imageUrl: "/api/placeholder?label=Reference",
      imageAlt: "Reference product",
      priceMinor: 12900,
      currency: "NOK",
      availability: "IN_STOCK",
    },
    ...overrides,
  };
}

class FakeWishlistRepository implements WishlistRepositoryV2 {
  readonly catalog = new Map<string, WishlistCatalogItem>();
  private readonly items = new Map<string, WishlistPublicItem>();

  async resolveCatalogItem(input: {
    storeId: string;
    productId: string;
    variantId: string | null;
  }): Promise<WishlistCatalogItem | null> {
    const item = this.catalog.get(
      wishlistItemKey({ productId: input.productId, variantId: input.variantId })
    );
    return item?.storeId === input.storeId ? item : null;
  }

  async list(): Promise<WishlistPublicItem[]> {
    return [...this.items.values()];
  }

  async add(input: {
    owner: WishlistOwner;
    item: WishlistCatalogItem;
    itemKey: string;
  }): Promise<WishlistPublicItem[]> {
    if (!this.items.has(input.itemKey)) {
      this.items.set(input.itemKey, {
        ...input.item.publicItem,
        key: input.itemKey,
        addedAt: "2026-09-03T10:00:00.000Z",
      });
    }
    return this.list();
  }

  async remove(input: {
    owner: WishlistOwner;
    itemKey: string;
  }): Promise<WishlistPublicItem[]> {
    this.items.delete(input.itemKey);
    return this.list();
  }

  async mergeAnonymousIntoCustomer(): Promise<WishlistPublicItem[]> {
    return this.list();
  }
}
