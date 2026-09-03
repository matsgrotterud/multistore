import assert from "node:assert/strict";
import test from "node:test";
import { wishlistItemKey } from "./contracts";
import {
  PrismaWishlistV2Repository,
  legacyMajorToMinor,
  type WishlistLegacyPublicProduct,
  type WishlistV2PrismaClient,
  type WishlistV2PrismaTransaction,
} from "./prisma-repository";
import type { WishlistOwner } from "./service";

const owner: WishlistOwner = {
  storeId: "store-a",
  storeSlug: "drone-lab",
  anonymousId: "11111111-1111-4111-8111-111111111111",
};

test("catalog resolution uses the public visibility gate and validates variant scope", async () => {
  const loaderCalls: Array<{ storeId: string; ids: string[] }> = [];
  const db = new ScriptedWishlistPrisma((query, values) => {
    if (query.includes('FROM "ProductVariant"')) {
      if (values[0] === "variant-right") return [variantRow()];
      return [];
    }
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = wishlistRepository(db, async (storeId, ids) => {
    loaderCalls.push({ storeId, ids });
    return [publicProduct()];
  });

  const found = await repository.resolveCatalogItem({
    storeId: owner.storeId,
    productId: "product-1",
    variantId: "variant-right",
  });
  const mismatch = await repository.resolveCatalogItem({
    storeId: owner.storeId,
    productId: "product-1",
    variantId: "variant-foreign",
  });

  assert.equal(found?.variantId, "variant-right");
  assert.equal(found?.publicItem.priceMinor, 10999);
  assert.equal(found?.publicItem.optionSummary, "Blue / Standard");
  assert.equal(mismatch, null);
  assert.deepEqual(loaderCalls, [
    { storeId: owner.storeId, ids: ["product-1"] },
    { storeId: owner.storeId, ids: ["product-1"] },
  ]);
  assert.match(db.queries[0].query, /product\."storeId" = \$3/);
  assert.equal(allSql(db).includes("supplier"), false);
  assert.equal(allSql(db).includes("margin"), false);
});

test("list exposes only visible public fields and filters a foreign variant", async () => {
  const db = new ScriptedWishlistPrisma((query) => {
    if (query.includes('SELECT "id" FROM "Wishlist"')) return [{ id: "wishlist-a" }];
    if (query.includes('FROM "WishlistItem"')) {
      return [
        {
          itemKey: wishlistItemKey({ productId: "product-1", variantId: null }),
          productId: "product-1",
          variantId: null,
          createdAt: new Date("2026-09-03T10:00:00.000Z"),
        },
        {
          itemKey: wishlistItemKey({
            productId: "product-1",
            variantId: "variant-foreign",
          }),
          productId: "product-1",
          variantId: "variant-foreign",
          createdAt: new Date("2026-09-03T10:01:00.000Z"),
        },
      ];
    }
    if (query.includes('FROM "ProductVariant"')) {
      return [{ ...variantRow(), id: "variant-foreign", productId: "other-product" }];
    }
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = wishlistRepository(db, async () => [publicProduct()]);

  const items = await repository.list(owner);

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    key: "product:product-1",
    productId: "product-1",
    variantId: null,
    slug: "reference-drone",
    categorySlug: "camera-drones",
    title: "Reference Drone",
    optionSummary: null,
    imageUrl: "/reference-drone.jpg",
    imageAlt: "Reference drone in flight",
    priceMinor: 12990,
    currency: "NOK",
    availability: "IN_STOCK",
    addedAt: "2026-09-03T10:00:00.000Z",
  });
  assert.equal(allSql(db).includes("providerKey"), false);
  assert.equal(allSql(db).includes("supplierDataJson"), false);
});

test("add is one tenant-locked transaction with atomic item dedup", async () => {
  let ownerReads = 0;
  const db = new ScriptedWishlistPrisma((query) => {
    if (query.includes('SELECT "id" FROM "Store"')) return [{ id: owner.storeId }];
    if (query.includes('INSERT INTO "Wishlist"')) return [{ id: "wishlist-a" }];
    if (query.includes('SELECT "id" FROM "Product"')) return [{ id: "product-1" }];
    if (query.includes('SELECT "id" FROM "Wishlist"')) {
      ownerReads += 1;
      return ownerReads > 0 ? [{ id: "wishlist-a" }] : [];
    }
    if (query.includes('FROM "WishlistItem"')) return [];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = wishlistRepository(db, async () => [publicProduct()]);
  const item = await repository.resolveCatalogItem({
    storeId: owner.storeId,
    productId: "product-1",
    variantId: null,
  });
  assert.ok(item);

  await repository.add({
    owner,
    item,
    itemKey: "product:product-1",
  });

  assert.equal(db.transactions, 1);
  const insert = db.executes.find((entry) =>
    entry.query.includes('INSERT INTO "WishlistItem"')
  );
  assert.ok(insert);
  assert.match(insert.query, /ON CONFLICT \("wishlistId", "itemKey"\) DO NOTHING/);
  assert.equal(insert.values[2], "product-1");
  assert.equal(allSql(db).includes("launchStatus"), false);
});

test("merge deduplicates into the tenant customer wishlist and removes only the source", async () => {
  let wishlistOwnerLookup = 0;
  const db = new ScriptedWishlistPrisma((query, values) => {
    if (query.includes('SELECT "id" FROM "Store"')) return [{ id: owner.storeId }];
    if (query.includes('FROM "Customer"')) {
      return values[1] === owner.storeId ? [{ id: "customer-a" }] : [];
    }
    if (query.includes('SELECT "id" FROM "Wishlist"') && query.includes('"anonymousId"')) {
      return [{ id: "wishlist-anonymous" }];
    }
    if (query.includes('INSERT INTO "Wishlist"')) return [{ id: "wishlist-customer" }];
    if (query.includes('SELECT "id" FROM "Wishlist"') && query.includes('"id" = $1')) {
      return [{ id: "wishlist-customer" }];
    }
    if (query.includes('SELECT "id" FROM "Wishlist"') && query.includes('"customerId"')) {
      wishlistOwnerLookup += 1;
      return [{ id: "wishlist-customer" }];
    }
    if (query.includes('FROM "WishlistItem"')) {
      if (values[0] === "wishlist-anonymous") {
        return [
          {
            itemKey: "product:product-1",
            productId: "product-1",
            variantId: null,
            createdAt: new Date("2026-09-03T10:00:00.000Z"),
          },
          {
            itemKey: "product:product-1:variant:variant-right",
            productId: "product-1",
            variantId: "variant-right",
            createdAt: new Date("2026-09-03T10:01:00.000Z"),
          },
        ];
      }
      return [];
    }
    if (query.includes('SELECT "id" FROM "Product"')) return [{ id: "product-1" }];
    if (query.includes('SELECT variant."id"')) return [{ id: "variant-right" }];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = wishlistRepository(db, async () => [publicProduct()]);

  const result = await repository.mergeAnonymousIntoCustomer({
    storeId: owner.storeId,
    storeSlug: owner.storeSlug,
    anonymousId: owner.anonymousId!,
    customerId: "customer-a",
  });

  assert.equal(result.length, 0);
  assert.equal(db.transactions, 1);
  assert.equal(
    db.executes.filter((entry) => entry.query.includes('INSERT INTO "WishlistItem"')).length,
    2
  );
  assert.ok(
    db.executes.every(
      (entry) =>
        !entry.query.includes('INSERT INTO "WishlistItem"') ||
        entry.query.includes("ON CONFLICT")
    )
  );
  const sourceDelete = db.executes.find((entry) =>
    entry.query.includes('DELETE FROM "Wishlist"')
  );
  assert.deepEqual(sourceDelete?.values, [
    "wishlist-anonymous",
    owner.storeId,
    owner.anonymousId,
  ]);
  assert.ok(wishlistOwnerLookup >= 1);
});

test("legacy major-unit conversion is integer, bounded and fail-closed", () => {
  assert.equal(legacyMajorToMinor(109.99), 10999);
  assert.equal(legacyMajorToMinor(Number.NaN), null);
  assert.equal(legacyMajorToMinor(-1), null);
  assert.equal(legacyMajorToMinor(Number.MAX_VALUE), null);
});

class ScriptedWishlistPrisma implements WishlistV2PrismaClient {
  readonly queries: Array<{ query: string; values: unknown[] }> = [];
  readonly executes: Array<{ query: string; values: unknown[] }> = [];
  transactions = 0;

  constructor(private readonly respond: (query: string, values: unknown[]) => unknown) {}

  async $transaction<T>(
    callback: (transaction: WishlistV2PrismaTransaction) => Promise<T>
  ): Promise<T> {
    this.transactions += 1;
    return callback(this);
  }

  async $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: unknown[]
  ): Promise<T> {
    this.queries.push({ query, values });
    return this.respond(query, values) as T;
  }

  async $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> {
    this.executes.push({ query, values });
    return 1;
  }
}

function wishlistRepository(
  db: ScriptedWishlistPrisma,
  loader: (
    storeId: string,
    ids: string[]
  ) => Promise<WishlistLegacyPublicProduct[]>
): PrismaWishlistV2Repository {
  let id = 0;
  return new PrismaWishlistV2Repository({
    db,
    getVisibleProductsByIds: loader,
    createId: (kind) => `${kind}-${++id}`,
    clock: () => new Date("2026-09-03T10:05:00.000Z"),
  });
}

function publicProduct(): WishlistLegacyPublicProduct {
  return {
    id: "product-1",
    storeId: owner.storeId,
    slug: "reference-drone",
    title: "Reference Drone",
    imageUrl: "/reference-drone.jpg",
    imageAlt: "Reference drone in flight",
    price: 129.9,
    currency: "NOK",
    stockStatus: "IN_STOCK",
    checkoutAvailable: true,
    category: { slug: "camera-drones" },
  };
}

function variantRow() {
  return {
    id: "variant-right",
    productId: "product-1",
    title: "Blue standard",
    optionSummary: "Blue / Standard",
    price: 109.99,
    stockStatus: "LOW_STOCK",
    inventoryQuantity: 3,
    imageUrl: "/reference-drone-blue.jpg",
  };
}

function allSql(db: ScriptedWishlistPrisma): string {
  return [...db.queries, ...db.executes].map((entry) => entry.query).join("\n");
}
