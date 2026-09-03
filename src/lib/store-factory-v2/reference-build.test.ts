import assert from "node:assert/strict";
import test from "node:test";
import type { StoreFactoryV2SchemaReport } from "@/lib/db/store-factory-v2-schema";
import {
  buildCatalogFixturePersistencePlanV2,
  buildCatalogProjectionV2,
  digestCatalogValue,
} from "@/lib/catalog-v2";
import { CATALOG_BINDING_V1 } from "./contracts";
import { InMemoryStoreFactoryV2Repository } from "./in-memory-repository";
import {
  REFERENCE_STORE_BUILD_V2,
  ReferenceStoreBuildErrorV2,
  type ExecuteReferenceStoreBuildDependenciesV2,
  executeReferenceStoreBuildV2,
  referenceStoreBuildFixtureKeysV2,
} from "./reference-build";

const completeSchema: StoreFactoryV2SchemaReport = {
  version: "universal-store-factory.v2.1",
  status: "COMPLETE",
  expected: 1,
  satisfied: 1,
  missing: [],
  incompatible: [],
  persistenceEnabled: true,
};

function input(fixtureKey: (typeof referenceStoreBuildFixtureKeysV2)[number]) {
  return {
    version: REFERENCE_STORE_BUILD_V2,
    storeId: "store-1",
    storeSlug: "reference-store",
    fixtureKey,
    experienceVariant: "BASELINE" as const,
  };
}

function dependencies(
  repository: InMemoryStoreFactoryV2Repository
): ExecuteReferenceStoreBuildDependenciesV2 {
  let tick = 0;
  return {
    featureEnabled: true,
    schema: completeSchema,
    repository,
    requestedBy: "shared-admin-session",
    findStore: async () => ({
      id: "store-1",
      slug: "reference-store",
      name: "Reference Store",
      niche: "Reviewed products",
    }),
    prepareCatalog: async ({ store, fixture }) => {
      const plan = buildCatalogFixturePersistencePlanV2({
        storeId: store.id,
        fixture,
      });
      const projected = buildCatalogProjectionV2(fixture);
      assert.equal(plan.status, "READY");
      assert.equal(projected.status, "PROJECTED");
      if (plan.status !== "READY" || projected.status !== "PROJECTED") {
        throw new Error("invalid fixture");
      }
      const artifact = plan.plan.rows.artifacts[0];
      return {
        version: CATALOG_BINDING_V1,
        artifactId: artifact.id,
        artifactDigest: artifact.contentDigest,
        artifactContractVersion: artifact.contractVersion,
        projectionRef: projected.projection.projectionRef,
        projectionDigest: digestCatalogValue(projected.projection).replace(
          /^sha256:/,
          ""
        ),
        projectionContractVersion: projected.projection.version,
        sourceKind: artifact.sourceKind,
      };
    },
    clock: () => new Date(Date.UTC(2026, 8, 3, 10, 0, tick++)),
  };
}

test("all three provider-free references create QA-passed preview-only drafts", async () => {
  for (const fixtureKey of referenceStoreBuildFixtureKeysV2) {
    const repository = new InMemoryStoreFactoryV2Repository();
    const result = await executeReferenceStoreBuildV2(
      input(fixtureKey),
      dependencies(repository)
    );
    assert.equal(result.run.state, "SUCCEEDED");
    assert.equal(result.revision?.status, "DRAFT");
    assert.equal(result.revision?.document.qaReport.status, "PASS");
    assert.equal(result.revision?.document.activation.scope, "PREVIEW_ONLY");
    assert.equal(result.revision?.document.activation.liveAuthorized, false);
    assert.equal(result.revision?.document.activation.indexingAuthorized, false);
    assert.equal(
      result.revision?.document.catalogProjection.products.length,
      fixtureKey === "drones" ? 10 : 4
    );
  }
});

test("reference build derives one idempotency key for identical server input", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const deps = dependencies(repository);
  const first = await executeReferenceStoreBuildV2(input("drones"), deps);
  const replay = await executeReferenceStoreBuildV2(input("drones"), deps);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.revision?.id, first.revision?.id);
  assert.equal(
    (await repository.listBuildEvents(first.run.id)).filter(
      (event) => event.type === "REVISION_CREATED"
    ).length,
    1
  );
});

test("refined build derives its approved active base and creates a distinct manifest", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const deps = dependencies(repository);
  const baseline = await executeReferenceStoreBuildV2(input("apparel"), deps);
  assert.ok(baseline.revision);
  await repository.reviewRevision({
    storeId: "store-1",
    revisionId: baseline.revision.id,
    expectedStatus: "DRAFT",
    expectedOutputDigest: baseline.revision.outputDigest,
    nextStatus: "APPROVED",
    reviewedBy: "shared-admin-session",
    reason: "baseline accepted",
    reviewedAt: "2026-09-03T10:10:00.000Z",
  });
  await repository.compareAndSwapPreviewPointer({
    storeId: "store-1",
    targetRevisionId: baseline.revision.id,
    expectedVersion: 0,
    action: "PROMOTE",
    changedBy: "shared-admin-session",
    reason: "baseline preview",
    changedAt: "2026-09-03T10:11:00.000Z",
  });

  await assert.rejects(
    executeReferenceStoreBuildV2(
      { ...input("drones"), experienceVariant: "REFINED" },
      deps
    ),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "BASE_REVISION_INVALID"
  );

  const refined = await executeReferenceStoreBuildV2(
    { ...input("apparel"), experienceVariant: "REFINED" },
    deps
  );
  assert.ok(refined.revision);
  assert.equal(refined.revision.parentRevisionId, baseline.revision.id);
  assert.equal(
    refined.revision.document.baseRevision?.outputDigest,
    baseline.revision.outputDigest
  );
  assert.notDeepEqual(
    refined.revision.document.experienceManifest,
    baseline.revision.document.experienceManifest
  );
  assert.notEqual(refined.run.requestKey, baseline.run.requestKey);
});

test("catalog binding must match the exact persisted fixture artifact", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const deps = dependencies(repository);
  const prepare = deps.prepareCatalog;
  assert.ok(prepare);
  deps.prepareCatalog = async (value) => ({
    ...(await prepare(value)),
    artifactDigest: `sha256:${"f".repeat(64)}`,
  });
  await assert.rejects(
    executeReferenceStoreBuildV2(input("drones"), deps),
    (error: unknown) =>
      error instanceof ReferenceStoreBuildErrorV2 &&
      error.code === "CATALOG_BINDING_INVALID"
  );
  assert.deepEqual(await repository.listStoreBuildEvents("store-1"), []);
});

test("catalog preparation completes before the build claim and fails without revision writes", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const deps = dependencies(repository);
  let preparedFixture: string | null = null;
  deps.prepareCatalog = async ({ fixtureKey, fixture, store }) => {
    assert.equal(store.id, "store-1");
    assert.equal(fixture.fixtureId, "reference:consumables");
    preparedFixture = fixtureKey;
    throw new Error("INJECTED_CATALOG_PERSISTENCE_FAILURE");
  };

  await assert.rejects(
    executeReferenceStoreBuildV2(input("consumables"), deps),
    /INJECTED_CATALOG_PERSISTENCE_FAILURE/
  );
  assert.equal(preparedFixture, "consumables");
  assert.deepEqual(await repository.listStoreBuildEvents("store-1"), []);
});

test("feature, schema and tenant gates refuse before a build is claimed", async () => {
  for (const blocked of ["feature", "schema", "tenant"] as const) {
    const repository = new InMemoryStoreFactoryV2Repository();
    const deps = dependencies(repository);
    if (blocked === "feature") deps.featureEnabled = false;
    if (blocked === "schema") {
      deps.schema = {
        ...completeSchema,
        status: "PARTIAL",
        persistenceEnabled: false,
      };
    }
    if (blocked === "tenant") deps.findStore = async () => null;
    await assert.rejects(
      executeReferenceStoreBuildV2(input("apparel"), deps),
      (error: unknown) => {
        assert.ok(error instanceof ReferenceStoreBuildErrorV2);
        return true;
      }
    );
    assert.deepEqual(await repository.listStoreBuildEvents("store-1"), []);
  }
});

test("browser reference input cannot supply request identity, actor, base or runtime version", async () => {
  const repository = new InMemoryStoreFactoryV2Repository();
  const deps = dependencies(repository);
  for (const extra of [
    { requestKey: "browser-controlled-key" },
    { requestedBy: "browser-actor" },
    { baseRevision: null },
    { runtimeCapabilityVersion: "browser-runtime" },
  ]) {
    await assert.rejects(
      executeReferenceStoreBuildV2({ ...input("apparel"), ...extra }, deps)
    );
  }
  assert.deepEqual(await repository.listStoreBuildEvents("store-1"), []);
});
