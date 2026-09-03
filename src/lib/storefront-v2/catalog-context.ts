import { z } from "zod";
import {
  StorefrontProductV2Schema,
  type StorefrontProductV2,
} from "@/lib/catalog-v2/contracts";
import type { CatalogProjectionV2 } from "@/lib/catalog-v2/catalog-projection";
import {
  CatalogProjectionAttributeDefinitionV2Schema,
  type CatalogProjectionAttributeDefinitionV2,
} from "@/lib/catalog-v2/projection-contracts";
import type { StoreExperienceClaimV2 } from "./validation-types";

export const STORE_EXPERIENCE_CATALOG_PROJECTION_V2 =
  "store-experience-catalog-projection.v2" as const;

/**
 * The experience generator consumes only the public Catalog V2 projection.
 * Store/category labels are presentation metadata; product truth stays in the
 * imported StorefrontProductV2 contract.
 */
const safeCatalogText = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => !/[<>{}]|javascript\s*:|data\s*:\s*text\/html/i.test(value), {
    message: "Catalog presentation text must be plain text",
  });

export const StoreExperienceCategoryProjectionV2Schema = z
  .object({
    categoryId: z.string().trim().min(1).max(180),
    parentCategoryId: z.string().trim().min(1).max(180).nullable(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: safeCatalogText.pipe(z.string().max(160)),
    description: z.string().trim().max(1_000).nullable(),
    path: z
      .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
      .min(1)
      .max(16),
    depth: z.number().int().nonnegative().max(15),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const StoreExperienceCollectionProjectionV2Schema = z
  .object({
    collectionId: z.string().trim().min(1).max(180),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: safeCatalogText.pipe(z.string().max(160)),
    description: z.string().trim().max(1_000).nullable(),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const StoreExperienceCatalogProjectionV2Schema = z
  .object({
    version: z.literal(STORE_EXPERIENCE_CATALOG_PROJECTION_V2),
    projectionRef: z.string().trim().min(1).max(180),
    store: z
      .object({
        name: safeCatalogText.pipe(z.string().max(120)),
        niche: safeCatalogText.pipe(z.string().max(180)),
      })
      .strict(),
    products: z.array(StorefrontProductV2Schema).min(1).max(10_000),
    categories: z.array(StoreExperienceCategoryProjectionV2Schema).min(1).max(1_000),
    collections: z
      .array(StoreExperienceCollectionProjectionV2Schema)
      .max(1_000),
    attributeDefinitions: z
      .array(CatalogProjectionAttributeDefinitionV2Schema)
      .max(10_000),
    /** Claims are supplied by server-owned policy/operations code, never copy. */
    verifiedClaims: z
      .array(
        z.enum([
          "secure-checkout",
          "clear-returns",
          "merchant-support",
          "verified-availability",
        ])
      )
      .default([]),
  })
  .strict()
  .superRefine((catalog, context) => {
    for (const [path, values] of [
      ["products", catalog.products.map((product) => product.productId)],
      ["categories", catalog.categories.map((category) => category.categoryId)],
      ["collections", catalog.collections.map((collection) => collection.collectionId)],
      [
        "attributeDefinitions",
        catalog.attributeDefinitions.map(
          (definition) => definition.attributeDefinitionId
        ),
      ],
    ] as const) {
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: `${path} must have unique stable IDs`,
        });
      }
    }

    const categories = new Map(
      catalog.categories.map((category) => [category.categoryId, category])
    );
    const collectionIds = new Set(
      catalog.collections.map((collection) => collection.collectionId)
    );
    const collectionSlugs = new Set<string>();
    catalog.collections.forEach((collection, index) => {
      if (collectionSlugs.has(collection.slug)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["collections", index, "slug"],
          message: "collections must have unique slugs",
        });
      }
      collectionSlugs.add(collection.slug);
    });

    catalog.categories.forEach((category, index) => {
      const parent = category.parentCategoryId
        ? categories.get(category.parentCategoryId)
        : null;
      const expectedPath = parent
        ? [...parent.path, category.slug]
        : [category.slug];
      if (
        (category.parentCategoryId && !parent) ||
        category.depth !== (parent ? parent.depth + 1 : 0) ||
        JSON.stringify(category.path) !== JSON.stringify(expectedPath)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories", index],
          message: "category hierarchy must have a valid parent, depth and path",
        });
      }
    });

    catalog.attributeDefinitions.forEach((definition, definitionIndex) => {
      definition.appliesToTaxonomyNodeIds.forEach(
        (categoryId, categoryIndex) => {
          if (!categories.has(categoryId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                "attributeDefinitions",
                definitionIndex,
                "appliesToTaxonomyNodeIds",
                categoryIndex,
              ],
              message:
                "attribute definition taxonomy references must exist in categories",
            });
          }
        }
      );
    });

    catalog.products.forEach((product, productIndex) => {
      product.taxonomyNodeIds.forEach((categoryId, categoryIndex) => {
        if (!categories.has(categoryId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", productIndex, "taxonomyNodeIds", categoryIndex],
            message: "product taxonomy references must exist in categories",
          });
        }
      });
      product.collections.forEach((membership, membershipIndex) => {
        if (!collectionIds.has(membership.collectionId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", productIndex, "collections", membershipIndex],
            message: "product collection references must exist in collections",
          });
        }
      });
    });
  });

export type StoreExperienceCatalogProjectionV2 = z.infer<
  typeof StoreExperienceCatalogProjectionV2Schema
>;
export type StoreExperienceCategoryProjectionV2 = z.infer<
  typeof StoreExperienceCategoryProjectionV2Schema
>;
export type StoreExperienceCollectionProjectionV2 = z.infer<
  typeof StoreExperienceCollectionProjectionV2Schema
>;

/** Bridges the content-addressed public catalog snapshot into presentation context. */
export function catalogProjectionToStoreExperienceV2(input: {
  catalog: CatalogProjectionV2;
  store: StoreExperienceCatalogProjectionV2["store"];
  verifiedClaims?: readonly StoreExperienceClaimV2[];
}): StoreExperienceCatalogProjectionV2 {
  return {
    version: STORE_EXPERIENCE_CATALOG_PROJECTION_V2,
    projectionRef: input.catalog.projectionRef,
    store: { ...input.store },
    products: [...input.catalog.products],
    categories: [...input.catalog.taxonomy.nodes]
      .sort(
        (left, right) =>
          left.position - right.position ||
          left.taxonomyNodeId.localeCompare(right.taxonomyNodeId)
      )
      .map((node) => ({
        categoryId: node.taxonomyNodeId,
        parentCategoryId: node.parentId,
        slug: node.slug,
        title: node.name,
        description: node.description,
        path: [...node.path],
        depth: node.depth,
        position: node.position,
      })),
    collections: [...input.catalog.collections]
      .sort(
        (left, right) =>
          left.position - right.position ||
          left.collectionId.localeCompare(right.collectionId)
      )
      .map((collection) => ({
        collectionId: collection.collectionId,
        slug: collection.slug,
        title: collection.title,
        description: collection.description,
        position: collection.position,
      })),
    attributeDefinitions: input.catalog.attributeDefinitions.map(
      (definition) => ({
        ...definition,
        allowedValues: definition.allowedValues.map((value) => ({ ...value })),
        appliesToTaxonomyNodeIds: [...definition.appliesToTaxonomyNodeIds],
      })
    ),
    verifiedClaims: [...(input.verifiedClaims ?? [])],
  };
}

export function productReferenceSetV2(
  catalog: StoreExperienceCatalogProjectionV2
): ReadonlySet<string> {
  return new Set(catalog.products.map((product) => product.productId));
}

export function categoryReferenceSetV2(
  catalog: StoreExperienceCatalogProjectionV2
): ReadonlySet<string> {
  const references = new Set<string>();
  for (const category of catalog.categories) {
    references.add(category.categoryId);
  }
  for (const product of catalog.products) {
    for (const taxonomyNodeId of product.taxonomyNodeIds) {
      references.add(taxonomyNodeId);
    }
  }
  return references;
}

export function collectionReferenceSetV2(
  catalog: StoreExperienceCatalogProjectionV2
): ReadonlySet<string> {
  return new Set(catalog.collections.map((collection) => collection.collectionId));
}

/** Includes a selected taxonomy node and every normalized descendant. */
export function categoryDescendantReferenceSetV2(
  catalog: StoreExperienceCatalogProjectionV2,
  categoryRef: string
): ReadonlySet<string> {
  const selected = findExperienceCategoryV2(catalog, categoryRef);
  if (!selected) return new Set();
  return new Set(
    catalog.categories
      .filter(
        (category) =>
          category.path.length >= selected.path.length &&
          selected.path.every(
            (segment, index) => category.path[index] === segment
          )
      )
      .map((category) => category.categoryId)
  );
}

/**
 * Returns only facetable definitions that apply to, and have a public value in,
 * the products being rendered. Product and variant scopes share one generic
 * ordered facet surface; no attribute key is niche-special-cased.
 */
export function storeExperienceFacetKeysV2(
  catalog: StoreExperienceCatalogProjectionV2,
  products: readonly StorefrontProductV2[]
): string[] {
  const taxonomyNodeIds = taxonomyContextReferenceSetV2(catalog, products);
  const hasPublicValue = (
    definition: CatalogProjectionAttributeDefinitionV2
  ) =>
    products.some((product) =>
      definition.scope === "PRODUCT"
        ? product.attributes.some(
            (attribute) => attribute.key === definition.key
          )
        : product.variants.some((variant) =>
            variant.attributes.some(
              (attribute) => attribute.key === definition.key
            )
          )
    );

  return catalog.attributeDefinitions
    .filter(
      (definition) =>
        definition.facetable &&
        definition.appliesToTaxonomyNodeIds.some((categoryId) =>
          taxonomyNodeIds.has(categoryId)
        ) &&
        hasPublicValue(definition)
    )
    .sort(
      (left, right) =>
        left.position - right.position ||
        left.attributeDefinitionId.localeCompare(right.attributeDefinitionId)
    )
    .map((definition) => definition.key)
    .filter((key, index, keys) => keys.indexOf(key) === index);
}

function taxonomyContextReferenceSetV2(
  catalog: StoreExperienceCatalogProjectionV2,
  products: readonly StorefrontProductV2[]
): ReadonlySet<string> {
  const categories = new Map(
    catalog.categories.map((category) => [category.categoryId, category])
  );
  const references = new Set<string>();
  for (const product of products) {
    for (const taxonomyNodeId of product.taxonomyNodeIds) {
      let cursor = categories.get(taxonomyNodeId);
      while (cursor && !references.has(cursor.categoryId)) {
        references.add(cursor.categoryId);
        cursor = cursor.parentCategoryId
          ? categories.get(cursor.parentCategoryId)
          : undefined;
      }
    }
  }
  return references;
}

export function findStorefrontProductV2(
  catalog: StoreExperienceCatalogProjectionV2,
  productRef: string
): StorefrontProductV2 | undefined {
  return catalog.products.find((product) => product.productId === productRef);
}

export function findExperienceCategoryV2(
  catalog: StoreExperienceCatalogProjectionV2,
  categoryRef: string
): StoreExperienceCategoryProjectionV2 | undefined {
  return catalog.categories.find(
    (category) => category.categoryId === categoryRef
  );
}

export function findExperienceCollectionV2(
  catalog: StoreExperienceCatalogProjectionV2,
  collectionRef: string
): StoreExperienceCollectionProjectionV2 | undefined {
  return catalog.collections.find(
    (collection) => collection.collectionId === collectionRef
  );
}
