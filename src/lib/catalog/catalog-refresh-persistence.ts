import { createHash } from "node:crypto";
import {
  catalogStorefrontRevisionFingerprintV1,
  type CatalogCurrentStateV1,
} from "@/lib/catalog/catalog-alignment";
import type { CatalogRefreshProposalV1 } from "@/lib/catalog/catalog-refresh-proposal";
import {
  parseRefreshExistingProductsShadowResult,
  type RefreshExistingProductsShadowResult,
} from "@/lib/catalog/refresh-existing-products";
import { prisma } from "@/lib/db";
import { CatalogJobPermanentError } from "@/lib/jobs/errors";
import {
  catalogJobLeaseWhere,
  catalogJobRetryAt,
  type CatalogJobLease,
} from "@/lib/jobs/queue";

const MAX_SNAPSHOT_JSON_BYTES = 256_000;
const MAX_PROPOSAL_JSON_BYTES = 128_000;

export interface ClaimedCatalogRefreshJob {
  id: string;
  storeId: string;
  providerKey: string;
  jobType: string;
  attempts: number;
  maxAttempts: number;
}

export interface CatalogRefreshSettlement {
  executionId: string;
  recorded: boolean;
  outcome: "SUCCESS" | "RETRY" | "FAILED" | "LEASE_LOST";
  code: string;
}

interface ExistingExecutionRow {
  id: string;
  catalogJobId: string;
  catalogJobAttempt: number;
  storeId: string;
  providerKey: string;
  settlementStatus: string;
  settlementCode: string;
}

interface ProductRevisionRow {
  id: string;
  storeId: string;
  providerKey: string | null;
  externalId: string | null;
  updatedAt: Date;
  fulfillmentMode: string;
  sourceUrl: string | null;
  stockStatus: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string | null;
  sku: string;
  gtin: string | null;
}

interface ProductVariantRevisionRow {
  id: string;
  productId: string;
  externalVariantId: string | null;
  sku: string | null;
  stockStatus: string;
}

interface ProductImageRevisionRow {
  id: string;
  productId: string;
  sourceUrl: string | null;
}

interface ProductMediaRevisionRow {
  id: string;
  productId: string;
  sourceUrl: string;
  ingestionStatus: string;
}

interface LockedCatalogRevisionRows {
  products: ProductRevisionRow[];
  variants: ProductVariantRevisionRow[];
  images: ProductImageRevisionRow[];
  mediaAssets: ProductMediaRevisionRow[];
}

interface CatalogRefreshTransaction {
  catalogRefreshExecution: {
    create(args: unknown): Promise<unknown>;
  };
  catalogSupplierObservation: {
    createMany(args: unknown): Promise<{ count: number }>;
  };
  catalogRefreshProposal: {
    createMany(args: unknown): Promise<{ count: number }>;
  };
  catalogProductState: {
    upsert(args: unknown): Promise<unknown>;
  };
  catalogJob: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}

interface CatalogRefreshPersistenceDb {
  catalogRefreshExecution: {
    findUnique(args: unknown): Promise<ExistingExecutionRow | null>;
  };
  $transaction<T>(
    callback: (transaction: CatalogRefreshTransaction) => Promise<T>
  ): Promise<T>;
}

export interface SettleCatalogRefreshInput {
  catalogSyncRunId: string;
  job: ClaimedCatalogRefreshJob;
  lease: CatalogJobLease;
  result: unknown;
  now?: Date;
}

export interface SettleCatalogRefreshDependencies {
  db?: CatalogRefreshPersistenceDb;
}

interface PreparedObservation {
  id: string;
  idempotencyKey: string;
  proposalId: string;
  proposal: CatalogRefreshProposalV1;
  sourceStatus: "AVAILABLE" | "SOURCE_UNAVAILABLE";
  snapshotJson: string | null;
  reasonCodesJson: string;
  changesJson: string;
  alignmentJson: string;
  workflowStatus: "RECORDED" | "OPEN" | "NEEDS_REVIEW" | "SOURCE_UNAVAILABLE";
}

export async function settleCatalogRefreshJob(
  input: SettleCatalogRefreshInput,
  dependencies: SettleCatalogRefreshDependencies = {}
): Promise<CatalogRefreshSettlement> {
  assertRefreshJobIdentity(input.job, input.lease);
  const db = dependencies.db ?? (prisma as unknown as CatalogRefreshPersistenceDb);
  const now = input.now ?? new Date();
  assertValidDate(now, "CATALOG_REFRESH_INVALID_SETTLEMENT_TIME");
  const result = parseResultOrThrow(input.result);
  assertResultMatchesJob(result, input.job);
  assertResultSemantics(result);

  const executionId = deterministicEvidenceId(
    "crex",
    `${input.job.id}\u001f${input.job.attempts}`
  );
  const prior = await db.catalogRefreshExecution.findUnique({
    where: { id: executionId },
    select: existingExecutionSelect,
  });
  if (prior) return reconcileExistingExecution(prior, input.job);

  try {
    return await db.$transaction(async (transaction) => {
      const productIds = result.proposals.map((proposal) => proposal.productId);
      const catalogRows = productIds.length
        ? await lockCatalogRevisions(
            transaction,
            input.job.storeId,
            productIds
          )
        : emptyLockedCatalogRevisionRows();
      validateProductScope(catalogRows, result);
      const observations = prepareObservations(executionId, result);

      let settlement = settlementForHandlerOutcome(result, input.lease);
      let ownsCursorProjection = true;
      if (settlement.outcome !== "RETRY") {
        const cursorAdvanced = await advanceCursorCompareAndSwap(transaction, {
          storeId: result.storeId,
          providerKey: result.providerKey,
          lastProductId: result.scanCursorNext,
          expectedRevision: result.scanCursorRevisionStart,
          executionId,
          now,
        });
        if (!cursorAdvanced) {
          ownsCursorProjection = false;
          settlement = {
            outcome:
              input.lease.attempts < input.lease.maxAttempts ? "RETRY" : "FAILED",
            code: "CATALOG_REFRESH_CURSOR_CONFLICT",
          };
        }
      }

      await transaction.catalogRefreshExecution.create({
        data: {
          id: executionId,
          catalogJobId: input.job.id,
          catalogJobAttempt: input.job.attempts,
          catalogSyncRunId: input.catalogSyncRunId,
          storeId: result.storeId,
          providerKey: result.providerKey,
          mode: result.mode,
          handlerOutcome: result.outcome,
          settlementStatus: settlement.outcome,
          settlementCode: settlement.code,
          startedAt: new Date(result.startedAt),
          completedAt: new Date(result.completedAt),
          selected: result.selected,
          scanned: result.scanned,
          skippedFresh: result.skippedFresh,
          observed: result.observed,
          baselineCaptured: result.baselineCaptured,
          unchanged: result.unchanged,
          proposed: result.proposed,
          reviewRequired: result.reviewRequired,
          sourceUnavailable: result.sourceUnavailable,
          scanCursorStart: result.scanCursorStart,
          scanCursorNext: result.scanCursorNext,
          scanCursorRevisionStart: result.scanCursorRevisionStart,
          scanWrapped: result.scanWrapped,
        },
      });

      if (observations.length > 0) {
        const insertedObservations = await transaction.catalogSupplierObservation.createMany({
          data: observations.map((observation) => {
            return {
              id: observation.id,
              idempotencyKey: observation.idempotencyKey,
              executionId,
              storeId: result.storeId,
              productId: observation.proposal.productId,
              providerKey: observation.proposal.providerKey,
              externalId: observation.proposal.externalId,
              sourceStatus: observation.sourceStatus,
              observedAt: new Date(observation.proposal.observedAt),
              productRevisionAt: new Date(observation.proposal.productRevisionAt),
              storefrontRevisionFingerprint:
                observation.proposal.storefrontRevisionFingerprint,
              snapshotVersion: observation.proposal.snapshot?.version ?? null,
              snapshotFingerprint: observation.proposal.snapshot?.fingerprint ?? null,
              snapshotJson: observation.snapshotJson,
              reasonCodesJson: observation.reasonCodesJson,
            };
          }),
        });
        if (insertedObservations.count !== observations.length) {
          throw new Error("CATALOG_REFRESH_OBSERVATION_INSERT_COUNT_MISMATCH");
        }

        const insertedProposals = await transaction.catalogRefreshProposal.createMany({
          data: observations.map((observation) => ({
            id: observation.proposalId,
            observationId: observation.id,
            storeId: result.storeId,
            productId: observation.proposal.productId,
            providerKey: observation.proposal.providerKey,
            contractVersion: observation.proposal.version,
            proposalFingerprint: observation.proposal.proposalFingerprint,
            decision: observation.proposal.decision,
            alignmentStatus: observation.proposal.catalogAlignment.status,
            reasonCodesJson: observation.reasonCodesJson,
            changesJson: observation.changesJson,
            alignmentJson: observation.alignmentJson,
            workflowStatus: observation.workflowStatus,
          })),
        });
        if (insertedProposals.count !== observations.length) {
          throw new Error("CATALOG_REFRESH_PROPOSAL_INSERT_COUNT_MISMATCH");
        }

        if (ownsCursorProjection) {
          for (const observation of observations) {
            await upsertProductState(transaction, {
              executionId,
              storeId: result.storeId,
              observation,
            });
          }
        }
      }

      const terminal = await transaction.catalogJob.updateMany({
        where: catalogJobLeaseWhere(input.lease),
        data: jobSettlementData(settlement, result.outcome, input.lease, now),
      });
      if (terminal.count !== 1) {
        throw new CatalogRefreshLeaseLostError();
      }

      return {
        executionId,
        recorded: true,
        outcome: settlement.outcome,
        code: settlement.code,
      } satisfies CatalogRefreshSettlement;
    });
  } catch (error) {
    const reconciled = await safelyFindExistingExecution(db, executionId);
    if (reconciled) return reconcileExistingExecution(reconciled, input.job);
    if (error instanceof CatalogRefreshLeaseLostError) {
      return {
        executionId,
        recorded: false,
        outcome: "LEASE_LOST",
        code: "CATALOG_JOB_LEASE_LOST",
      };
    }
    throw error;
  }
}

const existingExecutionSelect = {
  id: true,
  catalogJobId: true,
  catalogJobAttempt: true,
  storeId: true,
  providerKey: true,
  settlementStatus: true,
  settlementCode: true,
} as const;

function parseResultOrThrow(value: unknown): RefreshExistingProductsShadowResult {
  try {
    return parseRefreshExistingProductsShadowResult(value);
  } catch {
    throw new CatalogJobPermanentError(
      "INVALID_REFRESH_RESULT",
      "REFRESH_EXISTING returned evidence that does not satisfy the versioned result contract."
    );
  }
}

function assertRefreshJobIdentity(
  job: ClaimedCatalogRefreshJob,
  lease: CatalogJobLease
): void {
  if (job.jobType !== "REFRESH_EXISTING") {
    throw new CatalogJobPermanentError(
      "INVALID_REFRESH_SETTLEMENT_JOB",
      "Durable refresh settlement only accepts REFRESH_EXISTING jobs."
    );
  }
  if (
    job.id !== lease.jobId ||
    job.attempts !== lease.attempts ||
    job.maxAttempts !== lease.maxAttempts
  ) {
    throw new CatalogJobPermanentError(
      "INVALID_REFRESH_SETTLEMENT_LEASE",
      "The claimed refresh job does not match its settlement lease."
    );
  }
}

function assertResultMatchesJob(
  result: RefreshExistingProductsShadowResult,
  job: ClaimedCatalogRefreshJob
): void {
  if (result.storeId !== job.storeId || result.providerKey !== job.providerKey) {
    throw new CatalogJobPermanentError(
      "REFRESH_RESULT_SCOPE_MISMATCH",
      "Refresh evidence does not match the claimed store and provider scope."
    );
  }
}

function assertResultSemantics(result: RefreshExistingProductsShadowResult): void {
  const ids = result.proposals.map((proposal) => proposal.productId);
  if (new Set(ids).size !== ids.length || result.selected !== result.proposals.length) {
    throwInvalidSemantics();
  }
  const decisions = {
    BASELINE_CAPTURED: 0,
    NO_CHANGE: 0,
    PROPOSED: 0,
    REVIEW_REQUIRED: 0,
    SOURCE_UNAVAILABLE: 0,
  };
  for (const proposal of result.proposals) {
    decisions[proposal.decision] += 1;
    const sourceUnavailable = proposal.decision === "SOURCE_UNAVAILABLE";
    if (
      proposal.providerKey !== result.providerKey ||
      (sourceUnavailable && proposal.snapshot !== undefined) ||
      (!sourceUnavailable && proposal.snapshot === undefined) ||
      (proposal.snapshot !== undefined &&
        (proposal.snapshot.identity.providerKey !== proposal.providerKey ||
          proposal.snapshot.identity.externalId !== proposal.externalId ||
          proposal.snapshot.observedAt !== proposal.observedAt))
    ) {
      throwInvalidSemantics();
    }
  }
  const observed = result.proposals.length - decisions.SOURCE_UNAVAILABLE;
  const expectedOutcome =
    decisions.SOURCE_UNAVAILABLE === 0
      ? "SUCCESS"
      : observed === 0
        ? "SOURCE_UNAVAILABLE"
        : "PARTIAL";
  if (
    result.observed !== observed ||
    result.sourceUnavailable !== decisions.SOURCE_UNAVAILABLE ||
    result.baselineCaptured !== decisions.BASELINE_CAPTURED ||
    result.unchanged !== decisions.NO_CHANGE ||
    result.proposed !== decisions.PROPOSED ||
    result.reviewRequired !== decisions.REVIEW_REQUIRED ||
    result.outcome !== expectedOutcome
  ) {
    throwInvalidSemantics();
  }
}

function throwInvalidSemantics(): never {
  throw new CatalogJobPermanentError(
    "INVALID_REFRESH_RESULT_SEMANTICS",
    "Refresh evidence counters, identities or outcomes are internally inconsistent."
  );
}

function validateProductScope(
  rows: LockedCatalogRevisionRows,
  result: RefreshExistingProductsShadowResult
): Map<string, ProductRevisionRow> {
  const byId = new Map(rows.products.map((row) => [row.id, row]));
  if (byId.size !== result.proposals.length) {
    throw new CatalogJobPermanentError(
      "REFRESH_PRODUCT_SCOPE_MISMATCH",
      "One or more refresh proposals do not belong to the claimed store."
    );
  }
  for (const proposal of result.proposals) {
    const product = byId.get(proposal.productId);
    if (
      !product ||
      product.storeId !== result.storeId ||
      product.providerKey !== result.providerKey ||
      product.externalId !== proposal.externalId
    ) {
      throw new CatalogJobPermanentError(
        "REFRESH_PRODUCT_IDENTITY_MISMATCH",
        "A refresh proposal does not match the persisted product supplier identity."
      );
    }
    if (product.updatedAt.getTime() !== Date.parse(proposal.productRevisionAt)) {
      throw new Error("CATALOG_REFRESH_PRODUCT_REVISION_CONFLICT");
    }
    const currentCatalog = lockedCatalogStateForProduct(rows, product);
    if (
      catalogStorefrontRevisionFingerprintV1(currentCatalog) !==
      proposal.storefrontRevisionFingerprint
    ) {
      throw new Error("CATALOG_REFRESH_STOREFRONT_REVISION_CONFLICT");
    }
  }
  return byId;
}

function lockedCatalogStateForProduct(
  rows: LockedCatalogRevisionRows,
  product: ProductRevisionRow
): CatalogCurrentStateV1 {
  return {
    fulfillmentMode: product.fulfillmentMode,
    sourceUrl: product.sourceUrl,
    stockStatus: product.stockStatus,
    shippingDaysMin: product.shippingDaysMin,
    shippingDaysMax: product.shippingDaysMax,
    countryOfOrigin: product.countryOfOrigin,
    sku: product.sku,
    gtin: product.gtin,
    variants: rows.variants
      .filter((variant) => variant.productId === product.id)
      .map((variant) => ({
        externalVariantId: variant.externalVariantId,
        sku: variant.sku,
        stockStatus: variant.stockStatus,
      })),
    mediaSourceUrls: [
      ...rows.mediaAssets
        .filter(
          (asset) =>
            asset.productId === product.id && asset.ingestionStatus === "STORED"
        )
        .map((asset) => asset.sourceUrl),
      ...rows.images
        .filter(
          (image): image is ProductImageRevisionRow & { sourceUrl: string } =>
            image.productId === product.id && image.sourceUrl !== null
        )
        .map((image) => image.sourceUrl),
    ],
  };
}

function prepareObservations(
  executionId: string,
  result: RefreshExistingProductsShadowResult
): PreparedObservation[] {
  return result.proposals.map((proposal) => {
    const observationId = deterministicEvidenceId(
      "cobs",
      `${executionId}\u001f${proposal.productId}`
    );
    const proposalId = deterministicEvidenceId("cprp", observationId);
    const snapshotJson = proposal.snapshot ? boundedJson(proposal.snapshot, MAX_SNAPSHOT_JSON_BYTES) : null;
    const reasonCodesJson = boundedJson(proposal.reasonCodes, MAX_PROPOSAL_JSON_BYTES);
    const changesJson = boundedJson(proposal.changes, MAX_PROPOSAL_JSON_BYTES);
    const alignmentJson = boundedJson(proposal.catalogAlignment, MAX_PROPOSAL_JSON_BYTES);
    return {
      id: observationId,
      idempotencyKey: sha256(`${executionId}\u001f${proposal.productId}`),
      proposalId,
      proposal,
      sourceStatus:
        proposal.decision === "SOURCE_UNAVAILABLE"
          ? "SOURCE_UNAVAILABLE"
          : "AVAILABLE",
      snapshotJson,
      reasonCodesJson,
      changesJson,
      alignmentJson,
      workflowStatus: proposalWorkflowStatus(proposal),
    };
  });
}

function proposalWorkflowStatus(
  proposal: CatalogRefreshProposalV1
): PreparedObservation["workflowStatus"] {
  if (proposal.decision === "SOURCE_UNAVAILABLE") return "SOURCE_UNAVAILABLE";
  if (proposal.decision === "REVIEW_REQUIRED") return "NEEDS_REVIEW";
  if (proposal.decision === "PROPOSED" || proposal.catalogAlignment.status === "DRIFT") {
    return "OPEN";
  }
  return "RECORDED";
}

async function upsertProductState(
  transaction: CatalogRefreshTransaction,
  input: {
    executionId: string;
    storeId: string;
    observation: PreparedObservation;
  }
): Promise<void> {
  const { observation } = input;
  const proposal = observation.proposal;
  const successful = observation.sourceStatus === "AVAILABLE";
  const actionable =
    observation.workflowStatus === "OPEN" ||
    observation.workflowStatus === "NEEDS_REVIEW";
  const common = {
    storeId: input.storeId,
    productId: proposal.productId,
    providerKey: proposal.providerKey,
    externalId: proposal.externalId,
    latestExecutionId: input.executionId,
    latestObservationId: observation.id,
    latestProposalId: observation.proposalId,
    latestDecision: proposal.decision,
    latestAlignmentStatus: proposal.catalogAlignment.status,
    latestSourceStatus: observation.sourceStatus,
    lastAttemptAt: new Date(proposal.observedAt),
  };
  await transaction.catalogProductState.upsert({
    where: {
      productId_providerKey: {
        productId: proposal.productId,
        providerKey: proposal.providerKey,
      },
    },
    create: {
      ...common,
      lastSuccessfulObservationId: successful ? observation.id : null,
      lastSuccessfulObservationAt: successful ? new Date(proposal.observedAt) : null,
      consecutiveFailures: successful ? 0 : 1,
      openProposalId: actionable ? observation.proposalId : null,
      openProposalStatus: actionable ? observation.workflowStatus : "NONE",
    },
    update: {
      ...common,
      consecutiveFailures: successful ? 0 : { increment: 1 },
      ...(successful
        ? {
            lastSuccessfulObservationId: observation.id,
            lastSuccessfulObservationAt: new Date(proposal.observedAt),
            ...(actionable
              ? {
                  openProposalId: observation.proposalId,
                  openProposalStatus: observation.workflowStatus,
                }
              : {}),
          }
        : {}),
    },
  });
}

function settlementForHandlerOutcome(
  result: RefreshExistingProductsShadowResult,
  lease: CatalogJobLease
): { outcome: "SUCCESS" | "RETRY" | "FAILED"; code: string } {
  if (result.outcome === "SUCCESS") return { outcome: "SUCCESS", code: "OK" };
  return {
    outcome: lease.attempts < lease.maxAttempts ? "RETRY" : "FAILED",
    code: `HANDLER_${result.outcome}`,
  };
}

function jobSettlementData(
  settlement: { outcome: "SUCCESS" | "RETRY" | "FAILED"; code: string },
  handlerOutcome: RefreshExistingProductsShadowResult["outcome"],
  lease: CatalogJobLease,
  now: Date
): Record<string, unknown> {
  if (settlement.outcome === "SUCCESS") {
    return {
      status: "SUCCESS",
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    };
  }
  return {
    status: settlement.outcome,
    lockedAt: null,
    lockedBy: null,
    lastError:
      settlement.code === "CATALOG_REFRESH_CURSOR_CONFLICT"
        ? "Refresh evidence was recorded, but the scan cursor changed concurrently."
        : `Handler completed with ${handlerOutcome}.`,
    runAfter: catalogJobRetryAt(lease, now),
  };
}

async function advanceCursorCompareAndSwap(
  transaction: CatalogRefreshTransaction,
  input: {
    storeId: string;
    providerKey: string;
    lastProductId: string | null;
    expectedRevision: number;
    executionId: string;
    now: Date;
  }
): Promise<boolean> {
  const changed = await transaction.$executeRawUnsafe(
    `INSERT INTO "CatalogRefreshCursor"
      ("storeId", "providerKey", "lastProductId", "revision", "lastExecutionId", "createdAt", "updatedAt")
     SELECT $1, $2, CAST($3 AS TEXT), 1, $4, CAST($5 AS TIMESTAMP(3)), CAST($5 AS TIMESTAMP(3))
     WHERE $6 = 0
     ON CONFLICT ("storeId", "providerKey") DO UPDATE SET
       "lastProductId" = EXCLUDED."lastProductId",
       "revision" = "CatalogRefreshCursor"."revision" + 1,
       "lastExecutionId" = EXCLUDED."lastExecutionId",
       "updatedAt" = EXCLUDED."updatedAt"
     WHERE "CatalogRefreshCursor"."revision" = $6`,
    input.storeId,
    input.providerKey,
    input.lastProductId,
    input.executionId,
    input.now,
    input.expectedRevision
  );
  return changed === 1;
}

async function lockCatalogRevisions(
  transaction: CatalogRefreshTransaction,
  storeId: string,
  productIds: string[]
): Promise<LockedCatalogRevisionRows> {
  const sortedProductIds = [...new Set(productIds)].sort();
  const products = await transaction.$queryRawUnsafe<ProductRevisionRow[]>(
    `SELECT "id", "storeId", "providerKey", "externalId", "updatedAt",
            "fulfillmentMode", "sourceUrl", "stockStatus", "shippingDaysMin",
            "shippingDaysMax", "countryOfOrigin", "sku", "gtin"
     FROM "Product"
     WHERE "storeId" = $1 AND "id" = ANY($2::text[])
     ORDER BY "id" ASC
     FOR UPDATE`,
    storeId,
    sortedProductIds
  );
  const variants = await transaction.$queryRawUnsafe<ProductVariantRevisionRow[]>(
    `SELECT "id", "productId", "externalVariantId", "sku", "stockStatus"
     FROM "ProductVariant"
     WHERE "productId" = ANY($1::text[])
     ORDER BY "productId" ASC, "id" ASC
     FOR UPDATE`,
    sortedProductIds
  );
  const images = await transaction.$queryRawUnsafe<ProductImageRevisionRow[]>(
    `SELECT "id", "productId", "sourceUrl"
     FROM "ProductImage"
     WHERE "productId" = ANY($1::text[])
     ORDER BY "productId" ASC, "id" ASC
     FOR UPDATE`,
    sortedProductIds
  );
  const mediaAssets = await transaction.$queryRawUnsafe<ProductMediaRevisionRow[]>(
    `SELECT "id", "productId", "sourceUrl", "ingestionStatus"
     FROM "ProductMediaAsset"
     WHERE "productId" = ANY($1::text[])
     ORDER BY "productId" ASC, "id" ASC
     FOR UPDATE`,
    sortedProductIds
  );
  return { products, variants, images, mediaAssets };
}

function emptyLockedCatalogRevisionRows(): LockedCatalogRevisionRows {
  return { products: [], variants: [], images: [], mediaAssets: [] };
}

function reconcileExistingExecution(
  execution: ExistingExecutionRow,
  job: ClaimedCatalogRefreshJob
): CatalogRefreshSettlement {
  if (
    execution.catalogJobId !== job.id ||
    execution.catalogJobAttempt !== job.attempts ||
    execution.storeId !== job.storeId ||
    execution.providerKey !== job.providerKey
  ) {
    throw new Error("CATALOG_REFRESH_EXECUTION_ID_COLLISION");
  }
  const outcome = execution.settlementStatus;
  if (outcome !== "SUCCESS" && outcome !== "RETRY" && outcome !== "FAILED") {
    throw new Error("CATALOG_REFRESH_INVALID_PERSISTED_SETTLEMENT");
  }
  return {
    executionId: execution.id,
    recorded: true,
    outcome,
    code: execution.settlementCode,
  };
}

async function safelyFindExistingExecution(
  db: CatalogRefreshPersistenceDb,
  executionId: string
): Promise<ExistingExecutionRow | null> {
  try {
    return await db.catalogRefreshExecution.findUnique({
      where: { id: executionId },
      select: existingExecutionSelect,
    });
  } catch {
    return null;
  }
}

function boundedJson(value: unknown, maxBytes: number): string {
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json, "utf8") > maxBytes) {
    throw new CatalogJobPermanentError(
      "CATALOG_REFRESH_EVIDENCE_TOO_LARGE",
      "Normalized refresh evidence exceeds its persistence limit."
    );
  }
  return json;
}

function deterministicEvidenceId(prefix: string, identity: string): string {
  return `${prefix}_${sha256(identity).slice(0, 48)}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertValidDate(date: Date, code: string): void {
  if (!Number.isFinite(date.getTime())) throw new Error(code);
}

class CatalogRefreshLeaseLostError extends Error {
  constructor() {
    super("CATALOG_JOB_LEASE_LOST");
    this.name = "CatalogRefreshLeaseLostError";
  }
}
