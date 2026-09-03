import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
  canonicalStoreFactoryV2ConnectionTarget,
  databaseIdentityFingerprint,
  decideStoreFactoryV2SchemaApply,
  formatStoreFactoryV2ConnectionTarget,
  inspectStoreFactoryV2Ddl,
  inspectStoreFactoryV2DdlBundle,
  inspectStoreFactoryV2Schema,
  makeCompleteStoreFactoryV2Inspection,
  readStoreFactoryV2SchemaCapability,
  recognizableStoreFactoryV2PoolerSignal,
  storeFactoryV2DatabaseTargetFingerprint,
  storeFactoryV2DdlBundleFingerprint,
  validateStoreFactoryV2ApplyTarget,
} from "./store-factory-v2-schema";

test("schema capability is absent until the manual additive migrations run", () => {
  const report = inspectStoreFactoryV2Schema({
    tables: ["Store", "Product", "Wishlist", "WishlistItem"],
    columns: [],
    checks: [],
    foreignKeys: [],
    triggers: [],
    functions: [],
    indexes: [],
  });
  assert.equal(report.status, "ABSENT");
  assert.equal(report.persistenceEnabled, false);
});

test("complete capability requires tables, columns, guards and ready indexes", () => {
  const report = inspectStoreFactoryV2Schema(
    makeCompleteStoreFactoryV2Inspection()
  );
  assert.equal(report.status, "COMPLETE");
  assert.equal(report.missing.length, 0);
  assert.equal(report.incompatible.length, 0);
  assert.equal(report.satisfied, report.expected);
  assert.equal(report.persistenceEnabled, true);
});

test("partial or disabled integrity artifacts fail closed", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const report = inspectStoreFactoryV2Schema({
    ...complete,
    columns: complete.columns.filter(
      (column) =>
        !(
          column.tableName === "CatalogSupplierOfferObservationV2" &&
          column.columnName === "sourcePayloadDigest"
        )
    ),
    triggers: complete.triggers.map((trigger, index) =>
      index === 0 ? { ...trigger, enabledMode: "D" } : trigger
    ),
  });
  assert.equal(report.status, "PARTIAL");
  assert.equal(report.persistenceEnabled, false);
  assert.ok(
    report.missing.includes(
      "column public.CatalogSupplierOfferObservationV2.sourcePayloadDigest"
    )
  );
  assert.equal(report.incompatible.length, 1);
});

test("COMPLETE refuses an unvalidated tenant foreign key", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const report = inspectStoreFactoryV2Schema({
    ...complete,
    foreignKeys: complete.foreignKeys.map((foreignKey, index) =>
      index === 0 ? { ...foreignKey, validated: false } : foreignKey
    ),
  });

  assert.equal(report.status, "PARTIAL");
  assert.equal(report.persistenceEnabled, false);
  assert.deepEqual(report.incompatible, [
    `foreign key ${complete.foreignKeys[0]!.name} is not validated`,
  ]);
});

test("COMPLETE requires the exact foreign-key graph, actions and ordering", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const targetIndex = complete.foreignKeys.findIndex(
    (foreignKey) => foreignKey.name === "CatalogProductV2_legacy_scope_fkey"
  );
  assert.notEqual(targetIndex, -1);
  const target = complete.foreignKeys[targetIndex]!;
  const incompatibleDefinitions = [
    { ...target, tableName: "CatalogArtifactV2" },
    { ...target, columns: [...target.columns].reverse() },
    { ...target, referencedTableName: "CatalogProductV2" },
    { ...target, referencedColumns: [...target.referencedColumns].reverse() },
    { ...target, updateAction: "a" },
    { ...target, deleteAction: "c" },
  ];

  for (const incompatibleDefinition of incompatibleDefinitions) {
    const foreignKeys = [...complete.foreignKeys];
    foreignKeys[targetIndex] = incompatibleDefinition;
    const report = inspectStoreFactoryV2Schema({ ...complete, foreignKeys });
    assert.equal(report.status, "PARTIAL");
    assert.equal(report.persistenceEnabled, false);
    assert.deepEqual(report.incompatible, [
      `foreign key ${target.name} has incompatible definition`,
    ]);
  }

  const duplicateReport = inspectStoreFactoryV2Schema({
    ...complete,
    foreignKeys: [...complete.foreignKeys, target],
  });
  assert.deepEqual(duplicateReport.incompatible, [
    `foreign key ${target.name} is ambiguous`,
  ]);
});

test("COMPLETE requires exact trigger bindings and origin-or-always mode", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const targetIndex = complete.triggers.findIndex(
    (trigger) => trigger.name === "guardCatalogTaxonomyPlacementArtifactScopeV2"
  );
  assert.notEqual(targetIndex, -1);
  const target = complete.triggers[targetIndex]!;

  for (const incompatibleBinding of [
    { ...target, tableName: "CatalogCollectionItemV2" },
    { ...target, functionName: "guardCatalogMediaVariantScopeV2" },
  ]) {
    const triggers = [...complete.triggers];
    triggers[targetIndex] = incompatibleBinding;
    const report = inspectStoreFactoryV2Schema({ ...complete, triggers });
    assert.equal(report.status, "PARTIAL");
    assert.deepEqual(report.incompatible, [
      `trigger ${target.name} has incompatible binding`,
    ]);
  }

  for (const enabledMode of ["R", "D"]) {
    const triggers = [...complete.triggers];
    triggers[targetIndex] = { ...target, enabledMode };
    const report = inspectStoreFactoryV2Schema({ ...complete, triggers });
    assert.equal(report.status, "PARTIAL");
    assert.deepEqual(report.incompatible, [
      `trigger ${target.name} has unsupported enabled mode ${enabledMode}`,
    ]);
  }

  const alwaysEnabled = inspectStoreFactoryV2Schema({
    ...complete,
    triggers: complete.triggers.map((trigger) => ({
      ...trigger,
      enabledMode: "A",
    })),
  });
  assert.equal(alwaysEnabled.status, "COMPLETE");
});

test("COMPLETE refuses semantic drift in columns, checks, functions, triggers and indexes", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const cases = [
    {
      ...complete,
      columnContracts: complete.columnContracts?.map((contract, index) =>
        index === 0 ? { ...contract, fingerprint: "drift" } : contract
      ),
    },
    {
      ...complete,
      checks: complete.checks.map((check, index) =>
        index === 0 ? { ...check, definitionFingerprint: "drift" } : check
      ),
    },
    {
      ...complete,
      functionContracts: complete.functionContracts?.map((contract, index) =>
        index === 0 ? { ...contract, fingerprint: "drift" } : contract
      ),
    },
    {
      ...complete,
      triggers: complete.triggers.map((trigger, index) =>
        index === 0 ? { ...trigger, timing: "AFTER" } : trigger
      ),
    },
    {
      ...complete,
      indexes: complete.indexes.map((indexContract, index) =>
        index === 0
          ? { ...indexContract, definitionFingerprint: "drift" }
          : indexContract
      ),
    },
  ];

  for (const inspection of cases) {
    const report = inspectStoreFactoryV2Schema(inspection);
    assert.equal(report.status, "PARTIAL");
    assert.equal(report.persistenceEnabled, false);
    assert.ok(report.incompatible.length >= 1);
  }
});

test("COMPLETE requires exact index owners, ordered keys, uniqueness and predicates", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const sourceIndexPosition = complete.indexes.findIndex(
    (index) => index.name === "CatalogArtifactV2_source_identity_key"
  );
  const partialIndexPosition = complete.indexes.findIndex(
    (index) => index.name === "CatalogMediaAssetV2_one_public_primary_key"
  );
  assert.notEqual(sourceIndexPosition, -1);
  assert.notEqual(partialIndexPosition, -1);
  const sourceIndex = complete.indexes[sourceIndexPosition]!;
  const partialIndex = complete.indexes[partialIndexPosition]!;

  for (const [position, incompatibleDefinition] of [
    [sourceIndexPosition, { ...sourceIndex, tableName: "CatalogProductV2" }],
    [sourceIndexPosition, { ...sourceIndex, columns: [...sourceIndex.columns].reverse() }],
    [sourceIndexPosition, { ...sourceIndex, unique: false }],
    [sourceIndexPosition, { ...sourceIndex, predicate: '"storeId" IS NOT NULL' }],
    [partialIndexPosition, { ...partialIndex, predicate: null }],
  ] as const) {
    const indexes = [...complete.indexes];
    indexes[position] = incompatibleDefinition;
    const report = inspectStoreFactoryV2Schema({ ...complete, indexes });
    assert.equal(report.status, "PARTIAL");
    assert.equal(report.persistenceEnabled, false);
    assert.deepEqual(report.incompatible, [
      `index ${incompatibleDefinition.name} has incompatible definition`,
    ]);
  }

  const postgresFormattedPredicate = [...complete.indexes];
  postgresFormattedPredicate[partialIndexPosition] = {
    ...partialIndex,
    predicate:
      `(("role" = 'PRIMARY'::text) AND ` +
      `("publicationState" = 'PUBLIC_READY'::text))`,
  };
  assert.equal(
    inspectStoreFactoryV2Schema({
      ...complete,
      indexes: postgresFormattedPredicate,
    }).status,
    "COMPLETE"
  );
});

test("read-only capability inspection loads all exact PostgreSQL metadata", async () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const responses: unknown[] = [
    complete.tables.map((table_name) => ({ table_name })),
    complete.columns.map((column) => ({
      table_name: column.tableName,
      column_name: column.columnName,
      data_type: column.dataType ?? "text",
      nullable: column.nullable ?? true,
      default_expression: column.defaultExpression ?? null,
      identity: column.identity ?? "",
      generated: column.generated ?? "",
    })),
    complete.checks.map((check) => ({
      constraint_name: check.name,
      table_name: check.tableName,
      validated: check.validated,
      definition: "CHECK (true)",
    })),
    complete.foreignKeys.map((foreignKey) => ({
      constraint_name: foreignKey.name,
      table_name: foreignKey.tableName,
      columns: foreignKey.columns,
      referenced_table_name: foreignKey.referencedTableName,
      referenced_columns: foreignKey.referencedColumns,
      update_action: foreignKey.updateAction,
      delete_action: foreignKey.deleteAction,
      validated: foreignKey.validated,
    })),
    complete.triggers.map((trigger) => ({
      trigger_name: trigger.name,
      table_name: trigger.tableName,
      function_name: trigger.functionName,
      enabled_mode: trigger.enabledMode,
      timing: trigger.timing,
      events: trigger.events,
      row_level: trigger.rowLevel,
      when_expression: trigger.whenExpression,
      argument_count: trigger.argumentCount,
      definition: `CREATE TRIGGER ${trigger.name}`,
    })),
    (complete.functionContracts ?? []).map(({ name: function_name }) => ({
      function_name,
      identity_arguments: "",
      result_type: "trigger",
      language: "plpgsql",
      volatility: "v",
      security_definer: false,
      leakproof: false,
      strict: false,
      parallel: "u",
      config: null,
      source: "BEGIN RETURN NEW; END",
    })),
    complete.indexes.map((index) => ({
      index_name: index.name,
      table_name: index.tableName,
      columns: index.columns,
      is_unique: index.unique,
      predicate: index.predicate,
      valid: index.valid,
      ready: index.ready,
      definition: `CREATE INDEX ${index.name}`,
    })),
  ];
  const queries: string[] = [];
  const values: unknown[][] = [];
  let queryIndex = 0;
  const report = await readStoreFactoryV2SchemaCapability({
    async $queryRawUnsafe<T>(query: string, ...queryValues: unknown[]) {
      queries.push(query);
      values.push(queryValues);
      return responses[queryIndex++] as T;
    },
  });

  assert.equal(report.status, "PARTIAL");
  assert.match(queries[3]!, /con\.conkey::smallint\[\]/);
  assert.match(queries[3]!, /con\.confkey::smallint\[\]/);
  assert.match(queries[3]!, /con\.confupdtype::text/);
  assert.match(queries[3]!, /con\.confdeltype::text/);
  assert.match(queries[4]!, /proc\.proname::text AS function_name/);
  assert.match(queries[4]!, /function_namespace\.nspname = 'public'/);
  assert.match(queries[4]!, /pg_catalog\.pg_get_triggerdef/);
  assert.match(queries[5]!, /pg_catalog\.pg_get_function_identity_arguments/);
  assert.match(queries[5]!, /proc\.prosecdef AS security_definer/);
  assert.match(queries[6]!, /ind\.indkey::smallint\[\]/);
  assert.match(queries[6]!, /ind\.indisunique AS is_unique/);
  assert.match(queries[6]!, /pg_catalog\.pg_get_expr\(ind\.indpred/);
  assert.match(queries[6]!, /pg_catalog\.pg_get_indexdef/);
  assert.ok(
    (values[3]![0] as string[]).every((name) => typeof name === "string")
  );
});

test("manual apply requires exact target and DDL bundle fingerprints", () => {
  const report = makeCompleteStoreFactoryV2Inspection();
  const capability = inspectStoreFactoryV2Schema(report);
  const target = databaseIdentityFingerprint({
    serverAddress: "127.0.0.1/32",
    serverPort: 5432,
    databaseName: "disposable",
    databaseUser: "tester",
    serverVersionNumber: "180004",
  });
  const ddl = storeFactoryV2DdlBundleFingerprint({
    version: STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
    files: [{ name: "one.sql", sql: "BEGIN;\nSELECT 1;\nCOMMIT;" }],
  });

  assert.equal(
    decideStoreFactoryV2SchemaApply({
      report: capability,
      targetFingerprint: target,
      ddlFingerprint: ddl,
    }),
    "REFUSE_TARGET_CONFIRMATION"
  );
  assert.equal(
    decideStoreFactoryV2SchemaApply({
      report: capability,
      targetFingerprint: target,
      confirmedTargetFingerprint: target,
      ddlFingerprint: ddl,
      confirmedDdlFingerprint: "sha256:wrong",
    }),
    "REFUSE_DDL_CONFIRMATION"
  );
  assert.equal(
    decideStoreFactoryV2SchemaApply({
      report: capability,
      targetFingerprint: target,
      confirmedTargetFingerprint: target,
      ddlFingerprint: ddl,
      confirmedDdlFingerprint: ddl,
    }),
    "NOOP_COMPLETE"
  );
});

test("manual target fingerprint binds a secret-free canonical connection target and runtime identity", () => {
  const url =
    "postgres://alice:do-not-print@DB.Example.COM.:5432/store%2Dcanary?sslmode=require&token=secret";
  const connectionTarget = canonicalStoreFactoryV2ConnectionTarget(url);
  assert.deepEqual(connectionTarget, {
    scheme: "postgresql",
    host: "db.example.com",
    port: 5432,
    database: "store-canary",
  });
  const descriptor = formatStoreFactoryV2ConnectionTarget(connectionTarget);
  assert.equal(descriptor, "postgresql://db.example.com:5432/store-canary");
  assert.doesNotMatch(descriptor, /alice|do-not-print|token|secret|sslmode/);

  const databaseIdentity = {
    serverAddress: "10.0.0.7",
    serverPort: 5432,
    databaseName: "store-canary",
    databaseUser: "migration_actor",
    serverVersionNumber: "180004",
  };
  const fingerprint = storeFactoryV2DatabaseTargetFingerprint({
    connectionTarget,
    databaseIdentity,
  });
  const sameTargetWithDifferentSecrets = storeFactoryV2DatabaseTargetFingerprint({
    connectionTarget: canonicalStoreFactoryV2ConnectionTarget(
      "postgresql://bob:different@db.example.com/store-canary?password=hidden"
    ),
    databaseIdentity,
  });
  assert.equal(fingerprint, sameTargetWithDifferentSecrets);

  const switchedEnvironmentTarget = storeFactoryV2DatabaseTargetFingerprint({
    connectionTarget: canonicalStoreFactoryV2ConnectionTarget(
      "postgresql://migration_actor@db-canary.internal/store-canary"
    ),
    databaseIdentity,
  });
  assert.notEqual(fingerprint, switchedEnvironmentTarget);
  assert.notEqual(
    fingerprint,
    storeFactoryV2DatabaseTargetFingerprint({
      connectionTarget: canonicalStoreFactoryV2ConnectionTarget(
        "postgresql://migration_actor@db.example.com/another-database"
      ),
      databaseIdentity,
    })
  );
});

test("manual apply accepts only direct env keys and refuses recognizable poolers", () => {
  const directUrl = "postgresql://actor@db.internal:5432/canary";
  assert.equal(
    validateStoreFactoryV2ApplyTarget({
      urlEnv: "DIRECT_URL",
      connectionString: directUrl,
    }),
    null
  );
  assert.equal(
    validateStoreFactoryV2ApplyTarget({
      urlEnv: "DATABASE_URL_UNPOOLED",
      connectionString: directUrl,
    }),
    null
  );
  assert.equal(
    validateStoreFactoryV2ApplyTarget({
      urlEnv: "DATABASE_URL",
      connectionString: directUrl,
    }),
    "APPLY_URL_ENV_NOT_DIRECT"
  );

  for (const pooledUrl of [
    "postgresql://actor@ep-example-pooler.eu-central-1.aws.neon.tech/canary",
    "postgresql://actor@pgbouncer.internal/canary",
    "postgresql://actor@db.internal:6432/canary",
    "postgresql://actor@db.internal:6543/canary",
    "postgresql://actor@db.internal/canary?pgbouncer=true",
    "postgresql://actor@db.internal/canary?pooling=transaction",
  ]) {
    assert.ok(recognizableStoreFactoryV2PoolerSignal(pooledUrl));
    assert.equal(
      validateStoreFactoryV2ApplyTarget({
        urlEnv: "DIRECT_URL",
        connectionString: pooledUrl,
      }),
      "APPLY_TARGET_RECOGNIZABLY_POOLED"
    );
  }
});

test("COMPLETE refuses lossy catalog numeric column types", () => {
  const complete = makeCompleteStoreFactoryV2Inspection();
  const report = inspectStoreFactoryV2Schema({
    ...complete,
    columns: complete.columns.map((column) =>
      column.tableName === "CatalogProductRevisionV2" &&
      column.columnName === "retailPriceMinor"
        ? { ...column, dataType: "double precision" }
        : column
    ),
  });

  assert.equal(report.status, "PARTIAL");
  assert.equal(report.persistenceEnabled, false);
  assert.ok(
    report.incompatible.includes(
      "column CatalogProductRevisionV2.retailPriceMinor has type double precision; expected bigint"
    )
  );
});

test("checked-in migrations are additive, transactional and contain required guards", () => {
  const revisionSql = fs.readFileSync(
    new URL(
      "../../../prisma/schema-changes/20260903_store_factory_v2_revision_v1.sql",
      import.meta.url
    ),
    "utf8"
  );
  const catalogSql = fs.readFileSync(
    new URL(
      "../../../prisma/schema-changes/20260903_catalog_core_v2_v1.sql",
      import.meta.url
    ),
    "utf8"
  );
  const hardeningSql = fs.readFileSync(
    new URL(
      "../../../prisma/schema-changes/20260903_store_factory_v2_persistence_hardening_v2_1.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.deepEqual(inspectStoreFactoryV2DdlBundle({
    version: STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
    files: [
      { name: "20260903_catalog_core_v2_v1.sql", sql: catalogSql },
      { name: "20260903_store_factory_v2_revision_v1.sql", sql: revisionSql },
      {
        name: "20260903_store_factory_v2_persistence_hardening_v2_1.sql",
        sql: hardeningSql,
      },
    ],
  }), {
    valid: true,
    problems: [],
  });
  assert.deepEqual(inspectStoreFactoryV2Ddl({ revisionSql, catalogSql }).valid, false);
  assert.match(hardeningSql, /"StoreBuildRun_catalogArtifact_scope_fkey"/);
  assert.match(hardeningSql, /"StoreRevision_catalogArtifact_scope_fkey"/);
  assert.match(
    revisionSql,
    /CREATE TABLE "StoreBuildRun" \([\s\S]*?"outputDigest" TEXT,/
  );
  assert.match(
    revisionSql,
    /CREATE TABLE "StoreRevision" \([\s\S]*?"outputDigest" TEXT NOT NULL,/
  );
  assert.match(
    revisionSql,
    /'outputDigest'\) IS NOT DISTINCT FROM "outputDigest"/
  );
  assert.match(
    revisionSql,
    /"outputDigest" = NEW\."outputDigest"/
  );
  assert.match(
    revisionSql,
    /CONSTRAINT "Wishlist_owner_check" CHECK \([\s\S]*?"anonymousId" IS NOT NULL[\s\S]*?"customerId" IS NOT NULL/
  );
  assert.match(
    revisionSql,
    /CREATE TRIGGER "guardWishlistOwnerScopeV1"[\s\S]*?ON "Wishlist"/
  );
  assert.match(
    revisionSql,
    /CREATE FUNCTION "guardWishlistOwnerScopeV1"\(\)[\s\S]*?customer_store_id <> NEW\."storeId"/
  );
  assert.match(revisionSql, /email is not an owner identity/);
  assert.match(
    revisionSql,
    /CREATE TRIGGER "guardCustomerWishlistScopeV1"[\s\S]*?ON "Customer"/
  );
  assert.match(
    revisionSql,
    /CREATE FUNCTION "setAndGuardWishlistItemKeyV1"\(\)[\s\S]*?FROM "Wishlist"[\s\S]*?FROM "Product"[\s\S]*?wishlist_store_id <> product_store_id/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogArtifactV2" \([\s\S]*?"sourceKind" TEXT NOT NULL,[\s\S]*?"sourceRef" TEXT NOT NULL,[\s\S]*?"artifactJson" TEXT NOT NULL,[\s\S]*?"contentDigest" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /"sourceKind" = 'REFERENCE_FIXTURE'[\s\S]*?"contractVersion" = 'catalog-reference-fixture\.v2'[\s\S]*?"sourceKind" = 'CATALOG_PROJECTION'[\s\S]*?"contractVersion" = 'catalog-projection\.v2'/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogVariantIdentityV2" \([\s\S]*?"productId" TEXT NOT NULL,[\s\S]*?"stableKey" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogProductRevisionV2" \([\s\S]*?"artifactId" TEXT NOT NULL,[\s\S]*?"artifactRevisionRef" TEXT NOT NULL,[\s\S]*?"revisionNumber" BIGINT NOT NULL,[\s\S]*?"retailPriceMinor" BIGINT,[\s\S]*?"reasonCodesJson" TEXT NOT NULL[\s\S]*?"sealedAt" TIMESTAMP\(3\)/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogSellableVariantV2" \([\s\S]*?"variantIdentityId" TEXT NOT NULL,[\s\S]*?"retailPriceMinor" BIGINT,[\s\S]*?"isDefault" BOOLEAN NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogTaxonomyNodeV2" \([\s\S]*?"artifactId" TEXT NOT NULL,[\s\S]*?"taxonomyRef" TEXT NOT NULL,[\s\S]*?"contractVersion" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogAttributeDefinitionV2" \([\s\S]*?"productRevisionId" TEXT NOT NULL,[\s\S]*?"stableKey" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogProductAttributeValueV2" \([\s\S]*?"assignmentScopeKey" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogCollectionV2" \([\s\S]*?"artifactId" TEXT NOT NULL,[\s\S]*?"stableKey" TEXT NOT NULL,[\s\S]*?"contractVersion" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogMediaAssetV2" \([\s\S]*?"stableKey" TEXT NOT NULL,[\s\S]*?"focalX" DOUBLE PRECISION,[\s\S]*?"focalY" DOUBLE PRECISION/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogPurchaseOptionV2" \([\s\S]*?"quantity" BIGINT NOT NULL,[\s\S]*?"repeatPurchaseState" TEXT NOT NULL,[\s\S]*?"repeatIntervalDaysJson" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogEvidenceV2" \([\s\S]*?"productRevisionId" TEXT NOT NULL,[\s\S]*?"stableKey" TEXT NOT NULL,[\s\S]*?"contentDigest" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogSupplierOfferV2" \([\s\S]*?"variantIdentityId" TEXT,[\s\S]*?"stableKey" TEXT NOT NULL/
  );
  assert.match(
    catalogSql,
    /CREATE TABLE "CatalogSupplierOfferObservationV2" \([\s\S]*?"stableKey" TEXT NOT NULL,[\s\S]*?"unitCostMinor" BIGINT,[\s\S]*?"inventoryQuantity" BIGINT/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogRevisionChildInsertV2"\(\)[\s\S]*?CATALOG_PRODUCT_REVISION_IS_SEALED/
  );
  for (const trigger of [
    "guardCatalogVariantRevisionOpenV2",
    "guardCatalogTaxonomyPlacementRevisionOpenV2",
    "guardCatalogAttributeDefinitionRevisionOpenV2",
    "guardCatalogAttributeValueRevisionOpenV2",
    "guardCatalogCollectionItemRevisionOpenV2",
    "guardCatalogMediaRevisionOpenV2",
    "guardCatalogPurchaseOptionRevisionOpenV2",
    "guardCatalogEvidenceRevisionOpenV2",
  ]) {
    assert.match(
      catalogSql,
      new RegExp(
        `CREATE TRIGGER "${trigger}"[\\s\\S]*?guardCatalogRevisionChildInsertV2`
      )
    );
  }
  for (const trigger of [
    "guardCatalogAttributeOptionRevisionOpenV2",
    "guardCatalogTaxonomyAttributeRevisionOpenV2",
  ]) {
    assert.match(
      catalogSql,
      new RegExp(
        `CREATE TRIGGER "${trigger}"[\\s\\S]*?guardCatalogDefinitionChildInsertV2`
      )
    );
  }
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogTaxonomyProvenanceV2"\(\)[\s\S]*?artifact_taxonomy_ref[\s\S]*?artifact_taxonomy_contract[\s\S]*?CATALOG_TAXONOMY_PROVENANCE_MISMATCH/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogVariantIdentityScopeV2"\(\)[\s\S]*?revision_product_id <> identity_product_id[\s\S]*?NEW\."stableKey" <> identity_stable_key/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogArtifactScopeV2"\(\)[\s\S]*?CatalogProductTaxonomyPlacementV2[\s\S]*?CatalogTaxonomyAttributeDefinitionV2[\s\S]*?CatalogCollectionItemV2[\s\S]*?CATALOG_ARTIFACT_SCOPE_MISMATCH/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogAttributeValueScopeV2"\(\)[\s\S]*?definition_revision_id <> NEW\."productRevisionId"[\s\S]*?COALESCE\(NEW\."variantId", 'PRODUCT'\)[\s\S]*?CATALOG_ATTRIBUTE_VALUE_ASSIGNMENT_KEY_MISMATCH/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogOfferVariantScopeV2"\(\)[\s\S]*?NEW\."variantIdentityId"[\s\S]*?FROM "CatalogVariantIdentityV2"/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogPurchaseOptionScopeV2"\(\)[\s\S]*?variant_revision_id <> NEW\."productRevisionId"/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "guardCatalogMediaVariantScopeV2"\(\)[\s\S]*?"sealedAt"[\s\S]*?CATALOG_PRODUCT_REVISION_IS_SEALED/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "sealCatalogProductRevisionV2"\(\)[\s\S]*?OLD\."sealedAt" IS NULL[\s\S]*?NEW\."sealedAt" IS NOT NULL[\s\S]*?to_jsonb\(NEW\) - 'sealedAt'[\s\S]*?CATALOG_PRODUCT_REVISION_IS_IMMUTABLE/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "assertCatalogRevisionGraphCompleteV2"\([\s\S]*?CATALOG_REVISION_DEFAULT_VARIANT_INCOMPLETE[\s\S]*?CATALOG_REVISION_TAXONOMY_INCOMPLETE[\s\S]*?CATALOG_REVISION_REQUIRED_ATTRIBUTE_INCOMPLETE[\s\S]*?CATALOG_REVISION_ENUM_OPTIONS_INCOMPLETE[\s\S]*?CATALOG_REVISION_VARIANT_MEDIA_INCOMPLETE[\s\S]*?CATALOG_REVISION_EVIDENCE_REFERENCE_INCOMPLETE/
  );
  assert.match(
    catalogSql,
    /CREATE FUNCTION "sealCatalogProductRevisionV2"\(\)[\s\S]*?PERFORM "assertCatalogRevisionGraphCompleteV2"\(NEW\."id", NEW\."storeId"\)/
  );
  assert.match(
    catalogSql,
    /CREATE TRIGGER "rejectCatalogProductRevisionMutationV2"[\s\S]*?EXECUTE FUNCTION "sealCatalogProductRevisionV2"\(\)/
  );
  for (const trigger of [
    "rejectCatalogArtifactMutationV2",
    "rejectCatalogVariantIdentityMutationV2",
    "rejectCatalogVariantMutationV2",
    "rejectCatalogTaxonomyNodeMutationV2",
    "rejectCatalogTaxonomyPlacementMutationV2",
    "rejectCatalogAttributeDefinitionMutationV2",
    "rejectCatalogTaxonomyAttributeMutationV2",
    "rejectCatalogAttributeOptionMutationV2",
    "rejectCatalogAttributeValueMutationV2",
    "rejectCatalogCollectionMutationV2",
    "rejectCatalogCollectionItemMutationV2",
    "rejectCatalogMediaMutationV2",
    "rejectCatalogMediaVariantMutationV2",
    "rejectCatalogPurchaseOptionMutationV2",
    "rejectCatalogEvidenceMutationV2",
    "rejectCatalogOfferObservationMutationV2",
  ]) {
    assert.match(
      catalogSql,
      new RegExp(
        `CREATE TRIGGER "${trigger}"[\\s\\S]*?rejectCatalogImmutableMutationV2`
      )
    );
  }
  assert.match(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogArtifactV2_source_identity_key"/
  );
  assert.match(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogRevisionV2_artifact_ref_key"/
  );
  assert.match(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogAttributeDefinitionV2_productRevisionId_stableKey_key"/
  );
  assert.match(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogAttrValueV2_revision_scope_definition_key"/
  );
  assert.match(
    catalogSql,
    /CREATE INDEX "CatalogOfferV2_store_source_idx"/
  );
  assert.match(
    catalogSql,
    /CREATE INDEX "CatalogOfferObsV2_offer_payload_digest_idx"/
  );
  assert.doesNotMatch(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogSupplierOfferV2_storeId_supplierAccountRef_sourceOfferRef_key"/
  );
  assert.doesNotMatch(
    catalogSql,
    /CREATE UNIQUE INDEX "CatalogSupplierOfferObservationV2_offerId_sourcePayloadDigest_key"/
  );
  assert.match(
    catalogSql,
    /CONSTRAINT "CatalogMediaAssetV2_contract_check"[\s\S]*?"publicUrl" ~ '\^https:\/\/'[\s\S]*?"sourceUrl" ~ '\^https:\/\/'/
  );

  for (const sql of [revisionSql, catalogSql]) {
    for (const match of sql.matchAll(
      /(?:CREATE (?:UNIQUE )?INDEX|ADD CONSTRAINT|CREATE TRIGGER|CREATE FUNCTION) "([^"]+)"/g
    )) {
      assert.ok(
        Buffer.byteLength(match[1]!, "utf8") <= 63,
        `PostgreSQL identifier exceeds 63 bytes: ${match[1]}`
      );
    }
  }
});
