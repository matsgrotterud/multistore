import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogFixturePersistencePlanV2,
  buildCatalogProjectionV2,
  droneCatalogFixtureV2,
} from "@/lib/catalog-v2";
import type { StoreFactoryV2SchemaReport } from "@/lib/db/store-factory-v2-schema";
import {
  CATALOG_BINDING_V1,
  PREVIEW_REVISION_POINTER_V1,
  STORE_BUILD_EVENT_V1,
  STORE_BUILD_REQUEST_V2,
  STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
  STORE_REVISION_V2,
  createStoreRevisionDocumentV2,
  digestCanonicalArtifactV1,
  type PreviewRevisionPointerV1,
  type StoreBuildRequestV2,
  type StoreFactoryV2Repository,
  type StoreRevisionV2,
} from "@/lib/store-factory-v2";
import { runDeterministicStoreRevisionQaV1 } from "@/lib/store-factory-v2/qa";
import {
  storeFactoryBuildRequestFixtureV1,
  storeRevisionCandidateFixtureV1,
} from "@/lib/store-factory-v2/test-fixtures";
import {
  StoreFactoryV2AdminPointerInputSchema,
  StoreFactoryV2AdminReviewInputSchema,
  StoreFactoryV2AdminRuntimeError,
  executeStoreFactoryV2AdminPointerMutation,
  executeStoreFactoryV2AdminReview,
  isStoreFactoryV2SameOriginMutation,
  loadPersistedStoreFactoryWorkspaceV2,
  parseStoreFactoryV2PilotStoreIds,
} from "./store-factory-v2-runtime";

const completeSchema: StoreFactoryV2SchemaReport = {
  version: "universal-store-factory.v2.1",
  status: "COMPLETE",
  expected: 1,
  satisfied: 1,
  missing: [],
  incompatible: [],
  persistenceEnabled: true,
};
const pilotStoreIds = new Set(["store-1"]);

test("review and pointer commands have separate concurrency bindings", () => {
  const review = reviewInput();
  assert.equal(StoreFactoryV2AdminReviewInputSchema.safeParse(review).success, true);
  assert.equal(
    StoreFactoryV2AdminReviewInputSchema.safeParse({
      ...review,
      expectedOutputDigest: undefined,
    }).success,
    false
  );
  assert.equal(
    StoreFactoryV2AdminPointerInputSchema.safeParse(pointerInput()).success,
    true
  );
  assert.equal(
    StoreFactoryV2AdminPointerInputSchema.safeParse({
      ...pointerInput(),
      expectedPointerVersion: Number.NaN,
    }).success,
    false
  );
});

test("pilot allowlist is empty by default and rejects malformed or duplicate ids", () => {
  assert.equal(parseStoreFactoryV2PilotStoreIds(undefined).size, 0);
  assert.deepEqual(
    [...parseStoreFactoryV2PilotStoreIds("store-1,store-2")],
    ["store-1", "store-2"]
  );
  assert.throws(() => parseStoreFactoryV2PilotStoreIds("store-1,store-1"));
  assert.throws(() => parseStoreFactoryV2PilotStoreIds("store-1, bad id"));
});

test("Store Factory same-origin policy compares canonical scheme and host", () => {
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "http://localhost:3010",
      host: "LOCALHOST:3010",
      secFetchSite: "same-origin",
    }),
    true
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "https://localhost:3010",
      host: "localhost:3010",
      secFetchSite: "same-origin",
    }),
    false
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "http://localhost:3010",
      host: "localhost:3010",
      secFetchSite: null,
    }),
    false
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "http://localhost:3010/path",
      host: "localhost:3010",
      secFetchSite: "same-origin",
    }),
    false
  );
});

test("forwarded origin is accepted only with an explicit single trusted pair", () => {
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "https://admin.example.test",
      host: "internal:3000",
      forwardedHost: "admin.example.test",
      forwardedProto: "https",
      secFetchSite: "same-origin",
      trustForwardedHeaders: true,
    }),
    true
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "https://evil.example.test",
      host: "internal:3000",
      forwardedHost: "admin.example.test",
      forwardedProto: "https",
      secFetchSite: "same-origin",
      trustForwardedHeaders: true,
    }),
    false
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "https://admin.example.test",
      host: "internal:3000",
      forwardedHost: "admin.example.test, evil.example.test",
      forwardedProto: "https",
      secFetchSite: "same-origin",
      trustForwardedHeaders: true,
    }),
    false
  );
  assert.equal(
    isStoreFactoryV2SameOriginMutation({
      origin: "https://admin.example.test",
      host: "admin.example.test",
      forwardedHost: "admin.example.test",
      forwardedProto: "https",
      secFetchSite: "same-origin",
    }),
    false
  );
});

test("disabled feature and non-pilot stores fail before persistence access", async () => {
  let reads = 0;
  const repository = fakeRepository({
    getRevision: async () => {
      reads += 1;
      return null;
    },
  });
  await assert.rejects(
    executeStoreFactoryV2AdminReview(reviewInput(), {
      schema: completeSchema,
      featureEnabled: false,
      pilotStoreIds,
      repository,
      findStore: async () => {
        reads += 1;
        return activePreviewStore();
      },
    }),
    hasCode("FEATURE_DISABLED")
  );
  assert.equal(reads, 0);

  await assert.rejects(
    executeStoreFactoryV2AdminReview(reviewInput(), {
      schema: completeSchema,
      featureEnabled: true,
      pilotStoreIds: new Set(),
      repository,
      findStore: async () => activePreviewStore(),
    }),
    hasCode("PILOT_STORE_NOT_ALLOWED")
  );
  assert.equal(reads, 0);
});

test("persisted reader rejects inactive and non-PREVIEW stores before repository reads", async () => {
  let reads = 0;
  await assert.rejects(
    loadPersistedStoreFactoryWorkspaceV2(
      workspaceInput({ isActive: false }),
      {
        featureEnabled: true,
        schema: completeSchema,
        pilotStoreIds,
        db: emptyDb(() => {
          reads += 1;
        }),
        repository: fakeRepository({
          getPreviewPointer: async () => {
            reads += 1;
            return pointerFixture();
          },
        }),
      }
    ),
    hasCode("STORE_NOT_PREVIEW_ACTIVE")
  );
  assert.equal(reads, 0);
});

test("active pointer is loaded first and an unresolved target never falls back to latest", async () => {
  const calls: string[] = [];
  const revision = revisionFixture();
  await assert.rejects(
    loadPersistedStoreFactoryWorkspaceV2(workspaceInput(), {
      featureEnabled: true,
      schema: completeSchema,
      pilotStoreIds,
      repository: fakeRepository({
        getPreviewPointer: async () => {
          calls.push("pointer");
          return pointerFixture({ activeRevisionId: "revision-missing" });
        },
      }),
      db: {
        async $queryRawUnsafe<T>(sql: string): Promise<T> {
          calls.push(sql.includes('AND "id" = $2') ? "exact" : "history");
          return (sql.includes('AND "id" = $2') ? [] : [revisionRow(revision)]) as T;
        },
      },
    }),
    hasCode("ACTIVE_POINTER_INVALID")
  );
  assert.deepEqual(calls, ["pointer", "exact"]);
});

test("explicit revision remains available while the pointer is read first", async () => {
  const activeRevision = revisionFixture({
    id: "revision-active",
    status: "APPROVED",
  });
  const revision = revisionFixture({
    id: "revision-2",
    revisionNumber: 2,
    parentRevisionId: activeRevision.id,
  });
  const calls: string[] = [];
  const result = await loadPersistedStoreFactoryWorkspaceV2(
    workspaceInput({ requestedRevisionId: revision.id }),
    loadedDependencies(revision, calls, {
      pointer: pointerFixture({ activeRevisionId: activeRevision.id }),
      activeRevision,
    })
  );
  assert.equal(result.status, "LOADED");
  assert.equal(calls[0], "pointer");
  if (result.status === "LOADED") {
    assert.equal(result.workspace.selectedRevision.id, revision.id);
    assert.equal(
      result.workspace.revisions.find((entry) => entry.id === activeRevision.id)
        ?.activePreview,
      true
    );
  }
});

test("explicit selection cannot bypass a DRAFT active pointer target", async () => {
  const activeRevision = revisionFixture({ id: "revision-active-draft" });
  const selected = revisionFixture({ id: "revision-selected", revisionNumber: 2 });
  await assert.rejects(
    loadPersistedStoreFactoryWorkspaceV2(
      workspaceInput({ requestedRevisionId: selected.id }),
      loadedDependencies(selected, [], {
        pointer: pointerFixture({ activeRevisionId: activeRevision.id }),
        activeRevision,
      })
    ),
    hasCode("ACTIVE_POINTER_INVALID")
  );
});

test("explicit selection cannot bypass malformed active catalog binding", async () => {
  const validActive = revisionFixture({
    id: "revision-active-malformed",
    status: "APPROVED",
  });
  const malformedActive: StoreRevisionV2 = {
    ...validActive,
    catalogBinding: {
      ...validActive.catalogBinding,
      artifactDigest: `sha256:${"0".repeat(64)}`,
    },
  };
  const selected = revisionFixture({ id: "revision-selected", revisionNumber: 2 });
  await assert.rejects(
    loadPersistedStoreFactoryWorkspaceV2(
      workspaceInput({ requestedRevisionId: selected.id }),
      loadedDependencies(selected, [], {
        pointer: pointerFixture({ activeRevisionId: malformedActive.id }),
        activeRevision: malformedActive,
      })
    ),
    hasCode("ACTIVE_POINTER_INVALID")
  );
});

test("workspace re-reads the bound artifact and exposes store-wide audit history", async () => {
  const revision = revisionFixture();
  const calls: string[] = [];
  const result = await loadPersistedStoreFactoryWorkspaceV2(
    workspaceInput({ requestedRevisionId: revision.id }),
    loadedDependencies(revision, calls)
  );
  assert.equal(result.status, "LOADED");
  if (result.status !== "LOADED") return;
  assert.equal(result.workspace.renderDocument.revisionId, revision.id);
  assert.equal(result.workspace.events[0]?.buildRunId, "build-run-other");
  assert.equal(result.workspace.events[0]?.type, "RUN_SUCCEEDED");
  assert.ok(calls.includes("artifact"));
  assert.ok(calls.includes("store-events"));
});

test("workspace enables REFINED only from the server-validated active approved BASELINE", async () => {
  const activeBaseline = revisionFixture({
    id: "revision-active-baseline",
    status: "APPROVED",
  });
  const baselineResult = await loadPersistedStoreFactoryWorkspaceV2(
    workspaceInput({ requestedRevisionId: activeBaseline.id }),
    loadedDependencies(activeBaseline, [], {
      pointer: pointerFixture({ activeRevisionId: activeBaseline.id }),
      activeRevision: activeBaseline,
    })
  );
  assert.equal(baselineResult.status, "LOADED");
  if (baselineResult.status !== "LOADED") return;
  assert.equal(baselineResult.workspace.build.fixtureKey, "drones");
  assert.equal(
    baselineResult.workspace.build.activeExperienceVariant,
    "BASELINE"
  );
  assert.equal(baselineResult.workspace.build.activeRevisionStatus, "APPROVED");
  assert.equal(baselineResult.workspace.build.canCreateBaseline, true);
  assert.equal(baselineResult.workspace.build.canCreateRefined, true);
  assert.equal(
    baselineResult.workspace.build.refinedEligibilityReason,
    "ACTIVE_APPROVED_BASELINE"
  );

  const selectedBaseline = revisionFixture({
    id: "revision-selected-baseline",
    status: "APPROVED",
  });
  const activeRefined = revisionFixture(
    {
      id: "revision-active-refined",
      revisionNumber: 2,
      status: "APPROVED",
    },
    "REFINED",
    {
      revisionId: selectedBaseline.id,
      outputDigest: selectedBaseline.outputDigest,
    }
  );
  const refinedResult = await loadPersistedStoreFactoryWorkspaceV2(
    workspaceInput({ requestedRevisionId: selectedBaseline.id }),
    loadedDependencies(selectedBaseline, [], {
      pointer: pointerFixture({ activeRevisionId: activeRefined.id, version: 2 }),
      activeRevision: activeRefined,
    })
  );
  assert.equal(refinedResult.status, "LOADED");
  if (refinedResult.status !== "LOADED") return;
  assert.equal(
    refinedResult.workspace.build.activeExperienceVariant,
    "REFINED"
  );
  assert.equal(refinedResult.workspace.build.activeRevisionStatus, "APPROVED");
  assert.equal(refinedResult.workspace.build.canCreateRefined, false);
  assert.equal(
    refinedResult.workspace.build.refinedEligibilityReason,
    "ACTIVE_NOT_BASELINE"
  );
});

test("workspace rejects a catalog artifact whose digest no longer matches", async () => {
  const revision = revisionFixture();
  const dependencies = loadedDependencies(revision, [], { tamperArtifact: true });
  await assert.rejects(
    loadPersistedStoreFactoryWorkspaceV2(
      workspaceInput({ requestedRevisionId: revision.id }),
      dependencies
    ),
    hasCode("REVISION_RUNTIME_INVALID")
  );
});

test("review binds DRAFT and the submitted immutable output digest", async () => {
  const revision = revisionFixture();
  let reviews = 0;
  const dependencies = mutationDependencies(
    fakeRepository({
      getRevision: async () => revision,
      reviewRevision: async (input) => {
        reviews += 1;
        assert.equal(input.expectedStatus, "DRAFT");
        assert.equal(input.expectedOutputDigest, revision.outputDigest);
        return { ...revision, status: "APPROVED" };
      },
    })
  );
  const result = await executeStoreFactoryV2AdminReview(reviewInput(), dependencies);
  assert.equal(result.intent, "APPROVE");
  assert.equal(reviews, 1);

  await assert.rejects(
    executeStoreFactoryV2AdminReview(
      { ...reviewInput(), expectedOutputDigest: "0".repeat(64) },
      dependencies
    ),
    hasCode("REVISION_STATE_CONFLICT")
  );
  assert.equal(reviews, 1);
});

test("pointer mutation alone binds the expected pointer version", async () => {
  const revision = revisionFixture({ status: "APPROVED" });
  let swaps = 0;
  const repository = fakeRepository({
    getRevision: async () => revision,
    getPreviewPointer: async () => pointerFixture({ version: 2 }),
    compareAndSwapPreviewPointer: async (input) => {
      swaps += 1;
      assert.equal(input.expectedVersion, 2);
      return pointerFixture({ activeRevisionId: revision.id, version: 3 });
    },
  });
  const result = await executeStoreFactoryV2AdminPointerMutation(
    { ...pointerInput(), expectedPointerVersion: 2 },
    mutationDependencies(repository)
  );
  assert.equal(result.pointerVersion, 3);
  assert.equal(swaps, 1);

  await assert.rejects(
    executeStoreFactoryV2AdminPointerMutation(
      { ...pointerInput(), expectedPointerVersion: 1 },
      mutationDependencies(repository)
    ),
    hasCode("POINTER_VERSION_CONFLICT")
  );
  assert.equal(swaps, 1);
});

function workspaceInput(
  overrides: Partial<Parameters<typeof loadPersistedStoreFactoryWorkspaceV2>[0]> = {}
) {
  return {
    storeId: "store-1",
    storeSlug: "flight-atlas",
    storeName: "Flight Atlas",
    niche: "Camera drones",
    launchStatus: "PREVIEW",
    isActive: true,
    ...overrides,
  };
}

function activePreviewStore() {
  return {
    id: "store-1",
    slug: "flight-atlas",
    launchStatus: "PREVIEW",
    isActive: true,
  };
}

function mutationDependencies(repository: StoreFactoryV2Repository) {
  return {
    schema: completeSchema,
    featureEnabled: true,
    pilotStoreIds,
    repository,
    findStore: async () => activePreviewStore(),
  };
}

function reviewInput() {
  return {
    intent: "APPROVE" as const,
    storeId: "store-1",
    storeSlug: "flight-atlas",
    revisionId: "revision-1",
    expectedOutputDigest: revisionFixture().outputDigest,
    reason: "Ready for internal review",
  };
}

function pointerInput() {
  return {
    intent: "PROMOTE" as const,
    storeId: "store-1",
    storeSlug: "flight-atlas",
    revisionId: "revision-1",
    expectedPointerVersion: 0,
    reason: "Promote verified preview",
  };
}

function revisionFixture(
  overrides: Partial<StoreRevisionV2> = {},
  experienceVariant: "BASELINE" | "REFINED" = "BASELINE",
  baseRevision?: StoreBuildRequestV2["baseRevision"]
): StoreRevisionV2 {
  const legacy = storeFactoryBuildRequestFixtureV1();
  const plan = buildCatalogFixturePersistencePlanV2({
    storeId: "store-1",
    fixture: droneCatalogFixtureV2,
  });
  const projected = buildCatalogProjectionV2(droneCatalogFixtureV2);
  if (plan.status !== "READY" || projected.status !== "PROJECTED") {
    throw new Error("Reference fixture setup failed.");
  }
  const artifact = plan.plan.rows.artifacts[0];
  const request: StoreBuildRequestV2 = {
    version: STORE_BUILD_REQUEST_V2,
    storeId: "store-1",
    requestedBy: "shared-admin-session",
    brief: legacy.brief,
    catalogShape: {
      ...legacy.catalogShape,
      productClass: "reference.drones",
    },
    catalogBinding: {
      version: CATALOG_BINDING_V1,
      artifactId: artifact.id,
      artifactDigest: artifact.contentDigest,
      artifactContractVersion: artifact.contractVersion,
      projectionRef: projected.projection.projectionRef,
      projectionDigest: digestCanonicalArtifactV1(projected.projection),
      projectionContractVersion: projected.projection.version,
      sourceKind: "REFERENCE_FIXTURE",
    },
    baseRevision:
      experienceVariant === "REFINED"
        ? baseRevision ?? {
            revisionId: "revision-base",
            outputDigest: "a".repeat(64),
          }
        : null,
    experienceVariant,
    runtimeCapabilityVersion: STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
  };
  const candidate = storeRevisionCandidateFixtureV1(request);
  const document = createStoreRevisionDocumentV2(
    request,
    candidate,
    runDeterministicStoreRevisionQaV1(request, candidate)
  );
  return {
    contractVersion: STORE_REVISION_V2,
    id: "revision-1",
    storeId: "store-1",
    buildRunId: "build-run-1",
    catalogArtifactId: artifact.id,
    catalogBinding: request.catalogBinding,
    revisionNumber: 1,
    parentRevisionId: request.baseRevision?.revisionId ?? null,
    inputDigest: document.inputDigest,
    outputDigest: document.outputDigest,
    status: "DRAFT",
    document,
    createdAt: "2026-09-03T10:00:00.000Z",
    reviewedAt: null,
    reviewedBy: null,
    reviewReason: null,
    ...overrides,
  };
}

function revisionRow(revision: StoreRevisionV2) {
  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    parentRevisionId: revision.parentRevisionId,
    buildRunId: revision.buildRunId,
    outputDigest: revision.outputDigest,
    status: revision.status,
    createdAt: new Date(revision.createdAt),
    reviewedAt: revision.reviewedAt,
    reviewedBy: revision.reviewedBy,
    reviewReason: revision.reviewReason,
  };
}

function loadedDependencies(
  revision: StoreRevisionV2,
  calls: string[],
  options: {
    pointer?: PreviewRevisionPointerV1;
    tamperArtifact?: boolean;
    activeRevision?: StoreRevisionV2;
  } = {}
) {
  const plan = buildCatalogFixturePersistencePlanV2({
    storeId: revision.storeId,
    fixture: droneCatalogFixtureV2,
  });
  if (plan.status !== "READY") throw new Error("Fixture plan failed.");
  const artifact = plan.plan.rows.artifacts[0];
  return {
    featureEnabled: true,
    schema: completeSchema,
    pilotStoreIds,
    repository: fakeRepository({
      getPreviewPointer: async () => {
        calls.push("pointer");
        return options.pointer ?? pointerFixture();
      },
      getRevision: async (id) =>
        id === revision.id
          ? revision
          : id === options.activeRevision?.id
            ? options.activeRevision
            : null,
      listStoreBuildEvents: async () => {
        calls.push("store-events");
        return [
          {
            contractVersion: STORE_BUILD_EVENT_V1,
            id: "event-other",
            buildRunId: "build-run-other",
            sequence: 1,
            phase: "COMPLETED",
            type: "RUN_SUCCEEDED",
            payload: {},
            createdAt: "2026-09-03T10:01:00.000Z",
          },
        ];
      },
    }),
    db: {
      async $queryRawUnsafe<T>(sql: string, ...values: unknown[]): Promise<T> {
        if (sql.includes('FROM "CatalogArtifactV2"')) {
          calls.push("artifact");
          return [
            {
              id: artifact.id,
              sourceKind: artifact.sourceKind,
              contractVersion: artifact.contractVersion,
              artifactJson: options.tamperArtifact
                ? JSON.stringify({ ...droneCatalogFixtureV2, fixtureId: "tampered" })
                : artifact.artifactJson,
              contentDigest: artifact.contentDigest,
            },
          ] as T;
        }
        calls.push(sql.includes('AND "id" = $2') ? "exact" : "history");
        if (sql.includes('AND "id" = $2')) {
          const exact =
            values[1] === revision.id
              ? revision
              : values[1] === options.activeRevision?.id
                ? options.activeRevision
                : null;
          return (exact ? [revisionRow(exact)] : []) as T;
        }
        return [revisionRow(revision)] as T;
      },
    },
  };
}

function pointerFixture(
  overrides: Partial<PreviewRevisionPointerV1> = {}
): PreviewRevisionPointerV1 {
  return {
    contractVersion: PREVIEW_REVISION_POINTER_V1,
    storeId: "store-1",
    activeRevisionId: null,
    version: 0,
    lastAction: "NONE",
    changedBy: null,
    changeReason: null,
    updatedAt: null,
    ...overrides,
  };
}

function fakeRepository(
  overrides: Partial<StoreFactoryV2Repository> = {}
): StoreFactoryV2Repository {
  const unsupported = async (): Promise<never> => {
    throw new Error("Unexpected repository call");
  };
  return {
    claimBuildRun: unsupported,
    findBuildRunByRequestKey: unsupported,
    getBuildRun: unsupported,
    advanceBuildPhase: unsupported,
    finalizeBuildRevision: unsupported,
    failBuildRun: unsupported,
    getRevision: async () => revisionFixture(),
    reviewRevision: unsupported,
    getPreviewPointer: async () => pointerFixture(),
    compareAndSwapPreviewPointer: unsupported,
    listBuildEvents: async () => [],
    listStoreBuildEvents: async () => [],
    ...overrides,
  } as StoreFactoryV2Repository;
}

function emptyDb(onRead: () => void) {
  return {
    async $queryRawUnsafe<T>(): Promise<T> {
      onRead();
      return [] as T;
    },
  };
}

function hasCode(code: string) {
  return (error: unknown) =>
    error instanceof StoreFactoryV2AdminRuntimeError && error.code === code;
}
