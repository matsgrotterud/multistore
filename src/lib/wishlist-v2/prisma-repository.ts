import { randomUUID } from "node:crypto";
import {
  wishlistItemKey,
  type WishlistPublicItem,
} from "./contracts";
import type {
  WishlistCatalogItem,
  WishlistOwner,
  WishlistRepositoryV2,
} from "./service";

export interface WishlistV2PrismaTransaction {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}

export interface WishlistV2PrismaClient extends WishlistV2PrismaTransaction {
  $transaction<T>(
    callback: (transaction: WishlistV2PrismaTransaction) => Promise<T>
  ): Promise<T>;
}

export interface WishlistLegacyPublicProduct {
  id: string;
  storeId: string;
  slug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  currency: string;
  stockStatus: string;
  checkoutAvailable: boolean;
  category?: { slug: string } | null;
}

export type WishlistVisibleProductLookup = (
  storeId: string,
  productIds: string[]
) => Promise<WishlistLegacyPublicProduct[]>;

export type WishlistV2IdFactory = (kind: "wishlist" | "item") => string;

export interface PrismaWishlistV2RepositoryDependencies {
  db: WishlistV2PrismaClient;
  /** Production defaults to the existing fail-closed storefront visibility gate. */
  getVisibleProductsByIds?: WishlistVisibleProductLookup;
  createId?: WishlistV2IdFactory;
  clock?: () => Date;
}

type WishlistRow = { id: string };
type WishlistItemRow = {
  itemKey: string;
  productId: string;
  variantId: string | null;
  createdAt: Date | string;
};
type VariantRow = {
  id: string;
  productId: string;
  title: string;
  optionSummary: string;
  price: number | null;
  stockStatus: string;
  inventoryQuantity: number | null;
  imageUrl: string | null;
};

/**
 * Anonymous-first, tenant-scoped wishlist persistence.
 *
 * The repository never selects supplier, cost, margin, provider payload or
 * checkout fields. Product publication is delegated to getProductsByIds, the
 * same fail-closed visibility gate used by the storefront.
 */
export class PrismaWishlistV2Repository implements WishlistRepositoryV2 {
  private readonly db: WishlistV2PrismaClient;
  private readonly getVisibleProductsByIds: WishlistVisibleProductLookup;
  private readonly createId: WishlistV2IdFactory;
  private readonly clock: () => Date;

  constructor(dependencies: PrismaWishlistV2RepositoryDependencies) {
    this.db = dependencies.db;
    this.getVisibleProductsByIds =
      dependencies.getVisibleProductsByIds ?? defaultVisibleProductLookup;
    this.createId =
      dependencies.createId ??
      ((kind) => `${kind === "wishlist" ? "wlv2" : "wliv2"}_${randomUUID()}`);
    this.clock = dependencies.clock ?? (() => new Date());
  }

  async resolveCatalogItem(input: {
    storeId: string;
    productId: string;
    variantId: string | null;
  }): Promise<WishlistCatalogItem | null> {
    const products = await this.getVisibleProductsByIds(input.storeId, [
      input.productId,
    ]);
    const product = products.find(
      (candidate) =>
        candidate.id === input.productId && candidate.storeId === input.storeId
    );
    if (!product) return null;

    const variant = input.variantId
      ? await this.readVariant(input.storeId, input.productId, input.variantId)
      : null;
    if (input.variantId && !variant) return null;

    return {
      storeId: input.storeId,
      productId: product.id,
      variantId: variant?.id ?? null,
      visible: true,
      publicItem: toPublicCatalogItem(product, variant),
    };
  }

  async list(owner: WishlistOwner): Promise<WishlistPublicItem[]> {
    assertOwner(owner);
    const wishlist = await findOwnerWishlist(this.db, owner, false);
    if (!wishlist) return [];
    return this.hydrateWishlist(owner.storeId, wishlist.id);
  }

  async add(input: {
    owner: WishlistOwner;
    item: WishlistCatalogItem;
    itemKey: string;
  }): Promise<WishlistPublicItem[]> {
    assertOwner(input.owner);
    if (
      input.item.storeId !== input.owner.storeId ||
      input.itemKey !==
        wishlistItemKey({
          productId: input.item.productId,
          variantId: input.item.variantId,
        })
    ) {
      throw new WishlistPersistenceError(
        "WISHLIST_PERSISTENCE_INVARIANT",
        "Wishlist item identity does not match its tenant or item key."
      );
    }

    // Re-run the public visibility gate immediately before the write. This is
    // intentional even though the service resolved the same item already.
    const visible = await this.resolveCatalogItem({
      storeId: input.owner.storeId,
      productId: input.item.productId,
      variantId: input.item.variantId,
    });
    if (!visible) {
      throw new WishlistPersistenceError(
        "WISHLIST_CATALOG_ITEM_NOT_AVAILABLE",
        "The product is no longer visible for this store."
      );
    }

    await this.db.$transaction(async (transaction) => {
      await lockStore(transaction, input.owner.storeId);
      const wishlist = await ensureOwnerWishlist(
        transaction,
        input.owner,
        this.createId("wishlist"),
        this.clock()
      );
      await assertProductAndVariantScope(transaction, {
        storeId: input.owner.storeId,
        productId: input.item.productId,
        variantId: input.item.variantId,
      });
      await transaction.$executeRawUnsafe(
        `INSERT INTO "WishlistItem" (
           "id", "wishlistId", "productId", "variantId", "itemKey", "createdAt"
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT ("wishlistId", "itemKey") DO NOTHING`,
        this.createId("item"),
        wishlist.id,
        input.item.productId,
        input.item.variantId,
        input.itemKey,
        safeDate(this.clock(), "wishlist item clock")
      );
    });
    return this.list(input.owner);
  }

  async remove(input: {
    owner: WishlistOwner;
    itemKey: string;
  }): Promise<WishlistPublicItem[]> {
    assertOwner(input.owner);
    await this.db.$transaction(async (transaction) => {
      await lockStore(transaction, input.owner.storeId);
      const wishlist = await findOwnerWishlist(transaction, input.owner, true);
      if (!wishlist) return;
      await transaction.$executeRawUnsafe(
        `DELETE FROM "WishlistItem"
         WHERE "wishlistId" = $1 AND "itemKey" = $2`,
        wishlist.id,
        input.itemKey
      );
    });
    return this.list(input.owner);
  }

  async mergeAnonymousIntoCustomer(input: {
    storeId: string;
    storeSlug: string;
    anonymousId: string;
    customerId: string;
  }): Promise<WishlistPublicItem[]> {
    const customerOwner: WishlistOwner = {
      storeId: input.storeId,
      storeSlug: input.storeSlug,
      customerId: input.customerId,
    };
    const anonymousOwner: WishlistOwner = {
      storeId: input.storeId,
      storeSlug: input.storeSlug,
      anonymousId: input.anonymousId,
    };
    assertOwner(customerOwner);
    assertOwner(anonymousOwner);

    await this.db.$transaction(async (transaction) => {
      // Serializes owner creation and merge within one tenant. The customer
      // scope check happens under the same lock as all item movement.
      await lockStore(transaction, input.storeId);
      await requireCustomer(transaction, input.storeId, input.customerId);
      const anonymousWishlist = await findOwnerWishlist(
        transaction,
        anonymousOwner,
        true
      );
      const customerWishlist = await ensureOwnerWishlist(
        transaction,
        customerOwner,
        this.createId("wishlist"),
        this.clock(),
        true
      );
      if (!anonymousWishlist || anonymousWishlist.id === customerWishlist.id) {
        return;
      }

      const sourceItems = await transaction.$queryRawUnsafe<WishlistItemRow[]>(
        `SELECT "itemKey", "productId", "variantId", "createdAt"
         FROM "WishlistItem" WHERE "wishlistId" = $1
         ORDER BY "createdAt" ASC, "itemKey" ASC`,
        anonymousWishlist.id
      );
      for (const item of sourceItems) {
        await assertProductAndVariantScope(transaction, {
          storeId: input.storeId,
          productId: item.productId,
          variantId: item.variantId,
        });
        await transaction.$executeRawUnsafe(
          `INSERT INTO "WishlistItem" (
             "id", "wishlistId", "productId", "variantId", "itemKey", "createdAt"
           ) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT ("wishlistId", "itemKey") DO NOTHING`,
          this.createId("item"),
          customerWishlist.id,
          item.productId,
          item.variantId,
          item.itemKey,
          safeDate(item.createdAt, "wishlist item createdAt")
        );
      }
      await transaction.$executeRawUnsafe(
        `DELETE FROM "Wishlist"
         WHERE "id" = $1 AND "storeId" = $2 AND "anonymousId" = $3`,
        anonymousWishlist.id,
        input.storeId,
        input.anonymousId
      );
    });
    return this.list(customerOwner);
  }

  private async readVariant(
    storeId: string,
    productId: string,
    variantId: string
  ): Promise<VariantRow | null> {
    const rows = await this.db.$queryRawUnsafe<VariantRow[]>(
      `${variantPublicProjection}
       WHERE variant."id" = $1 AND variant."productId" = $2
         AND product."storeId" = $3
       LIMIT 1`,
      variantId,
      productId,
      storeId
    );
    return rows[0] ?? null;
  }

  private async hydrateWishlist(
    storeId: string,
    wishlistId: string
  ): Promise<WishlistPublicItem[]> {
    const itemRows = await this.db.$queryRawUnsafe<WishlistItemRow[]>(
      `SELECT "itemKey", "productId", "variantId", "createdAt"
       FROM "WishlistItem" WHERE "wishlistId" = $1
       ORDER BY "createdAt" DESC, "itemKey" ASC`,
      wishlistId
    );
    if (itemRows.length === 0) return [];
    const productIds = unique(itemRows.map((item) => item.productId));
    const visibleProducts = await this.getVisibleProductsByIds(storeId, productIds);
    const productsById = new Map(
      visibleProducts
        .filter((product) => product.storeId === storeId)
        .map((product) => [product.id, product])
    );
    const variantIds = unique(
      itemRows.flatMap((item) => (item.variantId ? [item.variantId] : []))
    );
    const variants =
      variantIds.length === 0
        ? []
        : await this.db.$queryRawUnsafe<VariantRow[]>(
            `${variantPublicProjection}
             WHERE product."storeId" = $1
               AND variant."id" = ANY($2::text[])`,
            storeId,
            variantIds
          );
    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

    return itemRows.flatMap((item) => {
      const product = productsById.get(item.productId);
      const variant = item.variantId ? variantsById.get(item.variantId) : null;
      if (!product || (item.variantId && (!variant || variant.productId !== product.id))) {
        return [];
      }
      return [
        {
          ...toPublicCatalogItem(product, variant ?? null),
          key: item.itemKey,
          addedAt: safeDate(item.createdAt, "wishlist item createdAt").toISOString(),
        },
      ];
    });
  }
}

export function createPrismaWishlistV2Repository(input: {
  prismaClient: unknown;
  getVisibleProductsByIds?: WishlistVisibleProductLookup;
  createId?: WishlistV2IdFactory;
  clock?: () => Date;
}): PrismaWishlistV2Repository {
  return new PrismaWishlistV2Repository({
    db: input.prismaClient as WishlistV2PrismaClient,
    getVisibleProductsByIds: input.getVisibleProductsByIds,
    createId: input.createId,
    clock: input.clock,
  });
}

export type WishlistPersistenceErrorCode =
  | "WISHLIST_OWNER_NOT_FOUND"
  | "WISHLIST_VARIANT_PRODUCT_MISMATCH"
  | "WISHLIST_CATALOG_ITEM_NOT_AVAILABLE"
  | "WISHLIST_PERSISTENCE_INVARIANT";

export class WishlistPersistenceError extends Error {
  constructor(
    readonly code: WishlistPersistenceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "WishlistPersistenceError";
  }
}

const variantPublicProjection = `
  SELECT variant."id", variant."productId", variant."title",
         variant."optionSummary", variant."price", variant."stockStatus",
         variant."inventoryQuantity", variant."imageUrl"
  FROM "ProductVariant" variant
  INNER JOIN "Product" product ON product."id" = variant."productId"`;

async function defaultVisibleProductLookup(
  storeId: string,
  productIds: string[]
): Promise<WishlistLegacyPublicProduct[]> {
  const { getProductsByIds } = await import("@/lib/stores/queries");
  return (await getProductsByIds(
    storeId,
    productIds
  )) as WishlistLegacyPublicProduct[];
}

async function findOwnerWishlist(
  db: WishlistV2PrismaTransaction,
  owner: WishlistOwner,
  forUpdate: boolean
): Promise<WishlistRow | null> {
  const ownerColumn = owner.anonymousId ? "anonymousId" : "customerId";
  const ownerValue = owner.anonymousId ?? owner.customerId;
  if (!ownerValue) throw invalidOwner();
  if (owner.customerId) await requireCustomer(db, owner.storeId, owner.customerId);
  const rows = await db.$queryRawUnsafe<WishlistRow[]>(
    `SELECT "id" FROM "Wishlist"
     WHERE "storeId" = $1 AND "${ownerColumn}" = $2
     LIMIT 1${forUpdate ? " FOR UPDATE" : ""}`,
    owner.storeId,
    ownerValue
  );
  return rows[0] ?? null;
}

async function ensureOwnerWishlist(
  transaction: WishlistV2PrismaTransaction,
  owner: WishlistOwner,
  proposedId: string,
  now: Date,
  forUpdate = false
): Promise<WishlistRow> {
  if (owner.customerId) {
    await requireCustomer(transaction, owner.storeId, owner.customerId);
  }
  const ownerColumn = owner.anonymousId ? "anonymousId" : "customerId";
  const ownerValue = owner.anonymousId ?? owner.customerId;
  if (!ownerValue) throw invalidOwner();
  const rows = await transaction.$queryRawUnsafe<WishlistRow[]>(
    `INSERT INTO "Wishlist" (
       "id", "storeId", "anonymousId", "customerId", "email", "createdAt", "updatedAt"
     ) VALUES ($1, $2, $3, $4, NULL, $5, $5)
     ON CONFLICT ("storeId", "${ownerColumn}")
     DO UPDATE SET "id" = "Wishlist"."id"
     RETURNING "id"`,
    proposedId,
    owner.storeId,
    owner.anonymousId ?? null,
    owner.customerId ?? null,
    safeDate(now, "wishlist clock")
  );
  const wishlist = rows[0];
  if (!wishlist) {
    throw new WishlistPersistenceError(
      "WISHLIST_PERSISTENCE_INVARIANT",
      "Wishlist upsert returned no row."
    );
  }
  if (forUpdate) {
    const locked = await transaction.$queryRawUnsafe<WishlistRow[]>(
      `SELECT "id" FROM "Wishlist"
       WHERE "id" = $1 AND "storeId" = $2 FOR UPDATE`,
      wishlist.id,
      owner.storeId
    );
    if (!locked[0]) throw invalidOwner();
  }
  return wishlist;
}

async function lockStore(
  transaction: WishlistV2PrismaTransaction,
  storeId: string
): Promise<void> {
  const rows = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "Store" WHERE "id" = $1 FOR UPDATE`,
    storeId
  );
  if (!rows[0]) throw invalidOwner();
}

async function requireCustomer(
  db: WishlistV2PrismaTransaction,
  storeId: string,
  customerId: string
): Promise<void> {
  const rows = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "Customer"
     WHERE "id" = $1 AND "storeId" = $2 LIMIT 1`,
    customerId,
    storeId
  );
  if (!rows[0]) throw invalidOwner();
}

async function assertProductAndVariantScope(
  transaction: WishlistV2PrismaTransaction,
  input: { storeId: string; productId: string; variantId: string | null }
): Promise<void> {
  const products = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "Product"
     WHERE "id" = $1 AND "storeId" = $2 AND "isPublished" = TRUE
     LIMIT 1`,
    input.productId,
    input.storeId
  );
  if (!products[0]) {
    throw new WishlistPersistenceError(
      "WISHLIST_CATALOG_ITEM_NOT_AVAILABLE",
      "Product is not published for the requested store."
    );
  }
  if (!input.variantId) return;
  const variants = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT variant."id"
     FROM "ProductVariant" variant
     INNER JOIN "Product" product ON product."id" = variant."productId"
     WHERE variant."id" = $1 AND variant."productId" = $2
       AND product."storeId" = $3
     LIMIT 1`,
    input.variantId,
    input.productId,
    input.storeId
  );
  if (!variants[0]) {
    throw new WishlistPersistenceError(
      "WISHLIST_VARIANT_PRODUCT_MISMATCH",
      "Variant does not belong to this product and store."
    );
  }
}

function toPublicCatalogItem(
  product: WishlistLegacyPublicProduct,
  variant: VariantRow | null
): Omit<WishlistPublicItem, "key" | "addedAt"> {
  const price = variant?.price ?? product.price;
  return {
    productId: product.id,
    variantId: variant?.id ?? null,
    slug: product.slug,
    categorySlug: product.category?.slug ?? null,
    title: product.title,
    optionSummary: variant?.optionSummary || variant?.title || null,
    imageUrl: variant?.imageUrl || product.imageUrl,
    imageAlt: product.imageAlt,
    priceMinor: legacyMajorToMinor(price),
    currency: /^[A-Z]{3}$/.test(product.currency) ? product.currency : null,
    availability: normalizeAvailability(
      variant?.stockStatus ?? product.stockStatus,
      variant?.inventoryQuantity ?? null
    ),
  };
}

/** Float conversion is intentionally isolated to this legacy projection edge. */
export function legacyMajorToMinor(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  const minor = Math.round((value + Number.EPSILON) * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}

function normalizeAvailability(
  stockStatus: string,
  inventoryQuantity: number | null
): WishlistPublicItem["availability"] {
  if (stockStatus === "PREORDER") return "PREORDER";
  if (stockStatus === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  if (inventoryQuantity !== null && inventoryQuantity <= 0) return "OUT_OF_STOCK";
  if (
    stockStatus === "IN_STOCK" ||
    stockStatus === "LOW_STOCK"
  ) {
    return stockStatus;
  }
  return "UNKNOWN";
}

function assertOwner(owner: WishlistOwner): void {
  if (
    Boolean(owner.anonymousId) === Boolean(owner.customerId) ||
    !owner.storeId.trim() ||
    !owner.storeSlug.trim()
  ) {
    throw invalidOwner();
  }
}

function invalidOwner(): WishlistPersistenceError {
  return new WishlistPersistenceError(
    "WISHLIST_OWNER_NOT_FOUND",
    "Wishlist owner was not found for the requested store."
  );
}

function safeDate(value: Date | string, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new WishlistPersistenceError(
      "WISHLIST_PERSISTENCE_INVARIANT",
      `Invalid ${field}.`
    );
  }
  return date;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
