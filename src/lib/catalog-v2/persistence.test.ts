import assert from "node:assert/strict";
import test from "node:test";
import { digestCatalogValue } from "./canonical";
import { buildCatalogProjectionV2 } from "./catalog-projection";
import type { CatalogReferenceFixtureV2 } from "./contracts";
import {
  apparelCatalogFixtureV2,
  catalogReferenceFixturesV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
} from "./fixtures";
import {
  CATALOG_PERSISTENCE_INSERT_ORDER_V2,
  buildCatalogFixturePersistencePlanV2,
  buildCatalogProjectionPersistencePlanV2,
  catalogPersistenceOperationsV2,
  executeCatalogPersistencePlanV2,
  isCatalogPersistencePlanIntactV2,
  type CatalogPersistenceOperationV2,
  type CatalogPersistencePlanV2,
  type CatalogPersistenceRepositoryV2,
  type CatalogPersistenceTransactionV2,
} from "./persistence";

function fixturePlan(
  fixture: CatalogReferenceFixtureV2,
  storeId = "store:catalog-v2:test"
): CatalogPersistencePlanV2 {
  const result = buildCatalogFixturePersistencePlanV2({ storeId, fixture });
  assert.equal(result.status, "READY");
  return result.plan;
}

function projectedFixture(fixture: CatalogReferenceFixtureV2) {
  const result = buildCatalogProjectionV2(fixture);
  assert.equal(result.status, "PROJECTED");
  return result.projection;
}

function projectionRevisionNumbers(
  projection: ReturnType<typeof projectedFixture>
): Record<string, number> {
  return Object.fromEntries(
    projection.products.map((product, index) => [
      product.revisionId,
      index + 1,
    ])
  );
}

test("all reference fixtures map losslessly into complete normalized row sets", () => {
  for (const fixture of catalogReferenceFixturesV2) {
    const plan = fixturePlan(fixture);
    const rows = plan.rows;
    assert.deepEqual(JSON.parse(rows.artifacts[0].artifactJson), fixture);
    assert.equal(rows.products.length, fixture.productRevisions.length);
    assert.equal(rows.revisions.length, fixture.productRevisions.length);
    assert.equal(
      rows.attributeDefinitions.length,
      fixture.productRevisions.reduce(
        (count, revision) => count + revision.attributeDefinitions.length,
        0
      )
    );
    assert.equal(
      rows.variants.length,
      fixture.productRevisions.reduce(
        (count, revision) => count + revision.variants.length,
        0
      )
    );
    assert.equal(
      rows.purchaseOptions.length,
      fixture.productRevisions.reduce(
        (count, revision) => count + revision.purchaseOptions.length,
        0
      )
    );
    assert.equal(
      rows.evidence.length,
      fixture.productRevisions.reduce(
        (count, revision) => count + revision.evidence.length,
        0
      )
    );
    assert.equal(rows.supplierOffers.length, fixture.supplierOffers.length);
    assert.equal(
      rows.supplierObservations.length,
      fixture.supplierObservations.length
    );
    for (const revision of fixture.productRevisions) {
      const row = rows.revisions.find(
        (candidate) => candidate.artifactRevisionRef === revision.revisionId
      );
      assert.ok(row);
      assert.deepEqual(JSON.parse(row.revisionJson), revision);
      assert.equal(row.contentDigest, digestCatalogValue(revision));
      assert.equal(row.revisionNumber, String(revision.revisionNumber));
    }
    assert.ok(isCatalogPersistencePlanIntactV2(plan));
    assert.match(plan.planRef, /^cv2:plan:sha256:[a-f0-9]{64}$/);
    for (const row of Object.values(rows).flat()) {
      if ("id" in row) assert.match(String(row.id), /^cv2:[a-z-]+:sha256:[a-f0-9]{64}$/);
    }
  }
});

test("apparel keeps revision-local definitions, stable identities, defaults, and exact focal coordinates", () => {
  const plan = fixturePlan(apparelCatalogFixtureV2);
  assert.equal(plan.rows.variantIdentities.length, 24);
  assert.equal(plan.rows.variants.length, 24);
  assert.equal(plan.rows.mediaVariants.length, 24);
  assert.equal(plan.rows.attributeDefinitions.length, 16);
  assert.equal(
    plan.rows.variants.filter((variant) => variant.isDefault).length,
    apparelCatalogFixtureV2.productRevisions.length
  );
  const sourceMedia = apparelCatalogFixtureV2.productRevisions[0].media[0];
  const mediaRow = plan.rows.mediaAssets.find(
    (media) => media.stableKey === sourceMedia.mediaId
  );
  assert.ok(mediaRow);
  assert.equal(mediaRow.focalX, sourceMedia.focalPoint?.x);
  assert.equal(mediaRow.focalY, sourceMedia.focalPoint?.y);
  assert.equal(mediaRow.rightsStatus, sourceMedia.rights.state);
  assert.equal(mediaRow.sourceKind, sourceMedia.rights.sourceKind);
});

test("consumables retain purchase, repeat, evidence, and variant-offer semantics", () => {
  const plan = fixturePlan(consumableCatalogFixtureV2);
  assert.equal(plan.rows.purchaseOptions.length, 12);
  assert.equal(plan.rows.evidence.length, 4);
  assert.equal(plan.rows.variantIdentities.length, 8);
  assert.equal(plan.rows.supplierOffers.length, 8);
  assert.ok(
    plan.rows.supplierOffers.every(
      (offer) => offer.variantIdentityId !== null
    )
  );
  const bundle = plan.rows.purchaseOptions.find(
    (option) =>
      option.stableKey === "purchase:fjord-roast-beans:bundle-3x250g"
  );
  assert.ok(bundle);
  assert.equal(bundle.quantity, "3");
  assert.ok(bundle.variantId);
  assert.deepEqual(JSON.parse(bundle.repeatIntervalDaysJson), [14, 30]);
  assert.equal(typeof bundle.retailPriceMinor, "string");
});

test("UNKNOWN and inherited price states flatten without optimistic values", () => {
  const dronePlan = fixturePlan(droneCatalogFixtureV2);
  const unknownRevision = dronePlan.rows.revisions.find(
    (revision) => revision.slug === "night-explorer"
  );
  assert.ok(unknownRevision);
  assert.equal(unknownRevision.retailPriceState, "UNKNOWN");
  assert.equal(unknownRevision.retailPriceMinor, null);
  assert.equal(unknownRevision.currency, null);
  assert.equal(unknownRevision.compareAtPriceMinor, null);
  assert.equal(unknownRevision.purchasable, false);
  const unknownObservation = dronePlan.rows.supplierObservations.find(
    (observation) => observation.outcome === "UNKNOWN"
  );
  assert.ok(unknownObservation);
  assert.equal(unknownObservation.unitCostMinor, null);
  assert.equal(unknownObservation.shippingMinor, null);
  assert.equal(unknownObservation.inventoryQuantity, null);
  assert.equal(unknownObservation.availability, "UNKNOWN");

  const apparelPlan = fixturePlan(apparelCatalogFixtureV2);
  assert.ok(
    apparelPlan.rows.variants.every(
      (variant) =>
        variant.retailPriceState === null &&
        variant.retailPriceMinor === null &&
        variant.currency === null
    )
  );
});

test("plans are deterministic, tenant-scoped, and do not mutate artifacts", () => {
  const fixture = structuredClone(apparelCatalogFixtureV2);
  const before = structuredClone(fixture);
  const first = fixturePlan(fixture, "store:one");
  const second = fixturePlan(fixture, "store:one");
  const otherTenant = fixturePlan(fixture, "store:two");
  assert.deepEqual(first, second);
  assert.deepEqual(fixture, before);
  assert.notEqual(first.planRef, otherTenant.planRef);
  assert.notEqual(first.rows.artifacts[0].id, otherTenant.rows.artifacts[0].id);
  assert.notEqual(first.rows.products[0].id, otherTenant.rows.products[0].id);
  assert.equal(
    first.rows.artifacts[0].contentDigest,
    otherTenant.rows.artifacts[0].contentDigest
  );
});

test("successive artifacts reuse stable identities but scope revisions and children by digest", () => {
  const next = structuredClone(apparelCatalogFixtureV2);
  next.description = `${next.description} Second immutable snapshot.`;
  const first = fixturePlan(apparelCatalogFixtureV2);
  const second = fixturePlan(next);
  assert.deepEqual(
    first.rows.products.map((row) => row.id),
    second.rows.products.map((row) => row.id)
  );
  assert.deepEqual(
    first.rows.variantIdentities.map((row) => row.id),
    second.rows.variantIdentities.map((row) => row.id)
  );
  assert.notDeepEqual(
    first.rows.revisions.map((row) => row.id),
    second.rows.revisions.map((row) => row.id)
  );
  assert.notDeepEqual(
    first.rows.attributeDefinitions.map((row) => row.id),
    second.rows.attributeDefinitions.map((row) => row.id)
  );
});

test("public projections require revision numbers and materialize as sealed review drafts", () => {
  const projection = projectedFixture(consumableCatalogFixtureV2);
  assert.deepEqual(
    buildCatalogProjectionPersistencePlanV2({
      storeId: "store:projection",
      projection,
    }),
    {
      status: "REFUSED",
      plan: null,
      reasonCodes: ["PROJECTION_REVISION_NUMBERS_REQUIRED"],
    }
  );
  const result = buildCatalogProjectionPersistencePlanV2({
    storeId: "store:projection",
    projection,
    revisionNumbers: projectionRevisionNumbers(projection),
  });
  assert.equal(result.status, "READY");
  const plan = result.plan;
  assert.deepEqual(JSON.parse(plan.rows.artifacts[0].artifactJson), projection);
  assert.ok(plan.rows.products.every((product) => product.status === "DRAFT"));
  assert.ok(
    plan.rows.revisions.every(
      (revision) =>
        revision.revisionState === "DRAFT" && !revision.purchasable
    )
  );
  assert.ok(
    plan.rows.mediaAssets.every(
      (media) =>
        media.publicationState === "INTERNAL_ONLY" &&
        media.rightsStatus === "UNKNOWN" &&
        media.sourceKind === "UNKNOWN" &&
        media.evidenceIdsJson === "[]"
    )
  );
  assert.equal(plan.rows.evidence.length, 0);
  assert.equal(plan.rows.supplierOffers.length, 0);
  assert.equal(plan.rows.purchaseOptions.length, 12);
  const revisionEnvelope = JSON.parse(plan.rows.revisions[0].revisionJson);
  assert.equal(revisionEnvelope.contractVersion, "catalog-product-revision.v2");
  assert.ok(revisionEnvelope.product);
});

test("schema-only conflicts are refused before a persistence plan exists", () => {
  const futureRevision = structuredClone(droneCatalogFixtureV2);
  futureRevision.generatedAt = "2025-01-01T00:00:00.000Z";
  const temporal = buildCatalogFixturePersistencePlanV2({
    storeId: "store:conflict",
    fixture: futureRevision,
  });
  assert.equal(temporal.status, "REFUSED");
  assert.ok(temporal.reasonCodes.includes("TEMPORAL_CONFLICT"));

  const invalidStore = buildCatalogFixturePersistencePlanV2({
    storeId: " invalid store ",
    fixture: droneCatalogFixtureV2,
  });
  assert.deepEqual(invalidStore, {
    status: "REFUSED",
    plan: null,
    reasonCodes: ["INVALID_STORE_ID"],
  });

  const duplicateRevision = structuredClone(
    projectedFixture(droneCatalogFixtureV2)
  );
  duplicateRevision.products[1].revisionId =
    duplicateRevision.products[0].revisionId;
  const projectionContent: Record<string, unknown> = { ...duplicateRevision };
  delete projectionContent.projectionRef;
  duplicateRevision.projectionRef =
    `catalog-projection:${digestCatalogValue(projectionContent)}`;
  const revisionNumbers = projectionRevisionNumbers(duplicateRevision);
  const duplicateResult = buildCatalogProjectionPersistencePlanV2({
    storeId: "store:conflict",
    projection: duplicateRevision,
    revisionNumbers,
  });
  assert.deepEqual(duplicateResult, {
    status: "REFUSED",
    plan: null,
    reasonCodes: ["PERSISTENCE_UNIQUE_CONFLICT"],
  });

  const invalidEnum = structuredClone(projectedFixture(droneCatalogFixtureV2));
  const cameraAttribute = invalidEnum.products[0].attributes.find(
    (attribute) => attribute.key === "camera-resolution"
  );
  assert.ok(cameraAttribute);
  cameraAttribute.value = "not-an-option";
  const invalidEnumContent: Record<string, unknown> = { ...invalidEnum };
  delete invalidEnumContent.projectionRef;
  invalidEnum.projectionRef =
    `catalog-projection:${digestCatalogValue(invalidEnumContent)}`;
  const invalidEnumResult = buildCatalogProjectionPersistencePlanV2({
    storeId: "store:conflict",
    projection: invalidEnum,
    revisionNumbers: projectionRevisionNumbers(invalidEnum),
  });
  assert.equal(invalidEnumResult.status, "REFUSED");
  assert.ok(
    invalidEnumResult.reasonCodes.includes("SCHEMA_CONSTRAINT_CONFLICT")
  );
});

test("latest supplier observation is the deterministic max timestamp and observation ID", () => {
  const laterFixture = structuredClone(consumableCatalogFixtureV2);
  const laterOffer = laterFixture.supplierOffers[0];
  const earlierObservation = laterFixture.supplierObservations.find(
    (observation) => observation.offerId === laterOffer.offerId
  );
  assert.ok(earlierObservation);
  earlierObservation.observedAt = "2026-01-15T11:59:59.000Z";
  const laterObservation = structuredClone(earlierObservation);
  laterObservation.observationId = `${earlierObservation.observationId}:2`;
  laterObservation.observedAt = "2026-01-15T12:00:00.000Z";
  laterFixture.supplierObservations.push(laterObservation);

  const staleByTime = buildCatalogFixturePersistencePlanV2({
    storeId: "store:latest-observation",
    fixture: laterFixture,
  });
  assert.deepEqual(staleByTime, {
    status: "REFUSED",
    plan: null,
    reasonCodes: ["TEMPORAL_CONFLICT"],
  });

  const tiedFixture = structuredClone(consumableCatalogFixtureV2);
  const tiedOffer = tiedFixture.supplierOffers[0];
  const tiedEarlier = tiedFixture.supplierObservations.find(
    (observation) => observation.offerId === tiedOffer.offerId
  );
  assert.ok(tiedEarlier);
  const tiedLater = structuredClone(tiedEarlier);
  tiedLater.observationId = `${tiedEarlier.observationId}:z`;
  tiedLater.observedAt = "2026-01-15T13:00:00.000+01:00";
  tiedFixture.supplierObservations.push(tiedLater);

  const staleByTieBreak = buildCatalogFixturePersistencePlanV2({
    storeId: "store:latest-observation",
    fixture: tiedFixture,
  });
  assert.deepEqual(staleByTieBreak, {
    status: "REFUSED",
    plan: null,
    reasonCodes: ["TEMPORAL_CONFLICT"],
  });

  tiedOffer.latestObservationId = tiedLater.observationId;
  const selected = buildCatalogFixturePersistencePlanV2({
    storeId: "store:latest-observation",
    fixture: tiedFixture,
  });
  assert.equal(selected.status, "READY");
  const selectedRow = selected.plan.rows.supplierObservations.find(
    (row) => row.stableKey === tiedLater.observationId
  );
  assert.ok(selectedRow);
  const selectedUpdate = selected.plan.offerLatestObservationUpdates.find(
    (update) => update.latestObservationId === selectedRow.id
  );
  assert.ok(selectedUpdate);
});

test("operation order creates the full graph, links observations, and seals last", () => {
  const plan = fixturePlan(consumableCatalogFixtureV2);
  const operations = catalogPersistenceOperationsV2(plan);
  const ensuredModels = operations.flatMap((operation) =>
    operation.kind === "ENSURE_ROWS" ? [operation.model] : []
  );
  const expectedModels = CATALOG_PERSISTENCE_INSERT_ORDER_V2.filter(
    (model) => {
      const operation = operations.find(
        (candidate) =>
          candidate.kind === "ENSURE_ROWS" && candidate.model === model
      );
      return Boolean(operation);
    }
  );
  assert.deepEqual(ensuredModels, expectedModels);
  const observationInsertIndex = operations.findIndex(
    (operation) =>
      operation.kind === "ENSURE_ROWS" &&
      operation.model === "CatalogSupplierOfferObservationV2"
  );
  const firstPointerIndex = operations.findIndex(
    (operation) => operation.kind === "SET_LATEST_OBSERVATION"
  );
  const firstSealIndex = operations.findIndex(
    (operation) => operation.kind === "SEAL_REVISION"
  );
  assert.ok(observationInsertIndex >= 0);
  assert.ok(firstPointerIndex > observationInsertIndex);
  assert.ok(firstSealIndex > firstPointerIndex);
  assert.ok(
    operations.slice(firstSealIndex).every(
      (operation) => operation.kind === "SEAL_REVISION"
    )
  );
  const revisionInsert = operations.find(
    (operation) =>
      operation.kind === "ENSURE_ROWS" &&
      operation.model === "CatalogProductRevisionV2"
  );
  const offerInsert = operations.find(
    (operation) =>
      operation.kind === "ENSURE_ROWS" &&
      operation.model === "CatalogSupplierOfferV2"
  );
  assert.equal(revisionInsert?.kind, "ENSURE_ROWS");
  assert.equal(offerInsert?.kind, "ENSURE_ROWS");
  if (revisionInsert?.kind === "ENSURE_ROWS") {
    assert.ok(revisionInsert.mutableColumns.includes("sealedAt"));
  }
  if (offerInsert?.kind === "ENSURE_ROWS") {
    assert.ok(offerInsert.mutableColumns.includes("latestObservationId"));
  }
});

class MemoryRepository implements CatalogPersistenceRepositoryV2 {
  committed = new Set<string>();
  transactionCount = 0;
  failAt: number | null = null;

  async transaction<T>(
    work: (transaction: CatalogPersistenceTransactionV2) => Promise<T>
  ): Promise<T> {
    this.transactionCount += 1;
    const staged = new Set(this.committed);
    let operationIndex = 0;
    const transaction: CatalogPersistenceTransactionV2 = {
      execute: async (operation: CatalogPersistenceOperationV2) => {
        if (this.failAt === operationIndex) throw new Error("INJECTED_FAILURE");
        staged.add(digestCatalogValue(operation));
        operationIndex += 1;
      },
    };
    const result = await work(transaction);
    this.committed = staged;
    return result;
  }
}

test("repository execution is idempotent and transaction failure leaves no partial writes", async () => {
  const plan = fixturePlan(droneCatalogFixtureV2);
  const repository = new MemoryRepository();
  await executeCatalogPersistencePlanV2(repository, plan);
  const committedCount = repository.committed.size;
  await executeCatalogPersistencePlanV2(repository, plan);
  assert.equal(repository.transactionCount, 2);
  assert.equal(repository.committed.size, committedCount);

  const failing = new MemoryRepository();
  failing.failAt = 4;
  await assert.rejects(
    executeCatalogPersistencePlanV2(failing, plan),
    /INJECTED_FAILURE/
  );
  assert.equal(failing.transactionCount, 1);
  assert.equal(failing.committed.size, 0);

  const tampered = structuredClone(plan);
  tampered.rows.products[0].canonicalKey = "tampered";
  const untouched = new MemoryRepository();
  await assert.rejects(
    executeCatalogPersistencePlanV2(untouched, tampered),
    /INVALID_CATALOG_PERSISTENCE_PLAN/
  );
  assert.equal(untouched.transactionCount, 0);
  assert.equal(untouched.committed.size, 0);
});
