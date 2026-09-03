import { z } from "zod";
import { digestCatalogValue } from "./canonical";
import {
  EVIDENCE_V2,
  MONEY_V2,
  PRODUCT_REVISION_V2,
  ProductRevisionV2Schema,
  type AttributeDefinitionV2,
  type AttributeValueV2,
  type AvailabilityV2,
  type MediaAssetV2,
  type ProductRevisionV2,
  type VariantV2,
} from "./contracts";
import {
  projectStorefrontProductV2,
  type StorefrontProjectionResultV2,
} from "./projection";

const legacyVariantSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    optionSummary: z.string().optional(),
    optionsJson: z.string().optional(),
    options: z.record(z.unknown()).optional(),
    price: z.number().finite().nonnegative().nullable().optional(),
    compareAtPrice: z.number().finite().nonnegative().nullable().optional(),
    stockStatus: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    isDefault: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    sku: z.string().nullable().optional(),
    providerKey: z.string().nullable().optional(),
    externalId: z.string().nullable().optional(),
    externalVariantId: z.string().nullable().optional(),
  })
  .passthrough();

const legacyImageSchema = z
  .object({
    id: z.string().optional(),
    url: z.string().min(1),
    alt: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isPrimary: z.boolean().optional(),
    providerKey: z.string().nullable().optional(),
    externalId: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
  })
  .passthrough();

const legacySpecSchema = z
  .object({ label: z.string().min(1), value: z.string().min(1) })
  .strict();

export const LegacyProductLikeV2Schema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().nullable().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    brand: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
    price: z.number().finite().nonnegative(),
    compareAtPrice: z.number().finite().nonnegative().nullable().optional(),
    currency: z.string().min(1),
    stockStatus: z.string().optional(),
    isPublished: z.boolean().optional(),
    category: z
      .object({ slug: z.string().optional() })
      .passthrough()
      .nullable()
      .optional(),
    categorySlug: z.string().nullable().optional(),
    specs: z.union([z.string(), z.array(legacySpecSchema)]).optional(),
    variants: z.array(legacyVariantSchema).optional(),
    images: z.array(legacyImageSchema).optional(),
    providerKey: z.string().nullable().optional(),
    externalId: z.string().nullable().optional(),
    supplierProductId: z.string().nullable().optional(),
    supplierName: z.string().nullable().optional(),
    supplierSource: z.string().nullable().optional(),
    supplierUrl: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
  })
  .passthrough();

export const LegacyAdapterOptionsV2Schema = z
  .object({
    adaptedAt: z.string().datetime({ offset: true }),
    revisionNumber: z.number().int().positive().default(1),
    taxonomyNodeId: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/)
      .optional(),
    collectionIds: z
      .array(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/))
      .default([]),
    publicImageUrl: z.string().url().optional(),
    publicImageRightsVerified: z.boolean().default(false),
  })
  .strict();

export type LegacyProductLikeV2 = z.infer<typeof LegacyProductLikeV2Schema>;
export type LegacyAdapterOptionsV2 = z.input<
  typeof LegacyAdapterOptionsV2Schema
>;

export type LegacyAdapterRefusalReasonV2 =
  | "INVALID_LEGACY_PRODUCT"
  | "INVALID_ADAPTER_OPTIONS"
  | "INVALID_ADAPTED_REVISION";

export type LegacyProductAdapterResultV2 =
  | {
      status: "ADAPTED";
      revision: ProductRevisionV2;
      storefrontProjection: StorefrontProjectionResultV2;
      reasonCodes: [];
    }
  | {
      status: "REFUSED";
      revision: null;
      storefrontProjection: null;
      reasonCodes: LegacyAdapterRefusalReasonV2[];
    };

function digestSuffix(value: unknown, length = 20): string {
  return digestCatalogValue(value).slice("sha256:".length, "sha256:".length + length);
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || fallback;
}

function collectSensitiveIdentifiers(
  product: LegacyProductLikeV2
): string[] {
  const candidates = [
    product.externalId,
    product.supplierProductId,
    product.sku,
    ...(product.variants ?? []).flatMap((variant) => [
      variant.externalId,
      variant.externalVariantId,
      variant.sku,
    ]),
    ...(product.images ?? []).map((image) => image.externalId),
  ];
  return [...new Set(
    candidates
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value && value.length >= 3))
  )].sort((left, right) => right.length - left.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeText(
  value: string | null | undefined,
  sensitiveIdentifiers: string[],
  fallback: string
): string {
  let sanitized = value?.trim() ?? "";
  for (const identifier of sensitiveIdentifiers) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(identifier), "gi"), "");
  }
  sanitized = sanitized
    .replace(/\s*[-–—|:/#]+\s*$/g, "")
    .replace(/^\s*[-–—|:/#]+\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return sanitized || fallback;
}

function containsSensitiveIdentifier(
  value: string,
  sensitiveIdentifiers: string[]
): boolean {
  const normalized = value.toLowerCase();
  return sensitiveIdentifiers.some((identifier) =>
    normalized.includes(identifier.toLowerCase())
  );
}

function safePublicUrl(
  value: string | null | undefined,
  sensitiveIdentifiers: string[]
): string | null {
  if (!value || containsSensitiveIdentifier(value, sensitiveIdentifiers)) return null;
  const parsed = z.string().url().safeParse(value);
  return parsed.success ? parsed.data : null;
}

function normalizeAvailability(value: string | null | undefined): AvailabilityV2 {
  return ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(
    value ?? ""
  )
    ? (value as AvailabilityV2)
    : "UNKNOWN";
}

function moneyFromMajor(
  value: number,
  currency: string,
  fractionDigits = 2
) {
  const scale = 10 ** fractionDigits;
  return {
    version: MONEY_V2,
    currency,
    amountMinor: Math.round(value * scale),
  } as const;
}

function knownRetailPriceFromMajor(value: number, currency: string) {
  return { state: "KNOWN" as const, money: moneyFromMajor(value, currency) };
}

function safeCompareAtPrice(
  compareAtPrice: number | null | undefined,
  price: number,
  currency: string
) {
  return typeof compareAtPrice === "number" && compareAtPrice > price
    ? moneyFromMajor(compareAtPrice, currency)
    : null;
}

function parseSpecs(value: LegacyProductLikeV2["specs"]): Array<{
  label: string;
  value: string;
}> {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = z.array(legacySpecSchema).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function parseVariantOptions(
  variant: z.infer<typeof legacyVariantSchema>
): Record<string, string> {
  const candidate = variant.options ?? (() => {
    if (!variant.optionsJson) return {};
    try {
      const parsed: unknown = JSON.parse(variant.optionsJson);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  })();
  return Object.fromEntries(
    Object.entries(candidate).filter(
      (entry): entry is [string, string] =>
        Boolean(entry[0].trim()) && typeof entry[1] === "string" && Boolean(entry[1].trim())
    )
  );
}

interface NormalizedLegacyAttribute {
  definition: AttributeDefinitionV2;
  value: AttributeValueV2;
}

function productAttributes(
  product: LegacyProductLikeV2,
  sensitiveIdentifiers: string[]
): NormalizedLegacyAttribute[] {
  const usedKeys = new Set<string>();
  return parseSpecs(product.specs).flatMap((spec, index) => {
    const label = sanitizeText(spec.label, sensitiveIdentifiers, "Specification");
    const rawKey = slugify(label, `spec-${index + 1}`);
    let key = rawKey;
    let suffix = 2;
    while (usedKeys.has(key)) key = `${rawKey}-${suffix++}`;
    usedKeys.add(key);
    const attributeDefinitionId = `attribute:legacy:product:${key}`;
    return [{
      definition: {
        attributeDefinitionId,
        key,
        label,
        dataType: "TEXT",
        cardinality: "SINGLE",
        scope: "PRODUCT",
        required: false,
        variantAxis: false,
        storefrontVisible: true,
        facetable: false,
        comparable: false,
        unitCode: null,
        allowedValues: [],
        position: index,
      },
      value: {
        attributeDefinitionId,
        dataType: "TEXT",
        values: [sanitizeText(spec.value, sensitiveIdentifiers, "Not specified")],
      },
    }];
  });
}

interface NormalizedLegacyVariant {
  legacy: z.infer<typeof legacyVariantSchema>;
  variantId: string;
  label: string;
  options: Record<string, string>;
}

function variantAttributes(
  variants: NormalizedLegacyVariant[],
  sensitiveIdentifiers: string[]
): {
  definitions: AttributeDefinitionV2[];
  valuesByVariantId: Map<string, AttributeValueV2[]>;
} {
  const labelsByKey = new Map<string, string>();
  for (const variant of variants) {
    for (const rawLabel of Object.keys(variant.options)) {
      const label = sanitizeText(rawLabel, sensitiveIdentifiers, "Option");
      const key = slugify(label, `option-${labelsByKey.size + 1}`);
      if (!labelsByKey.has(key)) labelsByKey.set(key, label);
    }
  }
  const definitions = [...labelsByKey.entries()].map(([key, label], index) => ({
    attributeDefinitionId: `attribute:legacy:variant:${key}`,
    key,
    label,
    dataType: "TEXT" as const,
    cardinality: "SINGLE" as const,
    scope: "VARIANT" as const,
    required: false,
    variantAxis: true,
    storefrontVisible: true,
    facetable: false,
    comparable: false,
    unitCode: null,
    allowedValues: [],
    position: index,
  }));
  const definitionByKey = new Map(
    definitions.map((definition) => [definition.key, definition])
  );
  const valuesByVariantId = new Map<string, AttributeValueV2[]>();
  for (const variant of variants) {
    const values = Object.entries(variant.options).flatMap(([rawLabel, rawValue]) => {
      const label = sanitizeText(rawLabel, sensitiveIdentifiers, "Option");
      const definition = definitionByKey.get(slugify(label, "option"));
      const value = sanitizeText(rawValue, sensitiveIdentifiers, "");
      return definition && value
        ? [{
            attributeDefinitionId: definition.attributeDefinitionId,
            dataType: "TEXT" as const,
            values: [value],
          }]
        : [];
    });
    valuesByVariantId.set(variant.variantId, values);
  }
  return { definitions, valuesByVariantId };
}

function normalizeVariants(
  product: LegacyProductLikeV2,
  sensitiveIdentifiers: string[]
): NormalizedLegacyVariant[] {
  return (product.variants ?? []).map((legacy, index) => {
    const options = Object.fromEntries(
      Object.entries(parseVariantOptions(legacy)).flatMap(([key, value]) => {
        const publicKey = sanitizeText(key, sensitiveIdentifiers, "");
        const publicValue = sanitizeText(value, sensitiveIdentifiers, "");
        return publicKey && publicValue ? [[publicKey, publicValue]] : [];
      })
    );
    return {
      legacy,
      variantId: `variant:legacy:${digestSuffix({ productId: product.id, variantId: legacy.id })}`,
      label: sanitizeText(
        legacy.title ?? legacy.optionSummary,
        sensitiveIdentifiers,
        `Option ${index + 1}`
      ),
      options,
    };
  });
}

/**
 * Converts the current Product-shaped record into a V2 revision without
 * retaining supplier/provider fields. The caller supplies time explicitly so
 * identical inputs remain deterministic.
 */
export function adaptLegacyProductLikeToV2(
  input: unknown,
  rawOptions: LegacyAdapterOptionsV2
): LegacyProductAdapterResultV2 {
  const parsedProduct = LegacyProductLikeV2Schema.safeParse(input);
  if (!parsedProduct.success) {
    return {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_LEGACY_PRODUCT"],
    };
  }
  const parsedOptions = LegacyAdapterOptionsV2Schema.safeParse(rawOptions);
  if (!parsedOptions.success) {
    return {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_ADAPTER_OPTIONS"],
    };
  }

  const product = parsedProduct.data;
  const options = parsedOptions.data;
  const currency = product.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_LEGACY_PRODUCT"],
    };
  }

  const sensitiveIdentifiers = collectSensitiveIdentifiers(product);
  const normalizedVariants = normalizeVariants(product, sensitiveIdentifiers);
  const normalizedProductAttributes = productAttributes(
    product,
    sensitiveIdentifiers
  );
  const normalizedVariantAttributes = variantAttributes(
    normalizedVariants,
    sensitiveIdentifiers
  );
  const productId = `product:legacy:${digestSuffix({ legacyProductId: product.id })}`;
  const evidenceId = `evidence:legacy:${digestSuffix({
    productId,
    adaptedAt: options.adaptedAt,
  })}`;

  const preferredPrimaryUrl = safePublicUrl(
    options.publicImageUrl ?? product.imageUrl,
    sensitiveIdentifiers
  );
  const mediaByUrl = new Map<
    string,
    { altText: string; position: number; role: MediaAssetV2["role"]; variantIds: string[] }
  >();
  if (preferredPrimaryUrl) {
    mediaByUrl.set(preferredPrimaryUrl, {
      altText: sanitizeText(product.imageAlt, sensitiveIdentifiers, product.title),
      position: 0,
      role: "PRIMARY",
      variantIds: [],
    });
  }
  for (const [index, image] of (product.images ?? []).entries()) {
    const url = safePublicUrl(image.url, sensitiveIdentifiers);
    if (!url || mediaByUrl.has(url)) continue;
    mediaByUrl.set(url, {
      altText: sanitizeText(image.alt, sensitiveIdentifiers, product.title),
      position: image.sortOrder ?? index + 1,
      role: preferredPrimaryUrl ? "GALLERY" : "PRIMARY",
      variantIds: [],
    });
  }
  if (!preferredPrimaryUrl && mediaByUrl.size > 0) {
    const first = [...mediaByUrl.values()].sort(
      (left, right) => left.position - right.position
    )[0];
    if (first) first.role = "PRIMARY";
  }
  for (const variant of normalizedVariants) {
    const url = safePublicUrl(variant.legacy.imageUrl, sensitiveIdentifiers);
    if (!url) continue;
    const existing = mediaByUrl.get(url);
    if (existing) {
      existing.variantIds.push(variant.variantId);
      continue;
    }
    mediaByUrl.set(url, {
      altText: variant.label,
      position: mediaByUrl.size,
      role: "VARIANT",
      variantIds: [variant.variantId],
    });
  }
  const media: MediaAssetV2[] = [...mediaByUrl.entries()]
    .map(([publicUrl, mediaInput]) => ({
      mediaId: `media:legacy:${digestSuffix({ productId, publicUrl })}`,
      kind: "IMAGE" as const,
      role: mediaInput.role,
      publicationState: options.publicImageRightsVerified
        ? ("PUBLIC_READY" as const)
        : ("INTERNAL_ONLY" as const),
      rights: {
        state: options.publicImageRightsVerified
          ? ("VERIFIED" as const)
          : ("REVIEW_REQUIRED" as const),
        sourceKind: options.publicImageRightsVerified
          ? ("MERCHANT_OWNED" as const)
          : ("UNKNOWN" as const),
        sourceUrl: publicUrl,
      },
      publicUrl,
      mimeType: null,
      width: null,
      height: null,
      altText: sanitizeText(mediaInput.altText, sensitiveIdentifiers, "Product image"),
      focalPoint: { x: 0.5, y: 0.5 },
      variantIds: [...new Set(mediaInput.variantIds)],
      evidenceIds: [evidenceId],
      position: mediaInput.position,
    }))
    .sort((left, right) => left.position - right.position);
  const mediaIdsByVariant = new Map<string, string[]>();
  media.forEach((asset) => {
    asset.variantIds.forEach((variantId) => {
      const ids = mediaIdsByVariant.get(variantId) ?? [];
      ids.push(asset.mediaId);
      mediaIdsByVariant.set(variantId, ids);
    });
  });

  const defaultVariantIndex = Math.max(
    0,
    normalizedVariants.findIndex((variant) => variant.legacy.isDefault)
  );
  const variants: VariantV2[] = normalizedVariants.map((variant, index) => {
    const legacyPrice = variant.legacy.price;
    const price =
      typeof legacyPrice === "number"
        ? knownRetailPriceFromMajor(legacyPrice, currency)
        : null;
    return {
      variantId: variant.variantId,
      label: variant.label,
      attributeValues:
        normalizedVariantAttributes.valuesByVariantId.get(variant.variantId) ?? [],
      price,
      compareAtPrice:
        typeof legacyPrice === "number"
          ? safeCompareAtPrice(
              variant.legacy.compareAtPrice,
              legacyPrice,
              currency
            )
          : null,
      availability: normalizeAvailability(variant.legacy.stockStatus),
      mediaIds: mediaIdsByVariant.get(variant.variantId) ?? [],
      isDefault: index === defaultVariantIndex,
      position: variant.legacy.sortOrder ?? index,
    };
  });

  const categorySlug = slugify(
    product.category?.slug ?? product.categorySlug ?? "uncategorized",
    "uncategorized"
  );
  const title = sanitizeText(product.title, sensitiveIdentifiers, "Product");
  const subtitleValue = product.subtitle
    ? sanitizeText(product.subtitle, sensitiveIdentifiers, "")
    : "";
  const brandValue = product.brand
    ? sanitizeText(product.brand, sensitiveIdentifiers, "")
    : "";
  const description = sanitizeText(
    product.description ?? product.shortDescription ?? product.subtitle,
    sensitiveIdentifiers,
    title
  );
  const revisionIdentity = {
    productId,
    revisionNumber: options.revisionNumber,
    adaptedAt: options.adaptedAt,
    title,
    priceMinor: moneyFromMajor(product.price, currency).amountMinor,
    variants: variants.map((variant) => ({
      variantId: variant.variantId,
      label: variant.label,
      availability: variant.availability,
    })),
  };
  const revision: ProductRevisionV2 = {
    contractVersion: PRODUCT_REVISION_V2,
    productId,
    revisionId: `revision:legacy:${digestSuffix(revisionIdentity)}`,
    revisionNumber: options.revisionNumber,
    revisionState: product.isPublished === false ? "DRAFT" : "PUBLISHED",
    createdAt: options.adaptedAt,
    slug: slugify(product.slug, `legacy-${digestSuffix(product.id, 10)}`),
    taxonomyNodeIds: [
      options.taxonomyNodeId ?? `taxonomy:legacy:${categorySlug}`,
    ],
    title,
    subtitle: subtitleValue || null,
    description,
    seoTitle: sanitizeText(
      product.seoTitle,
      sensitiveIdentifiers,
      title
    ).slice(0, 70),
    seoDescription: sanitizeText(
      product.seoDescription,
      sensitiveIdentifiers,
      description
    ).slice(0, 180),
    brand: brandValue || null,
    price: knownRetailPriceFromMajor(product.price, currency),
    compareAtPrice: safeCompareAtPrice(
      product.compareAtPrice,
      product.price,
      currency
    ),
    availability: normalizeAvailability(product.stockStatus),
    attributeDefinitions: [
      ...normalizedProductAttributes.map((attribute) => attribute.definition),
      ...normalizedVariantAttributes.definitions,
    ],
    attributeValues: normalizedProductAttributes.map(
      (attribute) => attribute.value
    ),
    variants,
    purchaseOptions: [],
    media,
    collectionMemberships: options.collectionIds.map((collectionId, index) => ({
      collectionId,
      position: index,
      evidenceIds: [evidenceId],
    })),
    evidence: [
      {
        version: EVIDENCE_V2,
        evidenceId,
        kind: "DERIVED",
        state: "UNVERIFIED",
        subjectType: "PRODUCT",
        subjectRef: productId,
        recordedAt: options.adaptedAt,
        sourceRef: "legacy:adapter",
        contentDigest: digestCatalogValue(revisionIdentity),
        notes: ["Adapted from a legacy Product-like record"],
      },
    ],
    reasonCodes: ["LEGACY_ADAPTER_UNVERIFIED"],
  };

  const parsedRevision = ProductRevisionV2Schema.safeParse(revision);
  if (!parsedRevision.success) {
    return {
      status: "REFUSED",
      revision: null,
      storefrontProjection: null,
      reasonCodes: ["INVALID_ADAPTED_REVISION"],
    };
  }
  return {
    status: "ADAPTED",
    revision: parsedRevision.data,
    storefrontProjection: projectStorefrontProductV2(parsedRevision.data),
    reasonCodes: [],
  };
}
