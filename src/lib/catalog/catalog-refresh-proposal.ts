import { createHash } from "node:crypto";
import { z } from "zod";
import {
  assessCatalogAlignmentV1,
  catalogAlignmentV1Schema,
  catalogStorefrontRevisionFingerprintV1,
  notEvaluatedCatalogAlignmentV1,
  type CatalogAlignmentV1,
  type CatalogCurrentStateV1,
} from "@/lib/catalog/catalog-alignment";
import type {
  ProductDetailsResult,
  ProviderCapabilities,
  ProviderHealth,
  SupplierMedia,
  SupplierProductVariant,
} from "@/lib/suppliers/providers/types";

export const SUPPLIER_PRODUCT_SNAPSHOT_VERSION = "supplier-product-snapshot.v1" as const;
export const CATALOG_REFRESH_PROPOSAL_VERSION = "catalog-refresh-proposal.v1" as const;

const stockStatusSchema = z.enum([
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "PREORDER",
  "UNKNOWN",
]);

const providerCapabilitiesSchema = z
  .object({
    search: z.boolean(),
    details: z.boolean(),
    images: z.boolean(),
    video: z.boolean(),
    pricing: z.boolean(),
    inventory: z.boolean(),
    checkout: z.boolean(),
    tracking: z.boolean(),
    returns: z.boolean(),
    affiliateLinks: z.boolean(),
  })
  .strict();

const canonicalVariantSchema = z
  .object({
    identityKey: z.string().min(1),
    identityStable: z.boolean(),
    externalVariantId: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    optionSummary: z.string().min(1).optional(),
    options: z.record(z.string().min(1)),
    listedPrice: z.number().finite().nonnegative().optional(),
    supplierCost: z.number().finite().nonnegative().optional(),
    shippingCost: z.number().finite().nonnegative().optional(),
    stock: z
      .object({
        status: stockStatusSchema,
        quantity: z.number().finite().int().nonnegative().optional(),
        authoritative: z.boolean(),
      })
      .strict(),
    imageUrl: z.string().min(1).optional(),
  })
  .strict();

const canonicalMediaSchema = z
  .object({
    url: z.string().min(1),
    fingerprintUrl: z.string().min(1),
    mediaType: z.enum(["IMAGE", "VIDEO"]),
  })
  .strict();

const sha256FingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const supplierProductSnapshotV1Schema = z
  .object({
    version: z.literal(SUPPLIER_PRODUCT_SNAPSHOT_VERSION),
    observedAt: isoTimestampSchema,
    identity: z
      .object({
        providerKey: z.string().min(1),
        externalId: z.string().min(1),
        sourceUrl: z.string().min(1).optional(),
      })
      .strict(),
    source: z
      .object({
        healthStatus: z.literal("OK"),
        fulfillmentMode: z.enum(["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"]),
        capabilities: providerCapabilitiesSchema,
        fixtureMode: z.boolean(),
      })
      .strict(),
    facts: z
      .object({
        title: z.string().min(1).optional(),
        descriptionHash: sha256FingerprintSchema.optional(),
        brand: z.string().min(1).optional(),
        supplierCurrency: z.string().regex(/^[A-Z]{3}$/).optional(),
        supplierCost: z.number().finite().nonnegative().optional(),
        listedPrice: z.number().finite().nonnegative().optional(),
        shippingCost: z.number().finite().nonnegative().optional(),
        stock: z
          .object({
            status: stockStatusSchema,
            quantity: z.number().finite().int().nonnegative().optional(),
            authoritative: z.boolean(),
          })
          .strict(),
        shippingDaysMin: z.number().finite().int().nonnegative().optional(),
        shippingDaysMax: z.number().finite().int().nonnegative().optional(),
        countryOfOrigin: z.string().min(1).optional(),
        sku: z.string().min(1).optional(),
        gtin: z.string().min(1).optional(),
      })
      .strict(),
    variants: z.array(canonicalVariantSchema),
    media: z.array(canonicalMediaSchema),
    completeness: z
      .object({
        product: z.boolean(),
        pricing: z.boolean(),
        inventory: z.boolean(),
        variants: z.boolean(),
        media: z.boolean(),
      })
      .strict(),
    fingerprint: sha256FingerprintSchema,
  })
  .strict();

export type SupplierProductSnapshotV1 = z.infer<
  typeof supplierProductSnapshotV1Schema
>;

export type CatalogRefreshDecision =
  | "BASELINE_CAPTURED"
  | "NO_CHANGE"
  | "PROPOSED"
  | "REVIEW_REQUIRED"
  | "SOURCE_UNAVAILABLE";

export const catalogRefreshDecisionSchema = z.enum([
  "BASELINE_CAPTURED",
  "NO_CHANGE",
  "PROPOSED",
  "REVIEW_REQUIRED",
  "SOURCE_UNAVAILABLE",
]);

export interface CatalogRefreshChangeV1 {
  field: string;
  impact: "LOW" | "HIGH";
  previous: string | number | boolean | null;
  next: string | number | boolean | null;
}

export interface CatalogRefreshProposalV1 {
  version: typeof CATALOG_REFRESH_PROPOSAL_VERSION;
  productId: string;
  productTitle: string;
  providerKey: string;
  externalId: string;
  observedAt: string;
  productRevisionAt: string;
  storefrontRevisionFingerprint: string;
  decision: CatalogRefreshDecision;
  reasonCodes: string[];
  previousFingerprint?: string;
  proposalFingerprint: string;
  changes: CatalogRefreshChangeV1[];
  catalogAlignment: CatalogAlignmentV1;
  snapshot?: SupplierProductSnapshotV1;
}

const catalogRefreshChangeValueV1Schema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const catalogRefreshChangeV1Schema = z
  .object({
    field: z.string().min(1),
    impact: z.enum(["LOW", "HIGH"]),
    previous: catalogRefreshChangeValueV1Schema,
    next: catalogRefreshChangeValueV1Schema,
  })
  .strict();

export const catalogRefreshProposalV1Schema = z
  .object({
    version: z.literal(CATALOG_REFRESH_PROPOSAL_VERSION),
    productId: z.string().min(1),
    productTitle: z.string().min(1),
    providerKey: z.string().min(1),
    externalId: z.string().min(1),
    observedAt: isoTimestampSchema,
    productRevisionAt: isoTimestampSchema,
    storefrontRevisionFingerprint: sha256FingerprintSchema,
    decision: catalogRefreshDecisionSchema,
    reasonCodes: z.array(z.string().min(1)),
    previousFingerprint: sha256FingerprintSchema.optional(),
    proposalFingerprint: sha256FingerprintSchema,
    changes: z.array(catalogRefreshChangeV1Schema),
    catalogAlignment: catalogAlignmentV1Schema,
    snapshot: supplierProductSnapshotV1Schema.optional(),
  })
  .strict()
  .superRefine((proposal, context) => {
    const unavailable = proposal.decision === "SOURCE_UNAVAILABLE";
    if (unavailable === Boolean(proposal.snapshot)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["snapshot"],
        message: unavailable
          ? "SOURCE_UNAVAILABLE must not include a supplier snapshot"
          : "A supplier observation decision requires a supplier snapshot",
      });
    }
    if (unavailable && proposal.previousFingerprint) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["previousFingerprint"],
        message: "SOURCE_UNAVAILABLE must not claim a previous supplier fingerprint",
      });
    }
    const requiresPrevious = ["NO_CHANGE", "PROPOSED", "REVIEW_REQUIRED"].includes(
      proposal.decision
    );
    if (requiresPrevious !== Boolean(proposal.previousFingerprint)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["previousFingerprint"],
        message: requiresPrevious
          ? `${proposal.decision} requires a previous supplier fingerprint`
          : `${proposal.decision} must not include a previous supplier fingerprint`,
      });
    }
    if (
      ["BASELINE_CAPTURED", "NO_CHANGE", "SOURCE_UNAVAILABLE"].includes(
        proposal.decision
      ) &&
      proposal.changes.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["changes"],
        message: `${proposal.decision} must not include supplier changes`,
      });
    }
    if (
      ["PROPOSED", "REVIEW_REQUIRED"].includes(proposal.decision) &&
      proposal.changes.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["changes"],
        message: `${proposal.decision} requires at least one supplier change`,
      });
    }
    if (proposal.snapshot) {
      if (proposal.snapshot.identity.providerKey !== proposal.providerKey) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["providerKey"],
          message: "Proposal and supplier snapshot provider identities must match",
        });
      }
      if (proposal.snapshot.identity.externalId !== proposal.externalId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["externalId"],
          message: "Proposal and supplier snapshot product identities must match",
        });
      }
      if (proposal.snapshot.observedAt !== proposal.observedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["observedAt"],
          message: "Proposal and supplier snapshot observation times must match",
        });
      }
    }
  });

export function parseCatalogRefreshProposalV1(
  value: unknown
): CatalogRefreshProposalV1 | null {
  const parsed = catalogRefreshProposalV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function buildSupplierProductSnapshotV1(input: {
  requestedProviderKey: string;
  requestedExternalId: string;
  observedAt: Date;
  health: ProviderHealth;
  details: ProductDetailsResult;
}): SupplierProductSnapshotV1 {
  if (!Number.isFinite(input.observedAt.getTime())) {
    throw new Error("CATALOG_REFRESH_INVALID_OBSERVED_AT");
  }
  if (input.health.status !== "OK" || !input.health.capabilities.details) {
    throw new Error("CATALOG_REFRESH_PROVIDER_NOT_READY");
  }
  if (
    input.health.key !== input.requestedProviderKey ||
    input.details.providerKey !== input.requestedProviderKey ||
    input.details.externalId !== input.requestedExternalId
  ) {
    throw new Error("CATALOG_REFRESH_IDENTITY_MISMATCH");
  }

  const capabilities = { ...input.health.capabilities };
  const stock = authoritativeStock(
    input.details.stockStatus,
    undefined,
    capabilities.inventory
  );
  const variants = canonicalizeVariants(input.details.variants, capabilities);
  const media = canonicalizeMedia(input.details.media);
  const facts = {
    title: cleanString(input.details.title),
    descriptionHash: input.details.description
      ? sha256(input.details.description.trim())
      : undefined,
    brand: cleanString(input.details.brand),
    supplierCurrency: cleanCurrency(input.details.currency),
    supplierCost: cleanAmount(input.details.supplierCost),
    listedPrice: cleanAmount(input.details.price),
    shippingCost: cleanAmount(input.details.shippingCost),
    stock,
    shippingDaysMin: cleanNonnegativeInteger(input.details.shippingDaysMin),
    shippingDaysMax: cleanNonnegativeInteger(input.details.shippingDaysMax),
    countryOfOrigin: cleanString(input.details.countryOfOrigin),
    sku: cleanString(input.details.sku),
    gtin: cleanString(input.details.gtin),
  };
  const fixtureMode = isFixtureProduct(input.details);
  const sourceUrl = cleanString(input.details.sourceUrl);
  const auditSourceUrl = sourceUrl ? sanitizeAuditUrl(sourceUrl) : undefined;
  const fulfillmentMode =
    input.details.fulfillmentMode ?? input.health.defaultFulfillmentMode;
  if (
    facts.shippingDaysMin !== undefined &&
    facts.shippingDaysMax !== undefined &&
    facts.shippingDaysMin > facts.shippingDaysMax
  ) {
    throw new Error("CATALOG_REFRESH_INVALID_SHIPPING_WINDOW");
  }
  const fingerprint = stableHash({
    identity: {
      providerKey: input.requestedProviderKey,
      externalId: input.requestedExternalId,
      sourceUrl: auditSourceUrl,
    },
    source: { fulfillmentMode, fixtureMode },
    facts,
    variants,
    media: media.map((entry) => ({
      fingerprintUrl: entry.fingerprintUrl,
      mediaType: entry.mediaType,
    })),
  });

  return supplierProductSnapshotV1Schema.parse({
    version: SUPPLIER_PRODUCT_SNAPSHOT_VERSION,
    observedAt: input.observedAt.toISOString(),
    identity: {
      providerKey: input.requestedProviderKey,
      externalId: input.requestedExternalId,
      sourceUrl: auditSourceUrl,
    },
    source: {
      healthStatus: "OK",
      fulfillmentMode,
      capabilities,
      fixtureMode,
    },
    facts,
    variants,
    media,
    completeness: {
      product: true,
      pricing:
        capabilities.pricing &&
        Boolean(facts.supplierCurrency) &&
        (facts.supplierCost !== undefined || facts.listedPrice !== undefined),
      inventory: stock.authoritative,
      variants:
        variants.length > 0 &&
        variants.every((variant) => variant.identityStable) &&
        new Set(variants.map((variant) => variant.identityKey)).size === variants.length,
      media: capabilities.images && media.length > 0,
    },
    fingerprint,
  });
}

export function buildCatalogRefreshProposalV1(input: {
  productId: string;
  productTitle: string;
  productRevisionAt?: Date;
  snapshot: SupplierProductSnapshotV1;
  previousSnapshot?: SupplierProductSnapshotV1;
  currentCatalog?: CatalogCurrentStateV1;
}): CatalogRefreshProposalV1 {
  const { snapshot, previousSnapshot } = input;
  const catalogAlignment = assessCatalogAlignmentV1({
    snapshot,
    current: input.currentCatalog,
  });
  if (
    previousSnapshot &&
    (previousSnapshot.identity.providerKey !== snapshot.identity.providerKey ||
      previousSnapshot.identity.externalId !== snapshot.identity.externalId)
  ) {
    throw new Error("CATALOG_REFRESH_PREVIOUS_IDENTITY_MISMATCH");
  }

  if (!previousSnapshot) {
    return proposal({
      ...input,
      decision: "BASELINE_CAPTURED",
      reasonCodes: [
        "FIRST_SUPPLIER_OBSERVATION",
        ...snapshotConditionReasonCodes(snapshot),
      ].sort(),
      changes: [],
      catalogAlignment,
    });
  }

  if (previousSnapshot.fingerprint === snapshot.fingerprint) {
    return proposal({
      ...input,
      decision: "NO_CHANGE",
      reasonCodes: snapshotConditionReasonCodes(snapshot),
      changes: [],
      catalogAlignment,
    });
  }

  const changes = diffSupplierSnapshots(previousSnapshot, snapshot);
  const reasonCodes = [
    ...new Set([
      ...reasonCodesForChanges(previousSnapshot, snapshot, changes),
      ...snapshotConditionReasonCodes(snapshot),
    ]),
  ].sort();
  return proposal({
    ...input,
    decision: changes.some((change) => change.impact === "HIGH")
      ? "REVIEW_REQUIRED"
      : "PROPOSED",
    reasonCodes,
    changes,
    catalogAlignment,
  });
}

export function buildSourceUnavailableProposalV1(input: {
  productId: string;
  productTitle: string;
  productRevisionAt?: Date;
  currentCatalog?: CatalogCurrentStateV1;
  providerKey: string;
  externalId: string;
  observedAt: Date;
  reasonCode: string;
}): CatalogRefreshProposalV1 {
  const observedAt = input.observedAt.toISOString();
  const productRevisionAt = validRevisionTimestamp(
    input.productRevisionAt,
    input.observedAt
  );
  const storefrontRevisionFingerprint =
    catalogStorefrontRevisionFingerprintV1(input.currentCatalog);
  return catalogRefreshProposalV1Schema.parse({
    version: CATALOG_REFRESH_PROPOSAL_VERSION,
    productId: input.productId,
    productTitle: input.productTitle,
    providerKey: input.providerKey,
    externalId: input.externalId,
    observedAt,
    productRevisionAt,
    storefrontRevisionFingerprint,
    decision: "SOURCE_UNAVAILABLE",
    reasonCodes: [input.reasonCode],
    proposalFingerprint: stableHash({
      productId: input.productId,
      providerKey: input.providerKey,
      externalId: input.externalId,
      productRevisionAt,
      storefrontRevisionFingerprint,
      decision: "SOURCE_UNAVAILABLE",
      reasonCode: input.reasonCode,
    }),
    changes: [],
    catalogAlignment: notEvaluatedCatalogAlignmentV1("SUPPLIER_SOURCE_UNAVAILABLE"),
  });
}

export function parseSupplierProductSnapshotV1(
  value: unknown
): SupplierProductSnapshotV1 | null {
  const parsed = supplierProductSnapshotV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isFixtureProduct(details: ProductDetailsResult): boolean {
  if (details.providerKey === "mock") return true;
  const signals = details.signals;
  return (
    signals.syntheticFixture === true ||
    signals.localDemoOnly === true ||
    signals.productionEligible === false
  );
}

function proposal(input: {
  productId: string;
  productTitle: string;
  productRevisionAt?: Date;
  snapshot: SupplierProductSnapshotV1;
  previousSnapshot?: SupplierProductSnapshotV1;
  currentCatalog?: CatalogCurrentStateV1;
  decision: Exclude<CatalogRefreshDecision, "SOURCE_UNAVAILABLE">;
  reasonCodes: string[];
  changes: CatalogRefreshChangeV1[];
  catalogAlignment: CatalogAlignmentV1;
}): CatalogRefreshProposalV1 {
  const productRevisionAt = validRevisionTimestamp(
    input.productRevisionAt,
    new Date(input.snapshot.observedAt)
  );
  const storefrontRevisionFingerprint =
    catalogStorefrontRevisionFingerprintV1(input.currentCatalog);
  const proposalFingerprint = stableHash({
    productId: input.productId,
    productRevisionAt,
    storefrontRevisionFingerprint,
    previousFingerprint: input.previousSnapshot?.fingerprint,
    snapshotFingerprint: input.snapshot.fingerprint,
    decision: input.decision,
    changes: input.changes,
    catalogAlignment: input.catalogAlignment,
  });
  return catalogRefreshProposalV1Schema.parse({
    version: CATALOG_REFRESH_PROPOSAL_VERSION,
    productId: input.productId,
    productTitle: input.productTitle,
    providerKey: input.snapshot.identity.providerKey,
    externalId: input.snapshot.identity.externalId,
    observedAt: input.snapshot.observedAt,
    productRevisionAt,
    storefrontRevisionFingerprint,
    decision: input.decision,
    reasonCodes: input.reasonCodes,
    previousFingerprint: input.previousSnapshot?.fingerprint,
    proposalFingerprint,
    changes: input.changes,
    catalogAlignment: input.catalogAlignment,
    snapshot: input.snapshot,
  });
}

function validRevisionTimestamp(value: Date | undefined, fallback: Date): string {
  const revision = value ?? fallback;
  if (!Number.isFinite(revision.getTime())) {
    throw new Error("CATALOG_REFRESH_INVALID_PRODUCT_REVISION");
  }
  return revision.toISOString();
}

function diffSupplierSnapshots(
  previous: SupplierProductSnapshotV1,
  next: SupplierProductSnapshotV1
): CatalogRefreshChangeV1[] {
  const changes: CatalogRefreshChangeV1[] = [];
  addChange(changes, "identity.sourceUrl", "HIGH", previous.identity.sourceUrl, next.identity.sourceUrl);
  addChange(
    changes,
    "source.fulfillmentMode",
    "HIGH",
    previous.source.fulfillmentMode,
    next.source.fulfillmentMode
  );
  addChange(changes, "facts.title", "LOW", previous.facts.title, next.facts.title);
  addChange(changes, "facts.description", "LOW", previous.facts.descriptionHash, next.facts.descriptionHash);
  addChange(changes, "facts.brand", "LOW", previous.facts.brand, next.facts.brand);
  addChange(
    changes,
    "facts.supplierCurrency",
    "HIGH",
    previous.facts.supplierCurrency,
    next.facts.supplierCurrency
  );
  addChange(changes, "facts.supplierCost", "HIGH", previous.facts.supplierCost, next.facts.supplierCost);
  addChange(changes, "facts.listedPrice", "HIGH", previous.facts.listedPrice, next.facts.listedPrice);
  addChange(changes, "facts.shippingCost", "HIGH", previous.facts.shippingCost, next.facts.shippingCost);
  addChange(changes, "facts.stock.status", "HIGH", previous.facts.stock.status, next.facts.stock.status);
  addChange(
    changes,
    "facts.stock.authoritative",
    "HIGH",
    previous.facts.stock.authoritative,
    next.facts.stock.authoritative
  );
  addChange(
    changes,
    "facts.shippingDaysMin",
    "HIGH",
    previous.facts.shippingDaysMin,
    next.facts.shippingDaysMin
  );
  addChange(
    changes,
    "facts.shippingDaysMax",
    "HIGH",
    previous.facts.shippingDaysMax,
    next.facts.shippingDaysMax
  );
  addChange(
    changes,
    "facts.countryOfOrigin",
    "HIGH",
    previous.facts.countryOfOrigin,
    next.facts.countryOfOrigin
  );
  addChange(changes, "facts.sku", "HIGH", previous.facts.sku, next.facts.sku);
  addChange(changes, "facts.gtin", "HIGH", previous.facts.gtin, next.facts.gtin);

  const previousVariants = stableHash(previous.variants);
  const nextVariants = stableHash(next.variants);
  if (previousVariants !== nextVariants) {
    changes.push({
      field: "variants.manifest",
      impact: "HIGH",
      previous: previous.variants.length,
      next: next.variants.length,
    });
  }

  const previousMedia = mediaManifestHash(previous.media);
  const nextMedia = mediaManifestHash(next.media);
  if (previousMedia !== nextMedia) {
    changes.push({
      field: "media.manifest",
      impact: next.media.length < previous.media.length ? "HIGH" : "LOW",
      previous: previous.media.length,
      next: next.media.length,
    });
  }
  return changes;
}

function snapshotConditionReasonCodes(
  snapshot: SupplierProductSnapshotV1
): string[] {
  const reasons: string[] = [];
  if (!snapshot.completeness.pricing) reasons.push("PRICING_EVIDENCE_INCOMPLETE");
  if (!snapshot.completeness.inventory) reasons.push("INVENTORY_EVIDENCE_INCOMPLETE");
  if (snapshot.variants.length > 0 && !snapshot.completeness.variants) {
    reasons.push("VARIANT_IDENTITY_INCOMPLETE");
  }
  if (!snapshot.completeness.media) reasons.push("MEDIA_EVIDENCE_INCOMPLETE");
  if (
    snapshot.facts.stock.authoritative &&
    snapshot.facts.stock.status === "OUT_OF_STOCK"
  ) {
    reasons.push("SUPPLIER_OUT_OF_STOCK");
  }
  return reasons.sort();
}

function mediaManifestHash(media: SupplierProductSnapshotV1["media"]): string {
  return stableHash(
    media.map((entry) => ({
      fingerprintUrl: entry.fingerprintUrl,
      mediaType: entry.mediaType,
    }))
  );
}

function reasonCodesForChanges(
  previous: SupplierProductSnapshotV1,
  next: SupplierProductSnapshotV1,
  changes: CatalogRefreshChangeV1[]
): string[] {
  const reasons = new Set<string>();
  for (const change of changes) {
    if (change.next === null && change.previous !== null) {
      reasons.add("SUPPLIER_FACT_NOT_OBSERVED");
    }
    if (change.field.startsWith("facts.stock")) reasons.add("INVENTORY_CHANGED");
    else if (change.field.includes("Cost") || change.field.includes("Price")) reasons.add("SUPPLIER_PRICE_CHANGED");
    else if (change.field === "facts.supplierCurrency") reasons.add("SUPPLIER_CURRENCY_CHANGED");
    else if (change.field === "variants.manifest") reasons.add("VARIANT_MANIFEST_CHANGED");
    else if (change.field === "media.manifest") reasons.add("MEDIA_MANIFEST_CHANGED");
    else if (change.field.startsWith("facts.shipping")) reasons.add("SHIPPING_PROMISE_CHANGED");
    else if (change.field.startsWith("identity.") || change.field === "source.fulfillmentMode") reasons.add("SUPPLIER_ROUTE_CHANGED");
    else reasons.add("SUPPLIER_CONTENT_CHANGED");
  }
  if (next.facts.stock.authoritative && next.facts.stock.status === "OUT_OF_STOCK") {
    reasons.add("SUPPLIER_OUT_OF_STOCK");
  }
  if (
    changes.some((change) => change.field === "variants.manifest") &&
    (!previous.completeness.variants || !next.completeness.variants)
  ) {
    reasons.add("VARIANT_IDENTITY_INCOMPLETE");
  }
  return [...reasons].sort();
}

function addChange(
  changes: CatalogRefreshChangeV1[],
  field: string,
  impact: CatalogRefreshChangeV1["impact"],
  previous: string | number | boolean | undefined,
  next: string | number | boolean | undefined
): void {
  if (previous === next) return;
  changes.push({ field, impact, previous: previous ?? null, next: next ?? null });
}

function canonicalizeVariants(
  variants: SupplierProductVariant[],
  capabilities: ProviderCapabilities
): SupplierProductSnapshotV1["variants"] {
  return variants
    .map((variant) => {
      const externalVariantId = cleanString(variant.externalVariantId);
      const sku = cleanString(variant.sku);
      const options = Object.fromEntries(
        Object.entries(variant.options ?? {})
          .filter((entry): entry is [string, string] => typeof entry[1] === "string")
          .map(([key, value]) => [key.trim(), value.trim()] as const)
          .filter(([key, value]) => Boolean(key && value))
          .sort(([left], [right]) => left.localeCompare(right))
      );
      const fallbackIdentity = stableHash({
        title: cleanString(variant.title),
        optionSummary: cleanString(variant.optionSummary),
        options,
      }).slice(0, 20);
      return {
        identityKey: externalVariantId
          ? `id:${externalVariantId}`
          : sku
            ? `sku:${sku}`
            : `ambiguous:${fallbackIdentity}`,
        identityStable: Boolean(externalVariantId || sku),
        externalVariantId,
        sku,
        title: cleanString(variant.title),
        optionSummary: cleanString(variant.optionSummary),
        options,
        listedPrice: cleanAmount(variant.price),
        supplierCost: cleanAmount(variant.supplierCost),
        shippingCost: cleanAmount(variant.shippingCost),
        stock: authoritativeStock(
          variant.stockStatus ?? "UNKNOWN",
          variant.inventoryQuantity,
          capabilities.inventory
        ),
        imageUrl: variant.imageUrl
          ? normalizeMediaFingerprintUrl(variant.imageUrl)
          : undefined,
      };
    })
    .sort((left, right) =>
      left.identityKey.localeCompare(right.identityKey) ||
      stableStringify(left).localeCompare(stableStringify(right))
    );
}

function canonicalizeMedia(media: SupplierMedia[]): SupplierProductSnapshotV1["media"] {
  const deduplicated = new Map<string, SupplierProductSnapshotV1["media"][number]>();
  for (const entry of media) {
    const url = cleanString(entry.url);
    if (!url) continue;
    const fingerprintUrl = normalizeMediaFingerprintUrl(url);
    const key = `${entry.mediaType}:${fingerprintUrl}`;
    if (!deduplicated.has(key)) {
      deduplicated.set(key, {
        url: sanitizeAuditUrl(url),
        fingerprintUrl,
        mediaType: entry.mediaType,
      });
    }
  }
  return [...deduplicated.values()].sort((left, right) =>
    `${left.mediaType}:${left.fingerprintUrl}`.localeCompare(
      `${right.mediaType}:${right.fingerprintUrl}`
    )
  );
}

function authoritativeStock(
  status: SupplierProductVariant["stockStatus"] | ProductDetailsResult["stockStatus"],
  quantity: number | undefined,
  inventoryCapability: boolean
): SupplierProductSnapshotV1["facts"]["stock"] {
  const normalizedStatus = status ?? "UNKNOWN";
  const cleanQuantity = cleanNonnegativeInteger(quantity);
  const authoritative =
    inventoryCapability &&
    (normalizedStatus !== "UNKNOWN" || cleanQuantity !== undefined);
  if (!authoritative) return { status: "UNKNOWN", authoritative: false };
  const statusFromQuantity =
    normalizedStatus === "UNKNOWN" && cleanQuantity !== undefined
      ? cleanQuantity === 0
        ? "OUT_OF_STOCK"
        : "IN_STOCK"
      : normalizedStatus;
  return {
    status: statusFromQuantity,
    quantity: cleanQuantity,
    authoritative: true,
  };
}

function normalizeMediaFingerprintUrl(value: string): string {
  return sanitizeAuditUrl(value, true);
}

function sanitizeAuditUrl(value: string, fingerprint = false): string {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (
        /^(x-(?:amz|goog|oss)-|expires?|signature|sig|token|access[_-]?token|auth|authorization|credential|key|policy|spm|timestamp|ts|cache|cb)/i.test(
          key
        ) ||
        (fingerprint && /^(utm_|ref$|source$)/i.test(key))
      ) {
        url.searchParams.delete(key);
      }
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanCurrency(value: unknown): string | undefined {
  const currency = cleanString(value)?.toUpperCase();
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined;
}

function cleanAmount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value * 1_000_000) / 1_000_000
    : undefined;
}

function cleanNonnegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function stableHash(value: unknown): string {
  return sha256(stableStringify(value));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortJson(entry)])
  );
}
