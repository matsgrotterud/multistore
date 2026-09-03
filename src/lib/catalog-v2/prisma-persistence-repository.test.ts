import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_PERSISTENCE_INSERT_ORDER_V2,
  buildCatalogFixturePersistencePlanV2,
  executeCatalogPersistencePlanV2,
  type CatalogPersistenceOperationV2,
  type CatalogPersistencePlanV2,
} from "./persistence";
import {
  apparelCatalogFixtureV2,
  consumableCatalogFixtureV2,
} from "./fixtures";
import type { CatalogReferenceFixtureV2 } from "./contracts";
import {
  CatalogPersistenceRepositoryErrorV2,
  PrismaCatalogPersistenceRepositoryV2,
  type CatalogV2PrismaClient,
  type CatalogV2PrismaTransaction,
} from "./prisma-persistence-repository";

function fixturePlan(
  fixture: CatalogReferenceFixtureV2,
  storeId = "store:catalog-v2:prisma-test"
): CatalogPersistencePlanV2 {
  const result = buildCatalogFixturePersistencePlanV2({ storeId, fixture });
  assert.equal(result.status, "READY");
  return result.plan;
}

test("raw Prisma adapter covers every Catalog V2 model with parameterized SQL in injected transactions", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const consumable = fixturePlan(consumableCatalogFixtureV2);
  const apparel = fixturePlan(apparelCatalogFixtureV2);

  await executeCatalogPersistencePlanV2(repository, consumable);
  await executeCatalogPersistencePlanV2(repository, apparel);
  const committedRows = db.rowCount;
  await executeCatalogPersistencePlanV2(repository, consumable);
  await executeCatalogPersistencePlanV2(repository, apparel);

  assert.equal(db.transactions, 4);
  assert.equal(db.outsideTransactionQueries, 0);
  assert.equal(db.rowCount, committedRows);
  assert.deepEqual(
    [...db.insertedTables].sort(),
    [...CATALOG_PERSISTENCE_INSERT_ORDER_V2].sort()
  );
  assert.ok(db.calls.some((call) => call.values.some((value) => value instanceof Date)));
  assert.ok(db.calls.some((call) => call.values.some((value) => typeof value === "bigint")));
  assert.ok(
    db.calls
      .filter((call) => call.query.startsWith("INSERT INTO"))
      .every(
        (call) =>
          call.query.includes("VALUES ($1") &&
          call.query.includes("ON CONFLICT DO NOTHING")
      )
  );
  for (const call of db.calls.filter((entry) =>
    entry.query.startsWith("INSERT INTO")
  )) {
    const columns = insertColumns(call.query);
    assert.equal(
      new Set(columns).size,
      columns.length,
      `duplicate INSERT column for ${insertTable(call.query)}`
    );
  }
  const sql = db.calls.map((call) => call.query).join("\n");
  assert.equal(sql.includes(consumable.storeId), false);
  assert.equal(sql.includes(consumable.rows.artifacts[0].artifactJson), false);
  assert.doesNotMatch(
    sql,
    /(?:FROM|INTO|UPDATE|JOIN)\s+"(?:Product|ProductVariant|Order|Cart|Checkout)"(?:\s|$)/
  );
  for (const table of referencedTables(sql)) {
    assert.ok(
      CATALOG_PERSISTENCE_INSERT_ORDER_V2.includes(
        table as (typeof CATALOG_PERSISTENCE_INSERT_ORDER_V2)[number]
      ),
      `unexpected SQL table ${table}`
    );
  }
});

test("advisory identity lock casts PostgreSQL void to the exact Prisma-supported text result", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  await executeCatalogPersistencePlanV2(
    repository,
    fixturePlan(apparelCatalogFixtureV2)
  );
  const lockCalls = db.calls.filter((call) =>
    call.query.includes("pg_advisory_xact_lock")
  );
  assert.ok(lockCalls.length > 0);
  assert.equal(
    lockCalls.every(
      (call) =>
        call.query.replace(/\s+/g, " ").trim() ===
        'SELECT pg_advisory_xact_lock(hashtext($1::text))::text AS "locked"'
    ),
    true
  );

  const malformed = new MemoryPrisma();
  malformed.advisoryLockResult = null;
  await assert.rejects(
    executeCatalogPersistencePlanV2(
      new PrismaCatalogPersistenceRepositoryV2(malformed),
      fixturePlan(apparelCatalogFixtureV2)
    ),
    (error: unknown) =>
      repositoryErrorHasCode(error, "CATALOG_PERSISTENCE_ROW_CONFLICT")
  );
  assert.equal(malformed.insertedTables.size, 0);
});

test("optional preview-store guard locks and revalidates the exact active PREVIEW tenant inside the catalog transaction", async () => {
  const storeId = "store:catalog-v2:guarded-preview";
  const storeSlug = "guarded-preview";
  const db = new MemoryPrisma();
  db.seedStore({
    id: storeId,
    slug: storeSlug,
    launchStatus: "PREVIEW",
    isActive: true,
  });
  const repository = new PrismaCatalogPersistenceRepositoryV2(db, {
    previewStoreGuard: { storeId, storeSlug },
  });

  await executeCatalogPersistencePlanV2(
    repository,
    fixturePlan(apparelCatalogFixtureV2, storeId)
  );

  assert.equal(db.transactions, 1);
  assert.equal(db.outsideTransactionQueries, 0);
  assert.match(db.calls[0]?.query ?? "", /FROM "Store"/);
  assert.match(db.calls[0]?.query ?? "", /FOR UPDATE/);
  assert.deepEqual(db.calls[0]?.values, [storeId, storeSlug]);
  assert.equal(db.calls.slice(1).some((call) => call.query.startsWith("INSERT INTO")), true);
});

test("preview-store guard refuses missing, renamed, non-PREVIEW or inactive stores before any catalog write", async () => {
  const storeId = "store:catalog-v2:guard-refusal";
  const cases = [
    { name: "missing", store: null, storeSlug: "guard-refusal" },
    {
      name: "renamed",
      store: {
        id: storeId,
        slug: "renamed-preview",
        launchStatus: "PREVIEW",
        isActive: true,
      },
      storeSlug: "guard-refusal",
    },
    {
      name: "not preview",
      store: {
        id: storeId,
        slug: "guard-refusal",
        launchStatus: "LIVE",
        isActive: true,
      },
      storeSlug: "guard-refusal",
    },
    {
      name: "inactive",
      store: {
        id: storeId,
        slug: "guard-refusal",
        launchStatus: "PREVIEW",
        isActive: false,
      },
      storeSlug: "guard-refusal",
    },
  ] as const;

  for (const scenario of cases) {
    const db = new MemoryPrisma();
    if (scenario.store) db.seedStore(scenario.store);
    const repository = new PrismaCatalogPersistenceRepositoryV2(db, {
      previewStoreGuard: {
        storeId,
        storeSlug: scenario.storeSlug,
      },
    });

    await assert.rejects(
      executeCatalogPersistencePlanV2(
        repository,
        fixturePlan(apparelCatalogFixtureV2, storeId)
      ),
      (error: unknown) =>
        repositoryErrorHasCode(
          error,
          "CATALOG_PERSISTENCE_PREVIEW_STORE_GUARD_FAILED"
        ),
      scenario.name
    );
    assert.equal(db.insertedTables.size, 0, scenario.name);
    assert.equal(db.outsideTransactionQueries, 0, scenario.name);
    assert.equal(db.calls.filter((call) => call.query.startsWith("INSERT INTO")).length, 0, scenario.name);
  }
});

test("replay accepts changed pointer and seal columns but rejects immutable row drift", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const plan = fixturePlan(consumableCatalogFixtureV2);
  await executeCatalogPersistencePlanV2(repository, plan);

  assert.ok(
    db.rows("CatalogProductRevisionV2").every(
      (row) => row.sealedAt instanceof Date
    )
  );
  assert.ok(
    db.rows("CatalogSupplierOfferV2").every(
      (row) => typeof row.latestObservationId === "string"
    )
  );
  await executeCatalogPersistencePlanV2(repository, plan);

  const artifact = plan.rows.artifacts[0];
  db.setColumn(
    "CatalogArtifactV2",
    "id",
    artifact.id,
    "contentDigest",
    "sha256:conflicting"
  );
  await assert.rejects(
    executeCatalogPersistencePlanV2(repository, plan),
    (error: unknown) =>
      repositoryErrorHasCode(error, "CATALOG_PERSISTENCE_ROW_CONFLICT")
  );
});

test("idempotent replay validates rows before INSERT triggers and never updates an already matching seal", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const plan = fixturePlan(apparelCatalogFixtureV2);
  await executeCatalogPersistencePlanV2(repository, plan);

  const replayCallStart = db.calls.length;
  db.throwOnInsertConflict = true;
  db.throwOnSealedRevisionUpdate = true;
  await executeCatalogPersistencePlanV2(repository, plan);
  const replayCalls = db.calls.slice(replayCallStart);

  assert.equal(
    replayCalls.some((call) => call.query.startsWith("INSERT INTO")),
    false
  );
  assert.equal(
    replayCalls.some((call) =>
      call.query.includes('UPDATE "CatalogProductRevisionV2" AS revision')
    ),
    false
  );
  assert.ok(
    replayCalls.some(
      (call) =>
        call.query.includes('FROM "CatalogProductRevisionV2"') &&
        call.query.includes("FOR UPDATE")
    )
  );
  assert.ok(
    replayCalls.some((call) =>
      call.query.includes("pg_advisory_xact_lock")
    )
  );
});

test("runtime model and mutable-column allowlists fail closed before issuing SQL", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const plan = fixturePlan(consumableCatalogFixtureV2);
  const artifactOperation = {
    kind: "ENSURE_ROWS",
    model: "CatalogArtifactV2",
    rows: plan.rows.artifacts,
    mutableColumns: ["artifactJson"],
  } as CatalogPersistenceOperationV2;

  await assert.rejects(
    repository.transaction((transaction) => transaction.execute(artifactOperation)),
    (error: unknown) =>
      repositoryErrorHasCode(
        error,
        "INVALID_CATALOG_PERSISTENCE_OPERATION"
      )
  );
  await assert.rejects(
    repository.transaction((transaction) =>
      transaction.execute({
        kind: "ENSURE_ROWS",
        model: 'CatalogArtifactV2"; DELETE FROM "Product"; --',
        rows: plan.rows.artifacts,
        mutableColumns: [],
      } as unknown as CatalogPersistenceOperationV2)
    ),
    (error: unknown) =>
      repositoryErrorHasCode(
        error,
        "INVALID_CATALOG_PERSISTENCE_OPERATION"
      )
  );
  assert.equal(db.calls.length, 0);
  assert.equal(db.rowCount, 0);
});

test("latest pointer advances by timestamp and equal timestamps use observation ID", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);

  const earlierFixture = structuredClone(consumableCatalogFixtureV2);
  const earlierOffer = earlierFixture.supplierOffers[0];
  const earlierObservation = earlierFixture.supplierObservations.find(
    (observation) => observation.offerId === earlierOffer.offerId
  );
  assert.ok(earlierObservation);
  earlierObservation.observedAt = "2026-01-15T11:59:59.000Z";
  const earlierPlan = fixturePlan(
    earlierFixture,
    "store:catalog-v2:later-observation"
  );
  await executeCatalogPersistencePlanV2(repository, earlierPlan);

  const laterFixture = structuredClone(earlierFixture);
  const laterOffer = laterFixture.supplierOffers[0];
  const laterObservation = structuredClone(
    laterFixture.supplierObservations.find(
      (observation) => observation.offerId === laterOffer.offerId
    )!
  );
  laterObservation.observationId = `${laterObservation.observationId}:2`;
  laterObservation.observedAt = "2026-01-15T12:00:00.000Z";
  laterFixture.supplierObservations.push(laterObservation);
  laterOffer.latestObservationId = laterObservation.observationId;
  const laterPlan = fixturePlan(
    laterFixture,
    "store:catalog-v2:later-observation"
  );
  await executeCatalogPersistencePlanV2(repository, laterPlan);
  const laterRow = laterPlan.rows.supplierObservations.find(
    (row) => row.stableKey === laterObservation.observationId
  );
  assert.ok(laterRow);
  const advancedOffer = db
    .rows("CatalogSupplierOfferV2")
    .find((row) => row.id === laterPlan.rows.supplierOffers[0].id);
  assert.equal(advancedOffer?.latestObservationId, laterRow.id);

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
  tiedOffer.latestObservationId = tiedLater.observationId;
  const tiedPlan = fixturePlan(
    tiedFixture,
    "store:catalog-v2:tied-observation"
  );
  await executeCatalogPersistencePlanV2(repository, tiedPlan);
  const tiedEarlierRow = tiedPlan.rows.supplierObservations.find(
    (row) => row.stableKey === tiedEarlier.observationId
  );
  const tiedUpdate = tiedPlan.offerLatestObservationUpdates.find(
    (update) => update.offerId === tiedPlan.rows.supplierOffers[0].id
  );
  assert.ok(tiedEarlierRow);
  assert.ok(tiedUpdate);
  await assert.rejects(
    repository.transaction((transaction) =>
      transaction.execute({
        kind: "SET_LATEST_OBSERVATION",
        offerId: tiedUpdate.offerId,
        latestObservationId: tiedEarlierRow.id,
        updatedAt: tiedUpdate.updatedAt,
      })
    ),
    (error: unknown) =>
      repositoryErrorHasCode(
        error,
        "CATALOG_PERSISTENCE_POINTER_CONFLICT"
      )
  );

  const sql = db.calls.map((call) => call.query).join("\n");
  assert.match(
    sql,
    /newer\."stableKey" COLLATE "C" >\s+target\."stableKey" COLLATE "C"/
  );
  assert.match(
    sql,
    /current\."stableKey" COLLATE "C" <\s+target\."stableKey" COLLATE "C"/
  );
});

test("latest-observation and seal writes reject cross-scope or conflicting targets", async () => {
  const db = new MemoryPrisma();
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const plan = fixturePlan(consumableCatalogFixtureV2);
  await executeCatalogPersistencePlanV2(repository, plan);

  const [firstUpdate, secondUpdate] = plan.offerLatestObservationUpdates;
  assert.ok(firstUpdate);
  assert.ok(secondUpdate);
  await assert.rejects(
    repository.transaction((transaction) =>
      transaction.execute({
        kind: "SET_LATEST_OBSERVATION",
        offerId: firstUpdate.offerId,
        latestObservationId: secondUpdate.latestObservationId,
        updatedAt: firstUpdate.updatedAt,
      })
    ),
    (error: unknown) =>
      repositoryErrorHasCode(
        error,
        "CATALOG_PERSISTENCE_POINTER_CONFLICT"
      )
  );

  const seal = plan.revisionSealUpdates[0];
  const sealUpdateCount = db.calls.filter((call) =>
    call.query.includes('UPDATE "CatalogProductRevisionV2" AS revision')
  ).length;
  await assert.rejects(
    repository.transaction((transaction) =>
      transaction.execute({
        kind: "SEAL_REVISION",
        productRevisionId: seal.productRevisionId,
        sealedAt: "2027-01-01T00:00:00.000Z",
      })
    ),
    (error: unknown) =>
      repositoryErrorHasCode(error, "CATALOG_PERSISTENCE_SEAL_CONFLICT")
  );
  assert.equal(
    db.calls.filter((call) =>
      call.query.includes('UPDATE "CatalogProductRevisionV2" AS revision')
    ).length,
    sealUpdateCount
  );

  const sql = db.calls.map((call) => call.query).join("\n");
  assert.match(sql, /target\."offerId" = offer\."id"/);
  assert.match(sql, /target\."storeId" = offer\."storeId"/);
  assert.match(sql, /revision\."id" = \$1/);
  assert.match(sql, /revision\."sealedAt" IS NULL/);
});

test("an injected query failure rolls the single Prisma transaction back", async () => {
  const db = new MemoryPrisma();
  db.failOnQueryNumber = 6;
  const repository = new PrismaCatalogPersistenceRepositoryV2(db);
  const plan = fixturePlan(apparelCatalogFixtureV2);

  await assert.rejects(
    executeCatalogPersistencePlanV2(repository, plan),
    /INJECTED_PRISMA_FAILURE/
  );
  assert.equal(db.transactions, 1);
  assert.equal(db.rowCount, 0);
});

type DbRow = Record<string, unknown>;

const COMPOSITE_KEYS: Readonly<Record<string, readonly string[]>> = {
  CatalogProductTaxonomyPlacementV2: [
    "productRevisionId",
    "taxonomyNodeId",
  ],
  CatalogTaxonomyAttributeDefinitionV2: [
    "taxonomyNodeId",
    "definitionId",
  ],
  CatalogCollectionItemV2: ["collectionId", "productRevisionId"],
  CatalogMediaVariantV2: ["mediaId", "variantId"],
};

class MemoryPrisma implements CatalogV2PrismaClient {
  readonly calls: Array<{ query: string; values: unknown[] }> = [];
  readonly insertedTables = new Set<string>();
  transactions = 0;
  outsideTransactionQueries = 0;
  failOnQueryNumber: number | null = null;
  advisoryLockResult: unknown = "";
  throwOnInsertConflict = false;
  throwOnSealedRevisionUpdate = false;

  private tables = new Map<string, DbRow[]>();
  private inTransaction = false;

  get rowCount(): number {
    return [...this.tables.values()].reduce(
      (count, rows) => count + rows.length,
      0
    );
  }

  rows(table: string): DbRow[] {
    return this.table(table);
  }

  seedStore(row: {
    id: string;
    slug: string;
    launchStatus: string;
    isActive: boolean;
  }): void {
    this.table("Store").push(structuredClone(row));
  }

  setColumn(
    table: string,
    keyColumn: string,
    keyValue: unknown,
    column: string,
    value: unknown
  ): void {
    const row = this.table(table).find(
      (candidate) => valuesEqual(candidate[keyColumn], keyValue)
    );
    assert.ok(row);
    row[column] = value;
  }

  async $transaction<T>(
    callback: (transaction: CatalogV2PrismaTransaction) => Promise<T>
  ): Promise<T> {
    assert.equal(this.inTransaction, false);
    this.transactions += 1;
    const before = structuredClone(this.tables);
    this.inTransaction = true;
    try {
      return await callback(this);
    } catch (error) {
      this.tables = before;
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }

  async $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: unknown[]
  ): Promise<T> {
    if (!this.inTransaction) this.outsideTransactionQueries += 1;
    this.calls.push({ query, values });
    if (
      this.failOnQueryNumber !== null &&
      this.calls.length === this.failOnQueryNumber
    ) {
      throw new Error("INJECTED_PRISMA_FAILURE");
    }
    if (query.startsWith("INSERT INTO")) {
      return this.insert(query, values) as T;
    }
    if (query.includes("pg_advisory_xact_lock")) {
      return [{ locked: this.advisoryLockResult }] as T;
    }
    if (query.startsWith("SELECT")) {
      return this.select(query, values) as T;
    }
    if (query.includes('UPDATE "CatalogSupplierOfferV2" AS offer')) {
      return this.updateLatestObservation(values) as T;
    }
    if (query.includes('UPDATE "CatalogProductRevisionV2" AS revision')) {
      if (this.throwOnSealedRevisionUpdate) {
        throw new Error("SIMULATED_CATALOG_PRODUCT_REVISION_IS_SEALED");
      }
      return this.updateSeal(values) as T;
    }
    throw new Error("UNEXPECTED_SQL");
  }

  private insert(query: string, values: unknown[]): DbRow[] {
    const match = query.match(
      /^INSERT INTO "([A-Za-z][A-Za-z0-9]*)" \(([^)]+)\) VALUES/
    );
    assert.ok(match);
    const table = match[1];
    const columns = [...match[2].matchAll(/"([A-Za-z][A-Za-z0-9]*)"/g)].map(
      (columnMatch) => columnMatch[1]
    );
    assert.equal(columns.length, values.length);
    const row = Object.fromEntries(
      columns.map((column, index) => [column, structuredClone(values[index])])
    );
    const keyColumns = COMPOSITE_KEYS[table] ?? ["id"];
    const existing = this.table(table).find((candidate) =>
      keyColumns.every((column) =>
        valuesEqual(candidate[column], row[column])
      )
    );
    if (existing) {
      if (this.throwOnInsertConflict) {
        throw new Error("SIMULATED_BEFORE_INSERT_TRIGGER_CONFLICT");
      }
      return [];
    }
    this.table(table).push(row);
    this.insertedTables.add(table);
    return [structuredClone(row)];
  }

  private select(query: string, values: unknown[]): DbRow[] {
    const tableMatch = query.match(/FROM "([A-Za-z][A-Za-z0-9]*)"/);
    assert.ok(tableMatch);
    const predicates = [...query.matchAll(/"([A-Za-z][A-Za-z0-9]*)" = \$(\d+)/g)];
    return this.table(tableMatch[1])
      .filter((row) =>
        predicates.every((predicate) =>
          valuesEqual(row[predicate[1]], values[Number(predicate[2]) - 1])
        )
      )
      .map((row) => structuredClone(row));
  }

  private updateLatestObservation(values: unknown[]): DbRow[] {
    const [offerId, observationId, updatedAt] = values;
    const offer = this.table("CatalogSupplierOfferV2").find((row) =>
      valuesEqual(row.id, offerId)
    );
    const target = this.table("CatalogSupplierOfferObservationV2").find(
      (row) => valuesEqual(row.id, observationId)
    );
    if (
      !offer ||
      !target ||
      !valuesEqual(target.offerId, offer.id) ||
      !valuesEqual(target.storeId, offer.storeId) ||
      dateMillis(target.observedAt) > dateMillis(updatedAt)
    ) {
      return [];
    }
    const observations = this.table("CatalogSupplierOfferObservationV2").filter(
      (row) =>
        valuesEqual(row.offerId, offer.id) &&
        valuesEqual(row.storeId, offer.storeId)
    );
    if (
      observations.some(
        (row) => compareObservationRows(row, target) > 0
      )
    ) {
      return [];
    }
    const current = observations.find((row) =>
      valuesEqual(row.id, offer.latestObservationId)
    );
    const allowed =
      offer.latestObservationId === null ||
      (valuesEqual(offer.latestObservationId, observationId) &&
        valuesEqual(offer.updatedAt, updatedAt)) ||
      (current !== undefined &&
        compareObservationRows(current, target) < 0);
    if (!allowed) return [];
    offer.latestObservationId = observationId;
    offer.updatedAt = structuredClone(updatedAt);
    return [
      {
        id: offer.id,
        latestObservationId: offer.latestObservationId,
        updatedAt: structuredClone(offer.updatedAt),
      },
    ];
  }

  private updateSeal(values: unknown[]): DbRow[] {
    const [revisionId, sealedAt] = values;
    const revision = this.table("CatalogProductRevisionV2").find((row) =>
      valuesEqual(row.id, revisionId)
    );
    if (
      !revision ||
      (revision.sealedAt !== null &&
        !valuesEqual(revision.sealedAt, sealedAt))
    ) {
      return [];
    }
    revision.sealedAt = structuredClone(sealedAt);
    return [{ id: revision.id, sealedAt: structuredClone(sealedAt) }];
  }

  private table(table: string): DbRow[] {
    const rows = this.tables.get(table) ?? [];
    if (!this.tables.has(table)) this.tables.set(table, rows);
    return rows;
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date || right instanceof Date) {
    return dateMillis(left) === dateMillis(right);
  }
  if (typeof left === "bigint" || typeof right === "bigint") {
    return String(left) === String(right);
  }
  return left === right;
}

function dateMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return new Date(value).getTime();
  return Number.NaN;
}

function compareObservationRows(left: DbRow, right: DbRow): number {
  const timestampDifference =
    dateMillis(left.observedAt) - dateMillis(right.observedAt);
  if (timestampDifference !== 0) return timestampDifference;
  const leftKey = String(left.stableKey);
  const rightKey = String(right.stableKey);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function referencedTables(sql: string): Set<string> {
  return new Set(
    [...sql.matchAll(/(?:FROM|INTO|UPDATE|JOIN)\s+"([A-Za-z][A-Za-z0-9]*)"/g)].map(
      (match) => match[1]
    )
  );
}

function insertTable(sql: string): string {
  const match = sql.match(/^INSERT INTO "([A-Za-z][A-Za-z0-9]*)"/);
  assert.ok(match);
  return match[1];
}

function insertColumns(sql: string): string[] {
  const match = sql.match(
    /^INSERT INTO "[A-Za-z][A-Za-z0-9]*" \(([^)]+)\) VALUES/
  );
  assert.ok(match);
  return [...match[1].matchAll(/"([A-Za-z][A-Za-z0-9]*)"/g)].map(
    (columnMatch) => columnMatch[1]
  );
}

function repositoryErrorHasCode(
  error: unknown,
  code: CatalogPersistenceRepositoryErrorV2["code"]
): boolean {
  return error instanceof CatalogPersistenceRepositoryErrorV2 && error.code === code;
}
