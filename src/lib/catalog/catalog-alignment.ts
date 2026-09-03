import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  CatalogRefreshChangeV1,
  SupplierProductSnapshotV1,
} from "@/lib/catalog/catalog-refresh-proposal";

export const CATALOG_ALIGNMENT_VERSION = "catalog-alignment.v1" as const;
export const CATALOG_STOREFRONT_REVISION_VERSION =
  "catalog-storefront-revision.v1" as const;

export interface CatalogCurrentVariantV1 {
  externalVariantId?: string | null;
  sku?: string | null;
  stockStatus?: string | null;
}

export interface CatalogCurrentStateV1 {
  fulfillmentMode: string;
  sourceUrl?: string | null;
  stockStatus: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin?: string | null;
  sku: string;
  gtin?: string | null;
  variants: CatalogCurrentVariantV1[];
  mediaSourceUrls: string[];
}

export interface CatalogAlignmentV1 {
  version: typeof CATALOG_ALIGNMENT_VERSION;
  status: "ALIGNED" | "DRIFT" | "PARTIAL" | "NOT_EVALUATED";
  evaluatedFields: string[];
  skippedFields: string[];
  reasonCodes: string[];
  changes: CatalogRefreshChangeV1[];
}

const catalogAlignmentChangeValueV1Schema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const catalogAlignmentChangeV1Schema = z
  .object({
    field: z.string().min(1),
    impact: z.enum(["LOW", "HIGH"]),
    previous: catalogAlignmentChangeValueV1Schema,
    next: catalogAlignmentChangeValueV1Schema,
  })
  .strict();

export const catalogAlignmentV1Schema = z
  .object({
    version: z.literal(CATALOG_ALIGNMENT_VERSION),
    status: z.enum(["ALIGNED", "DRIFT", "PARTIAL", "NOT_EVALUATED"]),
    evaluatedFields: z.array(z.string().min(1)),
    skippedFields: z.array(z.string().min(1)),
    reasonCodes: z.array(z.string().min(1)),
    changes: z.array(catalogAlignmentChangeV1Schema),
  })
  .strict();

export function parseCatalogAlignmentV1(value: unknown): CatalogAlignmentV1 | null {
  const parsed = catalogAlignmentV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Captures the complete normalized storefront input used by
 * assessCatalogAlignmentV1. Array order and volatile URL credentials do not
 * create false revisions, while any semantically relevant product, variant or
 * media edit produces a different fingerprint.
 */
export function catalogStorefrontRevisionFingerprintV1(
  current?: CatalogCurrentStateV1
): string {
  return stableHash({
    version: CATALOG_STOREFRONT_REVISION_VERSION,
    current: current
      ? {
          fulfillmentMode: current.fulfillmentMode,
          sourceUrl: normalizeAuditUrl(current.sourceUrl) ?? null,
          stockStatus: cleanString(current.stockStatus)?.toUpperCase() ?? null,
          shippingDaysMin: current.shippingDaysMin,
          shippingDaysMax: current.shippingDaysMax,
          countryOfOrigin:
            cleanString(current.countryOfOrigin)?.toUpperCase() ?? null,
          sku: cleanString(current.sku) ?? null,
          gtin: cleanString(current.gtin) ?? null,
          variants: current.variants
            .map((variant) => ({
              externalVariantId: cleanString(variant.externalVariantId) ?? null,
              sku: cleanString(variant.sku) ?? null,
              stockStatus:
                cleanString(variant.stockStatus)?.toUpperCase() ?? null,
            }))
            .sort(compareCanonicalValues),
          mediaSourceUrls: uniqueSorted(
            current.mediaSourceUrls.map(normalizeAuditUrl).filter(isDefined)
          ),
        }
      : null,
  });
}

/**
 * Compares only like-for-like operational facts. Retail price and normalized
 * cost are deliberately excluded because the storefront values may include
 * FX conversion, margin and shipping policy that must be recomputed by a
 * separate pricing engine.
 */
export function assessCatalogAlignmentV1(input: {
  snapshot: SupplierProductSnapshotV1;
  current?: CatalogCurrentStateV1;
}): CatalogAlignmentV1 {
  if (!input.current) return notEvaluatedCatalogAlignmentV1();

  const { snapshot, current } = input;
  const changes: CatalogRefreshChangeV1[] = [];
  const evaluatedFields: string[] = [];
  const skippedFields: string[] = [];
  const reasonCodes = new Set<string>();

  compare(
    "catalog.fulfillmentMode",
    current.fulfillmentMode,
    snapshot.source.fulfillmentMode,
    "CATALOG_ROUTE_DRIFT"
  );
  if (snapshot.identity.sourceUrl) {
    compare(
      "catalog.sourceUrl",
      normalizeAuditUrl(current.sourceUrl),
      normalizeAuditUrl(snapshot.identity.sourceUrl),
      "CATALOG_ROUTE_DRIFT"
    );
  } else {
    skip("catalog.sourceUrl");
  }

  if (snapshot.facts.stock.authoritative) {
    compare(
      "catalog.stockStatus",
      cleanString(current.stockStatus)?.toUpperCase(),
      snapshot.facts.stock.status,
      "CATALOG_INVENTORY_DRIFT"
    );
  } else {
    skip("catalog.stockStatus");
  }

  compareOptionalSupplierFact(
    "catalog.shippingDaysMin",
    current.shippingDaysMin,
    snapshot.facts.shippingDaysMin,
    "CATALOG_SHIPPING_DRIFT"
  );
  compareOptionalSupplierFact(
    "catalog.shippingDaysMax",
    current.shippingDaysMax,
    snapshot.facts.shippingDaysMax,
    "CATALOG_SHIPPING_DRIFT"
  );
  compareOptionalSupplierFact(
    "catalog.countryOfOrigin",
    cleanString(current.countryOfOrigin)?.toUpperCase(),
    cleanString(snapshot.facts.countryOfOrigin)?.toUpperCase(),
    "CATALOG_IDENTITY_FACT_DRIFT"
  );
  compareOptionalSupplierFact(
    "catalog.sku",
    cleanString(current.sku),
    cleanString(snapshot.facts.sku),
    "CATALOG_IDENTITY_FACT_DRIFT"
  );
  compareOptionalSupplierFact(
    "catalog.gtin",
    cleanString(current.gtin),
    cleanString(snapshot.facts.gtin),
    "CATALOG_IDENTITY_FACT_DRIFT"
  );

  if (snapshot.variants.length === 0) {
    skip("catalog.variants.manifest");
  } else if (!snapshot.completeness.variants) {
    skip("catalog.variants.manifest");
    reasonCodes.add("CATALOG_VARIANT_IDENTITY_INCOMPLETE");
  } else {
    const supplierVariants = snapshot.variants.map((variant) => ({
      identityKey: variant.identityKey,
      stockStatus: variant.stock.authoritative ? variant.stock.status : undefined,
    }));
    const authoritativeVariantStock = new Set(
      supplierVariants
        .filter((variant) => variant.stockStatus !== undefined)
        .map((variant) => variant.identityKey)
    );
    const catalogVariants = current.variants
      .map((variant) => {
        const externalVariantId = cleanString(variant.externalVariantId);
        const sku = cleanString(variant.sku);
        const identityKey = externalVariantId
          ? `id:${externalVariantId}`
          : sku
            ? `sku:${sku}`
            : null;
        return identityKey
          ? {
              identityKey,
              stockStatus: authoritativeVariantStock.has(identityKey)
                ? cleanString(variant.stockStatus)?.toUpperCase()
                : undefined,
            }
          : null;
      })
      .filter((variant): variant is { identityKey: string; stockStatus: string | undefined } =>
        Boolean(variant)
      )
      .sort((left, right) => left.identityKey.localeCompare(right.identityKey));
    supplierVariants.sort((left, right) => left.identityKey.localeCompare(right.identityKey));
    if (
      catalogVariants.length !== current.variants.length ||
      new Set(catalogVariants.map((variant) => variant.identityKey)).size !==
        catalogVariants.length
    ) {
      reasonCodes.add("CATALOG_VARIANT_IDENTITY_INCOMPLETE");
    }
    compare(
      "catalog.variants.manifest",
      stableHash(catalogVariants),
      stableHash(supplierVariants),
      "CATALOG_VARIANT_DRIFT",
      current.variants.length,
      snapshot.variants.length
    );
  }

  if (!snapshot.completeness.media) {
    skip("catalog.media.manifest");
  } else {
    const catalogMedia = uniqueSorted(
      current.mediaSourceUrls.map(normalizeAuditUrl).filter(isDefined)
    );
    const supplierMedia = uniqueSorted(
      snapshot.media.map((media) => normalizeAuditUrl(media.fingerprintUrl)).filter(isDefined)
    );
    compare(
      "catalog.media.manifest",
      stableHash(catalogMedia),
      stableHash(supplierMedia),
      "CATALOG_MEDIA_DRIFT",
      catalogMedia.length,
      supplierMedia.length
    );
  }

  if (skippedFields.length > 0) reasonCodes.add("CATALOG_ALIGNMENT_EVIDENCE_PARTIAL");
  if (changes.length === 0 && skippedFields.length === 0) reasonCodes.add("CATALOG_ALIGNED");
  return {
    version: CATALOG_ALIGNMENT_VERSION,
    status:
      changes.length > 0
        ? "DRIFT"
        : skippedFields.length > 0
          ? "PARTIAL"
          : "ALIGNED",
    evaluatedFields: uniqueSorted(evaluatedFields),
    skippedFields: uniqueSorted(skippedFields),
    reasonCodes: [...reasonCodes].sort(),
    changes,
  };

  function compareOptionalSupplierFact(
    field: string,
    previous: string | number | undefined,
    next: string | number | undefined,
    reasonCode: string
  ): void {
    if (next === undefined) {
      skip(field);
      return;
    }
    compare(field, previous, next, reasonCode);
  }

  function compare(
    field: string,
    previous: string | number | boolean | undefined,
    next: string | number | boolean | undefined,
    reasonCode: string,
    displayPrevious: string | number | boolean | undefined = previous,
    displayNext: string | number | boolean | undefined = next
  ): void {
    evaluatedFields.push(field);
    if (previous === next) return;
    reasonCodes.add(reasonCode);
    changes.push({
      field,
      impact: field === "catalog.media.manifest" ? "LOW" : "HIGH",
      previous: displayPrevious ?? null,
      next: displayNext ?? null,
    });
  }

  function skip(field: string): void {
    skippedFields.push(field);
  }
}

export function notEvaluatedCatalogAlignmentV1(
  reasonCode = "CATALOG_ALIGNMENT_NOT_EVALUATED"
): CatalogAlignmentV1 {
  return {
    version: CATALOG_ALIGNMENT_VERSION,
    status: "NOT_EVALUATED",
    evaluatedFields: [],
    skippedFields: [],
    reasonCodes: [reasonCode],
    changes: [],
  };
}

function normalizeAuditUrl(value: string | null | undefined): string | undefined {
  const clean = cleanString(value);
  if (!clean) return undefined;
  try {
    const url = new URL(clean);
    for (const key of [...url.searchParams.keys()]) {
      if (
        /^(x-(?:amz|goog|oss)-|expires?|signature|sig|token|access[_-]?token|auth|authorization|credential|key|policy|spm|timestamp|ts|cache|cb|utm_|ref$|source$)/i.test(
          key
        )
      ) {
        url.searchParams.delete(key);
      }
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    return url.toString();
  } catch {
    return clean;
  }
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function compareCanonicalValues(left: unknown, right: unknown): number {
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  return leftJson < rightJson ? -1 : leftJson > rightJson ? 1 : 0;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
