import { z } from "zod";

export const CATALOG_CORE_V2 = "catalog-core.v2" as const;
export const MONEY_V2 = "catalog-money.v2" as const;
export const TAXONOMY_V2 = "catalog-taxonomy.v2" as const;
export const COLLECTION_V2 = "catalog-collection.v2" as const;
export const EVIDENCE_V2 = "catalog-evidence.v2" as const;
export const PRODUCT_REVISION_V2 = "catalog-product-revision.v2" as const;
export const SUPPLIER_OFFER_V2 = "catalog-supplier-offer.v2" as const;
export const SUPPLIER_OBSERVATION_V2 =
  "catalog-supplier-offer-observation.v2" as const;
export const STOREFRONT_PRODUCT_V2 = "catalog-storefront-product.v2" as const;
export const REFERENCE_FIXTURE_V2 = "catalog-reference-fixture.v2" as const;

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

const isoDateTimeSchema = z.string().datetime({ offset: true });

const httpsUrlSchema = z
  .string()
  .url()
  .max(2_000)
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Catalog media URLs must use HTTPS",
  });

export const DigestV2Schema = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/);

export const MoneyV2Schema = z
  .object({
    version: z.literal(MONEY_V2),
    currency: z.string().regex(/^[A-Z]{3}$/),
    amountMinor: z.number().int().safe().nonnegative(),
  })
  .strict();

export type MoneyV2 = z.infer<typeof MoneyV2Schema>;

export const RetailPriceV2Schema = z.discriminatedUnion("state", [
  z
    .object({ state: z.literal("KNOWN"), money: MoneyV2Schema })
    .strict(),
  z
    .object({ state: z.literal("UNKNOWN"), money: z.null() })
    .strict(),
]);

export type RetailPriceV2 = z.infer<typeof RetailPriceV2Schema>;

/** Unknown is explicit and never treated as a positive commerce signal. */
export const AvailabilityV2Schema = z.enum([
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "UNKNOWN",
]);

export type AvailabilityV2 = z.infer<typeof AvailabilityV2Schema>;

export function isImmediatelyPurchasableV2(
  availability: AvailabilityV2
): boolean {
  return availability === "IN_STOCK" || availability === "LOW_STOCK";
}

export const TaxonomyNodeV2Schema = z
  .object({
    taxonomyNodeId: idSchema,
    parentId: idSchema.nullable(),
    slug: slugSchema,
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1_000).nullable(),
    path: z.array(slugSchema).min(1).max(16),
    depth: z.number().int().nonnegative().max(15),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const TaxonomyV2Schema = z
  .object({
    version: z.literal(TAXONOMY_V2),
    taxonomyId: idSchema,
    nodes: z.array(TaxonomyNodeV2Schema).min(1),
  })
  .strict()
  .superRefine((taxonomy, ctx) => {
    const byId = new Map<string, (typeof taxonomy.nodes)[number]>();

    taxonomy.nodes.forEach((node, index) => {
      if (byId.has(node.taxonomyNodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "taxonomyNodeId"],
          message: "Taxonomy node IDs must be unique",
        });
      }
      byId.set(node.taxonomyNodeId, node);
    });

    const siblingSlugs = new Set<string>();
    taxonomy.nodes.forEach((node, index) => {
      const siblingKey = `${node.parentId ?? "<root>"}:${node.slug}`;
      if (siblingSlugs.has(siblingKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "slug"],
          message: "Sibling taxonomy slugs must be unique",
        });
      }
      siblingSlugs.add(siblingKey);

      const parent = node.parentId ? byId.get(node.parentId) : null;
      if (node.parentId && !parent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "parentId"],
          message: "Taxonomy parent must exist",
        });
        return;
      }

      const expectedPath = parent
        ? [...parent.path, node.slug]
        : [node.slug];
      if (
        expectedPath.length !== node.path.length ||
        expectedPath.some((part, pathIndex) => part !== node.path[pathIndex])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "path"],
          message: "Taxonomy path must extend the declared parent path",
        });
      }
      if (node.depth !== node.path.length - 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "depth"],
          message: "Taxonomy depth must match the path",
        });
      }

      const visited = new Set([node.taxonomyNodeId]);
      let cursor = parent;
      while (cursor) {
        if (visited.has(cursor.taxonomyNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "parentId"],
            message: "Taxonomy hierarchy must not contain cycles",
          });
          break;
        }
        visited.add(cursor.taxonomyNodeId);
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
      }
    });
  });

export type TaxonomyNodeV2 = z.infer<typeof TaxonomyNodeV2Schema>;
export type TaxonomyV2 = z.infer<typeof TaxonomyV2Schema>;

export const AttributeDataTypeV2Schema = z.enum([
  "TEXT",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "ENUM",
]);

export const AttributeDefinitionV2Schema = z
  .object({
    attributeDefinitionId: idSchema,
    key: slugSchema,
    label: z.string().trim().min(1).max(120),
    dataType: AttributeDataTypeV2Schema,
    cardinality: z.enum(["SINGLE", "MULTIPLE"]),
    scope: z.enum(["PRODUCT", "VARIANT"]),
    required: z.boolean(),
    variantAxis: z.boolean(),
    storefrontVisible: z.boolean(),
    facetable: z.boolean(),
    comparable: z.boolean(),
    unitCode: z.string().trim().min(1).max(24).nullable(),
    allowedValues: z.array(
      z
        .object({
          code: slugSchema,
          label: z.string().trim().min(1).max(120),
        })
        .strict()
    ),
    position: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((definition, ctx) => {
    if (definition.dataType === "ENUM" && definition.allowedValues.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedValues"],
        message: "Enum attributes require at least one allowed value",
      });
    }
    if (definition.dataType !== "ENUM" && definition.allowedValues.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedValues"],
        message: "Only enum attributes may declare allowed values",
      });
    }
    if (definition.variantAxis && definition.scope !== "VARIANT") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variantAxis"],
        message: "Variant axes must use VARIANT scope",
      });
    }
  });

const decimalStringSchema = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/)
  .max(80);

const attributeValueBase = {
  attributeDefinitionId: idSchema,
};

export const AttributeValueV2Schema = z.discriminatedUnion("dataType", [
  z
    .object({
      ...attributeValueBase,
      dataType: z.literal("TEXT"),
      values: z.array(z.string().trim().min(1).max(500)).min(1),
    })
    .strict(),
  z
    .object({
      ...attributeValueBase,
      dataType: z.literal("INTEGER"),
      values: z.array(z.number().int().safe()).min(1),
    })
    .strict(),
  z
    .object({
      ...attributeValueBase,
      dataType: z.literal("DECIMAL"),
      values: z.array(decimalStringSchema).min(1),
    })
    .strict(),
  z
    .object({
      ...attributeValueBase,
      dataType: z.literal("BOOLEAN"),
      values: z.array(z.boolean()).min(1),
    })
    .strict(),
  z
    .object({
      ...attributeValueBase,
      dataType: z.literal("ENUM"),
      values: z.array(slugSchema).min(1),
    })
    .strict(),
]);

export type AttributeDefinitionV2 = z.infer<
  typeof AttributeDefinitionV2Schema
>;
export type AttributeValueV2 = z.infer<typeof AttributeValueV2Schema>;

export const EvidenceV2Schema = z
  .object({
    version: z.literal(EVIDENCE_V2),
    evidenceId: idSchema,
    kind: z.enum([
      "MANUAL_ASSERTION",
      "SUPPLIER_OBSERVATION",
      "MEDIA_INGESTION",
      "DERIVED",
      "UNKNOWN",
    ]),
    state: z.enum(["VERIFIED", "UNVERIFIED", "REJECTED", "UNKNOWN"]),
    subjectType: z.enum([
      "PRODUCT",
      "VARIANT",
      "ATTRIBUTE",
      "MEDIA",
      "COLLECTION_MEMBERSHIP",
      "UNKNOWN",
    ]),
    subjectRef: idSchema,
    recordedAt: isoDateTimeSchema,
    sourceRef: idSchema.nullable(),
    contentDigest: DigestV2Schema,
    notes: z.array(z.string().trim().min(1).max(400)).max(20),
  })
  .strict();

export type EvidenceV2 = z.infer<typeof EvidenceV2Schema>;

export const FocalPointV2Schema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

export const MediaRoleV2Schema = z.enum([
  "PRIMARY",
  "GALLERY",
  "VARIANT",
  "SWATCH",
  "LIFESTYLE",
  "SIZE_GUIDE",
  "INSTRUCTIONAL",
  "UNKNOWN",
]);

export const MediaRightsV2Schema = z
  .object({
    state: z.enum(["VERIFIED", "REVIEW_REQUIRED", "UNKNOWN"]),
    sourceKind: z.enum([
      "MERCHANT_OWNED",
      "SUPPLIER_LICENSED",
      "STOCK_LICENSED",
      "SYNTHETIC",
      "UNKNOWN",
    ]),
    sourceUrl: httpsUrlSchema.nullable(),
  })
  .strict()
  .superRefine((rights, ctx) => {
    if (rights.state === "VERIFIED" && rights.sourceKind === "UNKNOWN") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceKind"],
        message: "Verified media rights require a known source kind",
      });
    }
    if (rights.state === "UNKNOWN" && rights.sourceKind !== "UNKNOWN") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceKind"],
        message: "Unknown media rights cannot assert a source kind",
      });
    }
  });

export const MediaAssetV2Schema = z
  .object({
    mediaId: idSchema,
    kind: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "UNKNOWN"]),
    role: MediaRoleV2Schema,
    publicationState: z.enum(["PUBLIC_READY", "INTERNAL_ONLY", "UNKNOWN"]),
    rights: MediaRightsV2Schema,
    publicUrl: httpsUrlSchema.nullable(),
    mimeType: z.string().trim().min(1).max(120).nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    altText: z.string().trim().max(300),
    focalPoint: FocalPointV2Schema.nullable(),
    variantIds: z.array(idSchema),
    evidenceIds: z.array(idSchema),
    position: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((media, ctx) => {
    if (media.publicationState === "PUBLIC_READY" && !media.publicUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicUrl"],
        message: "Public-ready media requires a public URL",
      });
    }
    if (media.rights.state === "VERIFIED" && media.evidenceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidenceIds"],
        message: "Verified media rights require evidence",
      });
    }
    if (media.role === "UNKNOWN" && media.publicationState === "PUBLIC_READY") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Media with an unknown role cannot be public-ready",
      });
    }
    if (media.role === "VARIANT" && media.variantIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variantIds"],
        message: "Variant media must reference at least one variant",
      });
    }
    if ((media.width === null) !== (media.height === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "Media dimensions must be both known or both null",
      });
    }
    if (media.kind !== "IMAGE" && media.focalPoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["focalPoint"],
        message: "Only images may declare a focal point",
      });
    }
  });

export type MediaAssetV2 = z.infer<typeof MediaAssetV2Schema>;
export type MediaRightsV2 = z.infer<typeof MediaRightsV2Schema>;

export const CollectionV2Schema = z
  .object({
    version: z.literal(COLLECTION_V2),
    collectionId: idSchema,
    slug: slugSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1_000).nullable(),
    kind: z.enum(["MANUAL", "RULE_BASED", "UNKNOWN"]),
    publicationState: z.enum(["PUBLIC", "INTERNAL", "UNKNOWN"]),
    position: z.number().int().nonnegative(),
  })
  .strict();

export const CollectionMembershipV2Schema = z
  .object({
    collectionId: idSchema,
    position: z.number().int().nonnegative(),
    evidenceIds: z.array(idSchema),
  })
  .strict();

export type CollectionV2 = z.infer<typeof CollectionV2Schema>;
export type CollectionMembershipV2 = z.infer<
  typeof CollectionMembershipV2Schema
>;

function currenciesMatch(
  left: MoneyV2,
  right: MoneyV2 | null
): boolean {
  return !right || left.currency === right.currency;
}

export const VariantV2Schema = z
  .object({
    variantId: idSchema,
    label: z.string().trim().min(1).max(180),
    attributeValues: z.array(AttributeValueV2Schema),
    price: RetailPriceV2Schema.nullable(),
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    mediaIds: z.array(idSchema),
    isDefault: z.boolean(),
    position: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((variant, ctx) => {
    const knownPrice =
      variant.price?.state === "KNOWN" ? variant.price.money : null;
    if (knownPrice && !currenciesMatch(knownPrice, variant.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Variant prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      variant.compareAtPrice &&
      variant.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (variant.price?.state === "UNKNOWN" && variant.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown variant price cannot assert a compare-at price",
      });
    }
  });

export type VariantV2 = z.infer<typeof VariantV2Schema>;

export const RepeatPurchaseV2Schema = z
  .object({
    state: z.enum(["ELIGIBLE", "INELIGIBLE", "UNKNOWN"]),
    intervalDays: z.array(z.number().int().positive()).max(12),
  })
  .strict()
  .superRefine((repeatPurchase, ctx) => {
    if (
      repeatPurchase.state === "ELIGIBLE" &&
      repeatPurchase.intervalDays.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["intervalDays"],
        message: "Eligible repeat purchases require at least one interval",
      });
    }
    if (
      repeatPurchase.state !== "ELIGIBLE" &&
      repeatPurchase.intervalDays.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["intervalDays"],
        message: "Only eligible repeat purchases may expose intervals",
      });
    }
  });

export const PurchaseOptionV2Schema = z
  .object({
    purchaseOptionId: idSchema,
    kind: z.enum(["SINGLE", "BUNDLE", "UNKNOWN"]),
    label: z.string().trim().min(1).max(180),
    quantity: z.number().int().positive(),
    variantId: idSchema.nullable(),
    price: RetailPriceV2Schema,
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    repeatPurchase: RepeatPurchaseV2Schema,
    position: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((option, ctx) => {
    const knownPrice = option.price.state === "KNOWN" ? option.price.money : null;
    if (option.kind === "SINGLE" && option.quantity !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Single purchase options must have quantity 1",
      });
    }
    if (option.kind === "BUNDLE" && option.quantity < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Bundle purchase options must contain at least two units",
      });
    }
    if (knownPrice && !currenciesMatch(knownPrice, option.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Purchase option prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      option.compareAtPrice &&
      option.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (option.price.state === "UNKNOWN" && option.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown purchase option price cannot assert a compare-at price",
      });
    }
  });

export type PurchaseOptionV2 = z.infer<typeof PurchaseOptionV2Schema>;

function addDuplicateIssues(
  values: readonly string[],
  path: (index: number) => Array<string | number>,
  message: string,
  ctx: z.RefinementCtx
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: path(index),
        message,
      });
    }
    seen.add(value);
  });
}

function addAttributeAssignmentIssues(
  assignments: AttributeValueV2[],
  definitions: Map<string, AttributeDefinitionV2>,
  expectedScope: AttributeDefinitionV2["scope"],
  pathPrefix: Array<string | number>,
  ctx: z.RefinementCtx
): void {
  addDuplicateIssues(
    assignments.map((assignment) => assignment.attributeDefinitionId),
    (index) => [...pathPrefix, index, "attributeDefinitionId"],
    "An attribute may only be assigned once",
    ctx
  );

  for (const [index, assignment] of assignments.entries()) {
    const definition = definitions.get(assignment.attributeDefinitionId);
    const basePath = [...pathPrefix, index];
    if (!definition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "attributeDefinitionId"],
        message: "Attribute assignment must reference a definition",
      });
      continue;
    }
    if (definition.scope !== expectedScope) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "attributeDefinitionId"],
        message: `Attribute assignment requires ${expectedScope} scope`,
      });
    }
    if (definition.dataType !== assignment.dataType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "dataType"],
        message: "Attribute value type must match its definition",
      });
    }
    if (definition.cardinality === "SINGLE" && assignment.values.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "values"],
        message: "Single-cardinality attributes require exactly one value",
      });
    }
    const serializedValues = assignment.values.map(
      (value) => `${typeof value}:${String(value)}`
    );
    if (new Set(serializedValues).size !== serializedValues.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "values"],
        message: "Attribute values must be unique",
      });
    }
    if (definition.dataType === "ENUM" && assignment.dataType === "ENUM") {
      const allowed = new Set(definition.allowedValues.map((value) => value.code));
      if (assignment.values.some((value) => !allowed.has(value))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...basePath, "values"],
          message: "Enum attribute value is not allowed by its definition",
        });
      }
    }
  }
}

export const ProductRevisionV2Schema = z
  .object({
    contractVersion: z.literal(PRODUCT_REVISION_V2),
    productId: idSchema,
    revisionId: idSchema,
    revisionNumber: z.number().int().positive(),
    revisionState: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "UNKNOWN"]),
    createdAt: isoDateTimeSchema,
    slug: slugSchema,
    taxonomyNodeIds: z.array(idSchema).min(1),
    title: z.string().trim().min(1).max(240),
    subtitle: z.string().trim().max(320).nullable(),
    description: z.string().trim().min(1).max(20_000),
    seoTitle: z.string().trim().min(1).max(70),
    seoDescription: z.string().trim().min(1).max(180),
    brand: z.string().trim().min(1).max(160).nullable(),
    price: RetailPriceV2Schema,
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    attributeDefinitions: z.array(AttributeDefinitionV2Schema),
    attributeValues: z.array(AttributeValueV2Schema),
    variants: z.array(VariantV2Schema),
    purchaseOptions: z.array(PurchaseOptionV2Schema),
    media: z.array(MediaAssetV2Schema),
    collectionMemberships: z.array(CollectionMembershipV2Schema),
    evidence: z.array(EvidenceV2Schema),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  })
  .strict()
  .superRefine((revision, ctx) => {
    const knownPrice =
      revision.price.state === "KNOWN" ? revision.price.money : null;
    if (knownPrice && !currenciesMatch(knownPrice, revision.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Product prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      revision.compareAtPrice &&
      revision.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (revision.price.state === "UNKNOWN" && revision.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown product price cannot assert a compare-at price",
      });
    }

    addDuplicateIssues(
      revision.taxonomyNodeIds,
      (index) => ["taxonomyNodeIds", index],
      "Taxonomy assignments must be unique",
      ctx
    );
    addDuplicateIssues(
      revision.attributeDefinitions.map(
        (definition) => definition.attributeDefinitionId
      ),
      (index) => ["attributeDefinitions", index, "attributeDefinitionId"],
      "Attribute definition IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      revision.attributeDefinitions.map((definition) => definition.key),
      (index) => ["attributeDefinitions", index, "key"],
      "Attribute definition keys must be unique",
      ctx
    );

    const definitions = new Map(
      revision.attributeDefinitions.map((definition) => [
        definition.attributeDefinitionId,
        definition,
      ])
    );
    addAttributeAssignmentIssues(
      revision.attributeValues,
      definitions,
      "PRODUCT",
      ["attributeValues"],
      ctx
    );

    const assignedProductAttributes = new Set(
      revision.attributeValues.map((value) => value.attributeDefinitionId)
    );
    revision.attributeDefinitions.forEach((definition, index) => {
      if (
        definition.scope === "PRODUCT" &&
        definition.required &&
        !assignedProductAttributes.has(definition.attributeDefinitionId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attributeDefinitions", index, "required"],
          message: "Required product attributes must have a value",
        });
      }
    });

    addDuplicateIssues(
      revision.variants.map((variant) => variant.variantId),
      (index) => ["variants", index, "variantId"],
      "Variant IDs must be unique",
      ctx
    );
    const variantById = new Map(
      revision.variants.map((variant) => [variant.variantId, variant])
    );
    const defaultCount = revision.variants.filter(
      (variant) => variant.isDefault
    ).length;
    if (revision.variants.length > 0 && defaultCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Products with variants require exactly one default variant",
      });
    }

    revision.variants.forEach((variant, variantIndex) => {
      addAttributeAssignmentIssues(
        variant.attributeValues,
        definitions,
        "VARIANT",
        ["variants", variantIndex, "attributeValues"],
        ctx
      );
      const assigned = new Set(
        variant.attributeValues.map((value) => value.attributeDefinitionId)
      );
      revision.attributeDefinitions.forEach((definition) => {
        if (
          definition.scope === "VARIANT" &&
          definition.required &&
          !assigned.has(definition.attributeDefinitionId)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", variantIndex, "attributeValues"],
            message: `Required variant attribute ${definition.key} is missing`,
          });
        }
      });
    });

    addDuplicateIssues(
      revision.media.map((media) => media.mediaId),
      (index) => ["media", index, "mediaId"],
      "Media IDs must be unique",
      ctx
    );
    const mediaById = new Map(
      revision.media.map((media) => [media.mediaId, media])
    );
    const publicPrimaryCount = revision.media.filter(
      (media) =>
        media.role === "PRIMARY" && media.publicationState === "PUBLIC_READY"
    ).length;
    if (publicPrimaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["media"],
        message: "A revision may have at most one public primary media asset",
      });
    }
    revision.variants.forEach((variant, variantIndex) => {
      addDuplicateIssues(
        variant.mediaIds,
        (index) => ["variants", variantIndex, "mediaIds", index],
        "Variant media references must be unique",
        ctx
      );
      variant.mediaIds.forEach((mediaId, mediaIndex) => {
        const media = mediaById.get(mediaId);
        if (!media) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", variantIndex, "mediaIds", mediaIndex],
            message: "Variant media must reference a revision media asset",
          });
        } else if (!media.variantIds.includes(variant.variantId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", variantIndex, "mediaIds", mediaIndex],
            message: "Variant/media relationships must be bidirectional",
          });
        }
      });
    });
    revision.media.forEach((media, mediaIndex) => {
      addDuplicateIssues(
        media.variantIds,
        (index) => ["media", mediaIndex, "variantIds", index],
        "Media variant references must be unique",
        ctx
      );
      media.variantIds.forEach((variantId, variantIndex) => {
        const variant = variantById.get(variantId);
        if (!variant) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["media", mediaIndex, "variantIds", variantIndex],
            message: "Media must reference a revision variant",
          });
        } else if (!variant.mediaIds.includes(media.mediaId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["media", mediaIndex, "variantIds", variantIndex],
            message: "Media/variant relationships must be bidirectional",
          });
        }
      });
    });

    addDuplicateIssues(
      revision.purchaseOptions.map((option) => option.purchaseOptionId),
      (index) => ["purchaseOptions", index, "purchaseOptionId"],
      "Purchase option IDs must be unique",
      ctx
    );
    revision.purchaseOptions.forEach((option, index) => {
      if (option.variantId && !variantById.has(option.variantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchaseOptions", index, "variantId"],
          message: "Purchase option variant must exist in the revision",
        });
      }
      if (
        knownPrice &&
        option.price.state === "KNOWN" &&
        option.price.money.currency !== knownPrice.currency
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchaseOptions", index, "price", "currency"],
          message: "Purchase options must use the product currency",
        });
      }
    });

    addDuplicateIssues(
      revision.collectionMemberships.map((entry) => entry.collectionId),
      (index) => ["collectionMemberships", index, "collectionId"],
      "Collection memberships must be unique",
      ctx
    );
    addDuplicateIssues(
      revision.evidence.map((evidence) => evidence.evidenceId),
      (index) => ["evidence", index, "evidenceId"],
      "Evidence IDs must be unique",
      ctx
    );
    const evidenceIds = new Set(
      revision.evidence.map((evidence) => evidence.evidenceId)
    );
    const evidenceReferences: Array<{
      ids: string[];
      path: Array<string | number>;
    }> = [
      ...revision.media.map((media, index) => ({
        ids: media.evidenceIds,
        path: ["media", index, "evidenceIds"],
      })),
      ...revision.collectionMemberships.map((membership, index) => ({
        ids: membership.evidenceIds,
        path: ["collectionMemberships", index, "evidenceIds"],
      })),
    ];
    evidenceReferences.forEach((reference) => {
      reference.ids.forEach((evidenceId, index) => {
        if (!evidenceIds.has(evidenceId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...reference.path, index],
            message: "Evidence reference must exist in the revision",
          });
        }
      });
    });
  });

export type ProductRevisionV2 = z.infer<typeof ProductRevisionV2Schema>;

export const SupplierOfferV2Schema = z
  .object({
    version: z.literal(SUPPLIER_OFFER_V2),
    offerId: idSchema,
    productId: idSchema,
    variantId: idSchema.nullable(),
    supplierAccountRef: idSchema,
    sourceOfferRef: idSchema,
    state: z.enum(["ACTIVE", "INACTIVE", "UNKNOWN"]),
    observedCurrency: z.string().regex(/^[A-Z]{3}$/),
    latestObservationId: idSchema.nullable(),
    createdAt: isoDateTimeSchema,
    evidenceIds: z.array(idSchema),
  })
  .strict();

const knownInventoryObservationSchema = z
  .object({
    state: z.literal("KNOWN"),
    availability: z.enum([
      "IN_STOCK",
      "LOW_STOCK",
      "OUT_OF_STOCK",
    ]),
    quantity: z.number().int().nonnegative().nullable(),
  })
  .strict()
  .superRefine((inventory, ctx) => {
    if (
      inventory.availability === "OUT_OF_STOCK" &&
      inventory.quantity !== null &&
      inventory.quantity !== 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Out-of-stock quantity must be zero or unknown",
      });
    }
  });

export const InventoryObservationV2Schema = z.union([
  knownInventoryObservationSchema,
  z
    .object({
      state: z.literal("UNKNOWN"),
      availability: z.literal("UNKNOWN"),
      quantity: z.null(),
    })
    .strict(),
]);

export const CostObservationV2Schema = z.discriminatedUnion("state", [
  z
    .object({ state: z.literal("KNOWN"), money: MoneyV2Schema })
    .strict(),
  z
    .object({ state: z.literal("UNKNOWN"), money: z.null() })
    .strict(),
]);

export const ShippingObservationV2Schema = z.union([
  z
    .object({
      state: z.literal("KNOWN"),
      minDays: z.number().int().nonnegative(),
      maxDays: z.number().int().nonnegative(),
      cost: MoneyV2Schema,
    })
    .strict()
    .refine((shipping) => shipping.minDays <= shipping.maxDays, {
      path: ["maxDays"],
      message: "Shipping maximum must not be less than the minimum",
    }),
  z
    .object({
      state: z.literal("UNKNOWN"),
      minDays: z.null(),
      maxDays: z.null(),
      cost: z.null(),
    })
    .strict(),
]);

export const SupplierObservationV2Schema = z
  .object({
    contractVersion: z.literal(SUPPLIER_OBSERVATION_V2),
    observationId: idSchema,
    offerId: idSchema,
    observedAt: isoDateTimeSchema,
    outcome: z.enum(["OBSERVED", "FAILED", "UNKNOWN"]),
    inventory: InventoryObservationV2Schema,
    unitCost: CostObservationV2Schema,
    shipping: ShippingObservationV2Schema,
    sourcePayloadDigest: DigestV2Schema,
    evidenceIds: z.array(idSchema),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  })
  .strict()
  .superRefine((observation, ctx) => {
    if (
      observation.outcome !== "OBSERVED" &&
      (observation.inventory.state !== "UNKNOWN" ||
        observation.unitCost.state !== "UNKNOWN" ||
        observation.shipping.state !== "UNKNOWN")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outcome"],
        message: "Failed or unknown observations must keep all facts unknown",
      });
    }
  });

export type SupplierOfferV2 = z.infer<typeof SupplierOfferV2Schema>;
export type SupplierObservationV2 = z.infer<
  typeof SupplierObservationV2Schema
>;

const storefrontAttributeScalarSchema = z.union([
  z.string(),
  z.number().int().safe(),
  z.boolean(),
]);

export const StorefrontAttributeV2Schema = z
  .object({
    key: slugSchema,
    label: z.string().trim().min(1).max(120),
    value: z.union([
      storefrontAttributeScalarSchema,
      z.array(storefrontAttributeScalarSchema).min(1),
    ]),
    unitCode: z.string().trim().min(1).max(24).nullable(),
    facetable: z.boolean(),
    comparable: z.boolean(),
  })
  .strict();

export const StorefrontVariantV2Schema = z
  .object({
    variantId: idSchema,
    label: z.string().trim().min(1).max(180),
    attributes: z.array(StorefrontAttributeV2Schema),
    price: RetailPriceV2Schema.nullable(),
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    mediaIds: z.array(idSchema),
  })
  .strict()
  .superRefine((variant, ctx) => {
    const knownPrice =
      variant.price?.state === "KNOWN" ? variant.price.money : null;
    if (knownPrice && !currenciesMatch(knownPrice, variant.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Variant prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      variant.compareAtPrice &&
      variant.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (variant.price?.state === "UNKNOWN" && variant.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown variant price cannot assert a compare-at price",
      });
    }
  });

export const StorefrontMediaV2Schema = z
  .object({
    mediaId: idSchema,
    kind: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
    role: z.enum([
      "PRIMARY",
      "GALLERY",
      "VARIANT",
      "SWATCH",
      "LIFESTYLE",
      "SIZE_GUIDE",
      "INSTRUCTIONAL",
    ]),
    publicUrl: z.string().url(),
    /** Intrinsic dimensions retained when the verified source declares them. */
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    altText: z.string().trim().max(300),
    focalPoint: FocalPointV2Schema.nullable(),
    variantIds: z.array(idSchema),
    position: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((media, ctx) => {
    if ((media.width === undefined) !== (media.height === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "Storefront media dimensions must be both present or both absent",
      });
    }
  });

export const StorefrontPurchaseOptionV2Schema = z
  .object({
    purchaseOptionId: idSchema,
    kind: z.enum(["SINGLE", "BUNDLE", "UNKNOWN"]),
    label: z.string().trim().min(1).max(180),
    quantity: z.number().int().positive(),
    variantId: idSchema.nullable(),
    price: RetailPriceV2Schema,
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    repeatPurchase: RepeatPurchaseV2Schema,
  })
  .strict()
  .superRefine((option, ctx) => {
    const knownPrice = option.price.state === "KNOWN" ? option.price.money : null;
    if (option.kind === "SINGLE" && option.quantity !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Single purchase options must have quantity 1",
      });
    }
    if (option.kind === "BUNDLE" && option.quantity < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Bundle purchase options must contain at least two units",
      });
    }
    if (knownPrice && !currenciesMatch(knownPrice, option.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Purchase option prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      option.compareAtPrice &&
      option.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (option.price.state === "UNKNOWN" && option.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown purchase option price cannot assert a compare-at price",
      });
    }
  });

export const StorefrontProductV2Schema = z
  .object({
    version: z.literal(STOREFRONT_PRODUCT_V2),
    productId: idSchema,
    revisionId: idSchema,
    slug: slugSchema,
    taxonomyNodeIds: z.array(idSchema).min(1),
    title: z.string().trim().min(1).max(240),
    subtitle: z.string().trim().max(320).nullable(),
    description: z.string().trim().min(1).max(20_000),
    seoTitle: z.string().trim().min(1).max(70),
    seoDescription: z.string().trim().min(1).max(180),
    brand: z.string().trim().min(1).max(160).nullable(),
    price: RetailPriceV2Schema,
    compareAtPrice: MoneyV2Schema.nullable(),
    availability: AvailabilityV2Schema,
    attributes: z.array(StorefrontAttributeV2Schema),
    variants: z.array(StorefrontVariantV2Schema),
    purchaseOptions: z.array(StorefrontPurchaseOptionV2Schema),
    media: z.array(StorefrontMediaV2Schema).min(1),
    collections: z.array(
      z
        .object({
          collectionId: idSchema,
          position: z.number().int().nonnegative(),
        })
        .strict()
    ),
    purchasable: z.boolean(),
  })
  .strict()
  .superRefine((product, ctx) => {
    const knownPrice =
      product.price.state === "KNOWN" ? product.price.money : null;
    if (knownPrice && !currenciesMatch(knownPrice, product.compareAtPrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "currency"],
        message: "Product prices must use the same currency",
      });
    }
    if (
      knownPrice &&
      product.compareAtPrice &&
      product.compareAtPrice.amountMinor <= knownPrice.amountMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice", "amountMinor"],
        message: "Compare-at price must be greater than the selling price",
      });
    }
    if (product.price.state === "UNKNOWN" && product.compareAtPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message: "Unknown product price cannot assert a compare-at price",
      });
    }
    if (!product.media.some((media) => media.role === "PRIMARY")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["media"],
        message: "Storefront products require a primary media asset",
      });
    }
    addDuplicateIssues(
      product.variants.map((variant) => variant.variantId),
      (index) => ["variants", index, "variantId"],
      "Storefront variant IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      product.media.map((media) => media.mediaId),
      (index) => ["media", index, "mediaId"],
      "Storefront media IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      product.collections.map((membership) => membership.collectionId),
      (index) => ["collections", index, "collectionId"],
      "Storefront collection memberships must be unique",
      ctx
    );
    const variantIds = new Set(product.variants.map((variant) => variant.variantId));
    const mediaIds = new Set(product.media.map((media) => media.mediaId));
    product.variants.forEach((variant, variantIndex) => {
      variant.mediaIds.forEach((mediaId, mediaIndex) => {
        if (!mediaIds.has(mediaId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", variantIndex, "mediaIds", mediaIndex],
            message: "Storefront variant media reference must exist",
          });
        }
      });
    });
    product.media.forEach((media, mediaIndex) => {
      media.variantIds.forEach((variantId, variantIndex) => {
        if (!variantIds.has(variantId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["media", mediaIndex, "variantIds", variantIndex],
            message: "Storefront media variant reference must exist",
          });
        }
      });
    });
    product.purchaseOptions.forEach((option, optionIndex) => {
      if (option.variantId && !variantIds.has(option.variantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchaseOptions", optionIndex, "variantId"],
          message: "Storefront purchase option variant must exist",
        });
      }
    });
    const expectedPurchasable =
      isImmediatelyPurchasableV2(product.availability) &&
      product.price.state === "KNOWN" &&
      (product.variants.length === 0 ||
        product.variants.some((variant) =>
          isImmediatelyPurchasableV2(variant.availability) &&
          variant.price?.state !== "UNKNOWN"
        )) &&
      (product.purchaseOptions.length === 0 ||
        product.purchaseOptions.some((option) =>
          isImmediatelyPurchasableV2(option.availability) &&
          option.kind !== "UNKNOWN" &&
          option.price.state === "KNOWN"
        ));
    if (product.purchasable !== expectedPurchasable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchasable"],
        message: "Purchasability must fail closed from explicit availability",
      });
    }
  });

export type StorefrontAttributeV2 = z.infer<
  typeof StorefrontAttributeV2Schema
>;
export type StorefrontVariantV2 = z.infer<typeof StorefrontVariantV2Schema>;
export type StorefrontMediaV2 = z.infer<typeof StorefrontMediaV2Schema>;
export type StorefrontProductV2 = z.infer<typeof StorefrontProductV2Schema>;

export const CatalogReferenceFixtureV2Schema = z
  .object({
    version: z.literal(REFERENCE_FIXTURE_V2),
    fixtureId: idSchema,
    description: z.string().trim().min(1).max(1_000),
    generatedAt: isoDateTimeSchema,
    taxonomy: TaxonomyV2Schema,
    collections: z.array(CollectionV2Schema),
    productRevisions: z.array(ProductRevisionV2Schema).min(1),
    supplierOffers: z.array(SupplierOfferV2Schema),
    supplierObservations: z.array(SupplierObservationV2Schema),
  })
  .strict()
  .superRefine((fixture, ctx) => {
    addDuplicateIssues(
      fixture.collections.map((collection) => collection.collectionId),
      (index) => ["collections", index, "collectionId"],
      "Collection IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      fixture.collections.map((collection) => collection.slug),
      (index) => ["collections", index, "slug"],
      "Collection slugs must be unique",
      ctx
    );
    addDuplicateIssues(
      fixture.productRevisions.map((revision) => revision.revisionId),
      (index) => ["productRevisions", index, "revisionId"],
      "Fixture revision IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      fixture.supplierOffers.map((offer) => offer.offerId),
      (index) => ["supplierOffers", index, "offerId"],
      "Supplier offer IDs must be unique",
      ctx
    );
    addDuplicateIssues(
      fixture.supplierObservations.map(
        (observation) => observation.observationId
      ),
      (index) => ["supplierObservations", index, "observationId"],
      "Supplier observation IDs must be unique",
      ctx
    );

    const taxonomyNodeIds = new Set(
      fixture.taxonomy.nodes.map((node) => node.taxonomyNodeId)
    );
    const collectionIds = new Set(
      fixture.collections.map((collection) => collection.collectionId)
    );
    const revisionsByProduct = new Map<string, ProductRevisionV2[]>();
    fixture.productRevisions.forEach((revision, revisionIndex) => {
      const revisions = revisionsByProduct.get(revision.productId) ?? [];
      revisions.push(revision);
      revisionsByProduct.set(revision.productId, revisions);
      revision.taxonomyNodeIds.forEach((taxonomyNodeId, taxonomyIndex) => {
        if (!taxonomyNodeIds.has(taxonomyNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "productRevisions",
              revisionIndex,
              "taxonomyNodeIds",
              taxonomyIndex,
            ],
            message: "Product taxonomy assignment must exist in the fixture",
          });
        }
      });
      revision.collectionMemberships.forEach((membership, membershipIndex) => {
        if (!collectionIds.has(membership.collectionId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "productRevisions",
              revisionIndex,
              "collectionMemberships",
              membershipIndex,
              "collectionId",
            ],
            message: "Product collection must exist in the fixture",
          });
        }
      });
    });
    revisionsByProduct.forEach((revisions) => {
      addDuplicateIssues(
        revisions.map((revision) => String(revision.revisionNumber)),
        (index) => [
          "productRevisions",
          fixture.productRevisions.indexOf(revisions[index]),
          "revisionNumber",
        ],
        "Revision numbers must be unique per product",
        ctx
      );
    });

    const offersById = new Map(
      fixture.supplierOffers.map((offer) => [offer.offerId, offer])
    );
    fixture.supplierOffers.forEach((offer, offerIndex) => {
      const revisions = revisionsByProduct.get(offer.productId);
      if (!revisions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplierOffers", offerIndex, "productId"],
          message: "Supplier offers must reference a fixture product",
        });
      }
      if (
        offer.variantId &&
        !revisions?.some((revision) =>
          revision.variants.some((variant) => variant.variantId === offer.variantId)
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplierOffers", offerIndex, "variantId"],
          message: "Supplier offer variant must exist on the product",
        });
      }
    });

    const observationsById = new Map(
      fixture.supplierObservations.map((observation) => [
        observation.observationId,
        observation,
      ])
    );
    fixture.supplierObservations.forEach((observation, observationIndex) => {
      if (!offersById.has(observation.offerId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplierObservations", observationIndex, "offerId"],
          message: "Supplier observations must reference a fixture offer",
        });
      }
    });
    fixture.supplierOffers.forEach((offer, offerIndex) => {
      if (
        offer.latestObservationId &&
        observationsById.get(offer.latestObservationId)?.offerId !== offer.offerId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplierOffers", offerIndex, "latestObservationId"],
          message: "Latest observation must exist and belong to the offer",
        });
      }
    });
  });

export type CatalogReferenceFixtureV2 = z.infer<
  typeof CatalogReferenceFixtureV2Schema
>;
