BEGIN;

-- Anonymous-first wishlist identity. Refuse unsafe uniqueness changes instead
-- of choosing or deleting a duplicate owner row silently.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Wishlist"
    WHERE "anonymousId" IS NOT NULL
    GROUP BY "storeId", "anonymousId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'WISHLIST_ANONYMOUS_ID_DUPLICATES: resolve duplicate non-null (storeId, anonymousId) rows before applying Store Factory V2 schema';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Wishlist"
    WHERE "customerId" IS NOT NULL
    GROUP BY "storeId", "customerId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'WISHLIST_CUSTOMER_ID_DUPLICATES: resolve duplicate non-null (storeId, customerId) rows before applying Store Factory V2 schema';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Wishlist"
    WHERE ("anonymousId" IS NULL) = ("customerId" IS NULL)
      OR ("anonymousId" IS NOT NULL AND length(btrim("anonymousId")) = 0)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'WISHLIST_OWNER_INVALID: exactly one non-empty anonymousId or customerId is required; email is not an owner identity';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Wishlist" wishlist
    LEFT JOIN "Customer" customer ON customer."id" = wishlist."customerId"
    WHERE wishlist."customerId" IS NOT NULL
      AND (customer."id" IS NULL OR customer."storeId" <> wishlist."storeId")
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'WISHLIST_CUSTOMER_STORE_MISMATCH: customer-owned wishlists must share the customer tenant';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "WishlistItem" item
    JOIN "Wishlist" wishlist ON wishlist."id" = item."wishlistId"
    JOIN "Product" product ON product."id" = item."productId"
    WHERE wishlist."storeId" <> product."storeId"
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'WISHLIST_ITEM_STORE_MISMATCH: wishlist items must share the wishlist tenant';
  END IF;
END;
$$;

ALTER TABLE "Wishlist"
  ADD CONSTRAINT "Wishlist_owner_check" CHECK (
    (("anonymousId" IS NOT NULL)::INTEGER + ("customerId" IS NOT NULL)::INTEGER) = 1
    AND ("anonymousId" IS NULL OR length(btrim("anonymousId")) > 0)
  );

CREATE FUNCTION "guardWishlistOwnerScopeV1"() RETURNS TRIGGER AS $$
DECLARE
  customer_store_id TEXT;
BEGIN
  IF (NEW."anonymousId" IS NULL) = (NEW."customerId" IS NULL)
    OR (NEW."anonymousId" IS NOT NULL AND length(btrim(NEW."anonymousId")) = 0)
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'WISHLIST_OWNER_INVALID';
  END IF;

  IF NEW."customerId" IS NOT NULL THEN
    SELECT "storeId" INTO customer_store_id
    FROM "Customer"
    WHERE "id" = NEW."customerId"
    FOR KEY SHARE;

    IF customer_store_id IS NULL OR customer_store_id <> NEW."storeId" THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'WISHLIST_CUSTOMER_STORE_MISMATCH';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardWishlistOwnerScopeV1"
BEFORE INSERT OR UPDATE OF "storeId", "anonymousId", "customerId", "email"
ON "Wishlist"
FOR EACH ROW EXECUTE FUNCTION "guardWishlistOwnerScopeV1"();

CREATE FUNCTION "guardCustomerWishlistScopeV1"() RETURNS TRIGGER AS $$
BEGIN
  IF ROW(NEW."id", NEW."storeId") IS DISTINCT FROM ROW(OLD."id", OLD."storeId")
    AND EXISTS (
      SELECT 1 FROM "Wishlist"
      WHERE "customerId" = OLD."id"
    )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'CUSTOMER_WISHLIST_OWNER_SCOPE_IS_IMMUTABLE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCustomerWishlistScopeV1"
BEFORE UPDATE OF "id", "storeId"
ON "Customer"
FOR EACH ROW EXECUTE FUNCTION "guardCustomerWishlistScopeV1"();

DROP INDEX IF EXISTS "Wishlist_storeId_anonymousId_idx";
CREATE UNIQUE INDEX "Wishlist_storeId_anonymousId_key"
  ON "Wishlist"("storeId", "anonymousId");
CREATE UNIQUE INDEX "Wishlist_storeId_customerId_key"
  ON "Wishlist"("storeId", "customerId");

ALTER TABLE "WishlistItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "WishlistItem" ADD COLUMN "itemKey" TEXT;

UPDATE "WishlistItem"
SET "itemKey" = 'product:' || "productId"
WHERE "itemKey" IS NULL;

ALTER TABLE "WishlistItem" ALTER COLUMN "itemKey" SET NOT NULL;
DROP INDEX IF EXISTS "WishlistItem_wishlistId_productId_key";
CREATE UNIQUE INDEX "WishlistItem_wishlistId_itemKey_key"
  ON "WishlistItem"("wishlistId", "itemKey");
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");
CREATE INDEX "WishlistItem_variantId_idx" ON "WishlistItem"("variantId");

ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION "setAndGuardWishlistItemKeyV1"() RETURNS TRIGGER AS $$
DECLARE
  variant_product_id TEXT;
  wishlist_store_id TEXT;
  product_store_id TEXT;
BEGIN
  SELECT "storeId" INTO wishlist_store_id
  FROM "Wishlist"
  WHERE "id" = NEW."wishlistId"
  FOR KEY SHARE;

  SELECT "storeId" INTO product_store_id
  FROM "Product"
  WHERE "id" = NEW."productId"
  FOR KEY SHARE;

  IF wishlist_store_id IS NULL
    OR product_store_id IS NULL
    OR wishlist_store_id <> product_store_id
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'WISHLIST_ITEM_STORE_MISMATCH';
  END IF;

  IF NEW."variantId" IS NOT NULL THEN
    SELECT "productId" INTO variant_product_id
    FROM "ProductVariant"
    WHERE "id" = NEW."variantId";

    IF variant_product_id IS NULL OR variant_product_id <> NEW."productId" THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'WISHLIST_VARIANT_PRODUCT_MISMATCH';
    END IF;

    NEW."itemKey" :=
      'product:' || NEW."productId" || ':variant:' || NEW."variantId";
  ELSE
    NEW."itemKey" := 'product:' || NEW."productId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "setAndGuardWishlistItemKeyV1"
BEFORE INSERT OR UPDATE OF "wishlistId", "productId", "variantId", "itemKey"
ON "WishlistItem"
FOR EACH ROW EXECUTE FUNCTION "setAndGuardWishlistItemKeyV1"();

CREATE TABLE "StoreBuildRun" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "inputDigest" TEXT NOT NULL,
  "outputDigest" TEXT,
  "requestedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "phase" TEXT NOT NULL DEFAULT 'RECEIVED',
  "briefJson" TEXT NOT NULL,
  "catalogShapeJson" TEXT NOT NULL,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StoreBuildRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreBuildRun_contract_check" CHECK (
    "contractVersion" = 'store-build-run.v1'
    AND length(btrim("storeId")) > 0
    AND "requestKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$'
    AND "inputDigest" ~ '^[0-9a-f]{64}$'
    AND ("outputDigest" IS NULL OR "outputDigest" ~ '^[0-9a-f]{64}$')
    AND length(btrim("requestedBy")) BETWEEN 1 AND 200
    AND "status" IN (
      'RUNNING', 'SUCCEEDED', 'PARTIAL_FAILURE', 'FAILED', 'CANCELLED'
    )
    AND "phase" IN (
      'RECEIVED', 'VALIDATING', 'ASSEMBLING_REVISION',
      'PERSISTING_REVISION', 'COMPLETED'
    )
    AND octet_length("briefJson") <= 256000
    AND jsonb_typeof("briefJson"::jsonb) = 'object'
    AND ("briefJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-brief.v1'
    AND octet_length("catalogShapeJson") <= 256000
    AND jsonb_typeof("catalogShapeJson"::jsonb) = 'object'
    AND ("catalogShapeJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'catalog-shape.v1'
    AND ("completedAt" IS NULL OR "completedAt" >= "startedAt")
    AND (
      (
        "status" = 'RUNNING'
        AND "outputDigest" IS NULL
        AND "completedAt" IS NULL
        AND "failureCode" IS NULL
        AND "failureMessage" IS NULL
        AND "phase" <> 'COMPLETED'
      )
      OR (
        "status" = 'SUCCEEDED'
        AND "outputDigest" IS NOT NULL
        AND "phase" = 'COMPLETED'
        AND "completedAt" IS NOT NULL
        AND "failureCode" IS NULL
        AND "failureMessage" IS NULL
      )
      OR (
        "status" IN ('PARTIAL_FAILURE', 'FAILED', 'CANCELLED')
        AND "outputDigest" IS NULL
        AND "phase" <> 'COMPLETED'
        AND "completedAt" IS NOT NULL
        AND "failureCode" IS NOT NULL
        AND length(btrim("failureCode")) > 0
        AND "failureMessage" IS NOT NULL
        AND length(btrim("failureMessage")) > 0
      )
    )
  )
);

CREATE TABLE "StoreRevision" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "buildRunId" TEXT NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "parentRevisionId" TEXT,
  "contractVersion" TEXT NOT NULL,
  "inputDigest" TEXT NOT NULL,
  "outputDigest" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "briefJson" TEXT NOT NULL,
  "catalogShapeJson" TEXT NOT NULL,
  "revisionJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewReason" TEXT,

  CONSTRAINT "StoreRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreRevision_contract_check" CHECK (
    "contractVersion" = 'store-revision.v1'
    AND length(btrim("storeId")) > 0
    AND length(btrim("buildRunId")) > 0
    AND "revisionNumber" > 0
    AND "inputDigest" ~ '^[0-9a-f]{64}$'
    AND "outputDigest" ~ '^[0-9a-f]{64}$'
    AND "status" IN ('DRAFT', 'APPROVED', 'REJECTED')
    AND octet_length("briefJson") <= 256000
    AND jsonb_typeof("briefJson"::jsonb) = 'object'
    AND ("briefJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-brief.v1'
    AND octet_length("catalogShapeJson") <= 256000
    AND jsonb_typeof("catalogShapeJson"::jsonb) = 'object'
    AND ("catalogShapeJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'catalog-shape.v1'
    AND octet_length("revisionJson") <= 16777216
    AND jsonb_typeof("revisionJson"::jsonb) = 'object'
    AND ("revisionJson"::jsonb ->> 'version') IS NOT DISTINCT FROM 'store-revision.v1'
    AND ("revisionJson"::jsonb ->> 'inputDigest') IS NOT DISTINCT FROM "inputDigest"
    AND ("revisionJson"::jsonb ->> 'outputDigest') IS NOT DISTINCT FROM "outputDigest"
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'version') IS NOT DISTINCT FROM 'store-revision-contract-map.v1'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'revisionCandidate') IS NOT DISTINCT FROM 'store-revision-candidate.v1'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'catalogProjection') IS NOT DISTINCT FROM 'catalog-projection.v2'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'experienceManifest') IS NOT DISTINCT FROM 'store-experience-manifest.v2'
    AND ("revisionJson"::jsonb -> 'contractVersions' ->> 'contentProposal') IS NOT DISTINCT FROM 'store-content-proposal.v1'
    AND ("revisionJson"::jsonb -> 'catalogProjection' ->> 'version') IS NOT DISTINCT FROM 'catalog-projection.v2'
    AND ("revisionJson"::jsonb -> 'experienceManifest' ->> 'version') IS NOT DISTINCT FROM 'store-experience-manifest.v2'
    AND ("revisionJson"::jsonb -> 'contentProposal' ->> 'version') IS NOT DISTINCT FROM 'store-content-proposal.v1'
    AND ("revisionJson"::jsonb -> 'qaReport' ->> 'version') IS NOT DISTINCT FROM 'store-revision-qa-report.v1'
    AND ("revisionJson"::jsonb -> 'qaReport' ->> 'status') IS NOT DISTINCT FROM 'PASS'
    AND ("revisionJson"::jsonb -> 'activation' ->> 'scope') IS NOT DISTINCT FROM 'PREVIEW_ONLY'
    AND ("revisionJson"::jsonb -> 'activation' -> 'liveAuthorized') IS NOT DISTINCT FROM 'false'::jsonb
    AND ("revisionJson"::jsonb -> 'activation' -> 'indexingAuthorized') IS NOT DISTINCT FROM 'false'::jsonb
    AND ("revisionJson"::jsonb -> 'brief') IS NOT DISTINCT FROM "briefJson"::jsonb
    AND ("revisionJson"::jsonb -> 'catalogShape') IS NOT DISTINCT FROM "catalogShapeJson"::jsonb
    AND (
      (
        "status" = 'DRAFT'
        AND "reviewedAt" IS NULL
        AND "reviewedBy" IS NULL
        AND "reviewReason" IS NULL
      )
      OR (
        "status" IN ('APPROVED', 'REJECTED')
        AND "reviewedAt" IS NOT NULL
        AND "reviewedBy" IS NOT NULL
        AND length(btrim("reviewedBy")) BETWEEN 1 AND 200
        AND "reviewReason" IS NOT NULL
        AND length(btrim("reviewReason")) BETWEEN 1 AND 2000
      )
    )
  )
);

CREATE TABLE "StoreBuildEvent" (
  "id" TEXT NOT NULL,
  "buildRunId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StoreBuildEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreBuildEvent_contract_check" CHECK (
    "contractVersion" = 'store-build-event.v1'
    AND length(btrim("buildRunId")) > 0
    AND "sequence" > 0
    AND "phase" IN (
      'RECEIVED', 'VALIDATING', 'ASSEMBLING_REVISION',
      'PERSISTING_REVISION', 'COMPLETED'
    )
    AND "eventType" IN (
      'RUN_STARTED', 'PHASE_ENTERED', 'REVISION_CREATED',
      'RUN_SUCCEEDED', 'RUN_FAILED', 'REVISION_APPROVED',
      'REVISION_REJECTED', 'PREVIEW_PROMOTED',
      'PREVIEW_ROLLED_BACK'
    )
    AND octet_length("payloadJson") <= 256000
    AND jsonb_typeof("payloadJson"::jsonb) = 'object'
  )
);

CREATE TABLE "StorePreviewRevisionPointer" (
  "storeId" TEXT NOT NULL,
  "activePreviewRevisionId" TEXT,
  "contractVersion" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "lastAction" TEXT NOT NULL DEFAULT 'NONE',
  "changedBy" TEXT,
  "changeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StorePreviewRevisionPointer_pkey" PRIMARY KEY ("storeId"),
  CONSTRAINT "StorePreviewRevisionPointer_contract_check" CHECK (
    "contractVersion" = 'preview-revision-pointer.v1'
    AND length(btrim("storeId")) > 0
    AND "version" >= 0
    AND "lastAction" IN ('NONE', 'PROMOTE', 'ROLLBACK')
    AND (
      (
        "activePreviewRevisionId" IS NULL
        AND "version" = 0
        AND "lastAction" = 'NONE'
        AND "changedBy" IS NULL
        AND "changeReason" IS NULL
      )
      OR (
        "activePreviewRevisionId" IS NOT NULL
        AND "version" > 0
        AND "lastAction" IN ('PROMOTE', 'ROLLBACK')
        AND "changedBy" IS NOT NULL
        AND length(btrim("changedBy")) BETWEEN 1 AND 200
        AND "changeReason" IS NOT NULL
        AND length(btrim("changeReason")) BETWEEN 1 AND 2000
      )
    )
  )
);

CREATE UNIQUE INDEX "StoreBuildRun_storeId_requestKey_key"
  ON "StoreBuildRun"("storeId", "requestKey");
CREATE INDEX "StoreBuildRun_storeId_status_createdAt_idx"
  ON "StoreBuildRun"("storeId", "status", "createdAt");
CREATE INDEX "StoreBuildRun_inputDigest_idx"
  ON "StoreBuildRun"("inputDigest");

CREATE UNIQUE INDEX "StoreRevision_buildRunId_key"
  ON "StoreRevision"("buildRunId");
CREATE UNIQUE INDEX "StoreRevision_storeId_revisionNumber_key"
  ON "StoreRevision"("storeId", "revisionNumber");
CREATE INDEX "StoreRevision_storeId_status_createdAt_idx"
  ON "StoreRevision"("storeId", "status", "createdAt");
CREATE INDEX "StoreRevision_parentRevisionId_idx"
  ON "StoreRevision"("parentRevisionId");
CREATE INDEX "StoreRevision_inputDigest_idx"
  ON "StoreRevision"("inputDigest");

CREATE UNIQUE INDEX "StoreBuildEvent_buildRunId_sequence_key"
  ON "StoreBuildEvent"("buildRunId", "sequence");
CREATE INDEX "StoreBuildEvent_buildRunId_createdAt_idx"
  ON "StoreBuildEvent"("buildRunId", "createdAt");
CREATE INDEX "StoreBuildEvent_eventType_createdAt_idx"
  ON "StoreBuildEvent"("eventType", "createdAt");

CREATE UNIQUE INDEX "StorePreviewRevisionPointer_activePreviewRevisionId_key"
  ON "StorePreviewRevisionPointer"("activePreviewRevisionId");
CREATE INDEX "StorePreviewRevisionPointer_updatedAt_idx"
  ON "StorePreviewRevisionPointer"("updatedAt");

ALTER TABLE "StoreBuildRun"
  ADD CONSTRAINT "StoreBuildRun_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreRevision"
  ADD CONSTRAINT "StoreRevision_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreRevision"
  ADD CONSTRAINT "StoreRevision_buildRunId_fkey"
  FOREIGN KEY ("buildRunId") REFERENCES "StoreBuildRun"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreRevision"
  ADD CONSTRAINT "StoreRevision_parentRevisionId_fkey"
  FOREIGN KEY ("parentRevisionId") REFERENCES "StoreRevision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreBuildEvent"
  ADD CONSTRAINT "StoreBuildEvent_buildRunId_fkey"
  FOREIGN KEY ("buildRunId") REFERENCES "StoreBuildRun"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StorePreviewRevisionPointer"
  ADD CONSTRAINT "StorePreviewRevisionPointer_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StorePreviewRevisionPointer"
  ADD CONSTRAINT "StorePreviewRevisionPointer_activePreviewRevisionId_fkey"
  FOREIGN KEY ("activePreviewRevisionId") REFERENCES "StoreRevision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "guardStoreBuildRunUpdateV1"() RETURNS TRIGGER AS $$
DECLARE
  expected_phase TEXT;
BEGIN
  IF ROW(
    NEW."id", NEW."storeId", NEW."contractVersion", NEW."requestKey",
    NEW."inputDigest", NEW."requestedBy", NEW."briefJson",
    NEW."catalogShapeJson", NEW."startedAt", NEW."createdAt"
  ) IS DISTINCT FROM ROW(
    OLD."id", OLD."storeId", OLD."contractVersion", OLD."requestKey",
    OLD."inputDigest", OLD."requestedBy", OLD."briefJson",
    OLD."catalogShapeJson", OLD."startedAt", OLD."createdAt"
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'STORE_BUILD_RUN_INPUT_IS_IMMUTABLE';
  END IF;

  IF OLD."status" <> 'RUNNING' THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'STORE_BUILD_RUN_IS_TERMINAL';
  END IF;

  expected_phase := CASE OLD."phase"
    WHEN 'RECEIVED' THEN 'VALIDATING'
    WHEN 'VALIDATING' THEN 'ASSEMBLING_REVISION'
    WHEN 'ASSEMBLING_REVISION' THEN 'PERSISTING_REVISION'
    WHEN 'PERSISTING_REVISION' THEN 'COMPLETED'
    ELSE NULL
  END;

  IF NEW."status" = 'RUNNING' THEN
    IF NEW."phase" <> expected_phase OR NEW."outputDigest" IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_BUILD_PHASE_TRANSITION_INVALID';
    END IF;
  ELSIF NEW."status" = 'SUCCEEDED' THEN
    IF OLD."phase" <> 'PERSISTING_REVISION' OR NEW."phase" <> 'COMPLETED' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_BUILD_SUCCESS_TRANSITION_INVALID';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM "StoreRevision"
      WHERE "buildRunId" = OLD."id"
        AND "outputDigest" = NEW."outputDigest"
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_BUILD_SUCCESS_REQUIRES_REVISION';
    END IF;
  ELSE
    IF NEW."phase" <> OLD."phase" THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_BUILD_FAILURE_MUST_PRESERVE_LAST_PHASE';
    END IF;
    IF NEW."outputDigest" IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_BUILD_FAILURE_CANNOT_PUBLISH_OUTPUT_DIGEST';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardStoreBuildRunUpdateV1"
BEFORE UPDATE ON "StoreBuildRun"
FOR EACH ROW EXECUTE FUNCTION "guardStoreBuildRunUpdateV1"();

CREATE FUNCTION "guardStoreRevisionInsertV1"() RETURNS TRIGGER AS $$
DECLARE
  build_run "StoreBuildRun"%ROWTYPE;
  parent_revision "StoreRevision"%ROWTYPE;
BEGIN
  PERFORM 1
  FROM "Store"
  WHERE "id" = NEW."storeId"
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'STORE_REVISION_STORE_NOT_FOUND';
  END IF;

  SELECT * INTO build_run
  FROM "StoreBuildRun"
  WHERE "id" = NEW."buildRunId"
  FOR UPDATE;

  IF NOT FOUND
    OR build_run."storeId" <> NEW."storeId"
    OR build_run."inputDigest" <> NEW."inputDigest"
    OR build_run."outputDigest" IS NOT NULL
    OR build_run."briefJson"::jsonb <> NEW."briefJson"::jsonb
    OR build_run."catalogShapeJson"::jsonb <> NEW."catalogShapeJson"::jsonb
    OR build_run."status" <> 'RUNNING'
    OR build_run."phase" <> 'PERSISTING_REVISION'
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_REVISION_BUILD_RUN_SCOPE_MISMATCH';
  END IF;

  IF (NEW."revisionJson"::jsonb ->> 'inputDigest') IS DISTINCT FROM NEW."inputDigest"
    OR (NEW."revisionJson"::jsonb ->> 'outputDigest') IS DISTINCT FROM NEW."outputDigest"
    OR (NEW."revisionJson"::jsonb -> 'brief') <> NEW."briefJson"::jsonb
    OR (NEW."revisionJson"::jsonb -> 'catalogShape') <> NEW."catalogShapeJson"::jsonb
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_REVISION_DOCUMENT_MISMATCH';
  END IF;

  IF NEW."parentRevisionId" IS NOT NULL THEN
    SELECT * INTO parent_revision
    FROM "StoreRevision"
    WHERE "id" = NEW."parentRevisionId";

    IF NOT FOUND
      OR parent_revision."storeId" <> NEW."storeId"
      OR parent_revision."status" <> 'APPROVED'
    THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
      MESSAGE = 'STORE_REVISION_PARENT_SCOPE_MISMATCH';
    END IF;
  END IF;

  IF NEW."parentRevisionId" IS DISTINCT FROM (
    SELECT "activePreviewRevisionId"
    FROM "StorePreviewRevisionPointer"
    WHERE "storeId" = NEW."storeId"
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_REVISION_PARENT_IS_NOT_ACTIVE_PREVIEW';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardStoreRevisionInsertV1"
BEFORE INSERT ON "StoreRevision"
FOR EACH ROW EXECUTE FUNCTION "guardStoreRevisionInsertV1"();

CREATE FUNCTION "guardStoreRevisionUpdateV1"() RETURNS TRIGGER AS $$
BEGIN
  IF ROW(
    NEW."id", NEW."storeId", NEW."buildRunId", NEW."revisionNumber",
    NEW."parentRevisionId", NEW."contractVersion", NEW."inputDigest",
    NEW."outputDigest",
    NEW."briefJson", NEW."catalogShapeJson", NEW."revisionJson",
    NEW."createdAt"
  ) IS DISTINCT FROM ROW(
    OLD."id", OLD."storeId", OLD."buildRunId", OLD."revisionNumber",
    OLD."parentRevisionId", OLD."contractVersion", OLD."inputDigest",
    OLD."outputDigest",
    OLD."briefJson", OLD."catalogShapeJson", OLD."revisionJson",
    OLD."createdAt"
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'STORE_REVISION_CONTENT_IS_IMMUTABLE';
  END IF;

  IF OLD."status" <> 'DRAFT'
    OR NEW."status" NOT IN ('APPROVED', 'REJECTED')
    OR NEW."status" = OLD."status"
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_REVISION_STATUS_TRANSITION_INVALID';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardStoreRevisionUpdateV1"
BEFORE UPDATE ON "StoreRevision"
FOR EACH ROW EXECUTE FUNCTION "guardStoreRevisionUpdateV1"();

CREATE FUNCTION "rejectStoreRevisionDeleteV1"() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'STORE_REVISIONS_ARE_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rejectStoreRevisionDeleteV1"
BEFORE DELETE ON "StoreRevision"
FOR EACH ROW EXECUTE FUNCTION "rejectStoreRevisionDeleteV1"();

CREATE FUNCTION "guardStoreBuildEventAppendV1"() RETURNS TRIGGER AS $$
DECLARE
  expected_sequence INTEGER;
BEGIN
  PERFORM 1
  FROM "StoreBuildRun"
  WHERE "id" = NEW."buildRunId"
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'STORE_BUILD_EVENT_RUN_NOT_FOUND';
  END IF;

  SELECT COALESCE(MAX("sequence"), 0) + 1 INTO expected_sequence
  FROM "StoreBuildEvent"
  WHERE "buildRunId" = NEW."buildRunId";

  IF NEW."sequence" <> expected_sequence THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_BUILD_EVENT_SEQUENCE_NOT_APPEND_ONLY';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardStoreBuildEventAppendV1"
BEFORE INSERT ON "StoreBuildEvent"
FOR EACH ROW EXECUTE FUNCTION "guardStoreBuildEventAppendV1"();

CREATE FUNCTION "rejectStoreBuildEventMutationV1"() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'STORE_BUILD_EVENTS_ARE_APPEND_ONLY';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rejectStoreBuildEventUpdateV1"
BEFORE UPDATE ON "StoreBuildEvent"
FOR EACH ROW EXECUTE FUNCTION "rejectStoreBuildEventMutationV1"();
CREATE TRIGGER "rejectStoreBuildEventDeleteV1"
BEFORE DELETE ON "StoreBuildEvent"
FOR EACH ROW EXECUTE FUNCTION "rejectStoreBuildEventMutationV1"();

CREATE FUNCTION "guardStorePreviewRevisionPointerV1"() RETURNS TRIGGER AS $$
DECLARE
  target_store_id TEXT;
  target_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."storeId" <> OLD."storeId"
      OR NEW."contractVersion" <> OLD."contractVersion"
      OR NEW."createdAt" <> OLD."createdAt"
      OR NEW."version" <> OLD."version" + 1
      OR NEW."activePreviewRevisionId" IS NOT DISTINCT FROM OLD."activePreviewRevisionId"
    THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_PREVIEW_POINTER_CAS_TRANSITION_INVALID';
    END IF;
  END IF;

  IF NEW."activePreviewRevisionId" IS NOT NULL THEN
    SELECT "storeId", "status" INTO target_store_id, target_status
    FROM "StoreRevision"
    WHERE "id" = NEW."activePreviewRevisionId";

    IF target_store_id IS NULL
      OR target_store_id <> NEW."storeId"
      OR target_status <> 'APPROVED'
    THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_PREVIEW_POINTER_TARGET_NOT_APPROVED_FOR_STORE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardStorePreviewRevisionPointerV1"
BEFORE INSERT OR UPDATE ON "StorePreviewRevisionPointer"
FOR EACH ROW EXECUTE FUNCTION "guardStorePreviewRevisionPointerV1"();

-- One SQL-level CAS primitive for both promotion and rollback. This function
-- changes only StorePreviewRevisionPointer and has no access to launchStatus.
CREATE FUNCTION "compareAndSwapStorePreviewRevisionV1"(
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
  IF expected_version IS NULL
    OR expected_version < 0
    OR requested_action IS NULL
    OR requested_action NOT IN ('PROMOTE', 'ROLLBACK')
    OR requested_by IS NULL
    OR length(btrim(requested_by)) NOT BETWEEN 1 AND 200
    OR requested_reason IS NULL
    OR length(btrim(requested_reason)) NOT BETWEEN 1 AND 2000
    OR changed_at IS NULL
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'STORE_PREVIEW_POINTER_REQUEST_INVALID';
  END IF;

  PERFORM 1 FROM "Store"
  WHERE "id" = requested_store_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'STORE_PREVIEW_POINTER_STORE_NOT_FOUND';
  END IF;

  SELECT "revisionNumber" INTO target_revision_number
  FROM "StoreRevision"
  WHERE "id" = target_revision_id
    AND "storeId" = requested_store_id
    AND "status" = 'APPROVED';
  IF target_revision_number IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'STORE_PREVIEW_POINTER_TARGET_NOT_APPROVED_FOR_STORE';
  END IF;

  SELECT "activePreviewRevisionId" INTO current_revision_id
  FROM "StorePreviewRevisionPointer"
  WHERE "storeId" = requested_store_id;

  IF requested_action = 'ROLLBACK' THEN
    IF current_revision_id IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_PREVIEW_ROLLBACK_HAS_NO_ACTIVE_REVISION';
    END IF;
    SELECT "revisionNumber" INTO current_revision_number
    FROM "StoreRevision"
    WHERE "id" = current_revision_id;
    IF target_revision_number >= current_revision_number THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'STORE_PREVIEW_ROLLBACK_TARGET_IS_NOT_OLDER';
    END IF;
  END IF;

  IF expected_version = 0 THEN
    INSERT INTO "StorePreviewRevisionPointer" (
      "storeId", "activePreviewRevisionId", "contractVersion", "version",
      "lastAction", "changedBy", "changeReason", "createdAt", "updatedAt"
    ) VALUES (
      requested_store_id, target_revision_id,
      'preview-revision-pointer.v1', 1, requested_action,
      requested_by, requested_reason, changed_at, changed_at
    )
    ON CONFLICT ("storeId") DO NOTHING;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 1 THEN
      RETURN TRUE;
    END IF;
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
