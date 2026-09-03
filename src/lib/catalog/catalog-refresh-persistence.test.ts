import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogCurrentStateV1 } from "./catalog-alignment";
import {
  buildCatalogRefreshProposalV1,
  buildSourceUnavailableProposalV1,
  buildSupplierProductSnapshotV1,
  type CatalogRefreshProposalV1,
} from "./catalog-refresh-proposal";
import {
  settleCatalogRefreshJob,
  type ClaimedCatalogRefreshJob,
  type SettleCatalogRefreshInput,
} from "./catalog-refresh-persistence";
import type { RefreshExistingProductsShadowResult } from "./refresh-existing-products";
import { CatalogJobPermanentError } from "../jobs/errors";
import type { CatalogJobLease } from "../jobs/queue";
import type {
  ProductDetailsResult,
  ProviderCapabilities,
  ProviderHealth,
} from "../suppliers/providers/types";

const observedAt = new Date("2026-08-30T10:00:00.000Z");
const settledAt = new Date("2026-08-30T10:01:00.000Z");

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: true,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: true,
};

const providerHealth: ProviderHealth = {
  key: "ebay",
  name: "Test provider",
  status: "OK",
  message: "Ready",
  capabilities,
  defaultFulfillmentMode: "AFFILIATE",
};

interface FakeProductRow {
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

interface FakeVariantRow {
  id: string;
  productId: string;
  externalVariantId: string | null;
  sku: string | null;
  stockStatus: string;
}

interface FakeImageRow {
  id: string;
  productId: string;
  sourceUrl: string | null;
}

interface FakeMediaRow {
  id: string;
  productId: string;
  sourceUrl: string;
  ingestionStatus: string;
}

interface FakeState {
  executions: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  proposals: Array<Record<string, unknown>>;
  productStates: Array<Record<string, unknown>>;
  cursors: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
}

class FakeCatalogRefreshDb {
  state: FakeState = emptyState();
  readonly products: FakeProductRow[];
  readonly variants: FakeVariantRow[];
  readonly images: FakeImageRow[];
  readonly mediaAssets: FakeMediaRow[];
  readonly callOrder: string[] = [];
  transactionCount = 0;
  executionLookupCount = 0;
  cursorCompareAndSwapSucceeds = true;
  terminalLeaseCount = 1;
  throwAfterNextCommit = false;

  constructor(input: {
    products: FakeProductRow[];
    variants: FakeVariantRow[];
    images: FakeImageRow[];
    mediaAssets: FakeMediaRow[];
  }) {
    this.products = input.products;
    this.variants = input.variants;
    this.images = input.images;
    this.mediaAssets = input.mediaAssets;
  }

  readonly catalogRefreshExecution = {
    findUnique: async (args: unknown) => {
      this.executionLookupCount += 1;
      const id = readPath(args, "where", "id");
      return this.state.executions.find((execution) => execution.id === id) ?? null;
    },
  };

  async $transaction<T>(callback: (transaction: never) => Promise<T>): Promise<T> {
    this.transactionCount += 1;
    const draft = structuredClone(this.state);
    const transaction = this.transactionClient(draft);
    const result = await callback(transaction as never);
    this.state = draft;
    if (this.throwAfterNextCommit) {
      this.throwAfterNextCommit = false;
      throw new Error("connection closed after COMMIT acknowledgement was lost");
    }
    return result;
  }

  private transactionClient(draft: FakeState) {
    return {
      $queryRawUnsafe: async (query: string, ...values: unknown[]) => {
        if (query.includes('FROM "ProductVariant"')) {
          this.callOrder.push("variant.lockForUpdate");
          const ids = values[0];
          return this.variants.filter(
            (variant) => Array.isArray(ids) && ids.includes(variant.productId)
          );
        }
        if (query.includes('FROM "ProductImage"')) {
          this.callOrder.push("image.lockForUpdate");
          const ids = values[0];
          return this.images.filter(
            (image) => Array.isArray(ids) && ids.includes(image.productId)
          );
        }
        if (query.includes('FROM "ProductMediaAsset"')) {
          this.callOrder.push("media.lockForUpdate");
          const ids = values[0];
          return this.mediaAssets.filter(
            (asset) => Array.isArray(ids) && ids.includes(asset.productId)
          );
        }
        this.callOrder.push("product.lockForUpdate");
        const [storeId, ids] = values;
        return this.products.filter(
          (product) =>
            product.storeId === storeId &&
            Array.isArray(ids) &&
            ids.includes(product.id)
        );
      },
      catalogRefreshExecution: {
        create: async (args: unknown) => {
          this.callOrder.push("execution.create");
          const data = cloneRecord(readPath(args, "data"));
          draft.executions.push(data);
          return data;
        },
      },
      catalogSupplierObservation: {
        createMany: async (args: unknown) => {
          this.callOrder.push("observation.createMany");
          const data = cloneRecordArray(readPath(args, "data"));
          draft.observations.push(...data);
          return { count: data.length };
        },
      },
      catalogRefreshProposal: {
        createMany: async (args: unknown) => {
          this.callOrder.push("proposal.createMany");
          const data = cloneRecordArray(readPath(args, "data"));
          draft.proposals.push(...data);
          return { count: data.length };
        },
      },
      catalogProductState: {
        upsert: async (args: unknown) => {
          this.callOrder.push("state.upsert");
          const productId = readPath(
            args,
            "where",
            "productId_providerKey",
            "productId"
          );
          const providerKey = readPath(
            args,
            "where",
            "productId_providerKey",
            "providerKey"
          );
          const existing = draft.productStates.find(
            (state) =>
              state.productId === productId && state.providerKey === providerKey
          );
          if (existing) {
            const update = cloneRecord(readPath(args, "update"));
            for (const [key, value] of Object.entries(update)) {
              if (isIncrement(value)) {
                existing[key] = Number(existing[key] ?? 0) + value.increment;
              } else {
                existing[key] = value;
              }
            }
            return existing;
          }
          const created = cloneRecord(readPath(args, "create"));
          draft.productStates.push(created);
          return created;
        },
      },
      catalogJob: {
        updateMany: async (args: unknown) => {
          this.callOrder.push("job.updateMany");
          if (this.terminalLeaseCount === 1) {
            draft.jobs.push({
              where: structuredClone(readPath(args, "where")),
              data: structuredClone(readPath(args, "data")),
            });
          }
          return { count: this.terminalLeaseCount };
        },
      },
      $executeRawUnsafe: async (_query: string, ...values: unknown[]) => {
        this.callOrder.push("cursor.compareAndSwap");
        if (!this.cursorCompareAndSwapSucceeds) return 0;
        const [storeId, providerKey, lastProductId, executionId, now, revision] =
          values;
        draft.cursors.push({
          storeId,
          providerKey,
          lastProductId,
          lastExecutionId: executionId,
          updatedAt: now,
          revision: Number(revision) + 1,
        });
        return 1;
      },
    };
  }
}

test("successful settlement atomically writes evidence, state, cursor and terminal job last", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);

  const settlement = await settleCatalogRefreshJob(
    settlementInput(refreshResult([proposal])),
    { db: db as never }
  );

  assert.equal(settlement.recorded, true);
  assert.equal(settlement.outcome, "SUCCESS");
  assert.equal(settlement.code, "OK");
  assert.equal(db.state.executions.length, 1);
  assert.equal(db.state.observations.length, 1);
  assert.equal(
    db.state.observations[0]?.storefrontRevisionFingerprint,
    proposal.storefrontRevisionFingerprint
  );
  assert.equal(db.state.proposals.length, 1);
  assert.equal(db.state.productStates.length, 1);
  assert.equal(db.state.cursors.length, 1);
  assert.equal(db.state.jobs.length, 1);
  assert.deepEqual(db.callOrder.slice(0, 4), [
    "product.lockForUpdate",
    "variant.lockForUpdate",
    "image.lockForUpdate",
    "media.lockForUpdate",
  ]);
  assert.equal(readPath(db.state.jobs[0], "data", "status"), "SUCCESS");
  assert.equal(db.callOrder.at(-1), "job.updateMany");
  assert.deepEqual(readPath(db.state.jobs[0], "where"), {
    id: "job-refresh-1",
    status: "RUNNING",
    lockedBy: "worker-1",
    lockedAt: new Date("2026-08-30T09:59:00.000Z"),
  });
});

test("exact lease loss rolls the transaction back and returns unrecorded LEASE_LOST", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  db.terminalLeaseCount = 0;

  const settlement = await settleCatalogRefreshJob(
    settlementInput(refreshResult([proposal])),
    { db: db as never }
  );

  assert.deepEqual(settlement, {
    executionId: settlement.executionId,
    recorded: false,
    outcome: "LEASE_LOST",
    code: "CATALOG_JOB_LEASE_LOST",
  });
  assert.deepEqual(db.state, emptyState());
  assert.equal(db.callOrder.at(-1), "job.updateMany");
});

test("partial supplier outcome persists all evidence and retries without advancing cursor", async () => {
  const available = baselineProposal("product-1", "external-1");
  const unavailable = buildSourceUnavailableProposalV1({
    productId: "product-2",
    productTitle: "Product product-2",
    providerKey: "ebay",
    externalId: "external-2",
    observedAt,
    currentCatalog: currentCatalogFor("external-2"),
    reasonCode: "PROVIDER_DETAILS_UNAVAILABLE",
  });
  const db = fakeDbFor(available, unavailable);

  const settlement = await settleCatalogRefreshJob(
    settlementInput(refreshResult([available, unavailable])),
    { db: db as never }
  );

  assert.equal(settlement.outcome, "RETRY");
  assert.equal(settlement.code, "HANDLER_PARTIAL");
  assert.equal(db.state.executions.length, 1);
  assert.equal(db.state.observations.length, 2);
  assert.equal(db.state.proposals.length, 2);
  assert.equal(db.state.productStates.length, 2);
  assert.equal(db.state.cursors.length, 0);
  assert.equal(db.callOrder.includes("cursor.compareAndSwap"), false);
  assert.equal(readPath(db.state.jobs[0], "data", "status"), "RETRY");
  assert.equal(db.callOrder.at(-1), "job.updateMany");
});

test("cursor CAS loser records immutable evidence but cannot overwrite a newer product projection", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  const newerProjection = {
    id: "state-newer",
    storeId: "store-1",
    productId: proposal.productId,
    providerKey: proposal.providerKey,
    externalId: proposal.externalId,
    latestExecutionId: "execution-newer",
    latestObservationId: "observation-newer",
    latestProposalId: "proposal-newer",
    latestDecision: "REVIEW_REQUIRED",
    latestAlignmentStatus: "DRIFT",
    latestSourceStatus: "AVAILABLE",
    lastAttemptAt: new Date("2026-08-30T10:05:00.000Z"),
    lastSuccessfulObservationId: "observation-newer",
    lastSuccessfulObservationAt: new Date("2026-08-30T10:05:00.000Z"),
    consecutiveFailures: 0,
    openProposalId: "proposal-newer",
    openProposalStatus: "NEEDS_REVIEW",
  };
  db.state.productStates.push(structuredClone(newerProjection));
  db.cursorCompareAndSwapSucceeds = false;

  const settlement = await settleCatalogRefreshJob(
    settlementInput(refreshResult([proposal], { scanCursorRevisionStart: 7 })),
    { db: db as never }
  );

  assert.equal(settlement.recorded, true);
  assert.equal(settlement.outcome, "RETRY");
  assert.equal(settlement.code, "CATALOG_REFRESH_CURSOR_CONFLICT");
  assert.equal(db.state.executions.length, 1);
  assert.equal(db.state.observations.length, 1);
  assert.equal(db.state.proposals.length, 1);
  assert.deepEqual(db.state.productStates, [newerProjection]);
  assert.equal(db.state.cursors.length, 0);
  assert.equal(db.callOrder.includes("state.upsert"), false);
  assert.equal(readPath(db.state.jobs[0], "data", "status"), "RETRY");
  assert.match(
    String(readPath(db.state.jobs[0], "data", "lastError")),
    /cursor changed concurrently/i
  );
});

test("an unresolved review proposal remains explicitly current after a later identical observation", async () => {
  const review = reviewRequiredProposal("product-1", "external-1");
  const db = fakeDbFor(review);

  await settleCatalogRefreshJob(
    settlementInput(refreshResult([review]), {
      jobId: "job-review",
      catalogSyncRunId: "sync-review",
    }),
    { db: db as never }
  );

  const openProposalId = String(db.state.proposals[0]?.id);
  assert.equal(db.state.productStates[0]?.openProposalId, openProposalId);
  assert.equal(db.state.productStates[0]?.openProposalStatus, "NEEDS_REVIEW");

  const unchanged = identicalNoChangeProposal(review);
  await settleCatalogRefreshJob(
    settlementInput(
      refreshResult([unchanged], {
        startedAt: "2026-08-30T11:00:00.000Z",
        completedAt: "2026-08-30T11:00:30.000Z",
        scanCursorRevisionStart: 1,
      }),
      {
        jobId: "job-no-change",
        catalogSyncRunId: "sync-no-change",
        now: new Date("2026-08-30T11:01:00.000Z"),
      }
    ),
    { db: db as never }
  );

  assert.equal(db.state.productStates.length, 1);
  assert.equal(db.state.productStates[0]?.latestDecision, "NO_CHANGE");
  assert.equal(
    db.state.productStates[0]?.latestProposalId,
    db.state.proposals[1]?.id
  );
  assert.equal(db.state.productStates[0]?.openProposalId, openProposalId);
  assert.equal(db.state.productStates[0]?.openProposalStatus, "NEEDS_REVIEW");
  assert.equal(db.state.proposals[1]?.workflowStatus, "RECORDED");
});

test("ambiguous post-commit failure reconciles the deterministic execution idempotently", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  db.throwAfterNextCommit = true;
  const input = settlementInput(refreshResult([proposal]));

  const first = await settleCatalogRefreshJob(input, { db: db as never });
  const second = await settleCatalogRefreshJob(input, { db: db as never });

  assert.deepEqual(first, second);
  assert.equal(first.recorded, true);
  assert.equal(first.outcome, "SUCCESS");
  assert.equal(db.transactionCount, 1);
  assert.equal(db.state.executions.length, 1);
  assert.equal(db.state.observations.length, 1);
  assert.equal(db.state.proposals.length, 1);
  assert.equal(db.state.jobs.length, 1);
  assert.ok(db.executionLookupCount >= 3);
});

test("store scope and persisted supplier identity tampering both fail closed", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const scopeDb = fakeDbFor(proposal);
  await assert.rejects(
    settleCatalogRefreshJob(
      settlementInput({ ...refreshResult([proposal]), storeId: "store-other" }),
      { db: scopeDb as never }
    ),
    (error: unknown) =>
      error instanceof CatalogJobPermanentError &&
      error.code === "REFRESH_RESULT_SCOPE_MISMATCH"
  );
  assert.equal(scopeDb.transactionCount, 0);

  assert.ok(proposal.snapshot);
  const tampered: CatalogRefreshProposalV1 = {
    ...proposal,
    externalId: "external-tampered",
    snapshot: {
      ...proposal.snapshot,
      identity: {
        ...proposal.snapshot.identity,
        externalId: "external-tampered",
      },
    },
  };
  const identityDb = fakeDbFor(proposal);
  await assert.rejects(
    settleCatalogRefreshJob(
      settlementInput(refreshResult([tampered])),
      { db: identityDb as never }
    ),
    (error: unknown) =>
      error instanceof CatalogJobPermanentError &&
      error.code === "REFRESH_PRODUCT_IDENTITY_MISMATCH"
  );
  assert.deepEqual(identityDb.state, emptyState());
});

test("a product edit during supplier I/O rejects stale proposal evidence", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  db.products[0].updatedAt = new Date("2026-08-30T10:00:01.000Z");

  await assert.rejects(
    settleCatalogRefreshJob(settlementInput(refreshResult([proposal])), {
      db: db as never,
    }),
    /CATALOG_REFRESH_PRODUCT_REVISION_CONFLICT/
  );
  assert.deepEqual(db.state, emptyState());
});

test("a variant edit during supplier I/O rejects stale storefront evidence", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  db.variants[0].stockStatus = "OUT_OF_STOCK";

  await assert.rejects(
    settleCatalogRefreshJob(settlementInput(refreshResult([proposal])), {
      db: db as never,
    }),
    /CATALOG_REFRESH_STOREFRONT_REVISION_CONFLICT/
  );
  assert.deepEqual(db.state, emptyState());
});

test("a product image edit during supplier I/O rejects stale storefront evidence", async () => {
  const proposal = baselineProposal("product-1", "external-1");
  const db = fakeDbFor(proposal);
  db.images[0].sourceUrl = "https://cdn.example/catalog/replaced.jpg";

  await assert.rejects(
    settleCatalogRefreshJob(settlementInput(refreshResult([proposal])), {
      db: db as never,
    }),
    /CATALOG_REFRESH_STOREFRONT_REVISION_CONFLICT/
  );
  assert.deepEqual(db.state, emptyState());
});

test("the complete normalized snapshot is persisted instead of bounded audit telemetry", async () => {
  const proposal = baselineProposal("product-large", "external-large", 900);
  const db = fakeDbFor(proposal);

  await settleCatalogRefreshJob(
    settlementInput(refreshResult([proposal])),
    { db: db as never }
  );

  const snapshotJson = String(db.state.observations[0]?.snapshotJson);
  const persisted = JSON.parse(snapshotJson) as {
    fingerprint: string;
    media: Array<{ url: string }>;
  };
  assert.ok(Buffer.byteLength(snapshotJson, "utf8") > 100_000);
  assert.equal(persisted.media.length, 900);
  assert.equal(persisted.fingerprint, proposal.snapshot?.fingerprint);
  assert.ok(
    persisted.media.some(
      (media) => media.url === "https://cdn.example/catalog/item-899.jpg"
    )
  );
});

function baselineProposal(
  productId: string,
  externalId: string,
  mediaCount = 1
): CatalogRefreshProposalV1 {
  const media = Array.from({ length: mediaCount }, (_, index) => ({
    url: `https://cdn.example/catalog/item-${String(index).padStart(3, "0")}.jpg`,
    mediaType: "IMAGE" as const,
    sortOrder: index,
  }));
  const details: ProductDetailsResult = {
    providerKey: "ebay",
    externalId,
    sourceUrl: `https://supplier.example/products/${externalId}`,
    title: `Supplier ${externalId}`,
    description: "Grounded supplier description",
    brand: "Supplier brand",
    price: 29,
    currency: "USD",
    supplierCost: 12,
    shippingCost: 3,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 4,
    shippingDaysMax: 8,
    countryOfOrigin: "NO",
    sku: `SKU-${externalId}`,
    specs: [],
    variants: [],
    media,
    signals: {},
    risk: {},
    fulfillmentMode: "AFFILIATE",
  };
  const snapshot = buildSupplierProductSnapshotV1({
    requestedProviderKey: "ebay",
    requestedExternalId: externalId,
    observedAt,
    health: providerHealth,
    details,
  });
  return buildCatalogRefreshProposalV1({
    productId,
    productTitle: `Product ${productId}`,
    snapshot,
    currentCatalog: currentCatalogFor(externalId),
  });
}

function reviewRequiredProposal(
  productId: string,
  externalId: string
): CatalogRefreshProposalV1 {
  const baseline = baselineProposal(productId, externalId);
  return {
    ...baseline,
    decision: "REVIEW_REQUIRED",
    previousFingerprint: "1".repeat(64),
    proposalFingerprint: "2".repeat(64),
    reasonCodes: ["SUPPLIER_PRICE_CHANGED"],
    changes: [
      {
        field: "facts.supplierCost",
        impact: "HIGH",
        previous: 10,
        next: 12,
      },
    ],
  };
}

function identicalNoChangeProposal(
  review: CatalogRefreshProposalV1
): CatalogRefreshProposalV1 {
  assert.ok(review.snapshot);
  const laterObservedAt = "2026-08-30T11:00:00.000Z";
  return {
    ...review,
    observedAt: laterObservedAt,
    decision: "NO_CHANGE",
    previousFingerprint: review.snapshot.fingerprint,
    proposalFingerprint: "3".repeat(64),
    reasonCodes: [],
    changes: [],
    snapshot: {
      ...review.snapshot,
      observedAt: laterObservedAt,
    },
  };
}

function refreshResult(
  proposals: CatalogRefreshProposalV1[],
  overrides: Partial<RefreshExistingProductsShadowResult> = {}
): RefreshExistingProductsShadowResult {
  const baselineCaptured = decisionCount(proposals, "BASELINE_CAPTURED");
  const unchanged = decisionCount(proposals, "NO_CHANGE");
  const proposed = decisionCount(proposals, "PROPOSED");
  const reviewRequired = decisionCount(proposals, "REVIEW_REQUIRED");
  const sourceUnavailable = decisionCount(proposals, "SOURCE_UNAVAILABLE");
  const observed = proposals.length - sourceUnavailable;
  const outcome =
    sourceUnavailable === 0
      ? "SUCCESS"
      : observed === 0
        ? "SOURCE_UNAVAILABLE"
        : "PARTIAL";
  return {
    version: "catalog-refresh-shadow.v1",
    mode: "SHADOW",
    storeId: "store-1",
    providerKey: "ebay",
    startedAt: "2026-08-30T10:00:00.000Z",
    completedAt: "2026-08-30T10:00:30.000Z",
    outcome,
    selected: proposals.length,
    skippedFresh: 0,
    observed,
    baselineCaptured,
    unchanged,
    proposed,
    reviewRequired,
    sourceUnavailable,
    scanned: proposals.length,
    scanCursorRevisionStart: 0,
    scanCursorStart: null,
    scanCursorNext: proposals.at(-1)?.productId ?? null,
    scanWrapped: false,
    proposals,
    ...overrides,
  };
}

function settlementInput(
  result: RefreshExistingProductsShadowResult,
  overrides: {
    jobId?: string;
    catalogSyncRunId?: string;
    now?: Date;
  } = {}
): SettleCatalogRefreshInput {
  const job: ClaimedCatalogRefreshJob = {
    id: overrides.jobId ?? "job-refresh-1",
    storeId: "store-1",
    providerKey: "ebay",
    jobType: "REFRESH_EXISTING",
    attempts: 1,
    maxAttempts: 3,
  };
  const lease: CatalogJobLease = {
    jobId: job.id,
    lockedBy: "worker-1",
    lockedAt: new Date("2026-08-30T09:59:00.000Z"),
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  };
  return {
    catalogSyncRunId: overrides.catalogSyncRunId ?? "sync-run-1",
    job,
    lease,
    result,
    now: overrides.now ?? settledAt,
  };
}

function fakeDbFor(...proposals: CatalogRefreshProposalV1[]): FakeCatalogRefreshDb {
  const catalogStates = new Map(
    proposals.map((proposal) => [
      proposal.productId,
      currentCatalogFor(proposal.externalId),
    ])
  );
  return new FakeCatalogRefreshDb({
    products: proposals.map((proposal) => {
      const current = catalogStates.get(proposal.productId);
      assert.ok(current);
      return {
        id: proposal.productId,
        storeId: "store-1",
        providerKey: proposal.providerKey,
        externalId: proposal.externalId,
        updatedAt: new Date(proposal.productRevisionAt),
        fulfillmentMode: current.fulfillmentMode,
        sourceUrl: current.sourceUrl ?? null,
        stockStatus: current.stockStatus,
        shippingDaysMin: current.shippingDaysMin,
        shippingDaysMax: current.shippingDaysMax,
        countryOfOrigin: current.countryOfOrigin ?? null,
        sku: current.sku,
        gtin: current.gtin ?? null,
      };
    }),
    variants: proposals.flatMap((proposal) =>
      (catalogStates.get(proposal.productId)?.variants ?? []).map(
        (variant, index) => ({
          id: `variant-${proposal.productId}-${index}`,
          productId: proposal.productId,
          externalVariantId: variant.externalVariantId ?? null,
          sku: variant.sku ?? null,
          stockStatus: variant.stockStatus ?? "UNKNOWN",
        })
      )
    ),
    images: proposals.flatMap((proposal) =>
      (catalogStates.get(proposal.productId)?.mediaSourceUrls ?? []).map(
        (sourceUrl, index) => ({
          id: `image-${proposal.productId}-${index}`,
          productId: proposal.productId,
          sourceUrl,
        })
      )
    ),
    mediaAssets: [],
  });
}

function currentCatalogFor(externalId: string): CatalogCurrentStateV1 {
  return {
    fulfillmentMode: "AFFILIATE",
    sourceUrl: `https://supplier.example/products/${externalId}`,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 4,
    shippingDaysMax: 8,
    countryOfOrigin: "NO",
    sku: `SKU-${externalId}`,
    gtin: null,
    variants: [
      {
        externalVariantId: "variant-local",
        sku: "SKU-VARIANT-LOCAL",
        stockStatus: "IN_STOCK",
      },
    ],
    mediaSourceUrls: ["https://cdn.example/catalog/item-000.jpg"],
  };
}

function decisionCount(
  proposals: CatalogRefreshProposalV1[],
  decision: CatalogRefreshProposalV1["decision"]
): number {
  return proposals.filter((proposal) => proposal.decision === decision).length;
}

function emptyState(): FakeState {
  return {
    executions: [],
    observations: [],
    proposals: [],
    productStates: [],
    cursors: [],
    jobs: [],
  };
}

function readPath(value: unknown, ...path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function cloneRecord(value: unknown): Record<string, unknown> {
  assert.ok(isRecord(value));
  return structuredClone(value);
}

function cloneRecordArray(value: unknown): Array<Record<string, unknown>> {
  assert.ok(Array.isArray(value));
  return value.map(cloneRecord);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIncrement(value: unknown): value is { increment: number } {
  return isRecord(value) && typeof value.increment === "number";
}
