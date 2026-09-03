BEGIN;

CREATE TABLE "CatalogRefreshExecution" (
    "id" TEXT NOT NULL,
    "catalogJobId" TEXT NOT NULL,
    "catalogJobAttempt" INTEGER NOT NULL,
    "catalogSyncRunId" TEXT,
    "storeId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'SHADOW',
    "handlerOutcome" TEXT NOT NULL,
    "settlementStatus" TEXT NOT NULL,
    "settlementCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "selected" INTEGER NOT NULL DEFAULT 0,
    "scanned" INTEGER NOT NULL DEFAULT 0,
    "skippedFresh" INTEGER NOT NULL DEFAULT 0,
    "observed" INTEGER NOT NULL DEFAULT 0,
    "baselineCaptured" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "proposed" INTEGER NOT NULL DEFAULT 0,
    "reviewRequired" INTEGER NOT NULL DEFAULT 0,
    "sourceUnavailable" INTEGER NOT NULL DEFAULT 0,
    "scanCursorStart" TEXT,
    "scanCursorNext" TEXT,
    "scanCursorRevisionStart" INTEGER NOT NULL DEFAULT 0,
    "scanWrapped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRefreshExecution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogRefreshExecution_contract_check" CHECK (
      "catalogJobAttempt" > 0
      AND length(btrim("catalogJobId")) > 0
      AND length(btrim("storeId")) > 0
      AND length(btrim("providerKey")) > 0
      AND "mode" = 'SHADOW'
      AND "handlerOutcome" IN ('SUCCESS', 'PARTIAL', 'SOURCE_UNAVAILABLE')
      AND "settlementStatus" IN ('SUCCESS', 'RETRY', 'FAILED')
      AND length(btrim("settlementCode")) > 0
      AND "completedAt" >= "startedAt"
      AND "selected" >= 0
      AND "scanned" >= 0
      AND "skippedFresh" >= 0
      AND "observed" >= 0
      AND "baselineCaptured" >= 0
      AND "unchanged" >= 0
      AND "proposed" >= 0
      AND "reviewRequired" >= 0
      AND "sourceUnavailable" >= 0
      AND "scanCursorRevisionStart" >= 0
      AND "selected" = "observed" + "sourceUnavailable"
      AND "selected" = "baselineCaptured" + "unchanged" + "proposed" + "reviewRequired" + "sourceUnavailable"
      AND "selected" + "skippedFresh" <= "scanned"
      AND (
        ("handlerOutcome" = 'SUCCESS' AND "sourceUnavailable" = 0)
        OR ("handlerOutcome" = 'PARTIAL' AND "observed" > 0 AND "sourceUnavailable" > 0)
        OR ("handlerOutcome" = 'SOURCE_UNAVAILABLE' AND "observed" = 0 AND "sourceUnavailable" > 0)
      )
    )
);

CREATE TABLE "CatalogSupplierObservation" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceStatus" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "productRevisionAt" TIMESTAMP(3) NOT NULL,
    "storefrontRevisionFingerprint" TEXT NOT NULL,
    "snapshotVersion" TEXT,
    "snapshotFingerprint" TEXT,
    "snapshotJson" TEXT,
    "reasonCodesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogSupplierObservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogSupplierObservation_contract_check" CHECK (
      length(btrim("executionId")) > 0
      AND length(btrim("storeId")) > 0
      AND length(btrim("productId")) > 0
      AND length(btrim("providerKey")) > 0
      AND length(btrim("externalId")) > 0
      AND "idempotencyKey" ~ '^[0-9a-f]{64}$'
      AND "storefrontRevisionFingerprint" ~ '^[0-9a-f]{64}$'
      AND octet_length("reasonCodesJson") <= 128000
      AND jsonb_typeof("reasonCodesJson"::jsonb) = 'array'
      AND ("snapshotJson" IS NULL OR (
        octet_length("snapshotJson") <= 256000
        AND jsonb_typeof("snapshotJson"::jsonb) = 'object'
      ))
      AND (
        (
          "sourceStatus" = 'AVAILABLE'
          AND "snapshotVersion" = 'supplier-product-snapshot.v1'
          AND "snapshotFingerprint" ~ '^[0-9a-f]{64}$'
          AND "snapshotJson" IS NOT NULL
        )
        OR (
          "sourceStatus" = 'SOURCE_UNAVAILABLE'
          AND "snapshotVersion" IS NULL
          AND "snapshotFingerprint" IS NULL
          AND "snapshotJson" IS NULL
          AND jsonb_array_length("reasonCodesJson"::jsonb) > 0
        )
      )
    )
);

CREATE TABLE "CatalogRefreshProposal" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "proposalFingerprint" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "alignmentStatus" TEXT NOT NULL,
    "reasonCodesJson" TEXT NOT NULL DEFAULT '[]',
    "changesJson" TEXT NOT NULL DEFAULT '[]',
    "alignmentJson" TEXT NOT NULL DEFAULT '{}',
    "workflowStatus" TEXT NOT NULL DEFAULT 'RECORDED',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRefreshProposal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogRefreshProposal_contract_check" CHECK (
      length(btrim("observationId")) > 0
      AND length(btrim("storeId")) > 0
      AND length(btrim("productId")) > 0
      AND length(btrim("providerKey")) > 0
      AND "contractVersion" = 'catalog-refresh-proposal.v1'
      AND "proposalFingerprint" ~ '^[0-9a-f]{64}$'
      AND "decision" IN ('BASELINE_CAPTURED', 'NO_CHANGE', 'PROPOSED', 'REVIEW_REQUIRED', 'SOURCE_UNAVAILABLE')
      AND "alignmentStatus" IN ('ALIGNED', 'DRIFT', 'PARTIAL', 'NOT_EVALUATED')
      AND "workflowStatus" IN ('RECORDED', 'OPEN', 'NEEDS_REVIEW', 'SOURCE_UNAVAILABLE', 'APPLIED', 'DISMISSED')
      AND octet_length("reasonCodesJson") <= 128000
      AND octet_length("changesJson") <= 128000
      AND octet_length("alignmentJson") <= 128000
      AND jsonb_typeof("reasonCodesJson"::jsonb) = 'array'
      AND jsonb_typeof("changesJson"::jsonb) = 'array'
      AND jsonb_typeof("alignmentJson"::jsonb) = 'object'
    )
);

CREATE TABLE "CatalogProductState" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "latestExecutionId" TEXT NOT NULL,
    "latestObservationId" TEXT NOT NULL,
    "latestProposalId" TEXT,
    "latestDecision" TEXT NOT NULL,
    "latestAlignmentStatus" TEXT NOT NULL,
    "latestSourceStatus" TEXT NOT NULL,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "lastSuccessfulObservationId" TEXT,
    "lastSuccessfulObservationAt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "openProposalId" TEXT,
    "openProposalStatus" TEXT NOT NULL DEFAULT 'NONE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProductState_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogProductState_contract_check" CHECK (
      length(btrim("storeId")) > 0
      AND length(btrim("productId")) > 0
      AND length(btrim("providerKey")) > 0
      AND length(btrim("externalId")) > 0
      AND length(btrim("latestExecutionId")) > 0
      AND length(btrim("latestObservationId")) > 0
      AND "latestDecision" IN ('BASELINE_CAPTURED', 'NO_CHANGE', 'PROPOSED', 'REVIEW_REQUIRED', 'SOURCE_UNAVAILABLE')
      AND "latestAlignmentStatus" IN ('ALIGNED', 'DRIFT', 'PARTIAL', 'NOT_EVALUATED')
      AND "latestSourceStatus" IN ('AVAILABLE', 'SOURCE_UNAVAILABLE')
      AND "consecutiveFailures" >= 0
      AND "openProposalStatus" IN ('NONE', 'OPEN', 'NEEDS_REVIEW')
      AND (
        ("openProposalId" IS NULL AND "openProposalStatus" = 'NONE')
        OR
        ("openProposalId" IS NOT NULL AND "openProposalStatus" IN ('OPEN', 'NEEDS_REVIEW'))
      )
      AND (("lastSuccessfulObservationId" IS NULL) = ("lastSuccessfulObservationAt" IS NULL))
      AND ("latestSourceStatus" <> 'AVAILABLE' OR "consecutiveFailures" = 0)
    )
);

CREATE TABLE "CatalogRefreshCursor" (
    "storeId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "lastProductId" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "lastExecutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogRefreshCursor_pkey" PRIMARY KEY ("storeId", "providerKey"),
    CONSTRAINT "CatalogRefreshCursor_contract_check" CHECK (
      length(btrim("storeId")) > 0
      AND length(btrim("providerKey")) > 0
      AND "revision" >= 0
    )
);

CREATE INDEX "CatalogRefreshExecution_storeId_providerKey_completedAt_id_idx" ON "CatalogRefreshExecution"("storeId", "providerKey", "completedAt", "id");
CREATE INDEX "CatalogRefreshExecution_catalogSyncRunId_idx" ON "CatalogRefreshExecution"("catalogSyncRunId");
CREATE INDEX "CatalogRefreshExecution_settlementStatus_completedAt_idx" ON "CatalogRefreshExecution"("settlementStatus", "completedAt");
CREATE UNIQUE INDEX "CatalogRefreshExecution_catalogJobId_catalogJobAttempt_key" ON "CatalogRefreshExecution"("catalogJobId", "catalogJobAttempt");

CREATE UNIQUE INDEX "CatalogSupplierObservation_idempotencyKey_key" ON "CatalogSupplierObservation"("idempotencyKey");
CREATE INDEX "CatalogSupplierObservation_storeId_providerKey_observedAt_i_idx" ON "CatalogSupplierObservation"("storeId", "providerKey", "observedAt", "id");
CREATE INDEX "CatalogSupplierObservation_productId_providerKey_observedAt_idx" ON "CatalogSupplierObservation"("productId", "providerKey", "observedAt", "id");
CREATE INDEX "CatalogSupplierObservation_providerKey_externalId_observedA_idx" ON "CatalogSupplierObservation"("providerKey", "externalId", "observedAt");
CREATE INDEX "CatalogSupplierObservation_sourceStatus_observedAt_idx" ON "CatalogSupplierObservation"("sourceStatus", "observedAt");
CREATE UNIQUE INDEX "CatalogSupplierObservation_executionId_productId_key" ON "CatalogSupplierObservation"("executionId", "productId");

CREATE UNIQUE INDEX "CatalogRefreshProposal_observationId_key" ON "CatalogRefreshProposal"("observationId");
CREATE INDEX "CatalogRefreshProposal_storeId_workflowStatus_createdAt_id_idx" ON "CatalogRefreshProposal"("storeId", "workflowStatus", "createdAt", "id");
CREATE INDEX "CatalogRefreshProposal_storeId_decision_createdAt_idx" ON "CatalogRefreshProposal"("storeId", "decision", "createdAt");
CREATE INDEX "CatalogRefreshProposal_productId_providerKey_createdAt_idx" ON "CatalogRefreshProposal"("productId", "providerKey", "createdAt");
CREATE INDEX "CatalogRefreshProposal_proposalFingerprint_idx" ON "CatalogRefreshProposal"("proposalFingerprint");

CREATE INDEX "CatalogProductState_storeId_providerKey_lastAttemptAt_idx" ON "CatalogProductState"("storeId", "providerKey", "lastAttemptAt");
CREATE INDEX "CatalogProductState_storeId_openProposalStatus_updatedAt_idx" ON "CatalogProductState"("storeId", "openProposalStatus", "updatedAt");
CREATE INDEX "CatalogProductState_latestSourceStatus_lastAttemptAt_idx" ON "CatalogProductState"("latestSourceStatus", "lastAttemptAt");
CREATE INDEX "CatalogProductState_providerKey_externalId_idx" ON "CatalogProductState"("providerKey", "externalId");
CREATE INDEX "CatalogProductState_openProposalId_idx" ON "CatalogProductState"("openProposalId");
CREATE UNIQUE INDEX "CatalogProductState_productId_providerKey_key" ON "CatalogProductState"("productId", "providerKey");

CREATE INDEX "CatalogRefreshCursor_updatedAt_idx" ON "CatalogRefreshCursor"("updatedAt");
CREATE INDEX "Product_storeId_providerKey_externalId_idx" ON "Product"("storeId", "providerKey", "externalId");

ALTER TABLE "CatalogRefreshExecution" ADD CONSTRAINT "CatalogRefreshExecution_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierObservation" ADD CONSTRAINT "CatalogSupplierObservation_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "CatalogRefreshExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierObservation" ADD CONSTRAINT "CatalogSupplierObservation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierObservation" ADD CONSTRAINT "CatalogSupplierObservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogRefreshProposal" ADD CONSTRAINT "CatalogRefreshProposal_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "CatalogSupplierObservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogRefreshProposal" ADD CONSTRAINT "CatalogRefreshProposal_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogRefreshProposal" ADD CONSTRAINT "CatalogRefreshProposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogProductState" ADD CONSTRAINT "CatalogProductState_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogProductState" ADD CONSTRAINT "CatalogProductState_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogRefreshCursor" ADD CONSTRAINT "CatalogRefreshCursor_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION "guardCatalogRefreshExecutionScope"() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "CatalogJob"
    WHERE "id" = NEW."catalogJobId"
      AND "storeId" = NEW."storeId"
      AND "providerKey" = NEW."providerKey"
      AND "attempts" = NEW."catalogJobAttempt"
  ) THEN
    RAISE EXCEPTION 'Catalog refresh execution does not match its claimed job scope';
  END IF;
  IF NEW."catalogSyncRunId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "CatalogSyncRun" WHERE "id" = NEW."catalogSyncRunId"
  ) THEN
    RAISE EXCEPTION 'Catalog refresh execution references an unknown sync run';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "guardCatalogSupplierObservationScope"() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Product"
    WHERE "id" = NEW."productId"
      AND "storeId" = NEW."storeId"
      AND "providerKey" = NEW."providerKey"
      AND "externalId" = NEW."externalId"
      AND "updatedAt" = NEW."productRevisionAt"
  ) THEN
    RAISE EXCEPTION 'Catalog supplier observation does not match product tenant and supplier identity';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "CatalogRefreshExecution"
    WHERE "id" = NEW."executionId"
      AND "storeId" = NEW."storeId"
      AND "providerKey" = NEW."providerKey"
  ) THEN
    RAISE EXCEPTION 'Catalog supplier observation does not match execution scope';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "guardCatalogRefreshProposalScope"() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "CatalogSupplierObservation"
    WHERE "id" = NEW."observationId"
      AND "storeId" = NEW."storeId"
      AND "productId" = NEW."productId"
      AND "providerKey" = NEW."providerKey"
  ) THEN
    RAISE EXCEPTION 'Catalog refresh proposal does not match observation scope';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "guardCatalogProductStateScope"() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Product"
    WHERE "id" = NEW."productId"
      AND "storeId" = NEW."storeId"
      AND "providerKey" = NEW."providerKey"
      AND "externalId" = NEW."externalId"
  ) THEN
    RAISE EXCEPTION 'Catalog product state does not match product tenant and supplier identity';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "CatalogRefreshExecution"
    WHERE "id" = NEW."latestExecutionId"
      AND "storeId" = NEW."storeId"
      AND "providerKey" = NEW."providerKey"
  ) THEN
    RAISE EXCEPTION 'Catalog product state does not match latest execution scope';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "CatalogSupplierObservation"
    WHERE "id" = NEW."latestObservationId"
      AND "storeId" = NEW."storeId"
      AND "productId" = NEW."productId"
      AND "providerKey" = NEW."providerKey"
      AND "externalId" = NEW."externalId"
  ) THEN
    RAISE EXCEPTION 'Catalog product state does not match latest observation scope';
  END IF;
  IF NEW."latestProposalId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "CatalogRefreshProposal"
    WHERE "id" = NEW."latestProposalId"
      AND "storeId" = NEW."storeId"
      AND "productId" = NEW."productId"
      AND "providerKey" = NEW."providerKey"
  ) THEN
    RAISE EXCEPTION 'Catalog product state does not match latest proposal scope';
  END IF;
  IF NEW."openProposalId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "CatalogRefreshProposal"
    WHERE "id" = NEW."openProposalId"
      AND "storeId" = NEW."storeId"
      AND "productId" = NEW."productId"
      AND "providerKey" = NEW."providerKey"
      AND "workflowStatus" = NEW."openProposalStatus"
      AND "workflowStatus" IN ('OPEN', 'NEEDS_REVIEW')
  ) THEN
    RAISE EXCEPTION 'Catalog product state has an invalid open proposal';
  END IF;
  IF NEW."lastSuccessfulObservationId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "CatalogSupplierObservation"
    WHERE "id" = NEW."lastSuccessfulObservationId"
      AND "storeId" = NEW."storeId"
      AND "productId" = NEW."productId"
      AND "providerKey" = NEW."providerKey"
      AND "externalId" = NEW."externalId"
      AND "sourceStatus" = 'AVAILABLE'
  ) THEN
    RAISE EXCEPTION 'Catalog product state has an invalid last successful observation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "guardCatalogRefreshEvidenceImmutable"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Catalog refresh evidence is immutable after insertion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "guardCatalogRefreshProposalFactsImmutable"() RETURNS TRIGGER AS $$
BEGIN
  IF (
    to_jsonb(NEW) - 'workflowStatus' - 'reviewedAt' - 'reviewedBy' - 'appliedAt'
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - 'workflowStatus' - 'reviewedAt' - 'reviewedBy' - 'appliedAt'
  ) THEN
    RAISE EXCEPTION 'Catalog refresh proposal facts are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "CatalogRefreshExecution_scope"
BEFORE INSERT ON "CatalogRefreshExecution"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRefreshExecutionScope"();

CREATE TRIGGER "CatalogSupplierObservation_scope"
BEFORE INSERT ON "CatalogSupplierObservation"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogSupplierObservationScope"();

CREATE TRIGGER "CatalogRefreshProposal_scope"
BEFORE INSERT ON "CatalogRefreshProposal"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRefreshProposalScope"();

CREATE TRIGGER "CatalogProductState_scope"
BEFORE INSERT OR UPDATE ON "CatalogProductState"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogProductStateScope"();

CREATE TRIGGER "CatalogRefreshExecution_immutable"
BEFORE UPDATE ON "CatalogRefreshExecution"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRefreshEvidenceImmutable"();

CREATE TRIGGER "CatalogSupplierObservation_immutable"
BEFORE UPDATE ON "CatalogSupplierObservation"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRefreshEvidenceImmutable"();

CREATE TRIGGER "CatalogRefreshProposal_facts_immutable"
BEFORE UPDATE ON "CatalogRefreshProposal"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRefreshProposalFactsImmutable"();

COMMIT;
