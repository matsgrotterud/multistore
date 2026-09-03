BEGIN;

-- Universal Store Factory V2 / provider-neutral catalog core.
-- This file is intentionally not part of build or startup. Apply only after a
-- read-only capability check and explicit confirmation of the target database.

CREATE TABLE "CatalogArtifactV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "sourceKind" TEXT NOT NULL,
  "sourceRef" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "description" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL,
  "taxonomyRef" TEXT NOT NULL,
  "taxonomyContractVersion" TEXT NOT NULL,
  "artifactJson" TEXT NOT NULL,
  "contentDigest" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogArtifactV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogArtifactV2_contract_check" CHECK (
    (
      ("sourceKind" = 'REFERENCE_FIXTURE' AND "contractVersion" = 'catalog-reference-fixture.v2')
      OR
      ("sourceKind" = 'CATALOG_PROJECTION' AND "contractVersion" = 'catalog-projection.v2')
    )
    AND "taxonomyContractVersion" = 'catalog-taxonomy.v2'
    AND length(btrim("sourceRef")) BETWEEN 1 AND 180
    AND ("description" IS NULL OR length(btrim("description")) BETWEEN 1 AND 1000)
    AND octet_length("artifactJson") <= 8388608
    AND jsonb_typeof("artifactJson"::jsonb) = 'object'
    AND ("artifactJson"::jsonb ->> 'version') IS NOT DISTINCT FROM "contractVersion"
    AND "contentDigest" ~ '^sha256:[0-9a-f]{64}$'
    AND "createdAt" = "generatedAt"
  )
);

CREATE TABLE "CatalogProductV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "legacyProductId" TEXT,
  "canonicalKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogProductV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogProductV2_contract_check" CHECK (
    length(btrim("canonicalKey")) BETWEEN 1 AND 191
    AND "status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')
  )
);

CREATE TABLE "CatalogVariantIdentityV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogVariantIdentityV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogVariantIdentityV2_contract_check" CHECK (
    length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "createdAt" = "updatedAt"
  )
);

CREATE TABLE "CatalogProductRevisionV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "artifactId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "artifactRevisionRef" TEXT NOT NULL,
  "revisionNumber" BIGINT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "revisionState" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "description" TEXT NOT NULL,
  "brand" TEXT,
  "seoTitle" TEXT NOT NULL,
  "seoDescription" TEXT NOT NULL,
  "retailPriceState" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "retailPriceMinor" BIGINT,
  "currency" TEXT,
  "compareAtPriceMinor" BIGINT,
  "compareAtPriceCurrency" TEXT,
  "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "purchasable" BOOLEAN NOT NULL DEFAULT false,
  "revisionJson" TEXT NOT NULL,
  "contentDigest" TEXT NOT NULL,
  "reasonCodesJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sealedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogProductRevisionV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogProductRevisionV2_contract_check" CHECK (
    "contractVersion" = 'catalog-product-revision.v2'
    AND length(btrim("artifactRevisionRef")) BETWEEN 1 AND 180
    AND "revisionNumber" > 0
    AND "source" IN ('LEGACY_ADAPTER', 'MERCHANT', 'SYNTHETIC_FIXTURE', 'PROVIDER_PROPOSAL')
    AND "revisionState" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'UNKNOWN')
    AND "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND length(btrim("title")) BETWEEN 1 AND 500
    AND length(btrim("description")) BETWEEN 1 AND 50000
    AND length(btrim("seoTitle")) BETWEEN 1 AND 300
    AND length(btrim("seoDescription")) BETWEEN 1 AND 1000
    AND octet_length("revisionJson") <= 768000
    AND jsonb_typeof("revisionJson"::jsonb) = 'object'
    AND ("revisionJson"::jsonb ->> 'contractVersion') IS NOT DISTINCT FROM 'catalog-product-revision.v2'
    AND "contentDigest" ~ '^sha256:[0-9a-f]{64}$'
    AND octet_length("reasonCodesJson") <= 128000
    AND jsonb_typeof("reasonCodesJson"::jsonb) = 'array'
    AND ("sealedAt" IS NULL OR "sealedAt" >= "createdAt")
    AND "retailPriceState" IN ('KNOWN', 'UNKNOWN')
    AND (
      ("retailPriceState" = 'UNKNOWN' AND "retailPriceMinor" IS NULL AND "currency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "retailPriceMinor" IS NOT NULL AND "retailPriceMinor" >= 0 AND "currency" IS NOT NULL AND "currency" ~ '^[A-Z]{3}$')
    )
    AND (
      ("compareAtPriceMinor" IS NULL AND "compareAtPriceCurrency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "compareAtPriceMinor" IS NOT NULL AND "compareAtPriceMinor" > "retailPriceMinor" AND "compareAtPriceCurrency" = "currency")
    )
    AND "availability" IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')
    AND (
      NOT "purchasable"
      OR (
        "retailPriceState" = 'KNOWN'
        AND "availability" IN ('IN_STOCK', 'LOW_STOCK')
      )
    )
  )
);

CREATE TABLE "CatalogSellableVariantV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "variantIdentityId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "optionValuesJson" TEXT NOT NULL DEFAULT '{}',
  "retailPriceState" TEXT,
  "retailPriceMinor" BIGINT,
  "currency" TEXT,
  "compareAtPriceMinor" BIGINT,
  "compareAtPriceCurrency" TEXT,
  "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogSellableVariantV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogSellableVariantV2_contract_check" CHECK (
    length(btrim("stableKey")) BETWEEN 1 AND 191
    AND length(btrim("label")) BETWEEN 1 AND 300
    AND octet_length("optionValuesJson") <= 64000
    AND jsonb_typeof("optionValuesJson"::jsonb) = 'object'
    AND ("retailPriceState" IS NULL OR "retailPriceState" IN ('KNOWN', 'UNKNOWN'))
    AND (
      ("retailPriceState" IS NULL AND "retailPriceMinor" IS NULL AND "currency" IS NULL)
      OR
      ("retailPriceState" = 'UNKNOWN' AND "retailPriceMinor" IS NULL AND "currency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "retailPriceMinor" IS NOT NULL AND "retailPriceMinor" >= 0 AND "currency" IS NOT NULL AND "currency" ~ '^[A-Z]{3}$')
    )
    AND (
      ("compareAtPriceMinor" IS NULL AND "compareAtPriceCurrency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "compareAtPriceMinor" IS NOT NULL AND "compareAtPriceMinor" > "retailPriceMinor" AND "compareAtPriceCurrency" = "currency")
    )
    AND "availability" IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')
  )
);

CREATE TABLE "CatalogTaxonomyNodeV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "artifactId" TEXT NOT NULL,
  "taxonomyRef" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "parentId" TEXT,
  "key" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pathJson" TEXT NOT NULL DEFAULT '[]',
  "depth" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogTaxonomyNodeV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogTaxonomyNodeV2_contract_check" CHECK (
    "contractVersion" = 'catalog-taxonomy.v2'
    AND length(btrim("taxonomyRef")) BETWEEN 1 AND 180
    AND length(btrim("key")) BETWEEN 1 AND 180
    AND "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND length(btrim("title")) BETWEEN 1 AND 300
    AND octet_length("pathJson") <= 16000
    AND jsonb_typeof("pathJson"::jsonb) = 'array'
    AND jsonb_array_length("pathJson"::jsonb) BETWEEN 1 AND 16
    AND "depth" = jsonb_array_length("pathJson"::jsonb) - 1
    AND "parentId" IS DISTINCT FROM "id"
  )
);

CREATE TABLE "CatalogProductTaxonomyPlacementV2" (
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "taxonomyNodeId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CatalogProductTaxonomyPlacementV2_pkey" PRIMARY KEY ("productRevisionId", "taxonomyNodeId")
);

CREATE TABLE "CatalogAttributeDefinitionV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "valueType" TEXT NOT NULL,
  "cardinality" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "variantAxis" BOOLEAN NOT NULL DEFAULT false,
  "storefrontVisible" BOOLEAN NOT NULL DEFAULT false,
  "unitCode" TEXT,
  "facetable" BOOLEAN NOT NULL DEFAULT false,
  "comparable" BOOLEAN NOT NULL DEFAULT false,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogAttributeDefinitionV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogAttributeDefinitionV2_contract_check" CHECK (
    length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "key" ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'
    AND length(btrim("label")) BETWEEN 1 AND 300
    AND "valueType" IN ('TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'ENUM')
    AND "cardinality" IN ('SINGLE', 'MULTIPLE')
    AND "scope" IN ('PRODUCT', 'VARIANT')
    AND (NOT "variantAxis" OR "scope" = 'VARIANT')
    AND ("unitCode" IS NULL OR "unitCode" ~ '^[A-Za-z0-9.%/_-]{1,24}$')
  )
);

CREATE TABLE "CatalogTaxonomyAttributeDefinitionV2" (
  "storeId" TEXT NOT NULL,
  "taxonomyNodeId" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CatalogTaxonomyAttributeDefinitionV2_pkey" PRIMARY KEY ("taxonomyNodeId", "definitionId"),
  CONSTRAINT "CatalogTaxonomyAttributeDefinitionV2_contract_check" CHECK (
    "sortOrder" >= 0
  )
);

CREATE TABLE "CatalogAttributeOptionV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogAttributeOptionV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogAttributeOptionV2_contract_check" CHECK (
    "key" ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'
    AND length(btrim("label")) BETWEEN 1 AND 300
  )
);

CREATE TABLE "CatalogProductAttributeValueV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "variantId" TEXT,
  "definitionId" TEXT NOT NULL,
  "assignmentScopeKey" TEXT NOT NULL,
  "valuesJson" TEXT NOT NULL,
  "normalizedValuesJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogProductAttributeValueV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogProductAttributeValueV2_contract_check" CHECK (
    length(btrim("assignmentScopeKey")) BETWEEN 1 AND 220
    AND octet_length("valuesJson") BETWEEN 2 AND 64000
    AND jsonb_typeof("valuesJson"::jsonb) = 'array'
    AND jsonb_array_length("valuesJson"::jsonb) > 0
    AND octet_length("normalizedValuesJson") BETWEEN 2 AND 64000
    AND jsonb_typeof("normalizedValuesJson"::jsonb) = 'array'
    AND jsonb_array_length("normalizedValuesJson"::jsonb) > 0
  )
);

CREATE TABLE "CatalogCollectionV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "artifactId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'MANUAL',
  "publicationState" TEXT NOT NULL DEFAULT 'INTERNAL',
  "position" INTEGER NOT NULL DEFAULT 0,
  "ruleJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogCollectionV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogCollectionV2_contract_check" CHECK (
    "contractVersion" = 'catalog-collection.v2'
    AND length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND length(btrim("title")) BETWEEN 1 AND 300
    AND "kind" IN ('MANUAL', 'RULE_BASED', 'UNKNOWN')
    AND "publicationState" IN ('PUBLIC', 'INTERNAL', 'UNKNOWN')
    AND "position" >= 0
    AND ("ruleJson" IS NULL OR (octet_length("ruleJson") <= 128000 AND jsonb_typeof("ruleJson"::jsonb) = 'object'))
  )
);

CREATE TABLE "CatalogCollectionItemV2" (
  "collectionId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "evidenceIdsJson" TEXT NOT NULL DEFAULT '[]',
  CONSTRAINT "CatalogCollectionItemV2_pkey" PRIMARY KEY ("collectionId", "productRevisionId"),
  CONSTRAINT "CatalogCollectionItemV2_contract_check" CHECK (
    "sortOrder" >= 0
    AND octet_length("evidenceIdsJson") <= 128000
    AND jsonb_typeof("evidenceIdsJson"::jsonb) = 'array'
  )
);

CREATE TABLE "CatalogMediaAssetV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "publicationState" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publicUrl" TEXT,
  "mimeType" TEXT,
  "altText" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "focalX" DOUBLE PRECISION,
  "focalY" DOUBLE PRECISION,
  "sourceKind" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "rightsStatus" TEXT NOT NULL,
  "evidenceIdsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogMediaAssetV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogMediaAssetV2_contract_check" CHECK (
    length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "kind" IN ('IMAGE', 'VIDEO', 'DOCUMENT', 'UNKNOWN')
    AND "role" IN ('PRIMARY', 'GALLERY', 'VARIANT', 'SWATCH', 'LIFESTYLE', 'SIZE_GUIDE', 'INSTRUCTIONAL', 'UNKNOWN')
    AND "publicationState" IN ('PUBLIC_READY', 'INTERNAL_ONLY', 'UNKNOWN')
    AND ("publicUrl" IS NULL OR (length(btrim("publicUrl")) BETWEEN 1 AND 2000 AND "publicUrl" ~ '^https://'))
    AND ("mimeType" IS NULL OR length(btrim("mimeType")) BETWEEN 1 AND 120)
    AND length(btrim("altText")) <= 300
    AND ("width" IS NULL OR "width" > 0)
    AND ("height" IS NULL OR "height" > 0)
    AND (("width" IS NULL AND "height" IS NULL) OR ("width" IS NOT NULL AND "height" IS NOT NULL))
    AND ("focalX" IS NULL OR "focalX" BETWEEN 0 AND 1)
    AND ("focalY" IS NULL OR "focalY" BETWEEN 0 AND 1)
    AND (("focalX" IS NULL) = ("focalY" IS NULL))
    AND "sourceKind" IN ('MERCHANT_OWNED', 'SUPPLIER_LICENSED', 'STOCK_LICENSED', 'SYNTHETIC', 'UNKNOWN')
    AND ("sourceUrl" IS NULL OR (length(btrim("sourceUrl")) BETWEEN 1 AND 2000 AND "sourceUrl" ~ '^https://'))
    AND "rightsStatus" IN ('VERIFIED', 'REVIEW_REQUIRED', 'UNKNOWN')
    AND octet_length("evidenceIdsJson") <= 128000
    AND jsonb_typeof("evidenceIdsJson"::jsonb) = 'array'
    AND ("rightsStatus" <> 'VERIFIED' OR jsonb_array_length("evidenceIdsJson"::jsonb) > 0)
    AND ("rightsStatus" <> 'UNKNOWN' OR "sourceKind" = 'UNKNOWN')
    AND ("rightsStatus" <> 'VERIFIED' OR "sourceKind" <> 'UNKNOWN')
    AND (
      "publicationState" <> 'PUBLIC_READY'
      OR ("publicUrl" IS NOT NULL AND "role" <> 'UNKNOWN')
    )
    AND ("kind" = 'IMAGE' OR ("focalX" IS NULL AND "focalY" IS NULL))
  )
);

CREATE TABLE "CatalogMediaVariantV2" (
  "storeId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  CONSTRAINT "CatalogMediaVariantV2_pkey" PRIMARY KEY ("mediaId", "variantId")
);

CREATE TABLE "CatalogPurchaseOptionV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "quantity" BIGINT NOT NULL,
  "variantId" TEXT,
  "retailPriceState" TEXT NOT NULL,
  "retailPriceMinor" BIGINT,
  "currency" TEXT,
  "compareAtPriceMinor" BIGINT,
  "compareAtPriceCurrency" TEXT,
  "availability" TEXT NOT NULL,
  "repeatPurchaseState" TEXT NOT NULL,
  "repeatIntervalDaysJson" TEXT NOT NULL DEFAULT '[]',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogPurchaseOptionV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogPurchaseOptionV2_contract_check" CHECK (
    length(btrim("stableKey")) BETWEEN 1 AND 180
    AND length(btrim("label")) BETWEEN 1 AND 300
    AND "kind" IN ('SINGLE', 'BUNDLE', 'UNKNOWN')
    AND "quantity" > 0
    AND ("kind" <> 'SINGLE' OR "quantity" = 1)
    AND ("kind" <> 'BUNDLE' OR "quantity" >= 2)
    AND "retailPriceState" IN ('KNOWN', 'UNKNOWN')
    AND (
      ("retailPriceState" = 'UNKNOWN' AND "retailPriceMinor" IS NULL AND "currency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "retailPriceMinor" IS NOT NULL AND "retailPriceMinor" >= 0 AND "currency" ~ '^[A-Z]{3}$')
    )
    AND (
      ("compareAtPriceMinor" IS NULL AND "compareAtPriceCurrency" IS NULL)
      OR
      ("retailPriceState" = 'KNOWN' AND "compareAtPriceMinor" > "retailPriceMinor" AND "compareAtPriceCurrency" = "currency")
    )
    AND "availability" IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')
    AND "repeatPurchaseState" IN ('ELIGIBLE', 'INELIGIBLE', 'UNKNOWN')
    AND octet_length("repeatIntervalDaysJson") <= 16000
    AND jsonb_typeof("repeatIntervalDaysJson"::jsonb) = 'array'
    AND (
      ("repeatPurchaseState" = 'ELIGIBLE' AND jsonb_array_length("repeatIntervalDaysJson"::jsonb) > 0)
      OR
      ("repeatPurchaseState" <> 'ELIGIBLE' AND jsonb_array_length("repeatIntervalDaysJson"::jsonb) = 0)
    )
    AND "sortOrder" >= 0
  )
);

CREATE TABLE "CatalogEvidenceV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productRevisionId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectRef" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "sourceRef" TEXT,
  "contentDigest" TEXT NOT NULL,
  "notesJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogEvidenceV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogEvidenceV2_contract_check" CHECK (
    "contractVersion" = 'catalog-evidence.v2'
    AND length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "kind" IN ('MANUAL_ASSERTION', 'SUPPLIER_OBSERVATION', 'MEDIA_INGESTION', 'DERIVED', 'UNKNOWN')
    AND "state" IN ('VERIFIED', 'UNVERIFIED', 'REJECTED', 'UNKNOWN')
    AND "subjectType" IN ('PRODUCT', 'VARIANT', 'ATTRIBUTE', 'MEDIA', 'COLLECTION_MEMBERSHIP', 'UNKNOWN')
    AND length(btrim("subjectRef")) BETWEEN 1 AND 180
    AND "contentDigest" ~ '^sha256:[0-9a-f]{64}$'
    AND octet_length("notesJson") <= 128000
    AND jsonb_typeof("notesJson"::jsonb) = 'array'
    AND "createdAt" = "recordedAt"
  )
);

CREATE TABLE "CatalogSupplierOfferV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantIdentityId" TEXT,
  "contractVersion" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "supplierAccountRef" TEXT NOT NULL,
  "sourceOfferRef" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "observedCurrency" TEXT NOT NULL,
  "latestObservationId" TEXT,
  "evidenceIdsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogSupplierOfferV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogSupplierOfferV2_contract_check" CHECK (
    "contractVersion" = 'catalog-supplier-offer.v2'
    AND length(btrim("stableKey")) BETWEEN 1 AND 180
    AND length(btrim("supplierAccountRef")) BETWEEN 1 AND 180
    AND length(btrim("sourceOfferRef")) BETWEEN 1 AND 180
    AND "state" IN ('ACTIVE', 'INACTIVE', 'UNKNOWN')
    AND "observedCurrency" ~ '^[A-Z]{3}$'
    AND octet_length("evidenceIdsJson") <= 128000
    AND jsonb_typeof("evidenceIdsJson"::jsonb) = 'array'
  )
);

CREATE TABLE "CatalogSupplierOfferObservationV2" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "outcome" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "unitCostState" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "unitCostMinor" BIGINT,
  "unitCostCurrency" TEXT,
  "shippingState" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "shippingMinor" BIGINT,
  "shippingCurrency" TEXT,
  "inventoryState" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "inventoryQuantity" BIGINT,
  "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "shippingDaysMin" INTEGER,
  "shippingDaysMax" INTEGER,
  "sourcePayloadDigest" TEXT NOT NULL,
  "evidenceIdsJson" TEXT NOT NULL DEFAULT '[]',
  "reasonCodesJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogSupplierOfferObservationV2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogSupplierOfferObservationV2_contract_check" CHECK (
    "contractVersion" = 'catalog-supplier-offer-observation.v2'
    AND length(btrim("stableKey")) BETWEEN 1 AND 180
    AND "outcome" IN ('OBSERVED', 'FAILED', 'UNKNOWN')
    AND "unitCostState" IN ('KNOWN', 'UNKNOWN')
    AND (
      ("unitCostState" = 'UNKNOWN' AND "unitCostMinor" IS NULL AND "unitCostCurrency" IS NULL)
      OR
      ("unitCostState" = 'KNOWN' AND "unitCostMinor" IS NOT NULL AND "unitCostMinor" >= 0 AND "unitCostCurrency" IS NOT NULL AND "unitCostCurrency" ~ '^[A-Z]{3}$')
    )
    AND "shippingState" IN ('KNOWN', 'UNKNOWN')
    AND (
      ("shippingState" = 'UNKNOWN' AND "shippingMinor" IS NULL AND "shippingCurrency" IS NULL AND "shippingDaysMin" IS NULL AND "shippingDaysMax" IS NULL)
      OR
      ("shippingState" = 'KNOWN' AND "shippingMinor" IS NOT NULL AND "shippingMinor" >= 0 AND "shippingCurrency" IS NOT NULL AND "shippingCurrency" ~ '^[A-Z]{3}$' AND "shippingDaysMin" IS NOT NULL AND "shippingDaysMax" IS NOT NULL AND "shippingDaysMin" >= 0 AND "shippingDaysMax" >= "shippingDaysMin")
    )
    AND "inventoryState" IN ('KNOWN', 'UNKNOWN')
    AND (
      ("inventoryState" = 'UNKNOWN' AND "inventoryQuantity" IS NULL AND "availability" = 'UNKNOWN')
      OR
      (
        "inventoryState" = 'KNOWN'
        AND ("inventoryQuantity" IS NULL OR "inventoryQuantity" >= 0)
        AND "availability" IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')
      )
    )
    AND "availability" IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')
    AND (
      "outcome" = 'OBSERVED'
      OR (
        "unitCostState" = 'UNKNOWN'
        AND "shippingState" = 'UNKNOWN'
        AND "inventoryState" = 'UNKNOWN'
        AND "availability" = 'UNKNOWN'
      )
    )
    AND ("availability" <> 'OUT_OF_STOCK' OR "inventoryQuantity" IS NULL OR "inventoryQuantity" = 0)
    AND "sourcePayloadDigest" ~ '^sha256:[0-9a-f]{64}$'
    AND octet_length("evidenceIdsJson") <= 128000
    AND jsonb_typeof("evidenceIdsJson"::jsonb) = 'array'
    AND octet_length("reasonCodesJson") <= 128000
    AND jsonb_typeof("reasonCodesJson"::jsonb) = 'array'
  )
);

-- Tenant-scoped composite keys back every cross-table catalog relation.
CREATE UNIQUE INDEX "Product_storeId_id_key_v2" ON "Product"("storeId", "id");
CREATE UNIQUE INDEX "CatalogArtifactV2_storeId_id_key" ON "CatalogArtifactV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogProductV2_storeId_id_key" ON "CatalogProductV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogVariantIdentityV2_storeId_id_key" ON "CatalogVariantIdentityV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogProductRevisionV2_storeId_id_key" ON "CatalogProductRevisionV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogSellableVariantV2_storeId_id_key" ON "CatalogSellableVariantV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogTaxonomyNodeV2_storeId_id_key" ON "CatalogTaxonomyNodeV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogTaxonomyNodeV2_storeId_artifactId_id_key" ON "CatalogTaxonomyNodeV2"("storeId", "artifactId", "id");
CREATE UNIQUE INDEX "CatalogAttributeDefinitionV2_storeId_id_key" ON "CatalogAttributeDefinitionV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogCollectionV2_storeId_id_key" ON "CatalogCollectionV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogMediaAssetV2_storeId_id_key" ON "CatalogMediaAssetV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogPurchaseOptionV2_storeId_id_key" ON "CatalogPurchaseOptionV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogEvidenceV2_storeId_id_key" ON "CatalogEvidenceV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogSupplierOfferV2_storeId_id_key" ON "CatalogSupplierOfferV2"("storeId", "id");
CREATE UNIQUE INDEX "CatalogSupplierOfferObservationV2_storeId_id_key" ON "CatalogSupplierOfferObservationV2"("storeId", "id");

CREATE UNIQUE INDEX "CatalogArtifactV2_source_identity_key" ON "CatalogArtifactV2"("storeId", "sourceKind", "sourceRef", "contentDigest");
CREATE INDEX "CatalogArtifactV2_storeId_generatedAt_idx" ON "CatalogArtifactV2"("storeId", "generatedAt");
CREATE INDEX "CatalogArtifactV2_contentDigest_idx" ON "CatalogArtifactV2"("contentDigest");
CREATE UNIQUE INDEX "CatalogProductV2_legacyProductId_key" ON "CatalogProductV2"("legacyProductId");
CREATE UNIQUE INDEX "CatalogProductV2_storeId_canonicalKey_key" ON "CatalogProductV2"("storeId", "canonicalKey");
CREATE INDEX "CatalogProductV2_storeId_status_updatedAt_idx" ON "CatalogProductV2"("storeId", "status", "updatedAt");
CREATE UNIQUE INDEX "CatalogVariantIdentityV2_productId_stableKey_key" ON "CatalogVariantIdentityV2"("productId", "stableKey");
CREATE INDEX "CatalogVariantIdentityV2_storeId_productId_idx" ON "CatalogVariantIdentityV2"("storeId", "productId");
CREATE UNIQUE INDEX "CatalogRevisionV2_artifact_product_number_key" ON "CatalogProductRevisionV2"("artifactId", "productId", "revisionNumber");
CREATE UNIQUE INDEX "CatalogRevisionV2_artifact_ref_key" ON "CatalogProductRevisionV2"("artifactId", "artifactRevisionRef");
CREATE INDEX "CatalogProductRevisionV2_storeId_slug_revisionNumber_idx" ON "CatalogProductRevisionV2"("storeId", "slug", "revisionNumber");
CREATE INDEX "CatalogProductRevisionV2_artifactId_idx" ON "CatalogProductRevisionV2"("artifactId");
CREATE INDEX "CatalogProductRevisionV2_storeId_createdAt_idx" ON "CatalogProductRevisionV2"("storeId", "createdAt");
CREATE INDEX "CatalogProductRevisionV2_contentDigest_idx" ON "CatalogProductRevisionV2"("contentDigest");
CREATE UNIQUE INDEX "CatalogSellableVariantV2_productRevisionId_stableKey_key" ON "CatalogSellableVariantV2"("productRevisionId", "stableKey");
CREATE UNIQUE INDEX "CatalogVariantV2_revision_identity_key" ON "CatalogSellableVariantV2"("productRevisionId", "variantIdentityId");
CREATE UNIQUE INDEX "CatalogSellableVariantV2_one_default_key" ON "CatalogSellableVariantV2"("productRevisionId") WHERE "isDefault";
CREATE INDEX "CatalogVariantV2_store_revision_sort_idx" ON "CatalogSellableVariantV2"("storeId", "productRevisionId", "sortOrder");
CREATE UNIQUE INDEX "CatalogTaxonomyNodeV2_artifactId_key_key" ON "CatalogTaxonomyNodeV2"("artifactId", "key");
CREATE UNIQUE INDEX "CatalogTaxonomyNodeV2_artifactId_pathJson_key" ON "CatalogTaxonomyNodeV2"("artifactId", "pathJson");
CREATE INDEX "CatalogTaxonomyV2_store_parent_sort_idx" ON "CatalogTaxonomyNodeV2"("storeId", "taxonomyRef", "parentId", "sortOrder");
CREATE UNIQUE INDEX "CatalogProductTaxonomyPlacementV2_one_primary_key" ON "CatalogProductTaxonomyPlacementV2"("productRevisionId") WHERE "isPrimary";
CREATE INDEX "CatalogPlacementV2_store_node_sort_idx" ON "CatalogProductTaxonomyPlacementV2"("storeId", "taxonomyNodeId", "sortOrder");
CREATE UNIQUE INDEX "CatalogAttributeDefinitionV2_productRevisionId_stableKey_key" ON "CatalogAttributeDefinitionV2"("productRevisionId", "stableKey");
CREATE INDEX "CatalogAttributeDefinitionV2_storeId_key_idx" ON "CatalogAttributeDefinitionV2"("storeId", "key");
CREATE INDEX "CatalogAttrDefV2_store_revision_sort_idx" ON "CatalogAttributeDefinitionV2"("storeId", "productRevisionId", "sortOrder");
CREATE INDEX "CatalogTaxonomyAttrV2_store_node_sort_idx" ON "CatalogTaxonomyAttributeDefinitionV2"("storeId", "taxonomyNodeId", "sortOrder");
CREATE INDEX "CatalogTaxonomyAttributeDefinitionV2_storeId_definitionId_idx" ON "CatalogTaxonomyAttributeDefinitionV2"("storeId", "definitionId");
CREATE UNIQUE INDEX "CatalogAttributeOptionV2_definitionId_key_key" ON "CatalogAttributeOptionV2"("definitionId", "key");
CREATE INDEX "CatalogAttributeOptionV2_storeId_definitionId_sortOrder_idx" ON "CatalogAttributeOptionV2"("storeId", "definitionId", "sortOrder");
CREATE UNIQUE INDEX "CatalogAttrValueV2_revision_scope_definition_key" ON "CatalogProductAttributeValueV2"("productRevisionId", "assignmentScopeKey", "definitionId");
CREATE INDEX "CatalogProductAttributeValueV2_storeId_definitionId_idx" ON "CatalogProductAttributeValueV2"("storeId", "definitionId");
CREATE INDEX "CatalogProductAttributeValueV2_variantId_idx" ON "CatalogProductAttributeValueV2"("variantId");
CREATE UNIQUE INDEX "CatalogCollectionV2_artifactId_stableKey_key" ON "CatalogCollectionV2"("artifactId", "stableKey");
CREATE UNIQUE INDEX "CatalogCollectionV2_artifactId_slug_key" ON "CatalogCollectionV2"("artifactId", "slug");
CREATE INDEX "CatalogCollectionV2_storeId_updatedAt_idx" ON "CatalogCollectionV2"("storeId", "updatedAt");
CREATE INDEX "CatalogCollectionItemV2_storeId_collectionId_sortOrder_idx" ON "CatalogCollectionItemV2"("storeId", "collectionId", "sortOrder");
CREATE INDEX "CatalogCollectionItemV2_storeId_productRevisionId_idx" ON "CatalogCollectionItemV2"("storeId", "productRevisionId");
CREATE UNIQUE INDEX "CatalogMediaAssetV2_productRevisionId_stableKey_key" ON "CatalogMediaAssetV2"("productRevisionId", "stableKey");
CREATE INDEX "CatalogMediaAssetV2_productRevisionId_role_sortOrder_idx" ON "CatalogMediaAssetV2"("productRevisionId", "role", "sortOrder");
CREATE UNIQUE INDEX "CatalogMediaAssetV2_one_public_primary_key" ON "CatalogMediaAssetV2"("productRevisionId")
  WHERE "role" = 'PRIMARY' AND "publicationState" = 'PUBLIC_READY';
CREATE INDEX "CatalogMediaAssetV2_storeId_productRevisionId_sortOrder_idx" ON "CatalogMediaAssetV2"("storeId", "productRevisionId", "sortOrder");
CREATE INDEX "CatalogMediaAssetV2_publicationState_rightsStatus_idx" ON "CatalogMediaAssetV2"("publicationState", "rightsStatus");
CREATE INDEX "CatalogMediaVariantV2_storeId_variantId_idx" ON "CatalogMediaVariantV2"("storeId", "variantId");
CREATE UNIQUE INDEX "CatalogPurchaseOptionV2_productRevisionId_stableKey_key" ON "CatalogPurchaseOptionV2"("productRevisionId", "stableKey");
CREATE INDEX "CatalogPurchaseOptionV2_storeId_productRevisionId_sortOrder_idx" ON "CatalogPurchaseOptionV2"("storeId", "productRevisionId", "sortOrder");
CREATE INDEX "CatalogPurchaseOptionV2_variantId_idx" ON "CatalogPurchaseOptionV2"("variantId");
CREATE UNIQUE INDEX "CatalogEvidenceV2_productRevisionId_stableKey_key" ON "CatalogEvidenceV2"("productRevisionId", "stableKey");
CREATE INDEX "CatalogEvidenceV2_storeId_subjectType_subjectRef_idx" ON "CatalogEvidenceV2"("storeId", "subjectType", "subjectRef");
CREATE INDEX "CatalogEvidenceV2_contentDigest_idx" ON "CatalogEvidenceV2"("contentDigest");
CREATE UNIQUE INDEX "CatalogSupplierOfferV2_storeId_stableKey_key" ON "CatalogSupplierOfferV2"("storeId", "stableKey");
CREATE UNIQUE INDEX "CatalogSupplierOfferV2_latestObservationId_key" ON "CatalogSupplierOfferV2"("latestObservationId");
CREATE INDEX "CatalogSupplierOfferV2_storeId_productId_state_idx" ON "CatalogSupplierOfferV2"("storeId", "productId", "state");
CREATE INDEX "CatalogOfferV2_store_source_idx" ON "CatalogSupplierOfferV2"("storeId", "supplierAccountRef", "sourceOfferRef");
CREATE UNIQUE INDEX "CatalogSupplierOfferObservationV2_storeId_stableKey_key" ON "CatalogSupplierOfferObservationV2"("storeId", "stableKey");
CREATE INDEX "CatalogOfferObsV2_offer_payload_digest_idx" ON "CatalogSupplierOfferObservationV2"("offerId", "sourcePayloadDigest");
CREATE INDEX "CatalogOfferObsV2_store_offer_time_idx" ON "CatalogSupplierOfferObservationV2"("storeId", "offerId", "observedAt");
CREATE INDEX "CatalogOfferObsV2_store_availability_time_idx" ON "CatalogSupplierOfferObservationV2"("storeId", "availability", "observedAt");

ALTER TABLE "CatalogArtifactV2" ADD CONSTRAINT "CatalogArtifactV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductV2" ADD CONSTRAINT "CatalogProductV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductV2" ADD CONSTRAINT "CatalogProductV2_legacy_scope_fkey"
  FOREIGN KEY ("storeId", "legacyProductId") REFERENCES "Product"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogVariantIdentityV2" ADD CONSTRAINT "CatalogVariantIdentityV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogVariantIdentityV2" ADD CONSTRAINT "CatalogVariantIdentityV2_product_scope_fkey"
  FOREIGN KEY ("storeId", "productId") REFERENCES "CatalogProductV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductRevisionV2" ADD CONSTRAINT "CatalogProductRevisionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductRevisionV2" ADD CONSTRAINT "CatalogProductRevisionV2_artifact_scope_fkey"
  FOREIGN KEY ("storeId", "artifactId") REFERENCES "CatalogArtifactV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductRevisionV2" ADD CONSTRAINT "CatalogProductRevisionV2_product_scope_fkey"
  FOREIGN KEY ("storeId", "productId") REFERENCES "CatalogProductV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSellableVariantV2" ADD CONSTRAINT "CatalogSellableVariantV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSellableVariantV2" ADD CONSTRAINT "CatalogSellableVariantV2_identity_scope_fkey"
  FOREIGN KEY ("storeId", "variantIdentityId") REFERENCES "CatalogVariantIdentityV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyNodeV2" ADD CONSTRAINT "CatalogTaxonomyNodeV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyNodeV2" ADD CONSTRAINT "CatalogTaxonomyNodeV2_artifact_scope_fkey"
  FOREIGN KEY ("storeId", "artifactId") REFERENCES "CatalogArtifactV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyNodeV2" ADD CONSTRAINT "CatalogTaxonomyNodeV2_parent_scope_fkey"
  FOREIGN KEY ("storeId", "artifactId", "parentId") REFERENCES "CatalogTaxonomyNodeV2"("storeId", "artifactId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductTaxonomyPlacementV2" ADD CONSTRAINT "CatalogProductTaxonomyPlacementV2_product_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductTaxonomyPlacementV2" ADD CONSTRAINT "CatalogProductTaxonomyPlacementV2_node_scope_fkey"
  FOREIGN KEY ("storeId", "taxonomyNodeId") REFERENCES "CatalogTaxonomyNodeV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogAttributeDefinitionV2" ADD CONSTRAINT "CatalogAttributeDefinitionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogAttributeDefinitionV2" ADD CONSTRAINT "CatalogAttributeDefinitionV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyAttributeDefinitionV2" ADD CONSTRAINT "CatalogTaxonomyAttributeDefinitionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyAttributeDefinitionV2" ADD CONSTRAINT "CatalogTaxonomyAttributeDefinitionV2_node_scope_fkey"
  FOREIGN KEY ("storeId", "taxonomyNodeId") REFERENCES "CatalogTaxonomyNodeV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogTaxonomyAttributeDefinitionV2" ADD CONSTRAINT "CatalogTaxonomyAttributeDefinitionV2_definition_scope_fkey"
  FOREIGN KEY ("storeId", "definitionId") REFERENCES "CatalogAttributeDefinitionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogAttributeOptionV2" ADD CONSTRAINT "CatalogAttributeOptionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogAttributeOptionV2" ADD CONSTRAINT "CatalogAttributeOptionV2_definition_scope_fkey"
  FOREIGN KEY ("storeId", "definitionId") REFERENCES "CatalogAttributeDefinitionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductAttributeValueV2" ADD CONSTRAINT "CatalogProductAttributeValueV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductAttributeValueV2" ADD CONSTRAINT "CatalogProductAttributeValueV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductAttributeValueV2" ADD CONSTRAINT "CatalogProductAttributeValueV2_variant_scope_fkey"
  FOREIGN KEY ("storeId", "variantId") REFERENCES "CatalogSellableVariantV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogProductAttributeValueV2" ADD CONSTRAINT "CatalogProductAttributeValueV2_definition_scope_fkey"
  FOREIGN KEY ("storeId", "definitionId") REFERENCES "CatalogAttributeDefinitionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogCollectionV2" ADD CONSTRAINT "CatalogCollectionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogCollectionV2" ADD CONSTRAINT "CatalogCollectionV2_artifact_scope_fkey"
  FOREIGN KEY ("storeId", "artifactId") REFERENCES "CatalogArtifactV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogCollectionItemV2" ADD CONSTRAINT "CatalogCollectionItemV2_collection_scope_fkey"
  FOREIGN KEY ("storeId", "collectionId") REFERENCES "CatalogCollectionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogCollectionItemV2" ADD CONSTRAINT "CatalogCollectionItemV2_product_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMediaAssetV2" ADD CONSTRAINT "CatalogMediaAssetV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMediaAssetV2" ADD CONSTRAINT "CatalogMediaAssetV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMediaVariantV2" ADD CONSTRAINT "CatalogMediaVariantV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMediaVariantV2" ADD CONSTRAINT "CatalogMediaVariantV2_media_scope_fkey"
  FOREIGN KEY ("storeId", "mediaId") REFERENCES "CatalogMediaAssetV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMediaVariantV2" ADD CONSTRAINT "CatalogMediaVariantV2_variant_scope_fkey"
  FOREIGN KEY ("storeId", "variantId") REFERENCES "CatalogSellableVariantV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogPurchaseOptionV2" ADD CONSTRAINT "CatalogPurchaseOptionV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogPurchaseOptionV2" ADD CONSTRAINT "CatalogPurchaseOptionV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogPurchaseOptionV2" ADD CONSTRAINT "CatalogPurchaseOptionV2_variant_scope_fkey"
  FOREIGN KEY ("storeId", "variantId") REFERENCES "CatalogSellableVariantV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogEvidenceV2" ADD CONSTRAINT "CatalogEvidenceV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogEvidenceV2" ADD CONSTRAINT "CatalogEvidenceV2_revision_scope_fkey"
  FOREIGN KEY ("storeId", "productRevisionId") REFERENCES "CatalogProductRevisionV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferV2" ADD CONSTRAINT "CatalogSupplierOfferV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferV2" ADD CONSTRAINT "CatalogSupplierOfferV2_product_scope_fkey"
  FOREIGN KEY ("storeId", "productId") REFERENCES "CatalogProductV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferV2" ADD CONSTRAINT "CatalogSupplierOfferV2_variant_scope_fkey"
  FOREIGN KEY ("storeId", "variantIdentityId") REFERENCES "CatalogVariantIdentityV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferObservationV2" ADD CONSTRAINT "CatalogSupplierOfferObservationV2_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferObservationV2" ADD CONSTRAINT "CatalogSupplierOfferObservationV2_offer_scope_fkey"
  FOREIGN KEY ("storeId", "offerId") REFERENCES "CatalogSupplierOfferV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogSupplierOfferV2" ADD CONSTRAINT "CatalogSupplierOfferV2_latest_observation_scope_fkey"
  FOREIGN KEY ("storeId", "latestObservationId") REFERENCES "CatalogSupplierOfferObservationV2"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "guardCatalogTaxonomyProvenanceV2"() RETURNS TRIGGER AS $$
DECLARE
  artifact_taxonomy_ref TEXT;
  artifact_taxonomy_contract TEXT;
BEGIN
  SELECT "taxonomyRef", "taxonomyContractVersion"
  INTO artifact_taxonomy_ref, artifact_taxonomy_contract
  FROM "CatalogArtifactV2"
  WHERE "id" = NEW."artifactId" AND "storeId" = NEW."storeId";
  IF artifact_taxonomy_ref IS NULL
     OR NEW."taxonomyRef" <> artifact_taxonomy_ref
     OR NEW."contractVersion" <> artifact_taxonomy_contract THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_TAXONOMY_PROVENANCE_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogTaxonomyProvenanceV2"
BEFORE INSERT OR UPDATE ON "CatalogTaxonomyNodeV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogTaxonomyProvenanceV2"();

CREATE FUNCTION "guardCatalogVariantIdentityScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  revision_product_id TEXT;
  identity_product_id TEXT;
  identity_stable_key TEXT;
BEGIN
  SELECT "productId" INTO revision_product_id
  FROM "CatalogProductRevisionV2"
  WHERE "id" = NEW."productRevisionId" AND "storeId" = NEW."storeId";
  SELECT "productId", "stableKey" INTO identity_product_id, identity_stable_key
  FROM "CatalogVariantIdentityV2"
  WHERE "id" = NEW."variantIdentityId" AND "storeId" = NEW."storeId";
  IF revision_product_id IS NULL
     OR identity_product_id IS NULL
     OR revision_product_id <> identity_product_id
     OR NEW."stableKey" <> identity_stable_key THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_VARIANT_IDENTITY_SCOPE_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogVariantIdentityScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogSellableVariantV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogVariantIdentityScopeV2"();

CREATE FUNCTION "guardCatalogArtifactScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  left_artifact_id TEXT;
  right_artifact_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'CatalogProductTaxonomyPlacementV2' THEN
    SELECT "artifactId" INTO left_artifact_id
    FROM "CatalogProductRevisionV2"
    WHERE "id" = NEW."productRevisionId" AND "storeId" = NEW."storeId";
    SELECT "artifactId" INTO right_artifact_id
    FROM "CatalogTaxonomyNodeV2"
    WHERE "id" = NEW."taxonomyNodeId" AND "storeId" = NEW."storeId";
  ELSIF TG_TABLE_NAME = 'CatalogTaxonomyAttributeDefinitionV2' THEN
    SELECT "artifactId" INTO left_artifact_id
    FROM "CatalogTaxonomyNodeV2"
    WHERE "id" = NEW."taxonomyNodeId" AND "storeId" = NEW."storeId";
    SELECT revision."artifactId" INTO right_artifact_id
    FROM "CatalogAttributeDefinitionV2" definition
    JOIN "CatalogProductRevisionV2" revision ON revision."id" = definition."productRevisionId"
    WHERE definition."id" = NEW."definitionId" AND definition."storeId" = NEW."storeId";
  ELSIF TG_TABLE_NAME = 'CatalogCollectionItemV2' THEN
    SELECT "artifactId" INTO left_artifact_id
    FROM "CatalogCollectionV2"
    WHERE "id" = NEW."collectionId" AND "storeId" = NEW."storeId";
    SELECT "artifactId" INTO right_artifact_id
    FROM "CatalogProductRevisionV2"
    WHERE "id" = NEW."productRevisionId" AND "storeId" = NEW."storeId";
  ELSE
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_ARTIFACT_SCOPE_GUARD_MISCONFIGURED';
  END IF;
  IF left_artifact_id IS NULL OR right_artifact_id IS NULL OR left_artifact_id <> right_artifact_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_ARTIFACT_SCOPE_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogTaxonomyPlacementArtifactScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogProductTaxonomyPlacementV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogArtifactScopeV2"();
CREATE TRIGGER "guardCatalogTaxonomyAttributeArtifactScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogTaxonomyAttributeDefinitionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogArtifactScopeV2"();
CREATE TRIGGER "guardCatalogCollectionItemArtifactScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogCollectionItemV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogArtifactScopeV2"();

CREATE FUNCTION "guardCatalogMediaVariantScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  media_revision_id TEXT;
  variant_revision_id TEXT;
  revision_sealed_at TIMESTAMP(3);
BEGIN
  SELECT "productRevisionId" INTO media_revision_id
  FROM "CatalogMediaAssetV2"
  WHERE "id" = NEW."mediaId" AND "storeId" = NEW."storeId";
  SELECT "productRevisionId" INTO variant_revision_id
  FROM "CatalogSellableVariantV2"
  WHERE "id" = NEW."variantId" AND "storeId" = NEW."storeId";
  IF media_revision_id IS NULL OR variant_revision_id IS NULL OR media_revision_id <> variant_revision_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_MEDIA_VARIANT_REVISION_SCOPE_MISMATCH';
  END IF;
  SELECT "sealedAt" INTO revision_sealed_at
  FROM "CatalogProductRevisionV2"
  WHERE "id" = media_revision_id AND "storeId" = NEW."storeId";
  IF revision_sealed_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'CATALOG_PRODUCT_REVISION_IS_SEALED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogMediaVariantScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogMediaVariantV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogMediaVariantScopeV2"();

CREATE FUNCTION "guardCatalogAttributeValueScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  definition_scope TEXT;
  definition_revision_id TEXT;
  variant_revision_id TEXT;
  expected_assignment_scope_key TEXT;
BEGIN
  SELECT "scope", "productRevisionId" INTO definition_scope, definition_revision_id
  FROM "CatalogAttributeDefinitionV2"
  WHERE "id" = NEW."definitionId" AND "storeId" = NEW."storeId";
  IF definition_scope IS NULL
     OR definition_revision_id <> NEW."productRevisionId"
     OR (definition_scope = 'PRODUCT' AND NEW."variantId" IS NOT NULL)
     OR (definition_scope = 'VARIANT' AND NEW."variantId" IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_ATTRIBUTE_VALUE_SUBJECT_SCOPE_MISMATCH';
  END IF;
  expected_assignment_scope_key := COALESCE(NEW."variantId", 'PRODUCT');
  IF NEW."assignmentScopeKey" <> expected_assignment_scope_key THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_ATTRIBUTE_VALUE_ASSIGNMENT_KEY_MISMATCH';
  END IF;
  IF NEW."variantId" IS NOT NULL THEN
    SELECT "productRevisionId" INTO variant_revision_id
    FROM "CatalogSellableVariantV2"
    WHERE "id" = NEW."variantId" AND "storeId" = NEW."storeId";
    IF variant_revision_id IS NULL OR variant_revision_id <> NEW."productRevisionId" THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_ATTRIBUTE_VALUE_REVISION_SCOPE_MISMATCH';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogAttributeValueScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogProductAttributeValueV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogAttributeValueScopeV2"();

CREATE FUNCTION "guardCatalogOfferVariantScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  variant_product_id TEXT;
BEGIN
  IF NEW."variantIdentityId" IS NOT NULL THEN
    SELECT "productId" INTO variant_product_id
    FROM "CatalogVariantIdentityV2"
    WHERE "id" = NEW."variantIdentityId" AND "storeId" = NEW."storeId";
    IF variant_product_id IS NULL OR variant_product_id <> NEW."productId" THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_OFFER_VARIANT_PRODUCT_SCOPE_MISMATCH';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogOfferVariantScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogSupplierOfferV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogOfferVariantScopeV2"();

CREATE FUNCTION "guardCatalogPurchaseOptionScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  variant_revision_id TEXT;
BEGIN
  IF NEW."variantId" IS NOT NULL THEN
    SELECT "productRevisionId" INTO variant_revision_id
    FROM "CatalogSellableVariantV2"
    WHERE "id" = NEW."variantId" AND "storeId" = NEW."storeId";
    IF variant_revision_id IS NULL OR variant_revision_id <> NEW."productRevisionId" THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_PURCHASE_OPTION_REVISION_SCOPE_MISMATCH';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogPurchaseOptionScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogPurchaseOptionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogPurchaseOptionScopeV2"();

CREATE FUNCTION "guardCatalogLatestObservationScopeV2"() RETURNS TRIGGER AS $$
DECLARE
  observation_offer_id TEXT;
BEGIN
  IF NEW."latestObservationId" IS NOT NULL THEN
    SELECT "offerId" INTO observation_offer_id
    FROM "CatalogSupplierOfferObservationV2"
    WHERE "id" = NEW."latestObservationId" AND "storeId" = NEW."storeId";
    IF observation_offer_id IS NULL OR observation_offer_id <> NEW."id" THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_LATEST_OBSERVATION_OFFER_SCOPE_MISMATCH';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogLatestObservationScopeV2"
BEFORE INSERT OR UPDATE ON "CatalogSupplierOfferV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogLatestObservationScopeV2"();

-- Revision children are assembled while the parent is open, then the parent is
-- sealed exactly once. Inserts against a sealed revision are rejected even if
-- all tenant-scoped foreign keys otherwise match.
CREATE FUNCTION "guardCatalogRevisionChildInsertV2"() RETURNS TRIGGER AS $$
DECLARE
  revision_sealed_at TIMESTAMP(3);
BEGIN
  SELECT "sealedAt" INTO revision_sealed_at
  FROM "CatalogProductRevisionV2"
  WHERE "id" = NEW."productRevisionId" AND "storeId" = NEW."storeId";
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'CATALOG_PRODUCT_REVISION_NOT_FOUND';
  END IF;
  IF revision_sealed_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'CATALOG_PRODUCT_REVISION_IS_SEALED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogVariantRevisionOpenV2"
BEFORE INSERT ON "CatalogSellableVariantV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogTaxonomyPlacementRevisionOpenV2"
BEFORE INSERT ON "CatalogProductTaxonomyPlacementV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogAttributeDefinitionRevisionOpenV2"
BEFORE INSERT ON "CatalogAttributeDefinitionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogAttributeValueRevisionOpenV2"
BEFORE INSERT ON "CatalogProductAttributeValueV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogCollectionItemRevisionOpenV2"
BEFORE INSERT ON "CatalogCollectionItemV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogMediaRevisionOpenV2"
BEFORE INSERT ON "CatalogMediaAssetV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogPurchaseOptionRevisionOpenV2"
BEFORE INSERT ON "CatalogPurchaseOptionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();
CREATE TRIGGER "guardCatalogEvidenceRevisionOpenV2"
BEFORE INSERT ON "CatalogEvidenceV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogRevisionChildInsertV2"();

CREATE FUNCTION "guardCatalogDefinitionChildInsertV2"() RETURNS TRIGGER AS $$
DECLARE
  definition_revision_id TEXT;
  revision_sealed_at TIMESTAMP(3);
BEGIN
  SELECT definition."productRevisionId", revision."sealedAt"
  INTO definition_revision_id, revision_sealed_at
  FROM "CatalogAttributeDefinitionV2" definition
  JOIN "CatalogProductRevisionV2" revision
    ON revision."id" = definition."productRevisionId"
   AND revision."storeId" = definition."storeId"
  WHERE definition."id" = NEW."definitionId" AND definition."storeId" = NEW."storeId";
  IF definition_revision_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'CATALOG_ATTRIBUTE_DEFINITION_NOT_FOUND';
  END IF;
  IF revision_sealed_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'CATALOG_PRODUCT_REVISION_IS_SEALED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "guardCatalogAttributeOptionRevisionOpenV2"
BEFORE INSERT ON "CatalogAttributeOptionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogDefinitionChildInsertV2"();
CREATE TRIGGER "guardCatalogTaxonomyAttributeRevisionOpenV2"
BEFORE INSERT ON "CatalogTaxonomyAttributeDefinitionV2"
FOR EACH ROW EXECUTE FUNCTION "guardCatalogDefinitionChildInsertV2"();

CREATE FUNCTION "rejectCatalogImmutableMutationV2"() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'CATALOG_V2_ARTIFACT_IS_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "assertCatalogRevisionGraphCompleteV2"(
  target_revision_id TEXT,
  target_store_id TEXT
) RETURNS VOID AS $$
DECLARE
  variant_count INTEGER;
  default_variant_count INTEGER;
  placement_count INTEGER;
  primary_placement_count INTEGER;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE "isDefault")
  INTO variant_count, default_variant_count
  FROM "CatalogSellableVariantV2"
  WHERE "productRevisionId" = target_revision_id AND "storeId" = target_store_id;
  IF variant_count > 0 AND default_variant_count <> 1 THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_DEFAULT_VARIANT_INCOMPLETE';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE "isPrimary")
  INTO placement_count, primary_placement_count
  FROM "CatalogProductTaxonomyPlacementV2"
  WHERE "productRevisionId" = target_revision_id AND "storeId" = target_store_id;
  IF placement_count = 0 OR primary_placement_count <> 1 THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_TAXONOMY_INCOMPLETE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CatalogAttributeDefinitionV2" definition
    WHERE definition."productRevisionId" = target_revision_id
      AND definition."storeId" = target_store_id
      AND definition."required"
      AND (
        (
          definition."scope" = 'PRODUCT'
          AND NOT EXISTS (
            SELECT 1 FROM "CatalogProductAttributeValueV2" value
            WHERE value."productRevisionId" = target_revision_id
              AND value."storeId" = target_store_id
              AND value."definitionId" = definition."id"
              AND value."variantId" IS NULL
          )
        )
        OR
        (
          definition."scope" = 'VARIANT'
          AND EXISTS (
            SELECT 1 FROM "CatalogSellableVariantV2" variant
            WHERE variant."productRevisionId" = target_revision_id
              AND variant."storeId" = target_store_id
              AND NOT EXISTS (
                SELECT 1 FROM "CatalogProductAttributeValueV2" value
                WHERE value."productRevisionId" = target_revision_id
                  AND value."storeId" = target_store_id
                  AND value."definitionId" = definition."id"
                  AND value."variantId" = variant."id"
              )
          )
        )
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_REQUIRED_ATTRIBUTE_INCOMPLETE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CatalogAttributeDefinitionV2" definition
    WHERE definition."productRevisionId" = target_revision_id
      AND definition."storeId" = target_store_id
      AND definition."valueType" = 'ENUM'
      AND NOT EXISTS (
        SELECT 1 FROM "CatalogAttributeOptionV2" option
        WHERE option."definitionId" = definition."id"
          AND option."storeId" = target_store_id
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_ENUM_OPTIONS_INCOMPLETE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CatalogMediaAssetV2" media
    WHERE media."productRevisionId" = target_revision_id
      AND media."storeId" = target_store_id
      AND media."role" = 'VARIANT'
      AND NOT EXISTS (
        SELECT 1 FROM "CatalogMediaVariantV2" link
        WHERE link."mediaId" = media."id" AND link."storeId" = target_store_id
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_VARIANT_MEDIA_INCOMPLETE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CatalogMediaAssetV2" media
    CROSS JOIN LATERAL jsonb_array_elements_text(media."evidenceIdsJson"::jsonb) referenced("evidenceId")
    WHERE media."productRevisionId" = target_revision_id
      AND media."storeId" = target_store_id
      AND NOT EXISTS (
        SELECT 1 FROM "CatalogEvidenceV2" evidence
        WHERE evidence."productRevisionId" = target_revision_id
          AND evidence."storeId" = target_store_id
          AND evidence."stableKey" = referenced."evidenceId"
      )
    UNION ALL
    SELECT 1
    FROM "CatalogCollectionItemV2" membership
    CROSS JOIN LATERAL jsonb_array_elements_text(membership."evidenceIdsJson"::jsonb) referenced("evidenceId")
    WHERE membership."productRevisionId" = target_revision_id
      AND membership."storeId" = target_store_id
      AND NOT EXISTS (
        SELECT 1 FROM "CatalogEvidenceV2" evidence
        WHERE evidence."productRevisionId" = target_revision_id
          AND evidence."storeId" = target_store_id
          AND evidence."stableKey" = referenced."evidenceId"
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'CATALOG_REVISION_EVIDENCE_REFERENCE_INCOMPLETE';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "sealCatalogProductRevisionV2"() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD."sealedAt" IS NULL
     AND NEW."sealedAt" IS NOT NULL
     AND (to_jsonb(NEW) - 'sealedAt') = (to_jsonb(OLD) - 'sealedAt') THEN
    PERFORM "assertCatalogRevisionGraphCompleteV2"(NEW."id", NEW."storeId");
    RETURN NEW;
  END IF;
  RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'CATALOG_PRODUCT_REVISION_IS_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rejectCatalogProductRevisionMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogProductRevisionV2"
FOR EACH ROW EXECUTE FUNCTION "sealCatalogProductRevisionV2"();
CREATE TRIGGER "rejectCatalogArtifactMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogArtifactV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogVariantIdentityMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogVariantIdentityV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogVariantMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogSellableVariantV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogTaxonomyNodeMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogTaxonomyNodeV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogTaxonomyPlacementMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogProductTaxonomyPlacementV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogAttributeDefinitionMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogAttributeDefinitionV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogTaxonomyAttributeMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogTaxonomyAttributeDefinitionV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogAttributeOptionMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogAttributeOptionV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogAttributeValueMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogProductAttributeValueV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogCollectionMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogCollectionV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogCollectionItemMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogCollectionItemV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogMediaMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogMediaAssetV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogMediaVariantMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogMediaVariantV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogPurchaseOptionMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogPurchaseOptionV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogEvidenceMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogEvidenceV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();
CREATE TRIGGER "rejectCatalogOfferObservationMutationV2"
BEFORE UPDATE OR DELETE ON "CatalogSupplierOfferObservationV2"
FOR EACH ROW EXECUTE FUNCTION "rejectCatalogImmutableMutationV2"();

COMMIT;
