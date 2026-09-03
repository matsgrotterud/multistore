import {
  buildCatalogRefreshProposalV1,
  buildSourceUnavailableProposalV1,
  buildSupplierProductSnapshotV1,
  catalogRefreshProposalV1Schema,
  isFixtureProduct,
  parseSupplierProductSnapshotV1,
  type CatalogRefreshProposalV1,
  type SupplierProductSnapshotV1,
} from "@/lib/catalog/catalog-refresh-proposal";
import { z } from "zod";
import {
  DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS,
  MAX_CONFIGURABLE_CATALOG_FRESHNESS_HOURS,
} from "@/lib/catalog/catalog-freshness";
import type { CatalogCurrentStateV1 } from "@/lib/catalog/catalog-alignment";
import { prisma } from "@/lib/db";
import { getCachedProviderHealth } from "@/lib/suppliers/providers/provider-health-cache";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import type {
  CommerceProvider,
  ProviderHealth,
} from "@/lib/suppliers/providers/types";

export const CATALOG_REFRESH_RUN_VERSION = "catalog-refresh-shadow.v1" as const;
const DEFAULT_REFRESH_LIMIT = 6;
const MAX_REFRESH_LIMIT = 20;
const MAX_SCAN_LIMIT = 200;
const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000;
const DEFAULT_PROVIDER_CONCURRENCY = 3;

interface RefreshProductRow {
  id: string;
  title: string;
  updatedAt?: Date;
  providerKey: string | null;
  externalId: string | null;
  sourceUrl: string | null;
  lastSupplierSyncAt: Date | null;
  fulfillmentMode?: string;
  stockStatus?: string;
  shippingDaysMin?: number;
  shippingDaysMax?: number;
  countryOfOrigin?: string | null;
  sku?: string;
  gtin?: string | null;
  variants?: Array<{
    externalVariantId: string | null;
    sku: string | null;
    stockStatus: string;
  }>;
  mediaAssets?: Array<{ sourceUrl: string }>;
  images?: Array<{ sourceUrl: string | null }>;
}

interface SyncRunRow {
  summaryJson: string;
}

interface RefreshCursorRow {
  lastProductId: string | null;
  revision: number;
}

interface ProductRefreshStateRow {
  productId: string;
  externalId: string;
  lastAttemptAt: Date;
  lastSuccessfulObservationId: string | null;
  lastSuccessfulObservationAt: Date | null;
}

interface SupplierObservationRow {
  id: string;
  snapshotJson: string | null;
}

interface ShadowRefreshDb {
  product: {
    findMany(args: unknown): Promise<RefreshProductRow[]>;
  };
  catalogRefreshCursor: {
    findUnique(args: unknown): Promise<RefreshCursorRow | null>;
  };
  catalogProductState: {
    findMany(args: unknown): Promise<ProductRefreshStateRow[]>;
  };
  catalogSupplierObservation: {
    findMany(args: unknown): Promise<SupplierObservationRow[]>;
  };
}

export interface RefreshExistingProductsShadowInput {
  storeId: string;
  providerKey: string;
  limit?: number;
  maxAgeHours?: number;
  allowFixtureMode?: boolean;
  force?: boolean;
}

export interface RefreshExistingProductsShadowResult {
  version: typeof CATALOG_REFRESH_RUN_VERSION;
  mode: "SHADOW";
  storeId: string;
  providerKey: string;
  startedAt: string;
  completedAt: string;
  outcome: "SUCCESS" | "PARTIAL" | "SOURCE_UNAVAILABLE";
  selected: number;
  skippedFresh: number;
  observed: number;
  baselineCaptured: number;
  unchanged: number;
  proposed: number;
  reviewRequired: number;
  sourceUnavailable: number;
  scanned: number;
  scanCursorRevisionStart: number;
  scanCursorStart: string | null;
  scanCursorNext: string | null;
  scanWrapped: boolean;
  proposals: CatalogRefreshProposalV1[];
}

const refreshCountSchema = z.number().finite().int().nonnegative();

export const refreshExistingProductsShadowResultSchema = z
  .object({
    version: z.literal(CATALOG_REFRESH_RUN_VERSION),
    mode: z.literal("SHADOW"),
    storeId: z.string().min(1),
    providerKey: z.string().min(1),
    startedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
    outcome: z.enum(["SUCCESS", "PARTIAL", "SOURCE_UNAVAILABLE"]),
    selected: refreshCountSchema,
    skippedFresh: refreshCountSchema,
    observed: refreshCountSchema,
    baselineCaptured: refreshCountSchema,
    unchanged: refreshCountSchema,
    proposed: refreshCountSchema,
    reviewRequired: refreshCountSchema,
    sourceUnavailable: refreshCountSchema,
    scanned: refreshCountSchema,
    scanCursorRevisionStart: refreshCountSchema,
    scanCursorStart: z.string().min(1).nullable(),
    scanCursorNext: z.string().min(1).nullable(),
    scanWrapped: z.boolean(),
    proposals: z.array(catalogRefreshProposalV1Schema),
  })
  .strict()
  .superRefine((result, context) => {
    const decisionCount = (decision: CatalogRefreshProposalV1["decision"]) =>
      result.proposals.filter((proposal) => proposal.decision === decision).length;
    const expectedCounts = {
      baselineCaptured: decisionCount("BASELINE_CAPTURED"),
      unchanged: decisionCount("NO_CHANGE"),
      proposed: decisionCount("PROPOSED"),
      reviewRequired: decisionCount("REVIEW_REQUIRED"),
      sourceUnavailable: decisionCount("SOURCE_UNAVAILABLE"),
    };
    for (const [field, expected] of Object.entries(expectedCounts)) {
      if (result[field as keyof typeof expectedCounts] !== expected) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} must equal the number of matching proposals`,
        });
      }
    }
    const expectedObserved = result.proposals.length - expectedCounts.sourceUnavailable;
    if (result.observed !== expectedObserved) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["observed"],
        message: "observed must equal proposals with supplier snapshots",
      });
    }
    if (result.selected !== result.proposals.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selected"],
        message: "selected must equal the number of proposals",
      });
    }
    if (result.selected + result.skippedFresh > result.scanned) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scanned"],
        message: "scanned must cover selected and skipped products",
      });
    }
    const expectedOutcome =
      expectedCounts.sourceUnavailable === 0
        ? "SUCCESS"
        : expectedObserved === 0
          ? "SOURCE_UNAVAILABLE"
          : "PARTIAL";
    if (result.outcome !== expectedOutcome) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outcome"],
        message: `outcome must be ${expectedOutcome} for these proposals`,
      });
    }
    if (Date.parse(result.completedAt) < Date.parse(result.startedAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedAt"],
        message: "completedAt must not precede startedAt",
      });
    }
    if (new Set(result.proposals.map((proposal) => proposal.productId)).size !== result.proposals.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposals"],
        message: "A refresh result may contain at most one proposal per product",
      });
    }
    result.proposals.forEach((proposal, index) => {
      if (proposal.providerKey !== result.providerKey) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proposals", index, "providerKey"],
          message: "Proposal provider must match the refresh scope",
        });
      }
    });
  });

export function parseRefreshExistingProductsShadowResult(
  value: unknown
): RefreshExistingProductsShadowResult {
  return refreshExistingProductsShadowResultSchema.parse(value);
}

export function safeParseRefreshExistingProductsShadowResult(
  value: unknown
): RefreshExistingProductsShadowResult | null {
  const parsed = refreshExistingProductsShadowResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export interface RefreshExistingProductsShadowDependencies {
  db?: ShadowRefreshDb;
  resolveProvider?: (providerKey: string) => CommerceProvider;
  now?: () => Date;
  providerTimeoutMs?: number;
  concurrency?: number;
}

/**
 * Reads supplier facts and emits immutable proposals. This function deliberately
 * has no Product/variant/media write path: shadow observations cannot advance
 * live-commerce freshness or alter what customers see.
 */
export async function refreshExistingProductsShadow(
  input: RefreshExistingProductsShadowInput,
  dependencies: RefreshExistingProductsShadowDependencies = {}
): Promise<RefreshExistingProductsShadowResult> {
  const db = dependencies.db ?? (prisma as unknown as ShadowRefreshDb);
  const resolveProvider = dependencies.resolveProvider ?? getCommerceProvider;
  const now = dependencies.now ?? (() => new Date());
  const startedAt = now();
  assertValidDate(startedAt);
  const limit = boundedInteger(input.limit, DEFAULT_REFRESH_LIMIT, 1, MAX_REFRESH_LIMIT);
  const maxAgeHours = boundedInteger(
    input.maxAgeHours,
    DEFAULT_CATALOG_FRESHNESS_MAX_AGE_HOURS,
    1,
    MAX_CONFIGURABLE_CATALOG_FRESHNESS_HOURS
  );
  const providerTimeoutMs = boundedInteger(
    dependencies.providerTimeoutMs,
    DEFAULT_PROVIDER_TIMEOUT_MS,
    100,
    60_000
  );
  const concurrency = boundedInteger(
    dependencies.concurrency,
    DEFAULT_PROVIDER_CONCURRENCY,
    1,
    8
  );
  const scanLimit = Math.min(Math.max(limit * 10, 50), MAX_SCAN_LIMIT);

  const cursor = await db.catalogRefreshCursor.findUnique({
    where: {
      storeId_providerKey: {
        storeId: input.storeId,
        providerKey: input.providerKey,
      },
    },
    select: { lastProductId: true, revision: true },
  });
  const scanCursorStart = cursor?.lastProductId ?? null;
  const scanCursorRevisionStart = cursor?.revision ?? 0;
  const scan = await loadProductScan({
    db,
    storeId: input.storeId,
    providerKey: input.providerKey,
    cursor: scanCursorStart,
    limit: scanLimit,
  });
  const products = scan.products;
  const durableEvidence = await loadDurableRefreshEvidence({
    db,
    storeId: input.storeId,
    providerKey: input.providerKey,
    products,
  });
  const previousSnapshots = durableEvidence.snapshots;
  const thresholdMs = startedAt.getTime() - maxAgeHours * 60 * 60 * 1000;
  const scannedProducts = products
    .filter(
      (product): product is RefreshProductRow & { externalId: string } =>
        Boolean(product.externalId) && product.providerKey === input.providerKey
    )
    .map((product) => {
      const latestSuccessfulEvidenceMs = Math.max(
        validTimestamp(product.lastSupplierSyncAt, startedAt.getTime()),
        previousSnapshots.has(product.id)
          ? validTimestamp(
              durableEvidence.lastSuccessfulObservationAt.get(product.id),
              startedAt.getTime()
            )
          : 0
      );
      return {
        product,
        latestSuccessfulEvidenceMs,
        latestSchedulingMs: Math.max(
          latestSuccessfulEvidenceMs,
          validTimestamp(
            durableEvidence.lastAttemptAt.get(product.id),
            startedAt.getTime()
          )
        ),
      };
    });
  const skippedFresh = input.force
    ? 0
    : scannedProducts.filter(
        (entry) => entry.latestSuccessfulEvidenceMs >= thresholdMs
      ).length;
  const dueEntries = scannedProducts
    .filter(
      (entry) => input.force || entry.latestSuccessfulEvidenceMs < thresholdMs
    )
    .sort(compareRefreshPriority);
  const dueProducts = dueEntries.slice(0, limit).map((entry) => entry.product);
  const scanCursorNext =
    dueEntries.length > limit
      ? dueProducts.at(-1)?.id ?? scan.nextCursor
      : scan.nextCursor;

  if (dueProducts.length === 0) {
    return summarize({
      input,
      startedAt,
      completedAt: now(),
      selected: 0,
      scanned: products.length,
      skippedFresh,
      scanCursorRevisionStart,
      scanCursorStart,
      scanCursorNext,
      scanWrapped: scan.wrapped,
      proposals: [],
    });
  }

  if (input.providerKey === "mock" && !input.allowFixtureMode) {
    return summarize({
      input,
      startedAt,
      completedAt: now(),
      selected: dueProducts.length,
      scanned: products.length,
      skippedFresh,
      scanCursorRevisionStart,
      scanCursorStart,
      scanCursorNext,
      scanWrapped: scan.wrapped,
      proposals: dueProducts.map((product) =>
        unavailable(product, startedAt, "FIXTURE_PROVIDER_DISABLED")
      ),
    });
  }

  let provider: CommerceProvider;
  try {
    provider = resolveProvider(input.providerKey);
  } catch {
    return summarize({
      input,
      startedAt,
      completedAt: now(),
      selected: dueProducts.length,
      scanned: products.length,
      skippedFresh,
      scanCursorRevisionStart,
      scanCursorStart,
      scanCursorNext,
      scanWrapped: scan.wrapped,
      proposals: dueProducts.map((product) =>
        unavailable(product, startedAt, "UNKNOWN_PROVIDER")
      ),
    });
  }

  let health: ProviderHealth;
  try {
    health = await withTimeout(
      getCachedProviderHealth(provider),
      providerTimeoutMs,
      "PROVIDER_HEALTH_TIMEOUT"
    );
  } catch {
    return summarize({
      input,
      startedAt,
      completedAt: now(),
      selected: dueProducts.length,
      scanned: products.length,
      skippedFresh,
      scanCursorRevisionStart,
      scanCursorStart,
      scanCursorNext,
      scanWrapped: scan.wrapped,
      proposals: dueProducts.map((product) =>
        unavailable(product, startedAt, "PROVIDER_HEALTH_UNAVAILABLE")
      ),
    });
  }

  const healthReason = providerHealthReason(input.providerKey, health);
  if (healthReason) {
    return summarize({
      input,
      startedAt,
      completedAt: now(),
      selected: dueProducts.length,
      scanned: products.length,
      skippedFresh,
      scanCursorRevisionStart,
      scanCursorStart,
      scanCursorNext,
      scanWrapped: scan.wrapped,
      proposals: dueProducts.map((product) =>
        unavailable(product, startedAt, healthReason)
      ),
    });
  }

  const proposals = await mapWithConcurrency(dueProducts, concurrency, async (product) => {
    const observedAt = now();
    try {
      const detailsRequest = provider.getProductDetails({
        externalId: product.externalId,
        sourceUrl: product.sourceUrl ?? undefined,
      });
      // CJ owns pacing and its abortable timeout at the provider boundary.
      // Other providers retain the shadow refresh's generic timeout.
      const details = provider.key === "cj"
        ? await detailsRequest
        : await withTimeout(
            detailsRequest,
            providerTimeoutMs,
            "PROVIDER_DETAILS_TIMEOUT"
          );
      if (isFixtureProduct(details) && !input.allowFixtureMode) {
        return unavailable(product, observedAt, "FIXTURE_PRODUCT_DISABLED");
      }
      const snapshot = buildSupplierProductSnapshotV1({
        requestedProviderKey: input.providerKey,
        requestedExternalId: product.externalId,
        observedAt,
        health,
        details,
      });
      return buildCatalogRefreshProposalV1({
        productId: product.id,
        productTitle: product.title,
        productRevisionAt: product.updatedAt ?? startedAt,
        snapshot,
        previousSnapshot: previousSnapshots.get(product.id),
        currentCatalog: currentCatalogState(product),
      });
    } catch (error) {
      return unavailable(product, observedAt, reasonCodeForProviderError(error));
    }
  });

  return summarize({
    input,
    startedAt,
    completedAt: now(),
    selected: dueProducts.length,
    scanned: products.length,
    skippedFresh,
    scanCursorRevisionStart,
    scanCursorStart,
    scanCursorNext,
    scanWrapped: scan.wrapped,
    proposals,
  });
}

export function extractLatestSupplierSnapshots(
  rows: SyncRunRow[]
): Map<string, SupplierProductSnapshotV1> {
  const snapshots = new Map<string, SupplierProductSnapshotV1>();
  for (const row of rows) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.summaryJson);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const executions = (parsed as { executions?: unknown }).executions;
    if (!Array.isArray(executions)) continue;
    for (const execution of [...executions].reverse()) {
      if (!execution || typeof execution !== "object") continue;
      const result = (execution as { result?: unknown }).result;
      if (!result || typeof result !== "object") continue;
      if ((result as { version?: unknown }).version !== CATALOG_REFRESH_RUN_VERSION) continue;
      const proposals = (result as { proposals?: unknown }).proposals;
      if (!Array.isArray(proposals)) continue;
      for (const proposal of proposals) {
        if (!proposal || typeof proposal !== "object") continue;
        const productId = (proposal as { productId?: unknown }).productId;
        if (typeof productId !== "string" || snapshots.has(productId)) continue;
        const snapshot = parseSupplierProductSnapshotV1(
          (proposal as { snapshot?: unknown }).snapshot
        );
        if (snapshot) snapshots.set(productId, snapshot);
      }
    }
  }
  return snapshots;
}

async function loadDurableRefreshEvidence(input: {
  db: ShadowRefreshDb;
  storeId: string;
  providerKey: string;
  products: RefreshProductRow[];
}): Promise<{
  snapshots: Map<string, SupplierProductSnapshotV1>;
  lastAttemptAt: Map<string, Date>;
  lastSuccessfulObservationAt: Map<string, Date>;
}> {
  const snapshots = new Map<string, SupplierProductSnapshotV1>();
  const lastAttemptAt = new Map<string, Date>();
  const observedAt = new Map<string, Date>();
  if (input.products.length === 0) {
    return { snapshots, lastAttemptAt, lastSuccessfulObservationAt: observedAt };
  }
  const externalIdByProductId = new Map(
    input.products.map((product) => [product.id, product.externalId])
  );

  const states = await input.db.catalogProductState.findMany({
    where: {
      storeId: input.storeId,
      providerKey: input.providerKey,
      productId: { in: input.products.map((product) => product.id) },
    },
    select: {
      productId: true,
      externalId: true,
      lastAttemptAt: true,
      lastSuccessfulObservationId: true,
      lastSuccessfulObservationAt: true,
    },
  });
  const identitySafeStates = states.filter(
    (state) => externalIdByProductId.get(state.productId) === state.externalId
  );
  for (const state of identitySafeStates) {
    lastAttemptAt.set(state.productId, state.lastAttemptAt);
  }
  const observationIds = identitySafeStates
    .map((state) => state.lastSuccessfulObservationId)
    .filter((id): id is string => typeof id === "string");
  if (observationIds.length === 0) {
    return { snapshots, lastAttemptAt, lastSuccessfulObservationAt: observedAt };
  }

  const observations = await input.db.catalogSupplierObservation.findMany({
    where: {
      id: { in: observationIds },
      storeId: input.storeId,
      providerKey: input.providerKey,
      sourceStatus: "AVAILABLE",
    },
    select: { id: true, snapshotJson: true },
  });
  const observationById = new Map(observations.map((row) => [row.id, row]));
  for (const state of identitySafeStates) {
    if (!state.lastSuccessfulObservationId || !state.lastSuccessfulObservationAt) continue;
    const raw = observationById.get(state.lastSuccessfulObservationId)?.snapshotJson;
    if (!raw) continue;
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      continue;
    }
    const snapshot = parseSupplierProductSnapshotV1(parsedJson);
    if (
      !snapshot ||
      snapshot.identity.providerKey !== input.providerKey ||
      snapshot.identity.externalId !== state.externalId
    ) {
      continue;
    }
    snapshots.set(state.productId, snapshot);
    observedAt.set(state.productId, state.lastSuccessfulObservationAt);
  }
  return { snapshots, lastAttemptAt, lastSuccessfulObservationAt: observedAt };
}

export function extractLatestRefreshCursor(
  rows: SyncRunRow[],
  storeId: string,
  providerKey: string
): string | null {
  for (const row of rows) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.summaryJson);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const executions = (parsed as { executions?: unknown }).executions;
    if (!Array.isArray(executions)) continue;
    for (const execution of [...executions].reverse()) {
      if (!execution || typeof execution !== "object") continue;
      const result = (execution as { result?: unknown }).result;
      if (!result || typeof result !== "object") continue;
      const refresh = result as Record<string, unknown>;
      if (
        refresh.version !== CATALOG_REFRESH_RUN_VERSION ||
        refresh.storeId !== storeId ||
        refresh.providerKey !== providerKey
      ) {
        continue;
      }
      return typeof refresh.scanCursorNext === "string"
        ? refresh.scanCursorNext
        : null;
    }
  }
  return null;
}

function providerHealthReason(
  requestedProviderKey: string,
  health: ProviderHealth
): string | null {
  if (health.key !== requestedProviderKey) return "PROVIDER_IDENTITY_MISMATCH";
  if (health.status !== "OK") return "PROVIDER_NOT_READY";
  if (!health.capabilities.details) return "PROVIDER_DETAILS_UNSUPPORTED";
  return null;
}

function unavailable(
  product: RefreshProductRow & { externalId: string },
  observedAt: Date,
  reasonCode: string
): CatalogRefreshProposalV1 {
  return buildSourceUnavailableProposalV1({
    productId: product.id,
    productTitle: product.title,
    productRevisionAt: product.updatedAt ?? observedAt,
    currentCatalog: currentCatalogState(product),
    providerKey: product.providerKey ?? "unknown",
    externalId: product.externalId,
    observedAt,
    reasonCode,
  });
}

function summarize(input: {
  input: RefreshExistingProductsShadowInput;
  startedAt: Date;
  completedAt: Date;
  selected: number;
  scanned: number;
  skippedFresh: number;
  scanCursorRevisionStart: number;
  scanCursorStart: string | null;
  scanCursorNext: string | null;
  scanWrapped: boolean;
  proposals: CatalogRefreshProposalV1[];
}): RefreshExistingProductsShadowResult {
  assertValidDate(input.completedAt);
  const count = (decision: CatalogRefreshProposalV1["decision"]) =>
    input.proposals.filter((proposal) => proposal.decision === decision).length;
  const sourceUnavailable = count("SOURCE_UNAVAILABLE");
  const observed = input.proposals.length - sourceUnavailable;
  return refreshExistingProductsShadowResultSchema.parse({
    version: CATALOG_REFRESH_RUN_VERSION,
    mode: "SHADOW",
    storeId: input.input.storeId,
    providerKey: input.input.providerKey,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    outcome:
      sourceUnavailable === 0
        ? "SUCCESS"
        : observed === 0
          ? "SOURCE_UNAVAILABLE"
          : "PARTIAL",
    selected: input.selected,
    skippedFresh: input.skippedFresh,
    observed,
    baselineCaptured: count("BASELINE_CAPTURED"),
    unchanged: count("NO_CHANGE"),
    proposed: count("PROPOSED"),
    reviewRequired: count("REVIEW_REQUIRED"),
    sourceUnavailable,
    scanned: input.scanned,
    scanCursorRevisionStart: input.scanCursorRevisionStart,
    scanCursorStart: input.scanCursorStart,
    scanCursorNext: input.scanCursorNext,
    scanWrapped: input.scanWrapped,
    proposals: input.proposals,
  });
}

async function loadProductScan(input: {
  db: ShadowRefreshDb;
  storeId: string;
  providerKey: string;
  cursor: string | null;
  limit: number;
}): Promise<{
  products: RefreshProductRow[];
  nextCursor: string | null;
  wrapped: boolean;
}> {
  const select = {
    id: true,
    title: true,
    updatedAt: true,
    providerKey: true,
    externalId: true,
    sourceUrl: true,
    lastSupplierSyncAt: true,
    fulfillmentMode: true,
    stockStatus: true,
    shippingDaysMin: true,
    shippingDaysMax: true,
    countryOfOrigin: true,
    sku: true,
    gtin: true,
    variants: {
      select: {
        externalVariantId: true,
        sku: true,
        stockStatus: true,
      },
    },
    mediaAssets: {
      where: { ingestionStatus: "STORED" },
      select: { sourceUrl: true },
    },
    images: {
      where: { sourceUrl: { not: null } },
      select: { sourceUrl: true },
    },
  };
  const baseWhere = {
    storeId: input.storeId,
    providerKey: input.providerKey,
    externalId: { not: null },
  };
  const first = await input.db.product.findMany({
    where: input.cursor
      ? { ...baseWhere, id: { gt: input.cursor } }
      : baseWhere,
    select,
    orderBy: { id: "asc" },
    take: input.limit,
  });
  let wrapped = false;
  let products = first;
  if (input.cursor && first.length === 0) {
    wrapped = true;
    products = await input.db.product.findMany({
      where: { ...baseWhere, id: { lte: input.cursor } },
      select,
      orderBy: { id: "asc" },
      take: input.limit,
    });
  }

  // Never mix the tail and head of the catalog in one priority window. A
  // permanently unavailable product at the head would otherwise remain
  // "never observed", win the global freshness sort after every wrap, and
  // move the cursor backwards before later products receive a turn.
  return {
    products,
    nextCursor: products.at(-1)?.id ?? input.cursor,
    wrapped,
  };
}

function currentCatalogState(product: RefreshProductRow): CatalogCurrentStateV1 | undefined {
  if (
    !product.fulfillmentMode ||
    !product.stockStatus ||
    product.shippingDaysMin === undefined ||
    product.shippingDaysMax === undefined ||
    !product.sku
  ) {
    // Test doubles and legacy query projections remain explicit instead of
    // pretending a storefront comparison took place.
    return undefined;
  }
  return {
    fulfillmentMode: product.fulfillmentMode,
    sourceUrl: product.sourceUrl,
    stockStatus: product.stockStatus,
    shippingDaysMin: product.shippingDaysMin,
    shippingDaysMax: product.shippingDaysMax,
    countryOfOrigin: product.countryOfOrigin,
    sku: product.sku,
    gtin: product.gtin,
    variants: product.variants ?? [],
    mediaSourceUrls: [
      ...(product.mediaAssets ?? []).map((asset) => asset.sourceUrl),
      ...(product.images ?? [])
        .map((image) => image.sourceUrl)
        .filter((sourceUrl): sourceUrl is string => Boolean(sourceUrl)),
    ],
  };
}

function reasonCodeForProviderError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("IDENTITY_MISMATCH")) return "SUPPLIER_IDENTITY_MISMATCH";
  if (message.includes("TIMEOUT")) return "PROVIDER_DETAILS_TIMEOUT";
  if (/not found|404/i.test(message)) return "SUPPLIER_PRODUCT_NOT_FOUND";
  return "PROVIDER_DETAILS_UNAVAILABLE";
}

function validTimestamp(
  value: Date | string | null | undefined,
  nowMs: number
): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= nowMs + 5 * 60 * 1000
    ? timestamp
    : Number.NEGATIVE_INFINITY;
}

function compareRefreshPriority(
  left: { product: RefreshProductRow; latestSchedulingMs: number },
  right: { product: RefreshProductRow; latestSchedulingMs: number }
): number {
  if (left.latestSchedulingMs !== right.latestSchedulingMs) {
    return left.latestSchedulingMs < right.latestSchedulingMs ? -1 : 1;
  }
  return left.product.id.localeCompare(right.product.id);
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

function assertValidDate(value: Date): void {
  if (!Number.isFinite(value.getTime())) throw new Error("CATALOG_REFRESH_INVALID_CLOCK");
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  code: string
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(code)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );
  return results;
}
