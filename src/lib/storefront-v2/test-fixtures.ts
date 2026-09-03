import type { StorefrontProductV2 } from "@/lib/catalog-v2/contracts";
import {
  STORE_EXPERIENCE_CATALOG_PROJECTION_V2,
  type StoreExperienceCatalogProjectionV2,
} from "./catalog-context";

export function storefrontProductFixtureV2(
  index: number,
  overrides: Partial<StorefrontProductV2> = {}
): StorefrontProductV2 {
  return {
    version: "catalog-storefront-product.v2",
    productId: `product-${index}`,
    revisionId: `revision-${index}`,
    slug: `product-${index}`,
    taxonomyNodeIds: [`category-${index % 2}`],
    title: `Product ${index}`,
    subtitle: `Catalog subtitle ${index}`,
    description: `Catalog description ${index}`,
    seoTitle: `Product ${index} | North Light`,
    seoDescription: `Explore Product ${index} with verified catalog details.`,
    brand: "Catalog Brand",
    price: {
      state: "KNOWN",
      money: {
        version: "catalog-money.v2",
        currency: "NOK",
        amountMinor: 10_000 + index * 100,
      },
    },
    compareAtPrice: null,
    availability: "IN_STOCK",
    attributes: [],
    variants: [],
    purchaseOptions: [],
    media: [
      {
        mediaId: `media-${index}`,
        kind: "IMAGE",
        role: "PRIMARY",
        publicUrl: `https://cdn.example.test/products/${index}.jpg`,
        altText: `Product ${index}`,
        focalPoint: null,
        variantIds: [],
        position: 0,
      },
    ],
    collections: [],
    purchasable: true,
    ...overrides,
  } as StorefrontProductV2;
}

export function storeExperienceCatalogFixtureV2(
  productCount = 4
): StoreExperienceCatalogProjectionV2 {
  return {
    version: STORE_EXPERIENCE_CATALOG_PROJECTION_V2,
    projectionRef: "catalog-projection-2",
    store: { name: "North Light", niche: "desk lighting" },
    products: Array.from({ length: productCount }, (_, index) =>
      storefrontProductFixtureV2(index + 1)
    ),
    categories: [
      {
        categoryId: "category-0",
        parentCategoryId: null,
        slug: "reading-lights",
        title: "Reading lights",
        description: "Projected reading-light products.",
        path: ["reading-lights"],
        depth: 0,
        position: 0,
      },
      {
        categoryId: "category-1",
        parentCategoryId: null,
        slug: "desk-lamps",
        title: "Desk lamps",
        description: "Projected desk-lamp products.",
        path: ["desk-lamps"],
        depth: 0,
        position: 1,
      },
    ],
    collections: [],
    attributeDefinitions: [],
    verifiedClaims: [
      "secure-checkout",
      "clear-returns",
      "merchant-support",
      "verified-availability",
    ],
  };
}
