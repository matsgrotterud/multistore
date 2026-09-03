BEGIN;

-- V2.1 intentionally refuses to guess bindings for prior control-plane rows.
-- The currently gated rollout has no persisted Store Factory rows; any rows
-- require an explicit reconciliation migration before this bundle can apply.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "StoreBuildRun")
    OR EXISTS (SELECT 1 FROM "StoreRevision")
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'STORE_FACTORY_V2_1_REQUIRES_EMPTY_CONTROL_PLANE';
  END IF;
END;
$$;

ALTER TABLE "StoreBuildRun"
  ADD COLUMN "requestJson" TEXT NOT NULL,
  ADD COLUMN "catalogArtifactId" TEXT NOT NULL,
  ADD COLUMN "catalogBindingJson" TEXT NOT NULL;

ALTER TABLE "StoreRevision"
  ADD COLUMN "catalogArtifactId" TEXT NOT NULL,
  ADD COLUMN "catalogBindingJson" TEXT NOT NULL;

ALTER TABLE "StoreBuildRun"
  DROP CONSTRAINT "StoreBuildRun_contract_check",
  ADD CONSTRAINT "StoreBuildRun_v2_1_contract_check" CHECK (
    "contractVersion" = 'store-build-run.v2'
    AND length(btrim("storeId")) > 0
    AND "requestKey" ~ '^sfv2:[0-9a-f]{64}$'
    AND "inputDigest" ~ '^[0-9a-f]{64}$'
    AND ("outputDigest" IS NULL OR "outputDigest" ~ '^[0-9a-f]{64}$')
    AND length(btrim("requestedBy")) BETWEEN 1 AND 200
    AND octet_length("requestJson") <= 524288
    AND jsonb_typeof("requestJson"::jsonb) = 'object'
    AND "requestJson"::jsonb ?& ARRAY[
      'version', 'storeId', 'requestedBy', 'brief', 'catalogShape',
      'catalogBinding', 'baseRevision', 'experienceVariant',
      'runtimeCapabilityVersion'
    ]
    AND ("requestJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-build-request.v2'
    AND ("requestJson"::jsonb ->> 'storeId') IS NOT DISTINCT FROM "storeId"
    AND ("requestJson"::jsonb ->> 'requestedBy') IS NOT DISTINCT FROM "requestedBy"
    AND ("requestJson"::jsonb -> 'brief') IS NOT DISTINCT FROM "briefJson"::jsonb
    AND ("requestJson"::jsonb -> 'catalogShape') IS NOT DISTINCT FROM "catalogShapeJson"::jsonb
    AND ("requestJson"::jsonb -> 'catalogBinding') IS NOT DISTINCT FROM "catalogBindingJson"::jsonb
    AND ("requestJson"::jsonb ->> 'experienceVariant') IN ('BASELINE', 'REFINED')
    AND length(btrim("requestJson"::jsonb ->> 'runtimeCapabilityVersion')) BETWEEN 1 AND 120
    AND octet_length("briefJson") <= 256000
    AND jsonb_typeof("briefJson"::jsonb) = 'object'
    AND ("briefJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-brief.v1'
    AND octet_length("catalogShapeJson") <= 256000
    AND jsonb_typeof("catalogShapeJson"::jsonb) = 'object'
    AND ("catalogShapeJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'catalog-shape.v1'
    AND octet_length("catalogBindingJson") <= 32768
    AND jsonb_typeof("catalogBindingJson"::jsonb) = 'object'
    AND "catalogBindingJson"::jsonb ?& ARRAY[
      'version', 'artifactId', 'artifactDigest', 'artifactContractVersion',
      'projectionRef', 'projectionDigest', 'projectionContractVersion', 'sourceKind'
    ]
    AND ("catalogBindingJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'catalog-binding.v1'
    AND ("catalogBindingJson"::jsonb ->> 'artifactId') IS NOT DISTINCT FROM "catalogArtifactId"
    AND ("catalogBindingJson"::jsonb ->> 'artifactDigest') ~ '^sha256:[0-9a-f]{64}$'
    AND ("catalogBindingJson"::jsonb ->> 'projectionDigest') ~ '^[0-9a-f]{64}$'
    AND ("catalogBindingJson"::jsonb ->> 'projectionContractVersion') IS NOT DISTINCT FROM 'catalog-projection.v2'
    AND ("catalogBindingJson"::jsonb ->> 'sourceKind') IN ('REFERENCE_FIXTURE', 'CATALOG_PROJECTION')
    AND "status" IN ('RUNNING', 'SUCCEEDED', 'PARTIAL_FAILURE', 'FAILED', 'CANCELLED')
    AND "phase" IN ('RECEIVED', 'VALIDATING', 'ASSEMBLING_REVISION', 'PERSISTING_REVISION', 'COMPLETED')
    AND ("completedAt" IS NULL OR "completedAt" >= "startedAt")
    AND (
      ("status" = 'RUNNING' AND "outputDigest" IS NULL AND "completedAt" IS NULL
       AND "failureCode" IS NULL AND "failureMessage" IS NULL AND "phase" <> 'COMPLETED')
      OR
      ("status" = 'SUCCEEDED' AND "outputDigest" IS NOT NULL AND "phase" = 'COMPLETED'
       AND "completedAt" IS NOT NULL AND "failureCode" IS NULL AND "failureMessage" IS NULL)
      OR
      ("status" IN ('PARTIAL_FAILURE', 'FAILED', 'CANCELLED') AND "outputDigest" IS NULL
       AND "phase" <> 'COMPLETED' AND "completedAt" IS NOT NULL
       AND "failureCode" IS NOT NULL AND length(btrim("failureCode")) > 0
       AND "failureMessage" IS NOT NULL AND length(btrim("failureMessage")) > 0)
    )
  );

ALTER TABLE "StoreRevision"
  DROP CONSTRAINT "StoreRevision_contract_check",
  ADD CONSTRAINT "StoreRevision_v2_1_contract_check" CHECK (
    "contractVersion" = 'store-revision.v2'
    AND length(btrim("storeId")) > 0
    AND length(btrim("buildRunId")) > 0
    AND "revisionNumber" > 0
    AND "inputDigest" ~ '^[0-9a-f]{64}$'
    AND "outputDigest" ~ '^[0-9a-f]{64}$'
    AND "status" IN ('DRAFT', 'APPROVED', 'REJECTED')
    AND jsonb_typeof("catalogBindingJson"::jsonb) = 'object'
    AND "catalogBindingJson"::jsonb ?& ARRAY[
      'version', 'artifactId', 'artifactDigest', 'artifactContractVersion',
      'projectionRef', 'projectionDigest', 'projectionContractVersion', 'sourceKind'
    ]
    AND ("catalogBindingJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'catalog-binding.v1'
    AND ("catalogBindingJson"::jsonb ->> 'artifactId') IS NOT DISTINCT FROM "catalogArtifactId"
    AND ("catalogBindingJson"::jsonb ->> 'artifactDigest') ~ '^sha256:[0-9a-f]{64}$'
    AND ("catalogBindingJson"::jsonb ->> 'projectionDigest') ~ '^[0-9a-f]{64}$'
    AND ("catalogBindingJson"::jsonb ->> 'projectionContractVersion') IS NOT DISTINCT FROM 'catalog-projection.v2'
    AND octet_length("revisionJson") <= 16777216
    AND jsonb_typeof("revisionJson"::jsonb) = 'object'
    AND "revisionJson"::jsonb ?& ARRAY[
      'version', 'inputDigest', 'outputDigest', 'contractVersions', 'brief',
      'catalogShape', 'catalogBinding', 'baseRevision', 'experienceVariant',
      'runtimeCapabilityVersion', 'catalogProjection', 'experienceManifest',
      'contentProposal', 'qaReport', 'activation'
    ]
    AND ("revisionJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-revision.v2'
    AND ("revisionJson"::jsonb ->> 'inputDigest') IS NOT DISTINCT FROM "inputDigest"
    AND ("revisionJson"::jsonb ->> 'outputDigest') IS NOT DISTINCT FROM "outputDigest"
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'version') IS NOT DISTINCT FROM 'store-revision-contract-map.v2'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'buildRequest') IS NOT DISTINCT FROM 'store-build-request.v2'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'buildRun') IS NOT DISTINCT FROM 'store-build-run.v2'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'catalogBinding') IS NOT DISTINCT FROM 'catalog-binding.v1'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'storeRevision') IS NOT DISTINCT FROM 'store-revision.v2'
    AND ("revisionJson"::jsonb -> 'catalogBinding') IS NOT DISTINCT FROM "catalogBindingJson"::jsonb
    AND ("revisionJson"::jsonb -> 'brief') IS NOT DISTINCT FROM "briefJson"::jsonb
    AND ("revisionJson"::jsonb -> 'catalogShape') IS NOT DISTINCT FROM "catalogShapeJson"::jsonb
    AND ("revisionJson"::jsonb -> 'qaReport' ->> 'status') IS NOT DISTINCT FROM 'PASS'
    AND ("revisionJson"::jsonb -> 'activation' ->> 'scope') IS NOT DISTINCT FROM 'PREVIEW_ONLY'
    AND ("revisionJson"::jsonb -> 'activation' -> 'liveAuthorized') IS NOT DISTINCT FROM 'false'::jsonb
    AND ("revisionJson"::jsonb -> 'activation' -> 'indexingAuthorized') IS NOT DISTINCT FROM 'false'::jsonb
    AND (
      (("revisionJson"::jsonb ->> 'experienceVariant') = 'BASELINE'
       AND "parentRevisionId" IS NULL
       AND ("revisionJson"::jsonb -> 'baseRevision') = 'null'::jsonb)
      OR
      (("revisionJson"::jsonb ->> 'experienceVariant') = 'REFINED'
       AND "parentRevisionId" IS NOT NULL
       AND ("revisionJson"::jsonb -> 'baseRevision' ->> 'revisionId') IS NOT DISTINCT FROM "parentRevisionId"
       AND ("revisionJson"::jsonb -> 'baseRevision' ->> 'outputDigest') ~ '^[0-9a-f]{64}$')
    )
    AND (
      ("status" = 'DRAFT' AND "reviewedAt" IS NULL AND "reviewedBy" IS NULL AND "reviewReason" IS NULL)
      OR
      ("status" IN ('APPROVED', 'REJECTED') AND "reviewedAt" IS NOT NULL
       AND "reviewedBy" IS NOT NULL AND length(btrim("reviewedBy")) BETWEEN 1 AND 200
       AND "reviewReason" IS NOT NULL AND length(btrim("reviewReason")) BETWEEN 1 AND 2000)
    )
  );

ALTER TABLE "StoreBuildRun"
  ADD CONSTRAINT "StoreBuildRun_catalogArtifact_scope_fkey"
  FOREIGN KEY ("storeId", "catalogArtifactId")
  REFERENCES "CatalogArtifactV2"("storeId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreRevision"
  ADD CONSTRAINT "StoreRevision_catalogArtifact_scope_fkey"
  FOREIGN KEY ("storeId", "catalogArtifactId")
  REFERENCES "CatalogArtifactV2"("storeId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "guardStoreBuildRunUpdateV1"() RETURNS TRIGGER AS $$
BEGIN
  IF ROW(NEW."id", NEW."storeId", NEW."contractVersion", NEW."requestKey",
         NEW."inputDigest", NEW."requestedBy", NEW."requestJson", NEW."briefJson",
         NEW."catalogShapeJson", NEW."catalogArtifactId", NEW."catalogBindingJson",
         NEW."startedAt", NEW."createdAt")
    IS DISTINCT FROM
     ROW(OLD."id", OLD."storeId", OLD."contractVersion", OLD."requestKey",
         OLD."inputDigest", OLD."requestedBy", OLD."requestJson", OLD."briefJson",
         OLD."catalogShapeJson", OLD."catalogArtifactId", OLD."catalogBindingJson",
         OLD."startedAt", OLD."createdAt")
  THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'STORE_BUILD_RUN_INPUT_IS_IMMUTABLE';
  END IF;
  IF OLD."status" <> 'RUNNING' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'STORE_BUILD_RUN_IS_TERMINAL';
  END IF;
  IF NEW."status" = 'RUNNING' THEN
    IF NEW."phase" IS DISTINCT FROM (CASE OLD."phase"
      WHEN 'RECEIVED' THEN 'VALIDATING'
      WHEN 'VALIDATING' THEN 'ASSEMBLING_REVISION'
      WHEN 'ASSEMBLING_REVISION' THEN 'PERSISTING_REVISION'
      ELSE NULL END)
    THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_BUILD_PHASE_TRANSITION_INVALID';
    END IF;
  ELSIF NEW."status" = 'SUCCEEDED' THEN
    IF OLD."phase" <> 'PERSISTING_REVISION' OR NEW."phase" <> 'COMPLETED'
      OR NOT EXISTS (
        SELECT 1 FROM "StoreRevision"
        WHERE "buildRunId" = OLD."id"
          AND "outputDigest" = NEW."outputDigest"
          AND "catalogArtifactId" = OLD."catalogArtifactId"
          AND "catalogBindingJson"::jsonb = OLD."catalogBindingJson"::jsonb)
    THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_BUILD_SUCCESS_REQUIRES_MATCHING_REVISION';
    END IF;
  ELSIF NEW."phase" <> OLD."phase" OR NEW."outputDigest" IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_BUILD_FAILURE_TRANSITION_INVALID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "guardStoreRevisionInsertV1"() RETURNS TRIGGER AS $$
DECLARE
  build_run "StoreBuildRun"%ROWTYPE;
  parent_revision "StoreRevision"%ROWTYPE;
BEGIN
  PERFORM 1 FROM "Store" WHERE "id" = NEW."storeId" FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'STORE_REVISION_STORE_NOT_FOUND';
  END IF;

  SELECT * INTO build_run FROM "StoreBuildRun"
  WHERE "id" = NEW."buildRunId" FOR UPDATE;
  IF NOT FOUND OR build_run."storeId" <> NEW."storeId"
    OR build_run."inputDigest" <> NEW."inputDigest"
    OR build_run."outputDigest" IS NOT NULL
    OR build_run."status" <> 'RUNNING'
    OR build_run."phase" <> 'PERSISTING_REVISION'
    OR build_run."catalogArtifactId" <> NEW."catalogArtifactId"
    OR build_run."catalogBindingJson"::jsonb <> NEW."catalogBindingJson"::jsonb
    OR build_run."briefJson"::jsonb <> NEW."briefJson"::jsonb
    OR build_run."catalogShapeJson"::jsonb <> NEW."catalogShapeJson"::jsonb
  THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_REVISION_BUILD_RUN_SCOPE_MISMATCH';
  END IF;

  IF NEW."parentRevisionId" IS NOT NULL THEN
    SELECT * INTO parent_revision FROM "StoreRevision"
    WHERE "id" = NEW."parentRevisionId" FOR UPDATE;
    IF NOT FOUND OR parent_revision."storeId" <> NEW."storeId"
      OR parent_revision."status" <> 'APPROVED'
      OR (parent_revision."revisionJson"::jsonb ->> 'experienceVariant') <> 'BASELINE'
      OR parent_revision."catalogArtifactId" <> NEW."catalogArtifactId"
      OR parent_revision."catalogBindingJson"::jsonb <> NEW."catalogBindingJson"::jsonb
      OR parent_revision."outputDigest" IS DISTINCT FROM
        (build_run."requestJson"::jsonb -> 'baseRevision' ->> 'outputDigest')
    THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_REVISION_PARENT_SCOPE_MISMATCH';
    END IF;
  END IF;

  IF NEW."parentRevisionId" IS DISTINCT FROM (
    SELECT "activePreviewRevisionId" FROM "StorePreviewRevisionPointer"
    WHERE "storeId" = NEW."storeId")
  THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_REVISION_PARENT_IS_NOT_ACTIVE_PREVIEW';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "guardStoreRevisionUpdateV1"() RETURNS TRIGGER AS $$
BEGIN
  IF ROW(NEW."id", NEW."storeId", NEW."buildRunId", NEW."revisionNumber",
         NEW."parentRevisionId", NEW."catalogArtifactId", NEW."catalogBindingJson",
         NEW."contractVersion", NEW."inputDigest", NEW."outputDigest", NEW."briefJson",
         NEW."catalogShapeJson", NEW."revisionJson", NEW."createdAt")
    IS DISTINCT FROM
     ROW(OLD."id", OLD."storeId", OLD."buildRunId", OLD."revisionNumber",
         OLD."parentRevisionId", OLD."catalogArtifactId", OLD."catalogBindingJson",
         OLD."contractVersion", OLD."inputDigest", OLD."outputDigest", OLD."briefJson",
         OLD."catalogShapeJson", OLD."revisionJson", OLD."createdAt")
  THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'STORE_REVISION_CONTENT_IS_IMMUTABLE';
  END IF;
  IF OLD."status" <> 'DRAFT' OR NEW."status" NOT IN ('APPROVED', 'REJECTED')
    OR NEW."status" = OLD."status"
  THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_REVISION_STATUS_TRANSITION_INVALID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "compareAndSwapStorePreviewRevisionV1"(
  requested_store_id TEXT,
  expected_version INTEGER,
  target_revision_id TEXT,
  requested_action TEXT,
  requested_by TEXT,
  requested_reason TEXT,
  changed_at TIMESTAMP(3)
) RETURNS BOOLEAN AS $$
DECLARE
  affected INTEGER;
  current_revision_id TEXT;
  current_revision_number INTEGER;
  target_revision_number INTEGER;
BEGIN
  IF expected_version IS NULL OR expected_version < 0
    OR requested_action NOT IN ('PROMOTE', 'ROLLBACK')
    OR requested_by IS NULL OR length(btrim(requested_by)) NOT BETWEEN 1 AND 200
    OR requested_reason IS NULL OR length(btrim(requested_reason)) NOT BETWEEN 1 AND 2000
    OR changed_at IS NULL
  THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'STORE_PREVIEW_POINTER_REQUEST_INVALID';
  END IF;

  PERFORM 1 FROM "Store" WHERE "id" = requested_store_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'STORE_PREVIEW_POINTER_STORE_NOT_FOUND';
  END IF;

  SELECT "revisionNumber" INTO target_revision_number FROM "StoreRevision"
  WHERE "id" = target_revision_id AND "storeId" = requested_store_id
    AND "status" = 'APPROVED';
  IF target_revision_number IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_PREVIEW_POINTER_TARGET_NOT_APPROVED_FOR_STORE';
  END IF;

  SELECT "activePreviewRevisionId" INTO current_revision_id
  FROM "StorePreviewRevisionPointer" WHERE "storeId" = requested_store_id;
  IF current_revision_id IS NOT NULL THEN
    SELECT "revisionNumber" INTO current_revision_number FROM "StoreRevision"
    WHERE "id" = current_revision_id AND "storeId" = requested_store_id;
  END IF;
  IF requested_action = 'PROMOTE'
    AND current_revision_number IS NOT NULL
    AND target_revision_number <= current_revision_number
  THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_PREVIEW_PROMOTION_TARGET_IS_NOT_NEWER';
  END IF;
  IF requested_action = 'ROLLBACK'
    AND (current_revision_number IS NULL OR target_revision_number >= current_revision_number)
  THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'STORE_PREVIEW_ROLLBACK_TARGET_IS_NOT_OLDER';
  END IF;

  IF expected_version = 0 THEN
    INSERT INTO "StorePreviewRevisionPointer" (
      "storeId", "activePreviewRevisionId", "contractVersion", "version",
      "lastAction", "changedBy", "changeReason", "createdAt", "updatedAt")
    VALUES (requested_store_id, target_revision_id, 'preview-revision-pointer.v1', 1,
            requested_action, requested_by, requested_reason, changed_at, changed_at)
    ON CONFLICT ("storeId") DO NOTHING;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 1 THEN RETURN TRUE; END IF;
  END IF;

  UPDATE "StorePreviewRevisionPointer"
  SET "activePreviewRevisionId" = target_revision_id,
      "version" = "version" + 1,
      "lastAction" = requested_action,
      "changedBy" = requested_by,
      "changeReason" = requested_reason,
      "updatedAt" = changed_at
  WHERE "storeId" = requested_store_id
    AND "version" = expected_version
    AND "activePreviewRevisionId" IS DISTINCT FROM target_revision_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$ LANGUAGE plpgsql;

COMMIT;
