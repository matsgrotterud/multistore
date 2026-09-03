import assert from "node:assert/strict";
import test from "node:test";
import {
  PREVIEW_REVISION_POINTER_V1,
  STORE_BUILD_RUN_V2,
  canonicalJsonV1,
  createStoreRevisionDocumentV2,
  deriveStoreBuildRequestKeyV2,
  storeBuildInputDigestV2,
  type StoreBuildRequestV2,
  type StoreBuildRunV2,
} from "./contracts";
import {
  PrismaStoreFactoryV2Repository,
  type StoreFactoryV2PrismaClient,
  type StoreFactoryV2PrismaTransaction,
} from "./prisma-repository";
import { runDeterministicStoreRevisionQaV1 } from "./qa";
import {
  storeFactoryBuildRequestFixtureV2,
  storeRevisionCandidateFixtureV1,
} from "./test-fixtures";

test("claim persists immutable inputs and RUN_STARTED in one transaction", async () => {
  const run = initialRun();
  const db = new ScriptedPrisma((query) => {
    if (query.includes("LEFT JOIN") && query.includes('run."requestKey" = $2')) {
      return [];
    }
    if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
      return [activePreviewStoreRow(run.storeId)];
    }
    if (query.includes('INSERT INTO "StoreBuildRun"')) return [buildRunRow(run)];
    if (query.includes('SELECT "id" FROM "StoreBuildRun"')) {
      return [{ id: run.id }];
    }
    if (query.includes("COALESCE(MAX")) return [{ sequence: 1 }];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  const result = await repository.claimBuildRun(run);

  assert.equal(result.created, true);
  assert.deepEqual(result.run, run);
  assert.equal(db.transactions, 1);
  assert.equal(db.executes.length, 1);
  assert.match(db.executes[0].query, /StoreBuildEvent/);
  assert.equal(db.executes[0].values[5], "RUN_STARTED");
  assert.equal(allSql(db).includes('"launchStatus"'), true);
  assert.ok(
    db.operations.findIndex((entry) => entry.query.includes('FROM "Store"')) <
      db.operations.findIndex((entry) => entry.query.includes('INSERT INTO "StoreBuildRun"'))
  );
});

test("phase write scopes both lock and update to the requested tenant", async () => {
  const run = initialRun();
  const db = new ScriptedPrisma((query) => {
    if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
      return [activePreviewStoreRow(run.storeId)];
    }
    if (query.includes("FOR UPDATE OF run")) return [buildRunRow(run)];
    if (query.includes('UPDATE "StoreBuildRun"')) {
      return [buildRunRow({ ...run, phase: "VALIDATING" })];
    }
    if (query.includes('SELECT "id" FROM "StoreBuildRun"')) {
      return [{ id: run.id }];
    }
    if (query.includes("COALESCE(MAX")) return [{ sequence: 2 }];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  const result = await repository.advanceBuildPhase({
    storeId: run.storeId,
    runId: run.id,
    expectedPhase: "RECEIVED",
    nextPhase: "VALIDATING",
    at: "2026-09-03T10:00:01.000Z",
  });

  assert.equal(result.phase, "VALIDATING");
  const update = db.queries.find((entry) =>
    entry.query.includes('UPDATE "StoreBuildRun"')
  );
  assert.ok(update);
  assert.match(update.query, /run\."storeId" = \$3/);
  assert.equal(update.values[2], run.storeId);
  assert.equal(db.executes[0].values[5], "PHASE_ENTERED");
  assert.equal(db.transactions, 1);
});

test("finalization persists revision, ordered events, and success in one transaction", async () => {
  const request = buildRequest();
  const candidate = storeRevisionCandidateFixtureV1(request);
  const document = createStoreRevisionDocumentV2(
    request,
    candidate,
    runDeterministicStoreRevisionQaV1(request, candidate)
  );
  const run = initialRun({ phase: "PERSISTING_REVISION" });
  const revisionRow = {
    id: "revision-1",
    storeId: run.storeId,
    buildRunId: run.id,
    revisionNumber: 1,
    parentRevisionId: null,
    catalogArtifactId: run.catalogArtifactId,
    catalogBindingJson: run.catalogBindingJson,
    contractVersion: document.version,
    inputDigest: run.inputDigest,
    outputDigest: document.outputDigest,
    status: "DRAFT",
    revisionJson: canonicalJsonV1(document),
    createdAt: new Date("2026-09-03T10:00:04.000Z"),
    reviewedAt: null,
    reviewedBy: null,
    reviewReason: null,
  };
  const succeeded = {
    ...run,
    state: "SUCCEEDED" as const,
    phase: "COMPLETED" as const,
    outputDigest: document.outputDigest,
    revisionId: revisionRow.id,
    completedAt: "2026-09-03T10:00:05.000Z",
  };
  let sequence = 3;
  const db = new ScriptedPrisma((query) => {
    if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
      return [activePreviewStoreRow(run.storeId)];
    }
    if (query.includes("FOR UPDATE OF run")) return [buildRunRow(run)];
    if (query.includes('FROM "StoreRevision"') && query.includes('"buildRunId" = $1 FOR UPDATE')) return [];
    if (query.includes('SELECT "revisionNumber" FROM "StoreRevision"')) return [];
    if (query.includes('SELECT "activePreviewRevisionId"')) return [];
    if (query.includes('INSERT INTO "StoreRevision"')) return [revisionRow];
    if (query.includes('UPDATE "StoreBuildRun"')) {
      return [buildRunRow(succeeded)];
    }
    if (query.includes('SELECT "id" FROM "StoreBuildRun"')) return [{ id: run.id }];
    if (query.includes("COALESCE(MAX")) {
      sequence += 1;
      return [{ sequence }];
    }
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  const finalized = await repository.finalizeBuildRevision({
    id: revisionRow.id,
    storeId: run.storeId,
    buildRunId: run.id,
    inputDigest: run.inputDigest,
    outputDigest: document.outputDigest,
    document,
    catalogArtifactId: run.catalogArtifactId,
    catalogBindingJson: run.catalogBindingJson,
    parentRevisionId: null,
    parentRevisionOutputDigest: null,
    createdAt: "2026-09-03T10:00:04.000Z",
    completedAt: succeeded.completedAt,
  });

  assert.equal(finalized.revision.outputDigest, document.outputDigest);
  assert.equal(finalized.run.outputDigest, document.outputDigest);
  assert.equal(finalized.run.state, "SUCCEEDED");
  const insert = db.queries.find((entry) =>
    entry.query.includes('INSERT INTO "StoreRevision"')
  );
  assert.ok(insert);
  assert.equal(insert.values[9], document.outputDigest);
  assert.deepEqual(
    db.executes.map((entry) => entry.values[5]),
    ["REVISION_CREATED", "RUN_SUCCEEDED"]
  );
  assert.equal(
    JSON.parse(String(db.executes[0].values[6])).outputDigest,
    document.outputDigest
  );
  const update = db.queries.find((entry) =>
    entry.query.includes('UPDATE "StoreBuildRun"')
  );
  assert.ok(update);
  assert.equal(update.values[0], document.outputDigest);
  assert.equal(db.transactions, 1);
  assert.deepEqual(
    db.operations
      .filter(
        (entry) =>
          entry.query.includes('INSERT INTO "StoreRevision"') ||
          entry.query.includes('UPDATE "StoreBuildRun"') ||
          entry.query.includes('INSERT INTO "StoreBuildEvent"')
      )
      .map((entry) =>
        entry.query.includes('INSERT INTO "StoreRevision"')
          ? "REVISION_INSERT"
          : entry.query.includes('UPDATE "StoreBuildRun"')
            ? "RUN_SUCCESS"
            : String(entry.values[5])
      ),
    [
      "REVISION_INSERT",
      "REVISION_CREATED",
      "RUN_SUCCESS",
      "RUN_SUCCEEDED",
    ]
  );
});

test("preview CAS uses the SQL primitive and appends preview-only audit atomically", async () => {
  const run = initialRun({ phase: "COMPLETED", state: "SUCCEEDED", revisionId: "revision-1", completedAt: "2026-09-03T10:00:05.000Z" });
  let pointerReads = 0;
  const db = new ScriptedPrisma((query) => {
    if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
      return [activePreviewStoreRow(run.storeId)];
    }
    if (query.includes('FROM "StorePreviewRevisionPointer"')) {
      pointerReads += 1;
      return pointerReads === 1
        ? []
        : [
            {
              storeId: run.storeId,
              activePreviewRevisionId: "revision-1",
              contractVersion: PREVIEW_REVISION_POINTER_V1,
              version: 1,
              lastAction: "PROMOTE",
              changedBy: "reviewer@example.test",
              changeReason: "ready",
              updatedAt: new Date("2026-09-03T10:00:06.000Z"),
            },
          ];
    }
    if (query.includes('SELECT "buildRunId" FROM "StoreRevision"')) {
      return [{ buildRunId: run.id }];
    }
    if (query.includes("compareAndSwapStorePreviewRevisionV1")) {
      return [{ swapped: true }];
    }
    if (query.includes('SELECT "phase" FROM "StoreBuildRun"')) {
      return [{ phase: "COMPLETED" }];
    }
    if (query.includes('SELECT "id" FROM "StoreBuildRun"')) {
      return [{ id: run.id }];
    }
    if (query.includes("COALESCE(MAX")) return [{ sequence: 7 }];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  const pointer = await repository.compareAndSwapPreviewPointer({
    storeId: run.storeId,
    targetRevisionId: "revision-1",
    expectedVersion: 0,
    action: "PROMOTE",
    changedBy: "reviewer@example.test",
    reason: "ready",
    changedAt: "2026-09-03T10:00:06.000Z",
  });

  assert.equal(pointer?.version, 1);
  const cas = db.queries.find((entry) =>
    entry.query.includes("compareAndSwapStorePreviewRevisionV1")
  );
  assert.ok(cas);
  assert.deepEqual(cas.values.slice(0, 6), [
    run.storeId,
    0,
    "revision-1",
    "PROMOTE",
    "reviewer@example.test",
    "ready",
  ]);
  const payload = JSON.parse(String(db.executes[0].values[6]));
  assert.equal(payload.scope, "PREVIEW_ONLY");
  assert.equal(payload.liveStatusChanged, false);
  assert.equal(db.executes[0].values[5], "PREVIEW_PROMOTED");
  assert.equal(db.transactions, 1);
  assert.equal(allSql(db).includes('"launchStatus"'), true);
});

test("claim refuses a lifecycle change before inserting a run or event", async () => {
  const run = initialRun();
  const db = new ScriptedPrisma((query) => {
    if (query.includes("LEFT JOIN") && query.includes('run."requestKey" = $2')) {
      return [];
    }
    if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
      return [{ ...activePreviewStoreRow(run.storeId), isActive: false }];
    }
    throw new Error(`Unexpected query after lifecycle refusal: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  await assert.rejects(
    repository.claimBuildRun(run),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "STORE_NOT_PREVIEW_ACTIVE"
  );
  assert.equal(
    db.operations.some((entry) => entry.query.includes('INSERT INTO "StoreBuildRun"')),
    false
  );
  assert.equal(db.executes.length, 0);
});

test("every post-claim write revalidates lifecycle under the Store lock", async () => {
  const request = buildRequest();
  const candidate = storeRevisionCandidateFixtureV1(request);
  const document = createStoreRevisionDocumentV2(
    request,
    candidate,
    runDeterministicStoreRevisionQaV1(request, candidate)
  );
  const run = initialRun({ phase: "PERSISTING_REVISION" });
  const operations: Array<{
    name: string;
    execute(repository: PrismaStoreFactoryV2Repository): Promise<unknown>;
  }> = [
    {
      name: "advance phase",
      execute: (repository) =>
        repository.advanceBuildPhase({
          storeId: run.storeId,
          runId: run.id,
          expectedPhase: "RECEIVED",
          nextPhase: "VALIDATING",
          at: "2026-09-03T10:00:01.000Z",
        }),
    },
    {
      name: "finalize revision",
      execute: (repository) =>
        repository.finalizeBuildRevision({
          id: "revision-1",
          storeId: run.storeId,
          buildRunId: run.id,
          inputDigest: run.inputDigest,
          outputDigest: document.outputDigest,
          document,
          catalogArtifactId: run.catalogArtifactId,
          catalogBindingJson: run.catalogBindingJson,
          parentRevisionId: null,
          parentRevisionOutputDigest: null,
          createdAt: "2026-09-03T10:00:04.000Z",
          completedAt: "2026-09-03T10:00:05.000Z",
        }),
    },
    {
      name: "fail run",
      execute: (repository) =>
        repository.failBuildRun({
          storeId: run.storeId,
          runId: run.id,
          terminalState: "PARTIAL_FAILURE",
          completedAt: "2026-09-03T10:00:05.000Z",
          failureCode: "TEST_FAILURE",
          failureMessage: "Injected failure",
        }),
    },
    {
      name: "review revision",
      execute: (repository) =>
        repository.reviewRevision({
          storeId: run.storeId,
          revisionId: "revision-1",
          expectedStatus: "DRAFT",
          expectedOutputDigest: document.outputDigest,
          nextStatus: "APPROVED",
          reviewedBy: "shared-admin-session",
          reason: "review test",
          reviewedAt: "2026-09-03T10:00:05.000Z",
        }),
    },
    {
      name: "mutate pointer",
      execute: (repository) =>
        repository.compareAndSwapPreviewPointer({
          storeId: run.storeId,
          targetRevisionId: "revision-1",
          expectedVersion: 0,
          action: "PROMOTE",
          changedBy: "shared-admin-session",
          reason: "pointer test",
          changedAt: "2026-09-03T10:00:06.000Z",
        }),
    },
  ];

  for (const operation of operations) {
    const db = new ScriptedPrisma((query) => {
      if (query.includes('FROM "Store"') && query.includes("FOR UPDATE")) {
        return [{ ...activePreviewStoreRow(run.storeId), launchStatus: "LIVE" }];
      }
      throw new Error(`${operation.name} queried after lifecycle refusal: ${query}`);
    });
    const repository = new PrismaStoreFactoryV2Repository(db);
    await assert.rejects(
      operation.execute(repository),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "STORE_NOT_PREVIEW_ACTIVE",
      operation.name
    );
    assert.equal(db.operations.length, 1, operation.name);
    assert.equal(db.executes.length, 0, operation.name);
  }
});

test("claim recomputes canonical request digest and key before opening a transaction", async () => {
  const run = initialRun();
  const changedRequest = {
    ...buildRequest(),
    runtimeCapabilityVersion: "store-factory-runtime.v2.1-tampered",
  };
  const db = new ScriptedPrisma((query) => {
    throw new Error(`No query expected for invalid identity: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  await assert.rejects(
    repository.claimBuildRun({
      ...run,
      requestJson: canonicalJsonV1(changedRequest),
    }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "REPOSITORY_INVARIANT_VIOLATION"
  );
  assert.equal(db.operations.length, 0);
});

test("rehydration rejects requestJson whose canonical digest and key do not match columns", async () => {
  const run = initialRun();
  const changedRequest = {
    ...buildRequest(),
    runtimeCapabilityVersion: "store-factory-runtime.v2.1-tampered",
  };
  const row = {
    ...buildRunRow(run),
    requestJson: canonicalJsonV1(changedRequest),
  };
  const db = new ScriptedPrisma((query) => {
    if (query.includes('WHERE run."id" = $1')) return [row];
    throw new Error(`Unexpected query: ${query}`);
  });
  const repository = new PrismaStoreFactoryV2Repository(db);

  await assert.rejects(
    repository.getBuildRun(run.id),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "REPOSITORY_INVARIANT_VIOLATION"
  );
});

class ScriptedPrisma implements StoreFactoryV2PrismaClient {
  readonly queries: Array<{ query: string; values: unknown[] }> = [];
  readonly executes: Array<{ query: string; values: unknown[] }> = [];
  readonly operations: Array<{ query: string; values: unknown[] }> = [];
  transactions = 0;

  constructor(private readonly respond: (query: string, values: unknown[]) => unknown) {}

  async $transaction<T>(
    callback: (transaction: StoreFactoryV2PrismaTransaction) => Promise<T>
  ): Promise<T> {
    this.transactions += 1;
    return callback(this);
  }

  async $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: unknown[]
  ): Promise<T> {
    this.queries.push({ query, values });
    this.operations.push({ query, values });
    return this.respond(query, values) as T;
  }

  async $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> {
    this.executes.push({ query, values });
    this.operations.push({ query, values });
    return 1;
  }
}

function buildRequest(): StoreBuildRequestV2 {
  return storeFactoryBuildRequestFixtureV2();
}

function initialRun(overrides: Partial<StoreBuildRunV2> = {}): StoreBuildRunV2 {
  const request = buildRequest();
  return {
    contractVersion: STORE_BUILD_RUN_V2,
    id: "build-run-1",
    storeId: request.storeId,
    requestKey: deriveStoreBuildRequestKeyV2(request),
    inputDigest: storeBuildInputDigestV2(request),
    outputDigest: null,
    requestedBy: request.requestedBy,
    requestJson: canonicalJsonV1(request),
    briefJson: canonicalJsonV1(request.brief),
    catalogShapeJson: canonicalJsonV1(request.catalogShape),
    catalogArtifactId: request.catalogBinding.artifactId,
    catalogBindingJson: canonicalJsonV1(request.catalogBinding),
    state: "RUNNING",
    phase: "RECEIVED",
    revisionId: null,
    failureCode: null,
    failureMessage: null,
    startedAt: "2026-09-03T10:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

function buildRunRow(run: StoreBuildRunV2) {
  return {
    id: run.id,
    storeId: run.storeId,
    contractVersion: run.contractVersion,
    requestKey: run.requestKey,
    inputDigest: run.inputDigest,
    outputDigest: run.outputDigest,
    requestedBy: run.requestedBy,
    requestJson: run.requestJson,
    status: run.state,
    phase: run.phase,
    briefJson: run.briefJson,
    catalogShapeJson: run.catalogShapeJson,
    catalogArtifactId: run.catalogArtifactId,
    catalogBindingJson: run.catalogBindingJson,
    revisionId: run.revisionId,
    revisionOutputDigest: run.revisionId ? run.outputDigest : null,
    failureCode: run.failureCode,
    failureMessage: run.failureMessage,
    startedAt: new Date(run.startedAt),
    completedAt: run.completedAt ? new Date(run.completedAt) : null,
  };
}

function activePreviewStoreRow(storeId: string) {
  return {
    id: storeId,
    launchStatus: "PREVIEW",
    isActive: true,
  };
}

function allSql(db: ScriptedPrisma): string {
  return [...db.queries, ...db.executes].map((entry) => entry.query).join("\n");
}
