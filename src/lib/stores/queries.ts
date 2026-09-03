import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  isProductCheckoutAvailable,
  type CheckoutAvailabilityProduct,
} from "@/lib/stores/checkout-availability";
import {
  decideCatalogVisibilityV3,
  projectVirtualCatalogCategoryV3,
  selectPreviewCatalogCategoryV3,
} from "@/lib/stores/catalog-visibility-v3";
import { ontologyEntryForClass, resolveNicheIntentV1 } from "@/lib/generator-v3";
import { selectPublicProductImage } from "@/lib/media/public-media";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { getStoreBySlug, type StoreWithTheme } from "@/lib/tenant/resolve-tenant";
import type { Prisma, Product, Store } from "@prisma/client";

export { toClientProduct } from "@/lib/stores/client-product";

/** A catalog product enriched with card-level routing and variant signals. */
type PublicProduct = Omit<
  Product,
  | "cost"
  | "shippingCost"
  | "marginPercent"
  | "supplierName"
  | "supplierProductId"
  | "supplierSource"
  | "supplierUrl"
  | "supplierSearchQuery"
  | "imagesSyncedAt"
  | "externalId"
  | "sourceUrl"
  | "lastSupplierSyncAt"
  | "supplierDataJson"
>;

export type CatalogProduct = PublicProduct & {
  category?: { slug: string } | null;
  _count?: { variants: number };
  checkoutAvailable: boolean;
};

const catalogProductQueryOmit = {
  cost: true,
  shippingCost: true,
  marginPercent: true,
  supplierName: true,
  supplierProductId: true,
  supplierSource: true,
  supplierUrl: true,
  supplierSearchQuery: true,
  imagesSyncedAt: true,
  sourceUrl: true,
  lastSupplierSyncAt: true,
  supplierDataJson: true,
} satisfies Prisma.ProductOmit;

/**
 * Data access layer for storefront pages. All queries are store-scoped so a
 * tenant can never leak another tenant's data.
 *
 * PREVIEW/DRAFT reads deliberately happen in two stages: first fetch only the
 * evidence needed for the visibility decision, then fetch rich product data
 * only for IDs that passed. Besides keeping rejected products out of the UI,
 * this prevents their supplier payloads from being captured in a React Flight
 * response when a route calls notFound().
 */

export const requireStore = cache(async (slug: string): Promise<StoreWithTheme> => {
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return store;
});

/** Settings stay server-side and are loaded separately from public store data. */
export const getStoreSettings = cache(async (storeId: string) => {
  const row = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { settings: true },
  });
  return parseStoreSettings(row?.settings);
});

type StoreVisibilityContext = Pick<Store, "id" | "niche" | "launchStatus">;

const storeVisibilitySelect = {
  id: true,
  niche: true,
  launchStatus: true,
} satisfies Prisma.StoreSelect;

const productVisibilitySelect = {
  id: true,
  categoryId: true,
  title: true,
  description: true,
  supplierDataJson: true,
  specs: true,
  providerKey: true,
  externalId: true,
  sourceUrl: true,
  mediaStatus: true,
  qualityStatus: true,
  price: true,
  marginPercent: true,
  shippingDaysMax: true,
} satisfies Prisma.ProductSelect;

function containsAnyProductEvidence(concepts: string[]): Prisma.ProductWhereInput[] {
  return concepts.flatMap((concept) => [
    { title: { contains: concept, mode: "insensitive" as const } },
    { description: { contains: concept, mode: "insensitive" as const } },
    { specs: { contains: concept, mode: "insensitive" as const } },
  ]);
}

/**
 * A database-level coarse gate keeps obviously unrelated legacy rows out of
 * the request altogether. The full evaluator remains authoritative after the
 * query. V3 rows can prove the persisted PASS decision; legacy rows must at
 * least contain an explicit class concept and no known excluded concept.
 */
function previewEvidenceWhere(store: StoreVisibilityContext): Prisma.ProductWhereInput {
  const intent = resolveNicheIntentV1({ niche: store.niche });
  const ontology = ontologyEntryForClass(intent.productClass);
  const persistedPassEvidence: Prisma.ProductWhereInput = {
    AND: [
      { supplierDataJson: { contains: '\"candidateEvaluationV1\":' } },
      { supplierDataJson: { contains: '\"relevance\":{\"state\":\"PASS\"' } },
      { supplierDataJson: { contains: '\"previewVisibility\":{\"state\":\"PASS\"' } },
    ],
  };
  const excludedEvidence = ontology
    ? containsAnyProductEvidence([
        ...ontology.excludedClasses.flatMap((entry) => entry.concepts),
        ...intent.excludedConcepts,
      ])
    : [];
  const legacyOntologyEvidence: Prisma.ProductWhereInput | null = ontology
    ? {
        AND: [
          { OR: containsAnyProductEvidence(ontology.classConcepts) },
          ...(excludedEvidence.length > 0
            ? [{ NOT: { OR: excludedEvidence } } satisfies Prisma.ProductWhereInput]
            : []),
        ],
      }
    : null;

  return {
    mediaStatus: "OK",
    qualityStatus: { not: "BLOCKED" },
    providerKey: { not: null },
    externalId: { not: null },
    // A persisted V3 PASS is self-contained evidence, including for an
    // admin-confirmed class that is intentionally absent from the static
    // ontology. The full in-memory evaluator below still validates the entire
    // persisted contract before a product is returned. Legacy rows retain the
    // stricter static-ontology evidence path and therefore remain hidden for
    // unknown niches.
    OR: legacyOntologyEvidence
      ? [persistedPassEvidence, legacyOntologyEvidence]
      : [persistedPassEvidence],
  };
}

async function getPersistedPreviewCategories(
  storeId: string,
  visibleProductIds: string[],
  slug?: string
) {
  if (visibleProductIds.length === 0) return [];
  return prisma.category.findMany({
    where: {
      storeId,
      ...(slug ? { slug } : {}),
      products: { some: { id: { in: visibleProductIds } } },
    },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: { where: { id: { in: visibleProductIds }, isPublished: true } },
        },
      },
    },
  });
}

async function getVisiblePreviewProductIds(
  storeId: string,
  store: StoreVisibilityContext,
  where: Prisma.ProductWhereInput = {},
  options: { take?: number; orderBy?: Prisma.ProductOrderByWithRelationInput } = {}
): Promise<string[]> {
  const candidates = await prisma.product.findMany({
    where: {
      storeId,
      isPublished: true,
      AND: [where, previewEvidenceWhere(store)],
    },
    select: productVisibilitySelect,
    orderBy: options.orderBy,
    take: options.take,
  });
  return candidates
    .filter((product) => decideCatalogVisibilityV3(store, product).visible)
    .map((product) => product.id);
}

const catalogProductInclude = {
  category: { select: { slug: true } },
  _count: { select: { variants: true } },
  images: {
    where: { ingestionStatus: "STORED" },
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { url: true },
  },
  mediaAssets: {
    where: {
      mediaType: "IMAGE",
      ingestionStatus: "STORED",
      storageUrl: { not: null },
    },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    select: { storageUrl: true },
  },
} satisfies Prisma.ProductInclude;

type CatalogProductRecord = PublicProduct &
  CheckoutAvailabilityProduct & {
    category?: { slug: string } | null;
    _count?: { variants: number };
    images?: Array<{ url: string }>;
    mediaAssets?: Array<{ storageUrl: string | null }>;
  };

function toCatalogProduct(
  product: CatalogProductRecord,
  categorySlug?: string
): CatalogProduct {
  const checkoutAvailable = isProductCheckoutAvailable(product);
  const { images, mediaAssets, ...publicProduct } = product;
  Reflect.deleteProperty(publicProduct, "externalId");
  return {
    ...publicProduct,
    imageUrl: selectPublicProductImage({
      productImageUrl: product.imageUrl,
      storedAssetUrls: mediaAssets?.map((asset) => asset.storageUrl),
      storedGalleryUrls: images?.map((image) => image.url),
    }),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    checkoutAvailable,
  };
}

async function loadCatalogProducts({
  where,
  orderBy,
  take,
  categorySlug,
}: {
  where: Prisma.ProductWhereInput;
  orderBy?:
    | Prisma.ProductOrderByWithRelationInput
    | Prisma.ProductOrderByWithRelationInput[];
  take?: number;
  categorySlug?: string;
}): Promise<CatalogProduct[]> {
  const products = await prisma.product.findMany({
    where,
    orderBy,
    take,
    include: catalogProductInclude,
    omit: catalogProductQueryOmit,
  });
  return products.map((product) => toCatalogProduct(product, categorySlug));
}

export async function getCategories(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return [];

  if (store.launchStatus === "LIVE") {
    return prisma.category.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });
  }

  const visibleIds = await getVisiblePreviewProductIds(storeId, store);
  if (visibleIds.length === 0) return [];
  const category = projectVirtualCatalogCategoryV3(store);
  if (category) {
    return [{ ...category, _count: { products: visibleIds.length } }];
  }

  // Dynamic, admin-confirmed classes are not added to the static ontology.
  // Their persisted category is safe to expose only when it owns at least one
  // product that passed the full persisted V3 visibility contract above.
  return getPersistedPreviewCategories(storeId, visibleIds);
}

export async function getCategoryWithProducts(storeId: string, slug: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return null;

  if (store.launchStatus === "LIVE") {
    const category = await prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    if (!category) return null;
    const products = await loadCatalogProducts({
      where: { storeId, categoryId: category.id, isPublished: true },
      orderBy: { productScore: "desc" },
    });
    return { ...category, products };
  }

  const virtualCategory = projectVirtualCatalogCategoryV3(store);

  if (!virtualCategory) {
    const persistedCategory = await prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    if (!persistedCategory) return null;
    const visibleIds = await getVisiblePreviewProductIds(storeId, store, {
      categoryId: persistedCategory.id,
    });
    if (visibleIds.length === 0) return null;
    const products = await loadCatalogProducts({
      where: { storeId, id: { in: visibleIds }, isPublished: true },
      orderBy: { productScore: "desc" },
      categorySlug: persistedCategory.slug,
    });
    const category = selectPreviewCatalogCategoryV3(store, persistedCategory, true);
    return category ? { ...category, products } : null;
  }

  if (slug !== virtualCategory.slug) {
    const legacyCategory = await prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
      select: { id: true },
    });
    if (!legacyCategory) return null;
    const legacyVisibleIds = await getVisiblePreviewProductIds(storeId, store, {
      categoryId: legacyCategory.id,
    });
    if (legacyVisibleIds.length === 0) return null;
  }

  const visibleIds = await getVisiblePreviewProductIds(storeId, store);
  if (visibleIds.length === 0) return null;
  const products = await loadCatalogProducts({
    where: { storeId, id: { in: visibleIds }, isPublished: true },
    orderBy: { productScore: "desc" },
    categorySlug: virtualCategory.slug,
  });
  return { ...virtualCategory, products };
}

const fullProductInclude = {
  category: true,
  images: {
    where: {
      OR: [
        { ingestionStatus: "STORED" },
        { url: { startsWith: "/" } },
      ],
    },
    orderBy: { sortOrder: "asc" as const },
  },
  mediaAssets: {
    where: { ingestionStatus: "STORED", storageUrl: { not: null } },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
  variants: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
} satisfies Prisma.ProductInclude;

export async function getProductBySlug(storeId: string, slug: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return null;

  if (store.launchStatus === "LIVE") {
    return prisma.product.findFirst({
      where: { storeId, slug, isPublished: true },
      include: fullProductInclude,
    });
  }

  const evidence = await prisma.product.findFirst({
    where: {
      storeId,
      slug,
      isPublished: true,
      AND: [previewEvidenceWhere(store)],
    },
    select: productVisibilitySelect,
  });
  if (!evidence || !decideCatalogVisibilityV3(store, evidence).visible) return null;
  const product = await prisma.product.findUnique({
    where: { id: evidence.id },
    include: fullProductInclude,
  });
  if (!product) return null;
  const category = selectPreviewCatalogCategoryV3(store, product.category, true);
  // The product itself already passed V3 visibility. For a dynamic class, the
  // selector therefore permits its tenant-scoped persisted category; known
  // classes continue to receive the static virtual category.
  return category ? { ...product, category } : null;
}

export async function getFeaturedProducts(
  storeId: string,
  limit = 8
): Promise<CatalogProduct[]> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return [];

  if (store.launchStatus === "LIVE") {
    return loadCatalogProducts({
      where: { storeId, isPublished: true },
      orderBy: { productScore: "desc" },
      take: limit,
    });
  }

  const visibleIds = await getVisiblePreviewProductIds(
    storeId,
    store,
    {},
    { orderBy: { productScore: "desc" }, take: Math.max(limit * 5, 50) }
  );
  if (visibleIds.length === 0) return [];
  const category = projectVirtualCatalogCategoryV3(store);
  return loadCatalogProducts({
    where: { storeId, id: { in: visibleIds }, isPublished: true },
    orderBy: { productScore: "desc" },
    take: limit,
    categorySlug: category?.slug,
  });
}

export async function getRelatedProducts(
  storeId: string,
  categoryId: string,
  excludeProductId: string,
  limit = 4
): Promise<CatalogProduct[]> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return [];
  const category = projectVirtualCatalogCategoryV3(store);
  const baseWhere: Prisma.ProductWhereInput = {
    id: { not: excludeProductId },
  };

  if (store.launchStatus === "LIVE") {
    const sameCategory = await loadCatalogProducts({
      where: {
        storeId,
        categoryId,
        isPublished: true,
        ...baseWhere,
      },
      orderBy: { productScore: "desc" },
      take: limit,
    });
    if (sameCategory.length >= limit) return sameCategory;
    const filler = await loadCatalogProducts({
      where: {
        storeId,
        isPublished: true,
        id: { notIn: [excludeProductId, ...sameCategory.map((product) => product.id)] },
      },
      orderBy: { productScore: "desc" },
      take: limit - sameCategory.length,
    });
    return [...sameCategory, ...filler];
  }

  const sameCategoryIds = await getVisiblePreviewProductIds(
    storeId,
    store,
    { categoryId, ...baseWhere },
    { orderBy: { productScore: "desc" } }
  );
  const sameCategory = sameCategoryIds.length
      ? await loadCatalogProducts({
        where: { storeId, id: { in: sameCategoryIds }, isPublished: true },
        orderBy: { productScore: "desc" },
        take: limit,
        categorySlug: category?.slug,
      })
    : [];
  if (sameCategory.length >= limit) return sameCategory;

  const excludedIds = [excludeProductId, ...sameCategory.map((product) => product.id)];
  const fillerIds = await getVisiblePreviewProductIds(
    storeId,
    store,
    { id: { notIn: excludedIds } },
    { orderBy: { productScore: "desc" } }
  );
  const filler = fillerIds.length
      ? await loadCatalogProducts({
        where: { storeId, id: { in: fillerIds }, isPublished: true },
        orderBy: { productScore: "desc" },
        take: limit - sameCategory.length,
        categorySlug: category?.slug,
      })
    : [];
  return [...sameCategory, ...filler];
}

export const getGuides = cache(async (storeId: string) => {
  return prisma.contentPage.findMany({
    where: { storeId, type: "GUIDE", isPublished: true },
    orderBy: { createdAt: "asc" },
  });
});

export const getGuideBySlug = cache(async (storeId: string, slug: string) => {
  return prisma.contentPage.findUnique({
    where: { storeId_slug: { storeId, slug } },
  });
});

export const getComparisonPage = cache(async (storeId: string) => {
  return prisma.contentPage.findFirst({
    where: { storeId, type: "COMPARISON", isPublished: true },
  });
});

export const getHomepageFaq = cache(async (storeId: string, includeNoindex: boolean) => {
  return prisma.contentPage.findFirst({
    where: {
      storeId,
      type: "FAQ",
      isPublished: true,
      ...(includeNoindex ? {} : { noindex: false }),
    },
    orderBy: { id: "asc" },
  });
});

export async function getProductsByIds(
  storeId: string,
  ids: string[]
): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return [];

  const visibleIds =
    store.launchStatus === "LIVE"
      ? ids
      : await getVisiblePreviewProductIds(storeId, store, { id: { in: ids } });
  if (visibleIds.length === 0) return [];
  const category = projectVirtualCatalogCategoryV3(store);
  const products = await loadCatalogProducts({
    where: { storeId, id: { in: visibleIds }, isPublished: true },
    categorySlug: category?.slug,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids
    .map((id) => byId.get(id))
    .filter((product): product is (typeof products)[number] => Boolean(product));
}

export async function searchProducts(
  storeId: string,
  query: string
): Promise<CatalogProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: storeVisibilitySelect,
  });
  if (!store) return [];
  const searchWhere: Prisma.ProductWhereInput = {
    OR: [
      { title: { contains: trimmed } },
      { description: { contains: trimmed } },
      { brand: { contains: trimmed } },
      { subtitle: { contains: trimmed } },
    ],
  };
  const visibleIds =
    store.launchStatus === "LIVE"
      ? null
      : await getVisiblePreviewProductIds(storeId, store, searchWhere, {
          orderBy: { productScore: "desc" },
          take: 120,
        });
  if (visibleIds && visibleIds.length === 0) return [];
  const category = projectVirtualCatalogCategoryV3(store);
  return loadCatalogProducts({
    where: {
      storeId,
      isPublished: true,
      ...(visibleIds ? { id: { in: visibleIds } } : searchWhere),
    },
    orderBy: { productScore: "desc" },
    take: 24,
    categorySlug: category?.slug,
  });
}
