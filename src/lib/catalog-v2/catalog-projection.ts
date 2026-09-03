import { z } from "zod";
import { canonicalizeCatalogValue, digestCatalogValue } from "./canonical";
import {
  TAXONOMY_V2,
  CatalogReferenceFixtureV2Schema,
  StorefrontProductV2Schema,
  TaxonomyNodeV2Schema,
  TaxonomyV2Schema,
  type AttributeDefinitionV2,
  type CatalogReferenceFixtureV2,
  type ProductRevisionV2,
  type StorefrontProductV2,
} from "./contracts";
import { projectStorefrontProductV2 } from "./projection";
import {
  CatalogProjectionAttributeDefinitionV2Schema,
  type CatalogProjectionAttributeDefinitionV2,
} from "./projection-contracts";

export { CatalogProjectionAttributeDefinitionV2Schema };
export type { CatalogProjectionAttributeDefinitionV2 };

export const CATALOG_PROJECTION_V2 = "catalog-projection.v2" as const;

const projectionIdSchema = z
  .string()
  .regex(/^catalog-projection:sha256:[a-f0-9]{64}$/);
const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const CatalogProjectionCollectionV2Schema = z
  .object({
    collectionId: idSchema,
    slug: slugSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1_000).nullable(),
    position: z.number().int().nonnegative(),
  })
  .strict();

const catalogProjectionContentSchema = z
  .object({
    version: z.literal(CATALOG_PROJECTION_V2),
    generatedAt: z.string().datetime({ offset: true }),
    taxonomy: z
      .object({
        taxonomyId: idSchema,
        nodes: z.array(TaxonomyNodeV2Schema).min(1),
      })
      .strict(),
    collections: z.array(CatalogProjectionCollectionV2Schema),
    attributeDefinitions: z.array(
      CatalogProjectionAttributeDefinitionV2Schema
    ),
    products: z.array(StorefrontProductV2Schema),
  })
  .strict();

function projectionContent(input: {
  version: typeof CATALOG_PROJECTION_V2;
  generatedAt: string;
  taxonomy: z.infer<typeof catalogProjectionContentSchema>["taxonomy"];
  collections: z.infer<typeof CatalogProjectionCollectionV2Schema>[];
  attributeDefinitions: z.infer<
    typeof CatalogProjectionAttributeDefinitionV2Schema
  >[];
  products: StorefrontProductV2[];
}) {
  return input;
}

export const CatalogProjectionV2Schema = catalogProjectionContentSchema
  .extend({ projectionRef: projectionIdSchema })
  .strict()
  .superRefine((projection, ctx) => {
    if (
      !TaxonomyV2Schema.safeParse({
        version: TAXONOMY_V2,
        taxonomyId: projection.taxonomy.taxonomyId,
        nodes: projection.taxonomy.nodes,
      }).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxonomy"],
        message: "Catalog projection taxonomy hierarchy is invalid",
      });
    }
    const taxonomyNodeIds = new Set(
      projection.taxonomy.nodes.map((node) => node.taxonomyNodeId)
    );
    const collectionIds = new Set<string>();
    const collectionSlugs = new Set<string>();
    projection.collections.forEach((collection, index) => {
      if (collectionIds.has(collection.collectionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["collections", index, "collectionId"],
          message: "Catalog projection collection IDs must be unique",
        });
      }
      if (collectionSlugs.has(collection.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["collections", index, "slug"],
          message: "Catalog projection collection slugs must be unique",
        });
      }
      collectionIds.add(collection.collectionId);
      collectionSlugs.add(collection.slug);
    });
    const productIds = new Set<string>();
    const productSlugs = new Set<string>();
    const definitionIds = new Set<string>();

    projection.attributeDefinitions.forEach((definition, index) => {
      if (definitionIds.has(definition.attributeDefinitionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attributeDefinitions", index, "attributeDefinitionId"],
          message: "Catalog projection attribute definition IDs must be unique",
        });
      }
      definitionIds.add(definition.attributeDefinitionId);
      if (
        new Set(definition.appliesToTaxonomyNodeIds).size !==
        definition.appliesToTaxonomyNodeIds.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attributeDefinitions", index, "appliesToTaxonomyNodeIds"],
          message: "Attribute definition taxonomy references must be unique",
        });
      }
      definition.appliesToTaxonomyNodeIds.forEach((taxonomyNodeId, taxonomyIndex) => {
        if (!taxonomyNodeIds.has(taxonomyNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "attributeDefinitions",
              index,
              "appliesToTaxonomyNodeIds",
              taxonomyIndex,
            ],
            message: "Attribute definition taxonomy reference must exist",
          });
        }
      });
    });

    projection.products.forEach((product, productIndex) => {
      if (productIds.has(product.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["products", productIndex, "productId"],
          message: "Catalog projection product IDs must be unique",
        });
      }
      if (productSlugs.has(product.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["products", productIndex, "slug"],
          message: "Catalog projection product slugs must be unique",
        });
      }
      productIds.add(product.productId);
      productSlugs.add(product.slug);

      product.taxonomyNodeIds.forEach((taxonomyNodeId, taxonomyIndex) => {
        if (!taxonomyNodeIds.has(taxonomyNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", productIndex, "taxonomyNodeIds", taxonomyIndex],
            message: "Product taxonomy reference must exist",
          });
        }
      });
      product.collections.forEach((membership, membershipIndex) => {
        if (!collectionIds.has(membership.collectionId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "products",
              productIndex,
              "collections",
              membershipIndex,
              "collectionId",
            ],
            message: "Product collection reference must exist and be public",
          });
        }
      });

      const applicableDefinitions = projection.attributeDefinitions.filter(
        (definition) =>
          definition.appliesToTaxonomyNodeIds.some((taxonomyNodeId) =>
            product.taxonomyNodeIds.includes(taxonomyNodeId)
          )
      );
      product.attributes.forEach((attribute, attributeIndex) => {
        if (
          !applicableDefinitions.some(
            (definition) =>
              definition.scope === "PRODUCT" && definition.key === attribute.key
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", productIndex, "attributes", attributeIndex, "key"],
            message: "Product attribute requires an applicable public definition",
          });
        }
      });
      product.variants.forEach((variant, variantIndex) => {
        variant.attributes.forEach((attribute, attributeIndex) => {
          if (
            !applicableDefinitions.some(
              (definition) =>
                definition.scope === "VARIANT" && definition.key === attribute.key
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                "products",
                productIndex,
                "variants",
                variantIndex,
                "attributes",
                attributeIndex,
                "key",
              ],
              message: "Variant attribute requires an applicable public definition",
            });
          }
        });
      });
    });

    const content = projectionContent({
      version: projection.version,
      generatedAt: projection.generatedAt,
      taxonomy: projection.taxonomy,
      collections: projection.collections,
      attributeDefinitions: projection.attributeDefinitions,
      products: projection.products,
    });
    const expectedRef = `catalog-projection:${digestCatalogValue(content)}`;
    if (projection.projectionRef !== expectedRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectionRef"],
        message: "Catalog projection ref must match its canonical content digest",
      });
    }
  });

export type CatalogProjectionCollectionV2 = z.infer<
  typeof CatalogProjectionCollectionV2Schema
>;
export type CatalogProjectionV2 = z.infer<typeof CatalogProjectionV2Schema>;

export type CatalogProjectionBuildRefusalReasonV2 =
  | "INVALID_REFERENCE_FIXTURE"
  | "PRODUCT_PROJECTION_REFUSED"
  | "CONFLICTING_ATTRIBUTE_DEFINITION"
  | "INVALID_CATALOG_PROJECTION";

export type CatalogProjectionBuildResultV2 =
  | {
      status: "PROJECTED";
      projection: CatalogProjectionV2;
      reasonCodes: [];
    }
  | {
      status: "REFUSED";
      projection: null;
      reasonCodes: CatalogProjectionBuildRefusalReasonV2[];
    };

function latestPublishedRevisions(
  fixture: CatalogReferenceFixtureV2
): ProductRevisionV2[] {
  const byProductId = new Map<string, ProductRevisionV2[]>();
  fixture.productRevisions.forEach((revision) => {
    const revisions = byProductId.get(revision.productId) ?? [];
    revisions.push(revision);
    byProductId.set(revision.productId, revisions);
  });
  return [...byProductId.values()].flatMap((revisions) => {
    const published = revisions
      .filter((revision) => revision.revisionState === "PUBLISHED")
      .sort((left, right) => right.revisionNumber - left.revisionNumber);
    return published[0] ? [published[0]] : [];
  });
}

function publicDefinition(
  definition: AttributeDefinitionV2,
  taxonomyNodeIds: string[]
): CatalogProjectionAttributeDefinitionV2 {
  return {
    attributeDefinitionId: definition.attributeDefinitionId,
    key: definition.key,
    label: definition.label,
    dataType: definition.dataType,
    cardinality: definition.cardinality,
    scope: definition.scope,
    variantAxis: definition.variantAxis,
    facetable: definition.facetable,
    comparable: definition.comparable,
    unitCode: definition.unitCode,
    allowedValues: definition.allowedValues,
    position: definition.position,
    appliesToTaxonomyNodeIds: [...taxonomyNodeIds].sort(),
  };
}

function publicDefinitionSignature(
  definition: CatalogProjectionAttributeDefinitionV2
): string {
  return canonicalizeCatalogValue({
    attributeDefinitionId: definition.attributeDefinitionId,
    key: definition.key,
    label: definition.label,
    dataType: definition.dataType,
    cardinality: definition.cardinality,
    scope: definition.scope,
    variantAxis: definition.variantAxis,
    facetable: definition.facetable,
    comparable: definition.comparable,
    unitCode: definition.unitCode,
    allowedValues: definition.allowedValues,
    position: definition.position,
  });
}

/**
 * Builds a content-addressed public catalog snapshot from a validated fixture.
 * Any invalid reference, conflicting public definition, or unprojectable live
 * product refuses the entire immutable snapshot.
 */
export function buildCatalogProjectionV2(
  input: unknown
): CatalogProjectionBuildResultV2 {
  const parsedFixture = CatalogReferenceFixtureV2Schema.safeParse(input);
  if (!parsedFixture.success) {
    return {
      status: "REFUSED",
      projection: null,
      reasonCodes: ["INVALID_REFERENCE_FIXTURE"],
    };
  }
  const fixture = parsedFixture.data;
  const publicCollectionIds = new Set(
    fixture.collections
      .filter((collection) => collection.publicationState === "PUBLIC")
      .map((collection) => collection.collectionId)
  );
  const definitionById = new Map<
    string,
    CatalogProjectionAttributeDefinitionV2
  >();
  const products: StorefrontProductV2[] = [];

  for (const revision of latestPublishedRevisions(fixture)) {
    const projected = projectStorefrontProductV2(revision);
    if (projected.status !== "PROJECTED") {
      return {
        status: "REFUSED",
        projection: null,
        reasonCodes: ["PRODUCT_PROJECTION_REFUSED"],
      };
    }
    const publicProduct = StorefrontProductV2Schema.parse({
      ...projected.product,
      collections: projected.product.collections.filter((membership) =>
        publicCollectionIds.has(membership.collectionId)
      ),
    });
    products.push(publicProduct);

    for (const definition of revision.attributeDefinitions.filter(
      (candidate) => candidate.storefrontVisible
    )) {
      const next = publicDefinition(definition, revision.taxonomyNodeIds);
      const existing = definitionById.get(definition.attributeDefinitionId);
      if (!existing) {
        definitionById.set(definition.attributeDefinitionId, next);
        continue;
      }
      if (
        publicDefinitionSignature(existing) !== publicDefinitionSignature(next)
      ) {
        return {
          status: "REFUSED",
          projection: null,
          reasonCodes: ["CONFLICTING_ATTRIBUTE_DEFINITION"],
        };
      }
      existing.appliesToTaxonomyNodeIds = [
        ...new Set([
          ...existing.appliesToTaxonomyNodeIds,
          ...revision.taxonomyNodeIds,
        ]),
      ].sort();
    }
  }

  const content = projectionContent({
    version: CATALOG_PROJECTION_V2,
    generatedAt: fixture.generatedAt,
    taxonomy: {
      taxonomyId: fixture.taxonomy.taxonomyId,
      nodes: [...fixture.taxonomy.nodes].sort((left, right) => {
        if (left.depth !== right.depth) return left.depth - right.depth;
        const leftPath = left.path.join("/");
        const rightPath = right.path.join("/");
        return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0;
      }),
    },
    collections: fixture.collections
      .filter((collection) => collection.publicationState === "PUBLIC")
      .map((collection) => ({
        collectionId: collection.collectionId,
        slug: collection.slug,
        title: collection.title,
        description: collection.description,
        position: collection.position,
      }))
      .sort((left, right) =>
        left.position !== right.position
          ? left.position - right.position
          : left.collectionId.localeCompare(right.collectionId)
      ),
    attributeDefinitions: [...definitionById.values()].sort((left, right) =>
      left.position !== right.position
        ? left.position - right.position
        : left.attributeDefinitionId.localeCompare(right.attributeDefinitionId)
    ),
    products: products.sort((left, right) => left.slug.localeCompare(right.slug)),
  });
  const candidate = {
    ...content,
    projectionRef: `catalog-projection:${digestCatalogValue(content)}`,
  };
  const parsedProjection = CatalogProjectionV2Schema.safeParse(candidate);
  if (!parsedProjection.success) {
    return {
      status: "REFUSED",
      projection: null,
      reasonCodes: ["INVALID_CATALOG_PROJECTION"],
    };
  }
  return { status: "PROJECTED", projection: parsedProjection.data, reasonCodes: [] };
}

export const projectCatalogFixtureV2 = buildCatalogProjectionV2;
