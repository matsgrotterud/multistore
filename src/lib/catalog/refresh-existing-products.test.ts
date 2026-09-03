import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_REFRESH_RUN_VERSION,
  extractLatestRefreshCursor,
  parseRefreshExistingProductsShadowResult,
  refreshExistingProductsShadow,
  safeParseRefreshExistingProductsShadowResult,
  type RefreshExistingProductsShadowDependencies,
} from "./refresh-existing-products";
import type {
  CommerceProvider,
  ProductDetailsResult,
  ProviderCapabilities,
  ProviderKey,
} from "../suppliers/providers/types";
import type { SupplierProductSnapshotV1 } from "./catalog-refresh-proposal";

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

function supplierDetails(
  overrides: Partial<ProductDetailsResult> = {}
): ProductDetailsResult {
  return {
    providerKey: "ebay",
    externalId: "external-1",
    sourceUrl: "https://supplier.example/external-1",
    title: "Supplier title",
    description: "Supplier description",
    price: 25,
    currency: "USD",
    shippingCost: 2,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 3,
    shippingDaysMax: 7,
    specs: [],
    variants: [],
    media: [
      {
        url: "https://cdn.example/product.jpg",
        mediaType: "IMAGE",
        sortOrder: 0,
      },
    ],
    signals: {},
    risk: {},
    fulfillmentMode: "AFFILIATE",
    ...overrides,
  };
}

function provider(input: {
  providerKey?: ProviderKey;
  details?: ProductDetailsResult;
  detailsError?: Error;
  counters: { health: number; details: number };
}): CommerceProvider {
  const providerKey = input.providerKey ?? input.details?.providerKey ?? "ebay";
  const fulfillmentMode = providerKey === "cj" ? "DROPSHIP" : "AFFILIATE";
  return {
    key: providerKey,
    name: "Test provider",
    capabilities,
    defaultFulfillmentMode: fulfillmentMode,
    async getHealth() {
      input.counters.health += 1;
      return {
        key: providerKey,
        name: "Test provider",
        status: "OK",
        message: "Ready",
        capabilities,
        defaultFulfillmentMode: fulfillmentMode,
      };
    },
    async searchProducts() {
      return [];
    },
    async getProductDetails(detailsInput) {
      input.counters.details += 1;
      if (input.detailsError) throw input.detailsError;
      return (
        input.details ??
        supplierDetails({
          providerKey,
          externalId: detailsInput.externalId,
          sourceUrl:
            detailsInput.sourceUrl ??
            `https://supplier.example/${detailsInput.externalId}`,
          fulfillmentMode,
        })
      );
    },
    async getProductMedia() {
      return [];
    },
  };
}

function dependencies(input: {
  cursor?: { lastProductId: string | null; revision: number } | null;
  states?: Array<{
    storeId?: string;
    providerKey?: string;
    productId: string;
    externalId: string;
    lastAttemptAt?: Date;
    lastSuccessfulObservationId: string | null;
    lastSuccessfulObservationAt: Date | null;
  }>;
  observations?: Array<{
    storeId?: string;
    providerKey?: string;
    sourceStatus?: string;
    id: string;
    snapshotJson: string | null;
  }>;
  details?: ProductDetailsResult;
  detailsError?: Error;
  providerKey?: ProviderKey;
  productLastSyncAt?: Date | null;
  products?: Array<{
    id: string;
    title: string;
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
  }>;
  now?: Date;
}) {
  const providerKey = input.providerKey ?? "ebay";
  const productQueries: unknown[] = [];
  const cursorQueries: unknown[] = [];
  const stateQueries: unknown[] = [];
  const observationQueries: unknown[] = [];
  let legacySummaryReads = 0;
  const counters = { health: 0, details: 0, writes: 0 };
  const products =
    input.products ??
    [
      {
        id: "product-1",
        title: "Store title",
        providerKey,
        externalId: "external-1",
        sourceUrl: "https://supplier.example/external-1",
        lastSupplierSyncAt: input.productLastSyncAt ?? null,
        fulfillmentMode: providerKey === "cj" ? "DROPSHIP" : "AFFILIATE",
        stockStatus: "IN_STOCK",
        shippingDaysMin: 3,
        shippingDaysMax: 7,
        countryOfOrigin: null,
        sku: "LOCAL-SKU-1",
        gtin: null,
        variants: [],
        mediaAssets: [{ sourceUrl: "https://cdn.example/product.jpg" }],
        images: [],
      },
    ];
  const originalProducts = structuredClone(products);
  const db = {
    product: {
      async findMany(args: unknown) {
        productQueries.push(args);
        const query = args as {
          where?: {
            storeId?: string;
            providerKey?: string;
            externalId?: { not?: null };
            id?: { gt?: string; lte?: string };
          };
          orderBy?: { id?: "asc" | "desc" };
          take?: number;
        };
        let rows = products.filter((product) => {
          const where = query.where;
          if (!where) return true;
          if (where.storeId && where.storeId !== "store-1") return false;
          if (where.providerKey && product.providerKey !== where.providerKey) return false;
          if (where.externalId?.not === null && product.externalId === null) return false;
          if (where.id?.gt && product.id <= where.id.gt) return false;
          if (where.id?.lte && product.id > where.id.lte) return false;
          return true;
        });
        rows = [...rows].sort((left, right) => left.id.localeCompare(right.id));
        if (query.orderBy?.id === "desc") rows.reverse();
        return rows.slice(0, query.take ?? rows.length);
      },
    },
    catalogRefreshCursor: {
      async findUnique(args: unknown) {
        cursorQueries.push(args);
        return input.cursor ?? null;
      },
    },
    catalogProductState: {
      async findMany(args: unknown) {
        stateQueries.push(args);
        const query = args as {
          where: {
            storeId: string;
            providerKey: string;
            productId: { in: string[] };
          };
        };
        return (input.states ?? [])
          .filter(
            (state) =>
              (state.storeId ?? "store-1") === query.where.storeId &&
              (state.providerKey ?? providerKey) === query.where.providerKey &&
              query.where.productId.in.includes(state.productId)
          )
          .map((state) => ({
            productId: state.productId,
            externalId: state.externalId,
            lastAttemptAt:
              state.lastAttemptAt ??
              state.lastSuccessfulObservationAt ??
              new Date("1970-01-01T00:00:00.000Z"),
            lastSuccessfulObservationId: state.lastSuccessfulObservationId,
            lastSuccessfulObservationAt: state.lastSuccessfulObservationAt,
          }));
      },
    },
    catalogSupplierObservation: {
      async findMany(args: unknown) {
        observationQueries.push(args);
        const query = args as {
          where: {
            id: { in: string[] };
            storeId: string;
            providerKey: string;
            sourceStatus: string;
          };
        };
        return (input.observations ?? [])
          .filter(
            (observation) =>
              query.where.id.in.includes(observation.id) &&
              (observation.storeId ?? "store-1") === query.where.storeId &&
              (observation.providerKey ?? providerKey) === query.where.providerKey &&
              (observation.sourceStatus ?? "AVAILABLE") === query.where.sourceStatus
          )
          .map((observation) => ({
            id: observation.id,
            snapshotJson: observation.snapshotJson,
          }));
      },
    },
    // Deliberately outside the production dependency interface: any regression
    // to parsing bounded CatalogSyncRun summaries must fail these tests loudly.
    catalogSyncRun: {
      async findMany() {
        legacySummaryReads += 1;
        throw new Error("CatalogSyncRun summaries are not durable refresh state");
      },
    },
  };
  const fakeProvider = provider({
    counters,
    providerKey,
    details: input.details,
    detailsError: input.detailsError,
  });
  const deps: RefreshExistingProductsShadowDependencies = {
    db,
    resolveProvider: () => fakeProvider,
    now: () => new Date(input.now ?? "2026-08-29T12:00:00.000Z"),
    providerTimeoutMs: 1_000,
    concurrency: 1,
  };
  return {
    deps,
    productQueries,
    cursorQueries,
    stateQueries,
    observationQueries,
    get legacySummaryReads() {
      return legacySummaryReads;
    },
    counters,
    products,
    originalProducts,
  };
}

function durableEvidence(
  snapshot: SupplierProductSnapshotV1,
  input: {
    productId?: string;
    externalId?: string;
    observedAt?: Date;
    snapshotJson?: string | null;
  } = {}
) {
  const observationId = `observation-${input.productId ?? "product-1"}`;
  return {
    states: [
      {
        productId: input.productId ?? "product-1",
        externalId: input.externalId ?? snapshot.identity.externalId,
        lastAttemptAt: input.observedAt ?? new Date(snapshot.observedAt),
        lastSuccessfulObservationId: observationId,
        lastSuccessfulObservationAt:
          input.observedAt ?? new Date(snapshot.observedAt),
      },
    ],
    observations: [
      {
        id: observationId,
        snapshotJson: input.snapshotJson ?? JSON.stringify(snapshot),
      },
    ],
  };
}

test("shadow refresh is scoped, bounded, and captures a first baseline without mutations", async () => {
  const state = dependencies({});
  const result = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    state.deps
  );

  assert.equal(result.outcome, "SUCCESS");
  assert.equal(result.baselineCaptured, 1);
  assert.equal(result.observed, 1);
  assert.equal(result.proposals[0].decision, "BASELINE_CAPTURED");
  assert.equal(state.counters.health, 1);
  assert.equal(state.counters.details, 1);
  assert.equal(state.counters.writes, 0);
  assert.deepEqual(state.products, state.originalProducts);

  const productQuery = state.productQueries[0] as {
    where: { storeId: string; providerKey: string; externalId: unknown };
    take: number;
  };
  assert.equal(productQuery.where.storeId, "store-1");
  assert.equal(productQuery.where.providerKey, "ebay");
  assert.deepEqual(productQuery.where.externalId, { not: null });
  assert.ok(productQuery.take <= 200);
  assert.equal(state.cursorQueries.length, 1);
  assert.equal(state.stateQueries.length, 1);
  assert.equal(state.observationQueries.length, 0);
  assert.equal(state.legacySummaryReads, 0);
});

test("a persisted shadow observation throttles polling but does not update Product freshness", async () => {
  const firstState = dependencies({});
  const first = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    firstState.deps
  );
  const snapshot = first.proposals[0].snapshot;
  assert.ok(snapshot);
  const secondState = dependencies({
    ...durableEvidence(snapshot),
    now: new Date("2026-08-30T11:00:00.000Z"),
  });
  const second = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", maxAgeHours: 48 },
    secondState.deps
  );

  assert.equal(second.selected, 0);
  assert.equal(second.skippedFresh, 1);
  assert.equal(secondState.counters.health, 0);
  assert.equal(secondState.counters.details, 0);
  assert.equal(secondState.products[0].lastSupplierSyncAt, null);
  assert.equal(secondState.stateQueries.length, 1);
  assert.equal(secondState.observationQueries.length, 1);
  assert.equal(secondState.legacySummaryReads, 0);
});

test("the first supplier baseline also exposes existing storefront drift", async () => {
  const state = dependencies({});
  state.products[0].stockStatus = "OUT_OF_STOCK";
  state.products[0].shippingDaysMax = 14;

  const result = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    state.deps
  );

  assert.equal(result.proposals[0].decision, "BASELINE_CAPTURED");
  assert.equal(result.proposals[0].catalogAlignment.status, "DRIFT");
  assert.ok(
    result.proposals[0].catalogAlignment.reasonCodes.includes(
      "CATALOG_INVENTORY_DRIFT"
    )
  );
  assert.ok(
    result.proposals[0].catalogAlignment.reasonCodes.includes(
      "CATALOG_SHIPPING_DRIFT"
    )
  );
});

test("forced repeat compares with prior supplier evidence and reports no change", async () => {
  const firstState = dependencies({});
  const first = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    firstState.deps
  );
  const snapshot = first.proposals[0].snapshot;
  assert.ok(snapshot);
  const secondState = dependencies({
    ...durableEvidence(snapshot),
    now: new Date("2026-08-30T12:00:00.000Z"),
  });
  const second = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    secondState.deps
  );

  assert.equal(second.unchanged, 1);
  assert.equal(second.proposals[0].decision, "NO_CHANGE");
  assert.equal(
    second.proposals[0].previousFingerprint,
    first.proposals[0].snapshot?.fingerprint
  );
});

test("corrupt or identity-mismatched durable snapshots fail open to a new baseline", async () => {
  const firstState = dependencies({});
  const first = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    firstState.deps
  );
  const snapshot = first.proposals[0].snapshot;
  assert.ok(snapshot);

  const cases = [
    {
      name: "corrupt JSON",
      evidence: durableEvidence(snapshot, {
        observedAt: new Date("2026-08-30T11:30:00.000Z"),
        snapshotJson: "{not-valid-json",
      }),
    },
    {
      name: "mismatched external identity",
      evidence: durableEvidence(snapshot, {
        observedAt: new Date("2026-08-30T11:30:00.000Z"),
        externalId: "another-external-product",
      }),
    },
  ];

  for (const fixture of cases) {
    const state = dependencies({
      ...fixture.evidence,
      now: new Date("2026-08-30T12:00:00.000Z"),
    });
    const result = await refreshExistingProductsShadow(
      { storeId: "store-1", providerKey: "ebay", maxAgeHours: 48 },
      state.deps
    );

    assert.equal(result.selected, 1, fixture.name);
    assert.equal(result.skippedFresh, 0, fixture.name);
    assert.equal(result.proposals[0].decision, "BASELINE_CAPTURED", fixture.name);
    assert.equal(state.counters.details, 1, fixture.name);
    assert.equal(state.legacySummaryReads, 0, fixture.name);
  }
});

test("never-observed products are selected before already-baselined stale products", async () => {
  const firstState = dependencies({});
  const first = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    firstState.deps
  );
  const snapshot = first.proposals[0].snapshot;
  assert.ok(snapshot);
  const secondState = dependencies({
    ...durableEvidence(snapshot, {
      observedAt: new Date("2026-08-29T12:00:00.000Z"),
    }),
    products: [
      ...firstState.products,
      {
        id: "product-2",
        title: "Never observed",
        providerKey: "ebay",
        externalId: "external-2",
        sourceUrl: "https://supplier.example/external-2",
        lastSupplierSyncAt: null,
      },
    ],
    now: new Date("2026-08-31T13:00:00.000Z"),
  });
  const second = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", limit: 1, maxAgeHours: 48 },
    secondState.deps
  );

  assert.equal(second.proposals[0].productId, "product-2");
  assert.equal(second.proposals[0].decision, "BASELINE_CAPTURED");
});

test("persisted cursor advances beyond the first scan window", async () => {
  const freshAt = new Date("2026-08-29T11:00:00.000Z");
  const products = Array.from({ length: 55 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      id: `product-${number}`,
      title: `Product ${number}`,
      providerKey: "ebay",
      externalId: `external-${number}`,
      sourceUrl: `https://supplier.example/external-${number}`,
      lastSupplierSyncAt: index < 50 ? freshAt : null,
    };
  });
  const firstState = dependencies({ products });
  const first = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", limit: 1, maxAgeHours: 48 },
    firstState.deps
  );

  assert.equal(first.scanned, 50);
  assert.equal(first.selected, 0);
  assert.equal(first.scanCursorStart, null);
  assert.equal(first.scanCursorNext, "product-050");
  assert.equal(first.scanWrapped, false);

  const secondState = dependencies({
    products,
    cursor: { lastProductId: first.scanCursorNext, revision: 7 },
  });
  const second = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", limit: 1, maxAgeHours: 48 },
    secondState.deps
  );

  assert.equal(second.scanCursorStart, "product-050");
  assert.equal(second.scanCursorRevisionStart, 7);
  assert.equal(second.scanned, 5);
  assert.equal(second.selected, 1);
  assert.equal(second.proposals[0].productId, "product-051");
  assert.equal(second.scanCursorNext, "product-051");
  assert.equal(second.scanWrapped, false);

  const productQuery = secondState.productQueries[0] as {
    where: { id: { gt: string } };
    orderBy: { id: string };
    take: number;
  };
  assert.deepEqual(productQuery.where.id, { gt: "product-050" });
  assert.deepEqual(productQuery.orderBy, { id: "asc" });
  assert.equal(productQuery.take, 50);
  assert.equal(secondState.legacySummaryReads, 0);
});

test("a persistently unavailable product before the cursor cannot starve later products after wrap", async () => {
  const products = Array.from({ length: 6 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      id: `product-${number}`,
      title: `Product ${number}`,
      providerKey: "ebay",
      externalId: `external-${number}`,
      sourceUrl: `https://supplier.example/external-${number}`,
      lastSupplierSyncAt: null,
    };
  });

  const wrappedState = dependencies({
    products,
    cursor: { lastProductId: "product-006", revision: 10 },
    detailsError: new Error("persistent supplier failure"),
  });
  const wrapped = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", limit: 1 },
    wrappedState.deps
  );

  assert.equal(wrapped.scanWrapped, true);
  assert.equal(wrapped.proposals[0].productId, "product-001");
  assert.equal(wrapped.proposals[0].decision, "SOURCE_UNAVAILABLE");
  assert.equal(wrapped.scanCursorNext, "product-001");

  const nextState = dependencies({
    products,
    // A SOURCE_UNAVAILABLE settlement is retried without advancing the
    // durable cursor, but its failed attempt is materialized in product state.
    cursor: { lastProductId: "product-006", revision: 10 },
    states: [
      {
        productId: "product-001",
        externalId: "external-001",
        lastAttemptAt: new Date("2026-08-29T12:00:00.000Z"),
        lastSuccessfulObservationId: null,
        lastSuccessfulObservationAt: null,
      },
    ],
    detailsError: new Error("persistent supplier failure"),
  });
  const next = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", limit: 1 },
    nextState.deps
  );

  assert.equal(next.scanWrapped, true);
  assert.equal(next.proposals[0].productId, "product-002");
  assert.equal(next.proposals[0].decision, "SOURCE_UNAVAILABLE");
  assert.equal(next.scanCursorNext, "product-002");

  const wrappedQuery = nextState.productQueries[1] as {
    where: { id: { lte: string } };
  };
  assert.deepEqual(wrappedQuery.where.id, { lte: "product-006" });
  assert.equal(nextState.productQueries.length, 2);
});

test("cursor extraction survives bounded proposal summaries and stays scope-safe", () => {
  const rows = [
    {
      summaryJson: JSON.stringify({
        executions: [
          {
            result: {
              version: CATALOG_REFRESH_RUN_VERSION,
              storeId: "store-1",
              providerKey: "ebay",
              scanCursorNext: "product-050",
              proposals: [],
              proposalsTruncated: true,
              originalResultBytes: 500_000,
            },
          },
          {
            result: {
              version: CATALOG_REFRESH_RUN_VERSION,
              storeId: "another-store",
              providerKey: "ebay",
              scanCursorNext: "wrong-store-cursor",
              proposals: [],
              proposalsTruncated: true,
            },
          },
        ],
      }),
    },
  ];

  assert.equal(
    extractLatestRefreshCursor(rows, "store-1", "ebay"),
    "product-050"
  );
  assert.equal(extractLatestRefreshCursor(rows, "store-1", "cj"), null);
});

test("provider failures and identity mismatches become auditable unavailable evidence", async () => {
  const failedState = dependencies({ detailsError: new Error("network failed") });
  const failed = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    failedState.deps
  );
  assert.equal(failed.outcome, "SOURCE_UNAVAILABLE");
  assert.deepEqual(failed.proposals[0].reasonCodes, ["PROVIDER_DETAILS_UNAVAILABLE"]);

  const mismatchState = dependencies({
    details: supplierDetails({ externalId: "another-product" }),
  });
  const mismatch = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    mismatchState.deps
  );
  assert.deepEqual(mismatch.proposals[0].reasonCodes, ["SUPPLIER_IDENTITY_MISMATCH"]);
});

test("mock refresh is disabled unless fixture mode is explicit", async () => {
  const state = dependencies({});
  state.products[0].providerKey = "mock";
  const result = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "mock", force: true },
    {
      ...state.deps,
      resolveProvider: () => {
        throw new Error("provider resolution must not run");
      },
    }
  );

  assert.equal(result.outcome, "SOURCE_UNAVAILABLE");
  assert.deepEqual(result.proposals[0].reasonCodes, ["FIXTURE_PROVIDER_DISABLED"]);
  assert.equal(state.counters.health, 0);
  assert.equal(state.counters.details, 0);
});

test("complete shadow result contract rejects corrupt counts, scope, and nested evidence", async () => {
  const state = dependencies({});
  const valid = await refreshExistingProductsShadow(
    { storeId: "store-1", providerKey: "ebay", force: true },
    state.deps
  );
  assert.deepEqual(parseRefreshExistingProductsShadowResult(valid), valid);
  assert.equal(valid.scanCursorRevisionStart, 0);

  assert.equal(
    safeParseRefreshExistingProductsShadowResult({ ...valid, selected: -1 }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({
      ...valid,
      scanned: Number.POSITIVE_INFINITY,
    }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({ ...valid, baselineCaptured: 0 }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({ ...valid, outcome: "PARTIAL" }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({
      ...valid,
      proposals: [{ ...valid.proposals[0], providerKey: "cj" }],
    }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({
      ...valid,
      proposals: [
        {
          ...valid.proposals[0],
          proposalFingerprint: "f".repeat(63),
        },
      ],
    }),
    null
  );
  assert.equal(
    safeParseRefreshExistingProductsShadowResult({ ...valid, unexpected: true }),
    null
  );
  assert.throws(
    () => parseRefreshExistingProductsShadowResult({ ...valid, selected: -1 }),
    /Number must be greater than or equal to 0/
  );
});
