import { z } from "zod";

const publicProjectionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/);

const publicProjectionSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Browser-safe public attribute-definition contract. Digest construction lives
 * in catalog-projection.ts so renderers never pull Node crypto into the client.
 */
export const CatalogProjectionAttributeDefinitionV2Schema = z
  .object({
    attributeDefinitionId: publicProjectionIdSchema,
    key: publicProjectionSlugSchema,
    label: z.string().trim().min(1).max(120),
    dataType: z.enum(["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "ENUM"]),
    cardinality: z.enum(["SINGLE", "MULTIPLE"]),
    scope: z.enum(["PRODUCT", "VARIANT"]),
    variantAxis: z.boolean(),
    facetable: z.boolean(),
    comparable: z.boolean(),
    unitCode: z.string().trim().min(1).max(24).nullable(),
    allowedValues: z.array(
      z
        .object({
          code: publicProjectionSlugSchema,
          label: z.string().trim().min(1).max(120),
        })
        .strict()
    ),
    position: z.number().int().nonnegative(),
    appliesToTaxonomyNodeIds: z.array(publicProjectionIdSchema).min(1),
  })
  .strict();

export type CatalogProjectionAttributeDefinitionV2 = z.infer<
  typeof CatalogProjectionAttributeDefinitionV2Schema
>;
