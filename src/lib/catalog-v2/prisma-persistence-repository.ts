import type {
  CatalogPersistenceModelV2,
  CatalogPersistenceOperationV2,
  CatalogPersistenceRepositoryV2,
  CatalogPersistenceTransactionV2,
} from "./persistence";

/**
 * Minimal raw-query surface implemented by PrismaClient and its transaction
 * client. Keeping this injectable avoids importing the process-global client or
 * opening a database connection when the adapter is constructed or tested.
 */
export interface CatalogV2PrismaTransaction {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
}

export interface CatalogV2PrismaClient extends CatalogV2PrismaTransaction {
  $transaction<T>(
    callback: (transaction: CatalogV2PrismaTransaction) => Promise<T>
  ): Promise<T>;
}

export type CatalogPersistenceRepositoryErrorCodeV2 =
  | "INVALID_CATALOG_PERSISTENCE_OPERATION"
  | "CATALOG_PERSISTENCE_PREVIEW_STORE_GUARD_FAILED"
  | "CATALOG_PERSISTENCE_ROW_CONFLICT"
  | "CATALOG_PERSISTENCE_POINTER_CONFLICT"
  | "CATALOG_PERSISTENCE_SEAL_CONFLICT";

export class CatalogPersistenceRepositoryErrorV2 extends Error {
  readonly code: CatalogPersistenceRepositoryErrorCodeV2;

  constructor(code: CatalogPersistenceRepositoryErrorCodeV2) {
    super(code);
    this.name = "CatalogPersistenceRepositoryErrorV2";
    this.code = code;
  }
}

export interface CatalogPersistencePreviewStoreGuardV2 {
  /** Exact tenant identity already resolved at the admin boundary. */
  readonly storeId: string;
  readonly storeSlug: string;
}

export interface PrismaCatalogPersistenceRepositoryOptionsV2 {
  /**
   * Optional Store Factory guard. When present, the exact Store row is locked
   * and re-checked inside the same transaction as all catalog writes.
   * General Catalog Core callers intentionally remain unguarded by default.
   */
  readonly previewStoreGuard?: CatalogPersistencePreviewStoreGuardV2;
}

type ColumnKind = "BIGINT" | "DATETIME" | "SCALAR";

interface CatalogModelSpecV2 {
  readonly table: CatalogPersistenceModelV2;
  readonly columns: readonly string[];
  readonly keyColumns: readonly string[];
  readonly bigintColumns: readonly string[];
  readonly dateTimeColumns: readonly string[];
  readonly mutableColumns: readonly string[];
}

/**
 * This is the complete identifier allowlist for Catalog Core V2 persistence.
 * SQL identifiers can only originate here; operation data is always bound as
 * positional parameters.
 */
const MODEL_SPECS_V2 = {
  CatalogArtifactV2: {
    table: "CatalogArtifactV2",
    columns: [
      "id",
      "storeId",
      "sourceKind",
      "sourceRef",
      "contractVersion",
      "description",
      "generatedAt",
      "taxonomyRef",
      "taxonomyContractVersion",
      "artifactJson",
      "contentDigest",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["generatedAt", "createdAt"],
    mutableColumns: [],
  },
  CatalogProductV2: {
    table: "CatalogProductV2",
    columns: [
      "id",
      "storeId",
      "legacyProductId",
      "canonicalKey",
      "status",
      "createdAt",
      "updatedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt", "updatedAt"],
    mutableColumns: [],
  },
  CatalogVariantIdentityV2: {
    table: "CatalogVariantIdentityV2",
    columns: [
      "id",
      "storeId",
      "productId",
      "stableKey",
      "createdAt",
      "updatedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt", "updatedAt"],
    mutableColumns: [],
  },
  CatalogTaxonomyNodeV2: {
    table: "CatalogTaxonomyNodeV2",
    columns: [
      "id",
      "storeId",
      "artifactId",
      "taxonomyRef",
      "contractVersion",
      "parentId",
      "key",
      "slug",
      "title",
      "description",
      "pathJson",
      "depth",
      "sortOrder",
      "createdAt",
      "updatedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt", "updatedAt"],
    mutableColumns: [],
  },
  CatalogCollectionV2: {
    table: "CatalogCollectionV2",
    columns: [
      "id",
      "storeId",
      "artifactId",
      "stableKey",
      "contractVersion",
      "slug",
      "title",
      "description",
      "seoTitle",
      "seoDescription",
      "kind",
      "publicationState",
      "position",
      "ruleJson",
      "createdAt",
      "updatedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt", "updatedAt"],
    mutableColumns: [],
  },
  CatalogProductRevisionV2: {
    table: "CatalogProductRevisionV2",
    columns: [
      "id",
      "storeId",
      "artifactId",
      "productId",
      "artifactRevisionRef",
      "revisionNumber",
      "contractVersion",
      "source",
      "revisionState",
      "slug",
      "title",
      "subtitle",
      "description",
      "brand",
      "seoTitle",
      "seoDescription",
      "retailPriceState",
      "retailPriceMinor",
      "currency",
      "compareAtPriceMinor",
      "compareAtPriceCurrency",
      "availability",
      "purchasable",
      "revisionJson",
      "contentDigest",
      "reasonCodesJson",
      "createdAt",
      "sealedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [
      "revisionNumber",
      "retailPriceMinor",
      "compareAtPriceMinor",
    ],
    dateTimeColumns: ["createdAt", "sealedAt"],
    mutableColumns: ["sealedAt"],
  },
  CatalogSellableVariantV2: {
    table: "CatalogSellableVariantV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "variantIdentityId",
      "stableKey",
      "label",
      "optionValuesJson",
      "retailPriceState",
      "retailPriceMinor",
      "currency",
      "compareAtPriceMinor",
      "compareAtPriceCurrency",
      "availability",
      "isDefault",
      "sortOrder",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: ["retailPriceMinor", "compareAtPriceMinor"],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogProductTaxonomyPlacementV2: {
    table: "CatalogProductTaxonomyPlacementV2",
    columns: [
      "storeId",
      "productRevisionId",
      "taxonomyNodeId",
      "isPrimary",
      "sortOrder",
    ],
    keyColumns: ["productRevisionId", "taxonomyNodeId"],
    bigintColumns: [],
    dateTimeColumns: [],
    mutableColumns: [],
  },
  CatalogAttributeDefinitionV2: {
    table: "CatalogAttributeDefinitionV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "stableKey",
      "key",
      "label",
      "valueType",
      "cardinality",
      "scope",
      "variantAxis",
      "storefrontVisible",
      "unitCode",
      "facetable",
      "comparable",
      "required",
      "sortOrder",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogAttributeOptionV2: {
    table: "CatalogAttributeOptionV2",
    columns: [
      "id",
      "storeId",
      "definitionId",
      "key",
      "label",
      "sortOrder",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogTaxonomyAttributeDefinitionV2: {
    table: "CatalogTaxonomyAttributeDefinitionV2",
    columns: ["storeId", "taxonomyNodeId", "definitionId", "sortOrder"],
    keyColumns: ["taxonomyNodeId", "definitionId"],
    bigintColumns: [],
    dateTimeColumns: [],
    mutableColumns: [],
  },
  CatalogProductAttributeValueV2: {
    table: "CatalogProductAttributeValueV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "variantId",
      "definitionId",
      "assignmentScopeKey",
      "valuesJson",
      "normalizedValuesJson",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogCollectionItemV2: {
    table: "CatalogCollectionItemV2",
    columns: [
      "collectionId",
      "productRevisionId",
      "storeId",
      "sortOrder",
      "evidenceIdsJson",
    ],
    keyColumns: ["collectionId", "productRevisionId"],
    bigintColumns: [],
    dateTimeColumns: [],
    mutableColumns: [],
  },
  CatalogMediaAssetV2: {
    table: "CatalogMediaAssetV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "stableKey",
      "kind",
      "role",
      "publicationState",
      "sortOrder",
      "publicUrl",
      "mimeType",
      "altText",
      "width",
      "height",
      "focalX",
      "focalY",
      "sourceKind",
      "sourceUrl",
      "rightsStatus",
      "evidenceIdsJson",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogMediaVariantV2: {
    table: "CatalogMediaVariantV2",
    columns: ["storeId", "mediaId", "variantId"],
    keyColumns: ["mediaId", "variantId"],
    bigintColumns: [],
    dateTimeColumns: [],
    mutableColumns: [],
  },
  CatalogPurchaseOptionV2: {
    table: "CatalogPurchaseOptionV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "stableKey",
      "kind",
      "label",
      "quantity",
      "variantId",
      "retailPriceState",
      "retailPriceMinor",
      "currency",
      "compareAtPriceMinor",
      "compareAtPriceCurrency",
      "availability",
      "repeatPurchaseState",
      "repeatIntervalDaysJson",
      "sortOrder",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [
      "quantity",
      "retailPriceMinor",
      "compareAtPriceMinor",
    ],
    dateTimeColumns: ["createdAt"],
    mutableColumns: [],
  },
  CatalogEvidenceV2: {
    table: "CatalogEvidenceV2",
    columns: [
      "id",
      "storeId",
      "productRevisionId",
      "stableKey",
      "contractVersion",
      "kind",
      "state",
      "subjectType",
      "subjectRef",
      "recordedAt",
      "sourceRef",
      "contentDigest",
      "notesJson",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["recordedAt", "createdAt"],
    mutableColumns: [],
  },
  CatalogSupplierOfferV2: {
    table: "CatalogSupplierOfferV2",
    columns: [
      "id",
      "storeId",
      "productId",
      "variantIdentityId",
      "contractVersion",
      "stableKey",
      "supplierAccountRef",
      "sourceOfferRef",
      "state",
      "observedCurrency",
      "latestObservationId",
      "evidenceIdsJson",
      "createdAt",
      "updatedAt",
    ],
    keyColumns: ["id"],
    bigintColumns: [],
    dateTimeColumns: ["createdAt", "updatedAt"],
    mutableColumns: ["latestObservationId", "updatedAt"],
  },
  CatalogSupplierOfferObservationV2: {
    table: "CatalogSupplierOfferObservationV2",
    columns: [
      "id",
      "storeId",
      "offerId",
      "contractVersion",
      "stableKey",
      "observedAt",
      "outcome",
      "unitCostState",
      "unitCostMinor",
      "unitCostCurrency",
      "shippingState",
      "shippingMinor",
      "shippingCurrency",
      "inventoryState",
      "inventoryQuantity",
      "availability",
      "shippingDaysMin",
      "shippingDaysMax",
      "sourcePayloadDigest",
      "evidenceIdsJson",
      "reasonCodesJson",
      "createdAt",
    ],
    keyColumns: ["id"],
    bigintColumns: ["unitCostMinor", "shippingMinor", "inventoryQuantity"],
    dateTimeColumns: ["observedAt", "createdAt"],
    mutableColumns: [],
  },
} as const satisfies Record<CatalogPersistenceModelV2, CatalogModelSpecV2>;

const SET_LATEST_OBSERVATION_SQL = `
  UPDATE "CatalogSupplierOfferV2" AS offer
  SET "latestObservationId" = $2,
      "updatedAt" = $3
  FROM "CatalogSupplierOfferObservationV2" AS target
  WHERE offer."id" = $1
    AND target."id" = $2
    AND target."offerId" = offer."id"
    AND target."storeId" = offer."storeId"
    AND target."observedAt" <= $3
    AND NOT EXISTS (
      SELECT 1
      FROM "CatalogSupplierOfferObservationV2" AS newer
      WHERE newer."offerId" = offer."id"
        AND newer."storeId" = offer."storeId"
        AND (
          newer."observedAt" > target."observedAt"
          OR (
            newer."observedAt" = target."observedAt"
            AND newer."stableKey" COLLATE "C" >
                target."stableKey" COLLATE "C"
          )
        )
    )
    AND (
      offer."latestObservationId" IS NULL
      OR (
        offer."latestObservationId" = $2
        AND offer."updatedAt" = $3
      )
      OR EXISTS (
        SELECT 1
        FROM "CatalogSupplierOfferObservationV2" AS current
        WHERE current."id" = offer."latestObservationId"
          AND current."offerId" = offer."id"
          AND current."storeId" = offer."storeId"
          AND (
            current."observedAt" < target."observedAt"
            OR (
              current."observedAt" = target."observedAt"
              AND current."stableKey" COLLATE "C" <
                  target."stableKey" COLLATE "C"
            )
          )
      )
    )
  RETURNING offer."id", offer."latestObservationId", offer."updatedAt"`;

const SEAL_REVISION_SQL = `
  UPDATE "CatalogProductRevisionV2" AS revision
  SET "sealedAt" = $2
  WHERE revision."id" = $1
    AND revision."sealedAt" IS NULL
  RETURNING revision."id", revision."sealedAt"`;

/** Raw-Prisma adapter for the Catalog Core V2 persistence operation contract. */
export class PrismaCatalogPersistenceRepositoryV2
  implements CatalogPersistenceRepositoryV2
{
  private readonly db: CatalogV2PrismaClient;
  private readonly previewStoreGuard:
    | CatalogPersistencePreviewStoreGuardV2
    | undefined;

  constructor(
    db: CatalogV2PrismaClient,
    options: PrismaCatalogPersistenceRepositoryOptionsV2 = {}
  ) {
    this.db = db;
    this.previewStoreGuard = options.previewStoreGuard;
  }

  async transaction<T>(
    work: (transaction: CatalogPersistenceTransactionV2) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(async (prismaTransaction) => {
      if (this.previewStoreGuard) {
        await lockExactActivePreviewStore(
          prismaTransaction,
          this.previewStoreGuard
        );
      }
      return work({
        execute: (operation) =>
          executeCatalogOperationV2(prismaTransaction, operation),
      });
    });
  }
}

async function lockExactActivePreviewStore(
  transaction: CatalogV2PrismaTransaction,
  guard: CatalogPersistencePreviewStoreGuardV2
): Promise<void> {
  if (!guard.storeId.trim() || !guard.storeSlug.trim()) {
    throw repositoryError(
      "CATALOG_PERSISTENCE_PREVIEW_STORE_GUARD_FAILED"
    );
  }
  const rows = await transaction.$queryRawUnsafe<
    Array<{
      id: unknown;
      slug: unknown;
      launchStatus: unknown;
      isActive: unknown;
    }>
  >(
    `SELECT "id", "slug", "launchStatus", "isActive"
     FROM "Store"
     WHERE "id" = $1 AND "slug" = $2
     FOR UPDATE`,
    guard.storeId,
    guard.storeSlug
  );
  const store = rows[0];
  if (
    !store ||
    rows.length !== 1 ||
    store.id !== guard.storeId ||
    store.slug !== guard.storeSlug ||
    store.launchStatus !== "PREVIEW" ||
    store.isActive !== true
  ) {
    throw repositoryError(
      "CATALOG_PERSISTENCE_PREVIEW_STORE_GUARD_FAILED"
    );
  }
}

async function executeCatalogOperationV2(
  transaction: CatalogV2PrismaTransaction,
  operation: CatalogPersistenceOperationV2
): Promise<void> {
  if (!operation || typeof operation !== "object" || !("kind" in operation)) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  switch (operation.kind) {
    case "ENSURE_ROWS":
      await ensureRows(transaction, operation);
      return;
    case "SET_LATEST_OBSERVATION":
      await setLatestObservation(transaction, operation);
      return;
    case "SEAL_REVISION":
      await sealRevision(transaction, operation);
      return;
    default:
      throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
}

async function ensureRows(
  transaction: CatalogV2PrismaTransaction,
  operation: Extract<CatalogPersistenceOperationV2, { kind: "ENSURE_ROWS" }>
): Promise<void> {
  const spec = modelSpec(operation.model);
  if (
    !Array.isArray(operation.rows) ||
    !sameStrings(operation.mutableColumns, spec.mutableColumns)
  ) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  const seenKeys = new Set<string>();
  for (const candidate of operation.rows) {
    const row = exactRow(candidate, spec);
    const key = rowKey(row, spec);
    if (seenKeys.has(key)) {
      throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
    }
    seenKeys.add(key);
    await ensureRow(transaction, spec, row);
  }
}

async function ensureRow(
  transaction: CatalogV2PrismaTransaction,
  spec: CatalogModelSpecV2,
  row: Record<string, unknown>
): Promise<void> {
  const keyValues = spec.keyColumns.map((column) =>
    parameterValue(spec, column, row[column])
  );
  // PostgreSQL runs BEFORE INSERT triggers before it resolves ON CONFLICT.
  // Serialize cooperative writers, then validate an existing immutable row
  // before attempting INSERT so an idempotent replay cannot trip scope/seal
  // guards on an already-materialized graph.
  await lockCatalogRowIdentity(transaction, spec, row);
  const beforeInsert = await transaction.$queryRawUnsafe<
    Array<Record<string, unknown>>
  >(selectSql(spec), ...keyValues);
  if (!Array.isArray(beforeInsert) || beforeInsert.length > 1) {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  if (beforeInsert.length === 1) {
    assertMatchingRow(spec, row, beforeInsert[0], spec.mutableColumns);
    return;
  }

  const values = spec.columns.map((column) =>
    parameterValue(spec, column, row[column])
  );
  const inserted = await transaction.$queryRawUnsafe<
    Array<Record<string, unknown>>
  >(insertSql(spec), ...values);
  if (!Array.isArray(inserted) || inserted.length > 1) {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  if (inserted.length === 1) {
    assertMatchingRow(spec, row, inserted[0], []);
    return;
  }

  // Retain ON CONFLICT as a fail-safe for non-cooperating writers. A
  // cooperative repository transaction cannot reach this branch after the
  // advisory identity lock unless the row was concurrently written elsewhere.
  const existing = await transaction.$queryRawUnsafe<
    Array<Record<string, unknown>>
  >(selectSql(spec), ...keyValues);
  if (!Array.isArray(existing) || existing.length !== 1) {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  assertMatchingRow(spec, row, existing[0], spec.mutableColumns);
}

async function lockCatalogRowIdentity(
  transaction: CatalogV2PrismaTransaction,
  spec: CatalogModelSpecV2,
  row: Record<string, unknown>
): Promise<void> {
  const identity = JSON.stringify([
    "catalog-v2-row",
    spec.table,
    ...spec.keyColumns.map((column) => row[column]),
  ]);
  const locks = await transaction.$queryRawUnsafe<Array<{ locked: unknown }>>(
    `SELECT pg_advisory_xact_lock(hashtext($1::text))::text AS "locked"`,
    identity
  );
  // PostgreSQL renders its void return as an empty text value. The explicit
  // cast is required because Prisma cannot deserialize a raw `void` column.
  if (
    !Array.isArray(locks) ||
    locks.length !== 1 ||
    locks[0]?.locked !== ""
  ) {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
}

async function setLatestObservation(
  transaction: CatalogV2PrismaTransaction,
  operation: Extract<
    CatalogPersistenceOperationV2,
    { kind: "SET_LATEST_OBSERVATION" }
  >
): Promise<void> {
  const offerId = requiredString(operation.offerId);
  const latestObservationId = requiredString(operation.latestObservationId);
  const updatedAt = dateParameter(operation.updatedAt);
  const rows = await transaction.$queryRawUnsafe<
    Array<{
      id: unknown;
      latestObservationId: unknown;
      updatedAt: unknown;
    }>
  >(
    SET_LATEST_OBSERVATION_SQL,
    offerId,
    latestObservationId,
    updatedAt
  );
  if (
    !Array.isArray(rows) ||
    rows.length !== 1 ||
    rows[0].id !== offerId ||
    rows[0].latestObservationId !== latestObservationId ||
    normalizeDate(rows[0].updatedAt) !== updatedAt.toISOString()
  ) {
    throw repositoryError("CATALOG_PERSISTENCE_POINTER_CONFLICT");
  }
}

async function sealRevision(
  transaction: CatalogV2PrismaTransaction,
  operation: Extract<CatalogPersistenceOperationV2, { kind: "SEAL_REVISION" }>
): Promise<void> {
  const productRevisionId = requiredString(operation.productRevisionId);
  const sealedAt = dateParameter(operation.sealedAt);
  const currentRows = await transaction.$queryRawUnsafe<
    Array<{ id: unknown; sealedAt: unknown }>
  >(
    `SELECT "id", "sealedAt"
     FROM "CatalogProductRevisionV2"
     WHERE "id" = $1
     FOR UPDATE`,
    productRevisionId
  );
  if (
    !Array.isArray(currentRows) ||
    currentRows.length !== 1 ||
    currentRows[0].id !== productRevisionId
  ) {
    throw repositoryError("CATALOG_PERSISTENCE_SEAL_CONFLICT");
  }
  const currentSealedAt = currentRows[0].sealedAt;
  if (currentSealedAt !== null) {
    if (normalizeDate(currentSealedAt) === sealedAt.toISOString()) return;
    throw repositoryError("CATALOG_PERSISTENCE_SEAL_CONFLICT");
  }
  const rows = await transaction.$queryRawUnsafe<
    Array<{ id: unknown; sealedAt: unknown }>
  >(SEAL_REVISION_SQL, productRevisionId, sealedAt);
  if (
    !Array.isArray(rows) ||
    rows.length !== 1 ||
    rows[0].id !== productRevisionId ||
    normalizeDate(rows[0].sealedAt) !== sealedAt.toISOString()
  ) {
    throw repositoryError("CATALOG_PERSISTENCE_SEAL_CONFLICT");
  }
}

function modelSpec(model: CatalogPersistenceModelV2): CatalogModelSpecV2 {
  if (!Object.prototype.hasOwnProperty.call(MODEL_SPECS_V2, model)) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  return MODEL_SPECS_V2[model];
}

function exactRow(
  candidate: unknown,
  spec: CatalogModelSpecV2
): Record<string, unknown> {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  const row = candidate as Record<string, unknown>;
  const actualColumns = Object.keys(row).sort();
  const expectedColumns = [...spec.columns].sort();
  if (!sameStrings(actualColumns, expectedColumns)) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  for (const column of spec.columns) {
    const value = row[column];
    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
    }
  }
  for (const keyColumn of spec.keyColumns) requiredString(row[keyColumn]);
  return row;
}

function assertMatchingRow(
  spec: CatalogModelSpecV2,
  expected: Record<string, unknown>,
  actual: Record<string, unknown> | undefined,
  ignoredColumns: readonly string[]
): void {
  if (actual === undefined || actual === null || typeof actual !== "object") {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  for (const column of spec.columns) {
    if (ignoredColumns.includes(column)) continue;
    if (!Object.prototype.hasOwnProperty.call(actual, column)) {
      throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
    }
    if (
      normalizedValue(spec, column, expected[column]) !==
      normalizedValue(spec, column, actual[column])
    ) {
      throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
    }
  }
}

function parameterValue(
  spec: CatalogModelSpecV2,
  column: string,
  value: unknown
): unknown {
  if (value === null) return null;
  switch (columnKind(spec, column)) {
    case "BIGINT":
      return bigintParameter(value);
    case "DATETIME":
      return dateParameter(value);
    case "SCALAR":
      return value;
  }
}

function normalizedValue(
  spec: CatalogModelSpecV2,
  column: string,
  value: unknown
): string | number | boolean | null {
  if (value === null) return null;
  switch (columnKind(spec, column)) {
    case "BIGINT":
      try {
        return BigInt(value as string | number | bigint).toString();
      } catch {
        throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
      }
    case "DATETIME":
      return normalizeDate(value);
    case "SCALAR":
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return value;
      }
      throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
}

function columnKind(spec: CatalogModelSpecV2, column: string): ColumnKind {
  if (spec.bigintColumns.includes(column)) return "BIGINT";
  if (spec.dateTimeColumns.includes(column)) return "DATETIME";
  return "SCALAR";
}

function bigintParameter(value: unknown): bigint {
  if (typeof value !== "string" || !/^-?(0|[1-9]\d*)$/.test(value)) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  try {
    return BigInt(value);
  } catch {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
}

function dateParameter(value: unknown): Date {
  if (typeof value !== "string") {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  return date;
}

function normalizeDate(value: unknown): string {
  if (!(value instanceof Date) && typeof value !== "string") {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw repositoryError("CATALOG_PERSISTENCE_ROW_CONFLICT");
  }
  return date.toISOString();
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  return value;
}

function rowKey(
  row: Record<string, unknown>,
  spec: CatalogModelSpecV2
): string {
  return JSON.stringify(spec.keyColumns.map((column) => row[column]));
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(identifier)) {
    throw repositoryError("INVALID_CATALOG_PERSISTENCE_OPERATION");
  }
  return `"${identifier}"`;
}

function insertSql(spec: CatalogModelSpecV2): string {
  const columns = spec.columns.map(quoteIdentifier).join(", ");
  const placeholders = spec.columns
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  return `INSERT INTO ${quoteIdentifier(spec.table)} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING ${columns}`;
}

function selectSql(spec: CatalogModelSpecV2): string {
  const columns = spec.columns.map(quoteIdentifier).join(", ");
  const predicate = spec.keyColumns
    .map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)
    .join(" AND ");
  return `SELECT ${columns} FROM ${quoteIdentifier(spec.table)} WHERE ${predicate} FOR UPDATE`;
}

function repositoryError(
  code: CatalogPersistenceRepositoryErrorCodeV2
): CatalogPersistenceRepositoryErrorV2 {
  return new CatalogPersistenceRepositoryErrorV2(code);
}
