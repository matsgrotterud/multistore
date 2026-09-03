import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogProjectionV2,
  droneCatalogFixtureV2,
} from "@/lib/catalog-v2";
import {
  PREVIEW_POINTER_MUTATION_V1,
  REVISION_REVIEW_REQUEST_V2,
  STORE_BUILD_RUN_V2,
  StoreRevisionDocumentV2Schema,
  CatalogShapeV1Schema,
  canonicalJsonV1,
  createStoreRevisionDocumentV2,
  deriveStoreBuildRequestKeyV2,
  deterministicStoreFactoryIdV1,
  storeRevisionDocumentBodyV2,
  storeRevisionOutputDigestV2,
  storeBuildInputDigestV2,
  type StoreBuildRequestV2,
} from "./contracts";
import { StoreFactoryV2Error } from "./errors";
import { InMemoryStoreFactoryV2Repository } from "./in-memory-repository";
import { StoreFactoryV2Service } from "./service";
import { runDeterministicStoreRevisionQaV1 } from "./qa";
import {
  storeFactoryBuildRequestFixtureV2,
  storeRevisionCandidateFixtureV1,
} from "./test-fixtures";

test("versioned contracts normalize input and create a stable digest", () => {
  const parsed = buildRequest("request-contract-1");
  const reordered = {
    runtimeCapabilityVersion: parsed.runtimeCapabilityVersion,
    experienceVariant: parsed.experienceVariant,
    baseRevision: parsed.baseRevision,
    catalogBinding: parsed.catalogBinding,
    catalogShape: parsed.catalogShape,
    brief: parsed.brief,
    requestedBy: parsed.requestedBy,
    storeId: parsed.storeId,
    version: parsed.version,
  };

  assert.match(storeBuildInputDigestV2(parsed), /^[0-9a-f]{64}$/);
  assert.equal(
    storeBuildInputDigestV2(parsed),
    storeBuildInputDigestV2(reordered as StoreBuildRequestV2)
  );
  assert.throws(() =>
    CatalogShapeV1Schema.parse({
      ...parsed.catalogShape,
      targetProductCount: 9,
    })
  );
});

test("service fails closed when no revision assembler is injected", () => {
  assert.throws(
    () =>
      new StoreFactoryV2Service({
        repository: new InMemoryStoreFactoryV2Repository(),
        assembler: undefined as never,
      }),
    (error: unknown) => {
      assert.ok(error instanceof StoreFactoryV2Error);
      assert.equal(error.code, "REVISION_ASSEMBLER_REQUIRED");
      return true;
    }
  );
});

test("same canonical V2 request replays one terminal build without duplicate events", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const service = serviceFor(repository);
  const request = buildRequest("request-replay-1");

  const first = await service.buildRevision(request);
  const eventCount = (await repository.listBuildEvents(first.run.id)).length;
  const firstEvents = await repository.listBuildEvents(first.run.id);
  const replay = await service.buildRevision(structuredClone(request));

  assert.equal(first.replayed, false);
  assert.equal(first.run.state, "SUCCEEDED");
  assert.equal(first.run.phase, "COMPLETED");
  assert.match(first.run.outputDigest ?? "", /^[0-9a-f]{64}$/);
  assert.equal(first.revision?.status, "DRAFT");
  assert.equal(first.revision?.outputDigest, first.run.outputDigest);
  assert.equal(first.revision?.document.outputDigest, first.run.outputDigest);
  assert.equal(first.revision?.document.qaReport.status, "PASS");
  assert.equal(first.revision?.document.qaReport.checks.length, 8);
  assert.equal(first.revision?.document.activation.scope, "PREVIEW_ONLY");
  assert.deepEqual(
    firstEvents.slice(-2).map((event) => event.type),
    ["REVISION_CREATED", "RUN_SUCCEEDED"]
  );
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.run, first.run);
  assert.deepEqual(replay.revision, first.revision);
  assert.equal(
    (await repository.listBuildEvents(first.run.id)).length,
    eventCount
  );

  const changed = await service.buildRevision({
    ...request,
    brief: { ...request.brief, positioning: "Different approved input" },
  });
  assert.equal(changed.replayed, false);
  assert.notEqual(changed.run.id, first.run.id);
});

test("an existing RUNNING claim replays fail-closed without duplicate assembler work", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const request = buildRequest("request-running-replay-1");
  const inputDigest = storeBuildInputDigestV2(request);
  const requestKey = deriveStoreBuildRequestKeyV2(request);
  const runId = deterministicStoreFactoryIdV1(
    "sbr",
    request.storeId,
    requestKey
  );
  await repository.claimBuildRun({
    contractVersion: STORE_BUILD_RUN_V2,
    id: runId,
    storeId: request.storeId,
    requestKey,
    inputDigest,
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
  });
  let assemblerCalls = 0;
  const service = new StoreFactoryV2Service({
    repository,
    clock: deterministicClock(),
    assembler: {
      assemble: ({ request: claimedRequest }) => {
        assemblerCalls += 1;
        return storeRevisionCandidateFixtureV1(claimedRequest);
      },
    },
  });

  const replay = await service.buildRevision(request);

  assert.equal(replay.replayed, true);
  assert.equal(replay.run.state, "RUNNING");
  assert.equal(replay.run.phase, "RECEIVED");
  assert.equal(replay.revision, null);
  assert.equal(assemblerCalls, 0);
  assert.deepEqual(
    (await repository.listBuildEvents(runId)).map((event) => event.type),
    ["RUN_STARTED"]
  );
});

test("finalization fault leaves no partial revision or success event", async () => {
  let finalizeAttempts = 0;
  const repository = new InMemoryStoreFactoryV2Repository({
    beforeFinalizeCommit: () => {
      finalizeAttempts += 1;
      throw new Error("injected atomic finalization failure");
    },
  });
  const service = serviceFor(repository);
  const request = buildRequest("request-finalize-fault-1");
  const candidate = storeRevisionCandidateFixtureV1(request);
  const document = createStoreRevisionDocumentV2(
    request,
    candidate,
    runDeterministicStoreRevisionQaV1(request, candidate)
  );

  const failed = await service.buildRevision(request);
  const expectedRevisionId = deterministicStoreFactoryIdV1(
    "srv",
    failed.run.id,
    failed.run.inputDigest,
    document.outputDigest
  );
  const events = await repository.listBuildEvents(failed.run.id);

  assert.equal(finalizeAttempts, 1);
  assert.equal(failed.run.state, "PARTIAL_FAILURE");
  assert.equal(failed.run.phase, "PERSISTING_REVISION");
  assert.equal(failed.run.outputDigest, null);
  assert.equal(failed.run.revisionId, null);
  assert.equal(failed.revision, null);
  assert.equal(await repository.getRevision(expectedRevisionId), null);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      "RUN_STARTED",
      "PHASE_ENTERED",
      "PHASE_ENTERED",
      "PHASE_ENTERED",
      "RUN_FAILED",
    ]
  );
});

test("two concurrent preview promotions with one CAS version produce one winner", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const service = serviceFor(repository);
  const first = await buildAndApprove(service, "request-cas-1", "First");
  const second = await buildAndApprove(service, "request-cas-2", "Second");

  const changes = await Promise.allSettled([
    service.promotePreviewRevision(pointerRequest(first.id, 0, "promote first")),
    service.promotePreviewRevision(pointerRequest(second.id, 0, "promote second")),
  ]);

  assert.equal(
    changes.filter((change) => change.status === "fulfilled").length,
    1
  );
  const rejected = changes.find(
    (change): change is PromiseRejectedResult => change.status === "rejected"
  );
  assert.ok(rejected?.reason instanceof StoreFactoryV2Error);
  assert.equal(rejected.reason.code, "PREVIEW_POINTER_CONFLICT");

  const pointer = await repository.getPreviewPointer("store-1");
  assert.equal(pointer.version, 1);
  assert.ok([first.id, second.id].includes(pointer.activeRevisionId ?? ""));
  const success = changes.find(
    (change): change is PromiseFulfilledResult<Awaited<ReturnType<typeof service.promotePreviewRevision>>> =>
      change.status === "fulfilled"
  );
  assert.equal(success?.value.scope, "PREVIEW_ONLY");
  assert.equal(success?.value.liveStatusChanged, false);

  const staleTarget = pointer.activeRevisionId === first.id ? second.id : first.id;
  await assertStoreFactoryError(
    service.promotePreviewRevision(
      pointerRequest(staleTarget, 0, "stale retry")
    ),
    "PREVIEW_POINTER_CONFLICT"
  );
});

test("rollback CAS points preview to an older approved revision and never implies LIVE", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const service = serviceFor(repository);
  const first = await buildAndApprove(service, "request-rollback-1", "First");
  const firstPromotion = await service.promotePreviewRevision(
    pointerRequest(first.id, 0, "first preview")
  );
  const second = await buildAndApprove(
    service,
    "request-rollback-2",
    "Second",
    { revisionId: first.id, outputDigest: first.outputDigest }
  );
  assert.equal(second.parentRevisionId, first.id);
  const secondPromotion = await service.promotePreviewRevision(
    pointerRequest(
      second.id,
      firstPromotion.pointer.version,
      "second preview"
    )
  );
  const refinedOnRefined = storeFactoryBuildRequestFixtureV2({
    requestedBy: "refined-chain",
    experienceVariant: "REFINED",
    baseRevision: {
      revisionId: second.id,
      outputDigest: second.outputDigest,
    },
  });
  await assertStoreFactoryError(
    service.buildRevision(refinedOnRefined),
    "BASE_REVISION_INVALID"
  );
  await assertStoreFactoryError(
    service.promotePreviewRevision(
      pointerRequest(first.id, secondPromotion.pointer.version, "not newer")
    ),
    "PREVIEW_PROMOTION_TARGET_INVALID"
  );

  const rollback = await service.rollbackPreviewRevision(
    pointerRequest(first.id, secondPromotion.pointer.version, "known good")
  );

  assert.equal(rollback.pointer.activeRevisionId, first.id);
  assert.equal(rollback.pointer.version, 3);
  assert.equal(rollback.pointer.lastAction, "ROLLBACK");
  assert.equal(rollback.scope, "PREVIEW_ONLY");
  assert.equal(rollback.liveStatusChanged, false);
  await assertStoreFactoryError(
    service.rollbackPreviewRevision(
      pointerRequest(second.id, rollback.pointer.version, "not older")
    ),
    "PREVIEW_ROLLBACK_TARGET_INVALID"
  );
});

test("review binds the exact immutable output digest and store audit spans runs", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const service = serviceFor(repository);
  const first = await service.buildRevision(buildRequest("audit-run-1"));
  const second = await service.buildRevision(buildRequest("audit-run-2"));
  assert.ok(first.revision);
  assert.ok(second.revision);

  await assertStoreFactoryError(
    service.approveRevision({
      ...reviewRequest(first.revision.id, first.revision.outputDigest, "approve"),
      expectedOutputDigest: "0".repeat(64),
    }),
    "REVISION_STATUS_CONFLICT"
  );
  await service.approveRevision(
    reviewRequest(first.revision.id, first.revision.outputDigest, "approve")
  );

  const audit = await repository.listStoreBuildEvents("store-1");
  assert.ok(audit.some((event) => event.buildRunId === first.run.id));
  assert.ok(audit.some((event) => event.buildRunId === second.run.id));
  assert.equal(
    audit.every(
      (event, index) =>
        index === 0 || audit[index - 1].createdAt <= event.createdAt
    ),
    true
  );
});

test("rejected revisions cannot be promoted", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const service = serviceFor(repository);
  const build = await service.buildRevision(buildRequest("request-reject-1"));
  assert.ok(build.revision);
  const rejected = await service.rejectRevision(
    reviewRequest(
      build.revision.id,
      build.revision.outputDigest,
      "catalog evidence incomplete"
    )
  );

  assert.equal(rejected.revision.status, "REJECTED");
  assert.equal(rejected.scope, "PREVIEW_ONLY");
  assert.equal(rejected.liveStatusChanged, false);
  await assertStoreFactoryError(
    service.promotePreviewRevision(
      pointerRequest(build.revision.id, 0, "should fail")
    ),
    "PREVIEW_REVISION_NOT_APPROVED"
  );
});

test("a mid-build failure is terminal, preserves prior events, and replays without rerunning", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  let assemblerCalls = 0;
  const service = new StoreFactoryV2Service({
    repository,
    clock: deterministicClock(),
    assembler: {
      assemble: () => {
        assemblerCalls += 1;
        throw new Error("deterministic assembly failure");
      },
    },
  });
  const request = buildRequest("request-partial-1");

  const failed = await service.buildRevision(request);
  const events = await repository.listBuildEvents(failed.run.id);
  const replay = await service.buildRevision(request);

  assert.equal(failed.run.state, "PARTIAL_FAILURE");
  assert.equal(failed.run.phase, "ASSEMBLING_REVISION");
  assert.equal(failed.run.failureCode, "BUILD_PHASE_FAILED");
  assert.equal(failed.run.outputDigest, null);
  assert.equal(failed.revision, null);
  assert.deepEqual(
    events.map((event) => event.type),
    ["RUN_STARTED", "PHASE_ENTERED", "PHASE_ENTERED", "RUN_FAILED"]
  );
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.run, failed.run);
  assert.equal(assemblerCalls, 1);
  assert.equal(
    (await repository.listBuildEvents(failed.run.id)).length,
    events.length
  );
});

test("complete revision output is deterministic and tamper evident", async () => {
  const firstRepository = new InMemoryStoreFactoryV2Repository();
  const secondRepository = new InMemoryStoreFactoryV2Repository();
  const request = buildRequest("request-digest-1");
  const first = await serviceFor(firstRepository).buildRevision(request);
  const second = await serviceFor(secondRepository).buildRevision(request);

  assert.ok(first.revision);
  assert.ok(second.revision);
  assert.equal(first.revision.outputDigest, second.revision.outputDigest);
  assert.equal(
    first.revision.outputDigest,
    storeRevisionOutputDigestV2(
      storeRevisionDocumentBodyV2(first.revision.document)
    )
  );
  assert.equal(
    first.revision.document.contractVersions.catalogProjection,
    "catalog-projection.v2"
  );
  assert.equal(
    first.revision.document.contractVersions.revisionCandidate,
    "store-revision-candidate.v1"
  );
  assert.equal(
    first.revision.document.catalogProjection.products.length,
    request.catalogShape.targetProductCount
  );

  const tampered = structuredClone(first.revision.document);
  tampered.contentProposal.homepage.headline = "Tampered after digest";
  assert.equal(StoreRevisionDocumentV2Schema.safeParse(tampered).success, false);
});

test("invalid assembler output and deterministic QA failure persist no revision", async () => {
  const malformedRepository = new InMemoryStoreFactoryV2Repository();
  const malformed = await new StoreFactoryV2Service({
    repository: malformedRepository,
    clock: deterministicClock(),
    assembler: { assemble: () => ({ version: "unknown" }) },
  }).buildRevision(buildRequest("request-invalid-candidate-1"));
  assert.equal(malformed.run.state, "PARTIAL_FAILURE");
  assert.equal(malformed.run.failureCode, "REVISION_CANDIDATE_INVALID");
  assert.equal(malformed.run.outputDigest, null);
  assert.equal(malformed.revision, null);

  const qaRepository = new InMemoryStoreFactoryV2Repository();
  const qaFailed = await new StoreFactoryV2Service({
    repository: qaRepository,
    clock: deterministicClock(),
    assembler: {
      assemble: ({ request }) => {
        const candidate = storeRevisionCandidateFixtureV1(request);
        candidate.contentProposal.products[0].productId = "product:unknown";
        return candidate;
      },
    },
  }).buildRevision(buildRequest("request-qa-failure-1"));
  assert.equal(qaFailed.run.state, "PARTIAL_FAILURE");
  assert.equal(qaFailed.run.failureCode, "REVISION_QA_FAILED");
  assert.equal(qaFailed.run.outputDigest, null);
  assert.equal(qaFailed.revision, null);
  assert.equal(
    (await qaRepository.listBuildEvents(qaFailed.run.id)).some(
      (event) => event.type === "REVISION_CREATED"
    ),
    false
  );

  const claimRepository = new InMemoryStoreFactoryV2Repository();
  const unsafeClaim = await new StoreFactoryV2Service({
    repository: claimRepository,
    clock: deterministicClock(),
    assembler: {
      assemble: ({ request }) => {
        const candidate = storeRevisionCandidateFixtureV1(request);
        candidate.contentProposal.homepage.headline =
          "The guaranteed cheapest drones";
        return candidate;
      },
    },
  }).buildRevision(buildRequest("request-unsafe-content-claim-1"));
  assert.equal(unsafeClaim.run.state, "PARTIAL_FAILURE");
  assert.equal(unsafeClaim.run.failureCode, "REVISION_QA_FAILED");
  assert.equal(unsafeClaim.revision, null);
  assert.equal(
    (await claimRepository.listBuildEvents(unsafeClaim.run.id)).some(
      (event) => event.type === "REVISION_CREATED"
    ),
    false
  );
});

test("deterministic QA rejects unsupported claims embedded in catalog copy", () => {
  const request = buildRequest("request-unsafe-catalog-claim-1");
  const fixture = structuredClone(droneCatalogFixtureV2);
  fixture.taxonomy.nodes[0].description =
    "Guaranteed cheapest products with zero risk.";
  const projected = buildCatalogProjectionV2(fixture);
  assert.equal(projected.status, "PROJECTED");
  if (projected.status !== "PROJECTED") return;
  const candidate = storeRevisionCandidateFixtureV1(request);
  candidate.catalogProjection = projected.projection;
  candidate.experienceManifest.catalogProjectionRef =
    projected.projection.projectionRef;
  candidate.contentProposal.catalogProjectionRef =
    projected.projection.projectionRef;

  const report = runDeterministicStoreRevisionQaV1(request, candidate);
  assert.equal(report.status, "FAIL");
  const catalogCheck = report.checks.find(
    (check) => check.id === "CATALOG_CONTRACT"
  );
  assert.deepEqual(catalogCheck?.reasonCodes, ["CATALOG_UNSAFE_CLAIM_COPY"]);
});

function buildRequest(requestKey: string): StoreBuildRequestV2 {
  return storeFactoryBuildRequestFixtureV2({ requestedBy: requestKey });
}

async function buildAndApprove(
  service: StoreFactoryV2Service,
  requestKey: string,
  label: string,
  baseRevision: StoreBuildRequestV2["baseRevision"] = null
) {
  const base = storeFactoryBuildRequestFixtureV2({
    requestedBy: requestKey,
    experienceVariant: baseRevision ? "REFINED" : "BASELINE",
    baseRevision,
  });
  const build = await service.buildRevision({
    ...base,
    brief: { ...base.brief, name: label },
  });
  assert.ok(build.revision);
  const approval = await service.approveRevision(
    reviewRequest(build.revision.id, build.revision.outputDigest, `${label} approved`)
  );
  return approval.revision;
}

function reviewRequest(
  revisionId: string,
  expectedOutputDigest: string,
  reason: string
) {
  return {
    version: REVISION_REVIEW_REQUEST_V2,
    storeId: "store-1",
    revisionId,
    expectedOutputDigest,
    reviewedBy: "reviewer@example.test",
    reason,
  };
}

function pointerRequest(
  targetRevisionId: string,
  expectedPointerVersion: number,
  reason: string
) {
  return {
    version: PREVIEW_POINTER_MUTATION_V1,
    storeId: "store-1",
    targetRevisionId,
    expectedPointerVersion,
    changedBy: "reviewer@example.test",
    reason,
  };
}

function serviceFor(repository: InMemoryStoreFactoryV2Repository) {
  return new StoreFactoryV2Service({
    repository,
    clock: deterministicClock(),
    assembler: {
      assemble: ({ request }) => storeRevisionCandidateFixtureV1(request),
    },
  });
}

function deterministicClock(): () => Date {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 8, 3, 10, 0, tick++));
}

async function assertStoreFactoryError(
  promise: Promise<unknown>,
  code: StoreFactoryV2Error["code"]
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof StoreFactoryV2Error);
    assert.equal(error.code, code);
    return true;
  });
}
