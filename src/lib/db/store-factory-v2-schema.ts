import { createHash, timingSafeEqual } from "node:crypto";
import {
  STORE_FACTORY_V2_CHECK_CONTRACTS,
  STORE_FACTORY_V2_COLUMN_CONTRACT_FINGERPRINTS,
  STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS,
  STORE_FACTORY_V2_INDEX_DEFINITION_FINGERPRINTS,
  STORE_FACTORY_V2_TRIGGER_DEFINITION_FINGERPRINTS,
} from "./store-factory-v2-schema-contract";

export const STORE_FACTORY_V2_SCHEMA_VERSION =
  "universal-store-factory.v2.1" as const;

export const STORE_FACTORY_V2_DDL_BUNDLE_VERSION =
  "universal-store-factory.v2.1.ddl" as const;

export const STORE_FACTORY_V2_REQUIRED_COLUMNS = {
  StoreBuildRun: [
    "id",
    "storeId",
    "contractVersion",
    "requestKey",
    "inputDigest",
    "outputDigest",
    "requestedBy",
    "requestJson",
    "briefJson",
    "catalogShapeJson",
    "catalogArtifactId",
    "catalogBindingJson",
    "status",
    "phase",
    "failureCode",
    "failureMessage",
    "startedAt",
    "completedAt",
    "createdAt",
  ],
  StoreRevision: [
    "id",
    "storeId",
    "buildRunId",
    "revisionNumber",
    "parentRevisionId",
    "catalogArtifactId",
    "catalogBindingJson",
    "contractVersion",
    "inputDigest",
    "outputDigest",
    "briefJson",
    "catalogShapeJson",
    "revisionJson",
    "status",
    "createdAt",
    "reviewedAt",
    "reviewedBy",
    "reviewReason",
  ],
  StoreBuildEvent: [
    "id",
    "buildRunId",
    "sequence",
    "contractVersion",
    "phase",
    "eventType",
    "payloadJson",
    "createdAt",
  ],
  StorePreviewRevisionPointer: [
    "storeId",
    "activePreviewRevisionId",
    "contractVersion",
    "version",
    "lastAction",
    "changedBy",
    "changeReason",
    "createdAt",
    "updatedAt",
  ],
  Wishlist: ["anonymousId", "customerId"],
  WishlistItem: ["productId", "variantId", "itemKey"],
  CatalogArtifactV2: [
    "id",
    "storeId",
    "sourceKind",
    "sourceRef",
    "contractVersion",
    "description",
    "generatedAt",
    "taxonomyRef",
    "taxonomyContractVersion",
    "artifactJson",
    "contentDigest",
    "createdAt",
  ],
  CatalogProductV2: [
    "id",
    "storeId",
    "legacyProductId",
    "canonicalKey",
    "status",
    "createdAt",
    "updatedAt",
  ],
  CatalogVariantIdentityV2: [
    "id",
    "storeId",
    "productId",
    "stableKey",
    "createdAt",
    "updatedAt",
  ],
  CatalogProductRevisionV2: [
    "id",
    "storeId",
    "artifactId",
    "productId",
    "artifactRevisionRef",
    "revisionNumber",
    "contractVersion",
    "source",
    "revisionState",
    "slug",
    "title",
    "subtitle",
    "description",
    "brand",
    "seoTitle",
    "seoDescription",
    "retailPriceState",
    "retailPriceMinor",
    "currency",
    "compareAtPriceMinor",
    "compareAtPriceCurrency",
    "availability",
    "purchasable",
    "revisionJson",
    "contentDigest",
    "reasonCodesJson",
    "createdAt",
    "sealedAt",
  ],
  CatalogSellableVariantV2: [
    "id",
    "storeId",
    "productRevisionId",
    "variantIdentityId",
    "stableKey",
    "label",
    "optionValuesJson",
    "retailPriceState",
    "retailPriceMinor",
    "currency",
    "compareAtPriceMinor",
    "compareAtPriceCurrency",
    "availability",
    "isDefault",
    "sortOrder",
    "createdAt",
  ],
  CatalogTaxonomyNodeV2: [
    "id",
    "storeId",
    "artifactId",
    "taxonomyRef",
    "contractVersion",
    "parentId",
    "key",
    "slug",
    "title",
    "description",
    "pathJson",
    "depth",
    "sortOrder",
    "createdAt",
    "updatedAt",
  ],
  CatalogProductTaxonomyPlacementV2: [
    "storeId",
    "productRevisionId",
    "taxonomyNodeId",
    "isPrimary",
    "sortOrder",
  ],
  CatalogAttributeDefinitionV2: [
    "id",
    "storeId",
    "productRevisionId",
    "stableKey",
    "key",
    "label",
    "valueType",
    "cardinality",
    "scope",
    "variantAxis",
    "storefrontVisible",
    "unitCode",
    "facetable",
    "comparable",
    "required",
    "sortOrder",
    "createdAt",
  ],
  CatalogTaxonomyAttributeDefinitionV2: [
    "storeId",
    "taxonomyNodeId",
    "definitionId",
    "sortOrder",
  ],
  CatalogAttributeOptionV2: [
    "id",
    "storeId",
    "definitionId",
    "key",
    "label",
    "sortOrder",
    "createdAt",
  ],
  CatalogProductAttributeValueV2: [
    "id",
    "storeId",
    "productRevisionId",
    "variantId",
    "definitionId",
    "assignmentScopeKey",
    "valuesJson",
    "normalizedValuesJson",
    "createdAt",
  ],
  CatalogCollectionV2: [
    "id",
    "storeId",
    "artifactId",
    "stableKey",
    "contractVersion",
    "slug",
    "title",
    "description",
    "seoTitle",
    "seoDescription",
    "kind",
    "publicationState",
    "position",
    "ruleJson",
    "createdAt",
    "updatedAt",
  ],
  CatalogCollectionItemV2: [
    "storeId",
    "collectionId",
    "productRevisionId",
    "sortOrder",
    "evidenceIdsJson",
  ],
  CatalogMediaAssetV2: [
    "id",
    "storeId",
    "productRevisionId",
    "stableKey",
    "kind",
    "role",
    "publicationState",
    "sortOrder",
    "publicUrl",
    "mimeType",
    "altText",
    "width",
    "height",
    "focalX",
    "focalY",
    "sourceKind",
    "sourceUrl",
    "rightsStatus",
    "evidenceIdsJson",
    "createdAt",
  ],
  CatalogMediaVariantV2: ["storeId", "mediaId", "variantId"],
  CatalogPurchaseOptionV2: [
    "id",
    "storeId",
    "productRevisionId",
    "stableKey",
    "kind",
    "label",
    "quantity",
    "variantId",
    "retailPriceState",
    "retailPriceMinor",
    "currency",
    "compareAtPriceMinor",
    "compareAtPriceCurrency",
    "availability",
    "repeatPurchaseState",
    "repeatIntervalDaysJson",
    "sortOrder",
    "createdAt",
  ],
  CatalogEvidenceV2: [
    "id",
    "storeId",
    "productRevisionId",
    "stableKey",
    "contractVersion",
    "kind",
    "state",
    "subjectType",
    "subjectRef",
    "recordedAt",
    "sourceRef",
    "contentDigest",
    "notesJson",
    "createdAt",
  ],
  CatalogSupplierOfferV2: [
    "id",
    "storeId",
    "productId",
    "variantIdentityId",
    "contractVersion",
    "stableKey",
    "supplierAccountRef",
    "sourceOfferRef",
    "state",
    "observedCurrency",
    "latestObservationId",
    "evidenceIdsJson",
    "createdAt",
    "updatedAt",
  ],
  CatalogSupplierOfferObservationV2: [
    "id",
    "storeId",
    "offerId",
    "contractVersion",
    "stableKey",
    "observedAt",
    "outcome",
    "unitCostState",
    "unitCostMinor",
    "unitCostCurrency",
    "shippingState",
    "shippingMinor",
    "shippingCurrency",
    "shippingDaysMin",
    "shippingDaysMax",
    "inventoryState",
    "inventoryQuantity",
    "availability",
    "sourcePayloadDigest",
    "evidenceIdsJson",
    "reasonCodesJson",
    "createdAt",
  ],
} as const;

export const STORE_FACTORY_V2_REQUIRED_CHECKS = [
  "Wishlist_owner_check",
  "StoreBuildRun_v2_1_contract_check",
  "StoreRevision_v2_1_contract_check",
  "StoreBuildEvent_contract_check",
  "StorePreviewRevisionPointer_contract_check",
  "CatalogArtifactV2_contract_check",
  "CatalogProductV2_contract_check",
  "CatalogVariantIdentityV2_contract_check",
  "CatalogProductRevisionV2_contract_check",
  "CatalogSellableVariantV2_contract_check",
  "CatalogTaxonomyNodeV2_contract_check",
  "CatalogAttributeDefinitionV2_contract_check",
  "CatalogTaxonomyAttributeDefinitionV2_contract_check",
  "CatalogAttributeOptionV2_contract_check",
  "CatalogProductAttributeValueV2_contract_check",
  "CatalogCollectionV2_contract_check",
  "CatalogCollectionItemV2_contract_check",
  "CatalogMediaAssetV2_contract_check",
  "CatalogPurchaseOptionV2_contract_check",
  "CatalogEvidenceV2_contract_check",
  "CatalogSupplierOfferV2_contract_check",
  "CatalogSupplierOfferObservationV2_contract_check",
] as const;

/**
 * COMPLETE means the tenant/revision graph is physically constrained, not
 * merely shaped like the expected tables. The application guards add richer
 * invariants, while these validated FKs provide the minimum fail-closed base.
 */
export interface StoreFactoryV2RequiredForeignKey {
  name: string;
  tableName: string;
  columns: readonly string[];
  referencedTableName: string;
  referencedColumns: readonly string[];
  updateAction: "c";
  deleteAction: "c" | "r";
}

function requiredForeignKey(
  name: string,
  tableName: string,
  columns: readonly string[],
  referencedTableName: string,
  referencedColumns: readonly string[],
  deleteAction: "c" | "r" = "r"
): StoreFactoryV2RequiredForeignKey {
  return {
    name,
    tableName,
    columns,
    referencedTableName,
    referencedColumns,
    updateAction: "c",
    deleteAction,
  };
}

export const STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS = [
  requiredForeignKey(
    "WishlistItem_variantId_fkey",
    "WishlistItem",
    ["variantId"],
    "ProductVariant",
    ["id"],
    "c"
  ),
  requiredForeignKey("StoreBuildRun_storeId_fkey", "StoreBuildRun", ["storeId"], "Store", ["id"]),
  requiredForeignKey(
    "StoreBuildRun_catalogArtifact_scope_fkey",
    "StoreBuildRun",
    ["storeId", "catalogArtifactId"],
    "CatalogArtifactV2",
    ["storeId", "id"]
  ),
  requiredForeignKey("StoreRevision_storeId_fkey", "StoreRevision", ["storeId"], "Store", ["id"]),
  requiredForeignKey(
    "StoreRevision_catalogArtifact_scope_fkey",
    "StoreRevision",
    ["storeId", "catalogArtifactId"],
    "CatalogArtifactV2",
    ["storeId", "id"]
  ),
  requiredForeignKey("StoreRevision_buildRunId_fkey", "StoreRevision", ["buildRunId"], "StoreBuildRun", ["id"]),
  requiredForeignKey("StoreRevision_parentRevisionId_fkey", "StoreRevision", ["parentRevisionId"], "StoreRevision", ["id"]),
  requiredForeignKey("StoreBuildEvent_buildRunId_fkey", "StoreBuildEvent", ["buildRunId"], "StoreBuildRun", ["id"]),
  requiredForeignKey("StorePreviewRevisionPointer_storeId_fkey", "StorePreviewRevisionPointer", ["storeId"], "Store", ["id"]),
  requiredForeignKey("StorePreviewRevisionPointer_activePreviewRevisionId_fkey", "StorePreviewRevisionPointer", ["activePreviewRevisionId"], "StoreRevision", ["id"]),
  requiredForeignKey("CatalogArtifactV2_storeId_fkey", "CatalogArtifactV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogProductV2_storeId_fkey", "CatalogProductV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogProductV2_legacy_scope_fkey", "CatalogProductV2", ["storeId", "legacyProductId"], "Product", ["storeId", "id"]),
  requiredForeignKey("CatalogVariantIdentityV2_storeId_fkey", "CatalogVariantIdentityV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogVariantIdentityV2_product_scope_fkey", "CatalogVariantIdentityV2", ["storeId", "productId"], "CatalogProductV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductRevisionV2_storeId_fkey", "CatalogProductRevisionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogProductRevisionV2_artifact_scope_fkey", "CatalogProductRevisionV2", ["storeId", "artifactId"], "CatalogArtifactV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductRevisionV2_product_scope_fkey", "CatalogProductRevisionV2", ["storeId", "productId"], "CatalogProductV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSellableVariantV2_revision_scope_fkey", "CatalogSellableVariantV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSellableVariantV2_identity_scope_fkey", "CatalogSellableVariantV2", ["storeId", "variantIdentityId"], "CatalogVariantIdentityV2", ["storeId", "id"]),
  requiredForeignKey("CatalogTaxonomyNodeV2_storeId_fkey", "CatalogTaxonomyNodeV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogTaxonomyNodeV2_artifact_scope_fkey", "CatalogTaxonomyNodeV2", ["storeId", "artifactId"], "CatalogArtifactV2", ["storeId", "id"]),
  requiredForeignKey("CatalogTaxonomyNodeV2_parent_scope_fkey", "CatalogTaxonomyNodeV2", ["storeId", "artifactId", "parentId"], "CatalogTaxonomyNodeV2", ["storeId", "artifactId", "id"]),
  requiredForeignKey("CatalogProductTaxonomyPlacementV2_product_scope_fkey", "CatalogProductTaxonomyPlacementV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductTaxonomyPlacementV2_node_scope_fkey", "CatalogProductTaxonomyPlacementV2", ["storeId", "taxonomyNodeId"], "CatalogTaxonomyNodeV2", ["storeId", "id"]),
  requiredForeignKey("CatalogAttributeDefinitionV2_storeId_fkey", "CatalogAttributeDefinitionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogAttributeDefinitionV2_revision_scope_fkey", "CatalogAttributeDefinitionV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogTaxonomyAttributeDefinitionV2_storeId_fkey", "CatalogTaxonomyAttributeDefinitionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogTaxonomyAttributeDefinitionV2_node_scope_fkey", "CatalogTaxonomyAttributeDefinitionV2", ["storeId", "taxonomyNodeId"], "CatalogTaxonomyNodeV2", ["storeId", "id"]),
  requiredForeignKey("CatalogTaxonomyAttributeDefinitionV2_definition_scope_fkey", "CatalogTaxonomyAttributeDefinitionV2", ["storeId", "definitionId"], "CatalogAttributeDefinitionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogAttributeOptionV2_storeId_fkey", "CatalogAttributeOptionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogAttributeOptionV2_definition_scope_fkey", "CatalogAttributeOptionV2", ["storeId", "definitionId"], "CatalogAttributeDefinitionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductAttributeValueV2_storeId_fkey", "CatalogProductAttributeValueV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogProductAttributeValueV2_revision_scope_fkey", "CatalogProductAttributeValueV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductAttributeValueV2_variant_scope_fkey", "CatalogProductAttributeValueV2", ["storeId", "variantId"], "CatalogSellableVariantV2", ["storeId", "id"]),
  requiredForeignKey("CatalogProductAttributeValueV2_definition_scope_fkey", "CatalogProductAttributeValueV2", ["storeId", "definitionId"], "CatalogAttributeDefinitionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogCollectionV2_storeId_fkey", "CatalogCollectionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogCollectionV2_artifact_scope_fkey", "CatalogCollectionV2", ["storeId", "artifactId"], "CatalogArtifactV2", ["storeId", "id"]),
  requiredForeignKey("CatalogCollectionItemV2_collection_scope_fkey", "CatalogCollectionItemV2", ["storeId", "collectionId"], "CatalogCollectionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogCollectionItemV2_product_scope_fkey", "CatalogCollectionItemV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogMediaAssetV2_storeId_fkey", "CatalogMediaAssetV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogMediaAssetV2_revision_scope_fkey", "CatalogMediaAssetV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogMediaVariantV2_storeId_fkey", "CatalogMediaVariantV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogMediaVariantV2_media_scope_fkey", "CatalogMediaVariantV2", ["storeId", "mediaId"], "CatalogMediaAssetV2", ["storeId", "id"]),
  requiredForeignKey("CatalogMediaVariantV2_variant_scope_fkey", "CatalogMediaVariantV2", ["storeId", "variantId"], "CatalogSellableVariantV2", ["storeId", "id"]),
  requiredForeignKey("CatalogPurchaseOptionV2_storeId_fkey", "CatalogPurchaseOptionV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogPurchaseOptionV2_revision_scope_fkey", "CatalogPurchaseOptionV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogPurchaseOptionV2_variant_scope_fkey", "CatalogPurchaseOptionV2", ["storeId", "variantId"], "CatalogSellableVariantV2", ["storeId", "id"]),
  requiredForeignKey("CatalogEvidenceV2_storeId_fkey", "CatalogEvidenceV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogEvidenceV2_revision_scope_fkey", "CatalogEvidenceV2", ["storeId", "productRevisionId"], "CatalogProductRevisionV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSupplierOfferV2_storeId_fkey", "CatalogSupplierOfferV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogSupplierOfferV2_product_scope_fkey", "CatalogSupplierOfferV2", ["storeId", "productId"], "CatalogProductV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSupplierOfferV2_variant_scope_fkey", "CatalogSupplierOfferV2", ["storeId", "variantIdentityId"], "CatalogVariantIdentityV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSupplierOfferObservationV2_storeId_fkey", "CatalogSupplierOfferObservationV2", ["storeId"], "Store", ["id"]),
  requiredForeignKey("CatalogSupplierOfferObservationV2_offer_scope_fkey", "CatalogSupplierOfferObservationV2", ["storeId", "offerId"], "CatalogSupplierOfferV2", ["storeId", "id"]),
  requiredForeignKey("CatalogSupplierOfferV2_latest_observation_scope_fkey", "CatalogSupplierOfferV2", ["storeId", "latestObservationId"], "CatalogSupplierOfferObservationV2", ["storeId", "id"]),
];

export const STORE_FACTORY_V2_REQUIRED_COLUMN_TYPES = {
  "CatalogProductRevisionV2.revisionNumber": "bigint",
  "CatalogProductRevisionV2.retailPriceMinor": "bigint",
  "CatalogProductRevisionV2.compareAtPriceMinor": "bigint",
  "CatalogSellableVariantV2.retailPriceMinor": "bigint",
  "CatalogSellableVariantV2.compareAtPriceMinor": "bigint",
  "CatalogMediaAssetV2.focalX": "double precision",
  "CatalogMediaAssetV2.focalY": "double precision",
  "CatalogPurchaseOptionV2.quantity": "bigint",
  "CatalogPurchaseOptionV2.retailPriceMinor": "bigint",
  "CatalogPurchaseOptionV2.compareAtPriceMinor": "bigint",
  "CatalogSupplierOfferObservationV2.unitCostMinor": "bigint",
  "CatalogSupplierOfferObservationV2.shippingMinor": "bigint",
  "CatalogSupplierOfferObservationV2.inventoryQuantity": "bigint",
} as const;

export interface StoreFactoryV2RequiredTrigger {
  name: string;
  tableName: string;
  functionName: string;
}

function requiredTrigger(
  name: string,
  tableName: string,
  functionName = name
): StoreFactoryV2RequiredTrigger {
  return { name, tableName, functionName };
}

export const STORE_FACTORY_V2_REQUIRED_TRIGGERS = [
  requiredTrigger("guardWishlistOwnerScopeV1", "Wishlist"),
  requiredTrigger("guardCustomerWishlistScopeV1", "Customer"),
  requiredTrigger("setAndGuardWishlistItemKeyV1", "WishlistItem"),
  requiredTrigger("guardStoreBuildRunUpdateV1", "StoreBuildRun"),
  requiredTrigger("guardStoreRevisionInsertV1", "StoreRevision"),
  requiredTrigger("guardStoreRevisionUpdateV1", "StoreRevision"),
  requiredTrigger("rejectStoreRevisionDeleteV1", "StoreRevision"),
  requiredTrigger("guardStoreBuildEventAppendV1", "StoreBuildEvent"),
  requiredTrigger(
    "rejectStoreBuildEventUpdateV1",
    "StoreBuildEvent",
    "rejectStoreBuildEventMutationV1"
  ),
  requiredTrigger(
    "rejectStoreBuildEventDeleteV1",
    "StoreBuildEvent",
    "rejectStoreBuildEventMutationV1"
  ),
  requiredTrigger(
    "guardStorePreviewRevisionPointerV1",
    "StorePreviewRevisionPointer"
  ),
  requiredTrigger("guardCatalogTaxonomyProvenanceV2", "CatalogTaxonomyNodeV2"),
  requiredTrigger(
    "guardCatalogVariantIdentityScopeV2",
    "CatalogSellableVariantV2"
  ),
  requiredTrigger(
    "guardCatalogTaxonomyPlacementArtifactScopeV2",
    "CatalogProductTaxonomyPlacementV2",
    "guardCatalogArtifactScopeV2"
  ),
  requiredTrigger(
    "guardCatalogTaxonomyAttributeArtifactScopeV2",
    "CatalogTaxonomyAttributeDefinitionV2",
    "guardCatalogArtifactScopeV2"
  ),
  requiredTrigger(
    "guardCatalogCollectionItemArtifactScopeV2",
    "CatalogCollectionItemV2",
    "guardCatalogArtifactScopeV2"
  ),
  requiredTrigger("guardCatalogMediaVariantScopeV2", "CatalogMediaVariantV2"),
  requiredTrigger(
    "guardCatalogAttributeValueScopeV2",
    "CatalogProductAttributeValueV2"
  ),
  requiredTrigger("guardCatalogOfferVariantScopeV2", "CatalogSupplierOfferV2"),
  requiredTrigger("guardCatalogPurchaseOptionScopeV2", "CatalogPurchaseOptionV2"),
  requiredTrigger(
    "guardCatalogLatestObservationScopeV2",
    "CatalogSupplierOfferV2"
  ),
  requiredTrigger(
    "guardCatalogVariantRevisionOpenV2",
    "CatalogSellableVariantV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogTaxonomyPlacementRevisionOpenV2",
    "CatalogProductTaxonomyPlacementV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogAttributeDefinitionRevisionOpenV2",
    "CatalogAttributeDefinitionV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogAttributeValueRevisionOpenV2",
    "CatalogProductAttributeValueV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogCollectionItemRevisionOpenV2",
    "CatalogCollectionItemV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogMediaRevisionOpenV2",
    "CatalogMediaAssetV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogPurchaseOptionRevisionOpenV2",
    "CatalogPurchaseOptionV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogEvidenceRevisionOpenV2",
    "CatalogEvidenceV2",
    "guardCatalogRevisionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogAttributeOptionRevisionOpenV2",
    "CatalogAttributeOptionV2",
    "guardCatalogDefinitionChildInsertV2"
  ),
  requiredTrigger(
    "guardCatalogTaxonomyAttributeRevisionOpenV2",
    "CatalogTaxonomyAttributeDefinitionV2",
    "guardCatalogDefinitionChildInsertV2"
  ),
  requiredTrigger(
    "rejectCatalogArtifactMutationV2",
    "CatalogArtifactV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogVariantIdentityMutationV2",
    "CatalogVariantIdentityV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogProductRevisionMutationV2",
    "CatalogProductRevisionV2",
    "sealCatalogProductRevisionV2"
  ),
  requiredTrigger(
    "rejectCatalogVariantMutationV2",
    "CatalogSellableVariantV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogTaxonomyNodeMutationV2",
    "CatalogTaxonomyNodeV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogTaxonomyPlacementMutationV2",
    "CatalogProductTaxonomyPlacementV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogTaxonomyAttributeMutationV2",
    "CatalogTaxonomyAttributeDefinitionV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogAttributeDefinitionMutationV2",
    "CatalogAttributeDefinitionV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogAttributeOptionMutationV2",
    "CatalogAttributeOptionV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogAttributeValueMutationV2",
    "CatalogProductAttributeValueV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogCollectionMutationV2",
    "CatalogCollectionV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogCollectionItemMutationV2",
    "CatalogCollectionItemV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogMediaMutationV2",
    "CatalogMediaAssetV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogMediaVariantMutationV2",
    "CatalogMediaVariantV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogPurchaseOptionMutationV2",
    "CatalogPurchaseOptionV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogEvidenceMutationV2",
    "CatalogEvidenceV2",
    "rejectCatalogImmutableMutationV2"
  ),
  requiredTrigger(
    "rejectCatalogOfferObservationMutationV2",
    "CatalogSupplierOfferObservationV2",
    "rejectCatalogImmutableMutationV2"
  ),
];

export const STORE_FACTORY_V2_REQUIRED_FUNCTIONS = [
  "compareAndSwapStorePreviewRevisionV1",
  "guardCatalogTaxonomyProvenanceV2",
  "guardCatalogVariantIdentityScopeV2",
  "guardCatalogArtifactScopeV2",
  "guardCatalogMediaVariantScopeV2",
  "guardCatalogAttributeValueScopeV2",
  "guardCatalogOfferVariantScopeV2",
  "guardCatalogPurchaseOptionScopeV2",
  "guardCatalogLatestObservationScopeV2",
  "guardCatalogRevisionChildInsertV2",
  "guardCatalogDefinitionChildInsertV2",
  "rejectCatalogImmutableMutationV2",
  "assertCatalogRevisionGraphCompleteV2",
  "sealCatalogProductRevisionV2",
] as const;

export interface StoreFactoryV2RequiredIndex {
  name: string;
  tableName: string;
  columns: readonly string[];
  unique: boolean;
  predicate: string | null;
}

function requiredIndex(
  name: string,
  tableName: string,
  columns: readonly string[],
  unique = true,
  predicate: string | null = null
): StoreFactoryV2RequiredIndex {
  return { name, tableName, columns, unique, predicate };
}

export const STORE_FACTORY_V2_REQUIRED_INDEXES = [
  requiredIndex("Wishlist_storeId_anonymousId_key", "Wishlist", ["storeId", "anonymousId"]),
  requiredIndex("Wishlist_storeId_customerId_key", "Wishlist", ["storeId", "customerId"]),
  requiredIndex("WishlistItem_wishlistId_itemKey_key", "WishlistItem", ["wishlistId", "itemKey"]),
  requiredIndex("StoreBuildRun_storeId_requestKey_key", "StoreBuildRun", ["storeId", "requestKey"]),
  requiredIndex("StoreRevision_buildRunId_key", "StoreRevision", ["buildRunId"]),
  requiredIndex("StoreRevision_storeId_revisionNumber_key", "StoreRevision", ["storeId", "revisionNumber"]),
  requiredIndex("StoreBuildEvent_buildRunId_sequence_key", "StoreBuildEvent", ["buildRunId", "sequence"]),
  requiredIndex(
    "StorePreviewRevisionPointer_activePreviewRevisionId_key",
    "StorePreviewRevisionPointer",
    ["activePreviewRevisionId"]
  ),
  requiredIndex("Product_storeId_id_key_v2", "Product", ["storeId", "id"]),
  requiredIndex("CatalogArtifactV2_storeId_id_key", "CatalogArtifactV2", ["storeId", "id"]),
  requiredIndex(
    "CatalogArtifactV2_source_identity_key",
    "CatalogArtifactV2",
    ["storeId", "sourceKind", "sourceRef", "contentDigest"]
  ),
  requiredIndex(
    "CatalogProductV2_storeId_canonicalKey_key",
    "CatalogProductV2",
    ["storeId", "canonicalKey"]
  ),
  requiredIndex("CatalogProductV2_storeId_id_key", "CatalogProductV2", ["storeId", "id"]),
  requiredIndex(
    "CatalogVariantIdentityV2_storeId_id_key",
    "CatalogVariantIdentityV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogVariantIdentityV2_productId_stableKey_key",
    "CatalogVariantIdentityV2",
    ["productId", "stableKey"]
  ),
  requiredIndex(
    "CatalogProductRevisionV2_storeId_id_key",
    "CatalogProductRevisionV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogRevisionV2_artifact_product_number_key",
    "CatalogProductRevisionV2",
    ["artifactId", "productId", "revisionNumber"]
  ),
  requiredIndex(
    "CatalogRevisionV2_artifact_ref_key",
    "CatalogProductRevisionV2",
    ["artifactId", "artifactRevisionRef"]
  ),
  requiredIndex(
    "CatalogSellableVariantV2_storeId_id_key",
    "CatalogSellableVariantV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogSellableVariantV2_productRevisionId_stableKey_key",
    "CatalogSellableVariantV2",
    ["productRevisionId", "stableKey"]
  ),
  requiredIndex(
    "CatalogVariantV2_revision_identity_key",
    "CatalogSellableVariantV2",
    ["productRevisionId", "variantIdentityId"]
  ),
  requiredIndex(
    "CatalogSellableVariantV2_one_default_key",
    "CatalogSellableVariantV2",
    ["productRevisionId"],
    true,
    '"isDefault"'
  ),
  requiredIndex(
    "CatalogTaxonomyNodeV2_storeId_id_key",
    "CatalogTaxonomyNodeV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogTaxonomyNodeV2_storeId_artifactId_id_key",
    "CatalogTaxonomyNodeV2",
    ["storeId", "artifactId", "id"]
  ),
  requiredIndex(
    "CatalogTaxonomyNodeV2_artifactId_key_key",
    "CatalogTaxonomyNodeV2",
    ["artifactId", "key"]
  ),
  requiredIndex(
    "CatalogTaxonomyNodeV2_artifactId_pathJson_key",
    "CatalogTaxonomyNodeV2",
    ["artifactId", "pathJson"]
  ),
  requiredIndex(
    "CatalogProductTaxonomyPlacementV2_one_primary_key",
    "CatalogProductTaxonomyPlacementV2",
    ["productRevisionId"],
    true,
    '"isPrimary"'
  ),
  requiredIndex(
    "CatalogAttributeDefinitionV2_storeId_id_key",
    "CatalogAttributeDefinitionV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogAttributeDefinitionV2_productRevisionId_stableKey_key",
    "CatalogAttributeDefinitionV2",
    ["productRevisionId", "stableKey"]
  ),
  requiredIndex(
    "CatalogTaxonomyAttributeDefinitionV2_pkey",
    "CatalogTaxonomyAttributeDefinitionV2",
    ["taxonomyNodeId", "definitionId"]
  ),
  requiredIndex(
    "CatalogAttributeOptionV2_definitionId_key_key",
    "CatalogAttributeOptionV2",
    ["definitionId", "key"]
  ),
  requiredIndex(
    "CatalogAttrValueV2_revision_scope_definition_key",
    "CatalogProductAttributeValueV2",
    ["productRevisionId", "assignmentScopeKey", "definitionId"]
  ),
  requiredIndex("CatalogCollectionV2_storeId_id_key", "CatalogCollectionV2", ["storeId", "id"]),
  requiredIndex(
    "CatalogCollectionV2_artifactId_stableKey_key",
    "CatalogCollectionV2",
    ["artifactId", "stableKey"]
  ),
  requiredIndex(
    "CatalogCollectionV2_artifactId_slug_key",
    "CatalogCollectionV2",
    ["artifactId", "slug"]
  ),
  requiredIndex("CatalogMediaAssetV2_storeId_id_key", "CatalogMediaAssetV2", ["storeId", "id"]),
  requiredIndex(
    "CatalogMediaAssetV2_productRevisionId_stableKey_key",
    "CatalogMediaAssetV2",
    ["productRevisionId", "stableKey"]
  ),
  requiredIndex(
    "CatalogMediaAssetV2_productRevisionId_role_sortOrder_idx",
    "CatalogMediaAssetV2",
    ["productRevisionId", "role", "sortOrder"],
    false
  ),
  requiredIndex(
    "CatalogMediaAssetV2_one_public_primary_key",
    "CatalogMediaAssetV2",
    ["productRevisionId"],
    true,
    '"role" = \'PRIMARY\' AND "publicationState" = \'PUBLIC_READY\''
  ),
  requiredIndex(
    "CatalogPurchaseOptionV2_storeId_id_key",
    "CatalogPurchaseOptionV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogPurchaseOptionV2_productRevisionId_stableKey_key",
    "CatalogPurchaseOptionV2",
    ["productRevisionId", "stableKey"]
  ),
  requiredIndex("CatalogEvidenceV2_storeId_id_key", "CatalogEvidenceV2", ["storeId", "id"]),
  requiredIndex(
    "CatalogEvidenceV2_productRevisionId_stableKey_key",
    "CatalogEvidenceV2",
    ["productRevisionId", "stableKey"]
  ),
  requiredIndex(
    "CatalogSupplierOfferV2_storeId_id_key",
    "CatalogSupplierOfferV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogSupplierOfferV2_storeId_stableKey_key",
    "CatalogSupplierOfferV2",
    ["storeId", "stableKey"]
  ),
  requiredIndex(
    "CatalogSupplierOfferV2_latestObservationId_key",
    "CatalogSupplierOfferV2",
    ["latestObservationId"]
  ),
  requiredIndex(
    "CatalogOfferV2_store_source_idx",
    "CatalogSupplierOfferV2",
    ["storeId", "supplierAccountRef", "sourceOfferRef"],
    false
  ),
  requiredIndex(
    "CatalogSupplierOfferObservationV2_storeId_id_key",
    "CatalogSupplierOfferObservationV2",
    ["storeId", "id"]
  ),
  requiredIndex(
    "CatalogSupplierOfferObservationV2_storeId_stableKey_key",
    "CatalogSupplierOfferObservationV2",
    ["storeId", "stableKey"]
  ),
  requiredIndex(
    "CatalogOfferObsV2_offer_payload_digest_idx",
    "CatalogSupplierOfferObservationV2",
    ["offerId", "sourcePayloadDigest"],
    false
  ),
];

export interface StoreFactoryV2SchemaInspection {
  tables: readonly string[];
  columns: readonly {
    tableName: string;
    columnName: string;
    dataType?: string;
    nullable?: boolean;
    defaultExpression?: string | null;
    identity?: string;
    generated?: string;
  }[];
  columnContracts?: readonly { tableName: string; fingerprint: string }[];
  checks: readonly {
    name: string;
    tableName?: string;
    validated: boolean;
    definitionFingerprint?: string;
  }[];
  foreignKeys: readonly {
    name: string;
    tableName: string;
    columns: readonly string[];
    referencedTableName: string;
    referencedColumns: readonly string[];
    updateAction: string;
    deleteAction: string;
    validated: boolean;
  }[];
  triggers: readonly {
    name: string;
    tableName: string;
    functionName: string;
    enabledMode: string;
    timing?: string;
    events?: readonly string[];
    rowLevel?: boolean;
    whenExpression?: string | null;
    argumentCount?: number;
    definitionFingerprint?: string;
  }[];
  functions: readonly string[];
  functionContracts?: readonly { name: string; fingerprint: string }[];
  indexes: readonly {
    name: string;
    tableName: string;
    columns: readonly string[];
    unique: boolean;
    predicate: string | null;
    valid: boolean;
    ready: boolean;
    definitionFingerprint?: string;
  }[];
}

export interface StoreFactoryV2SchemaReport {
  version: typeof STORE_FACTORY_V2_SCHEMA_VERSION;
  status: "ABSENT" | "PARTIAL" | "COMPLETE";
  expected: number;
  satisfied: number;
  missing: string[];
  incompatible: string[];
  persistenceEnabled: boolean;
}

export type StoreFactoryV2SchemaApplyDecision =
  | "APPLY"
  | "NOOP_COMPLETE"
  | "REFUSE_TARGET_CONFIRMATION"
  | "REFUSE_DDL_CONFIRMATION"
  | "REFUSE_PARTIAL";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprintsEqual(
  expected: string,
  received: string | undefined
): boolean {
  if (!received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}

function normalizeSql(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

export function storeFactoryV2SqlFingerprint(value: string): string {
  return sha256(normalizeSql(value) ?? "");
}

/**
 * Fingerprint executable SQL/PLpgSQL semantics while ignoring formatting,
 * comments and human-only exception text. Identifiers, operators, control
 * flow and non-message literals remain exact tokens.
 */
export function storeFactoryV2FunctionSemanticFingerprint(
  source: string
): string {
  const rawTokens =
    source.replace(/\r\n/g, "\n").match(
      /\s+|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|<>|>=|<=|:=|::|\|\||&&|[A-Za-z_][A-Za-z0-9_$]*|\d+(?:\.\d+)?|./g
    ) ?? [];
  const semanticTokens: string[] = [];

  for (const token of rawTokens) {
    if (/^\s+$/.test(token) || token.startsWith("--") || token.startsWith("/*")) {
      continue;
    }
    const previous = semanticTokens.slice(-2);
    if (
      token.startsWith("'") &&
      previous[0] === "RAISE" &&
      previous[1] === "EXCEPTION"
    ) {
      semanticTokens.push("'<message>'");
      continue;
    }
    semanticTokens.push(/^[A-Za-z_]/.test(token) ? token.toUpperCase() : token);
  }

  return sha256(JSON.stringify(semanticTokens));
}

export function storeFactoryV2ColumnContractFingerprint(
  columns: readonly {
    columnName: string;
    dataType: string;
    nullable: boolean;
    defaultExpression: string | null;
    identity: string;
    generated: string;
  }[]
): string {
  return sha256(
    JSON.stringify(
      [...columns]
        .sort((left, right) => left.columnName.localeCompare(right.columnName))
        .map((column) => ({
          name: column.columnName,
          type: column.dataType,
          nullable: column.nullable,
          default: normalizeSql(column.defaultExpression),
          identity: column.identity,
          generated: column.generated,
        }))
    )
  );
}

export function storeFactoryV2FunctionContractFingerprint(input: {
  identityArguments: string;
  resultType: string;
  language: string;
  volatility: string;
  securityDefiner: boolean;
  leakproof: boolean;
  strict: boolean;
  parallel: string;
  config: readonly string[] | null;
  source: string;
}): string {
  return sha256(
    JSON.stringify({
      identityArguments: normalizeSql(input.identityArguments),
      resultType: normalizeSql(input.resultType),
      language: input.language,
      volatility: input.volatility,
      securityDefiner: input.securityDefiner,
      leakproof: input.leakproof,
      strict: input.strict,
      parallel: input.parallel,
      config: input.config ? [...input.config].sort() : null,
      source: storeFactoryV2FunctionSemanticFingerprint(input.source),
    })
  );
}

export function storeFactoryV2DdlBundleFingerprint(input: {
  version: string;
  files: readonly { name: string; sql: string }[];
}): string {
  const payload = JSON.stringify({
    version: input.version,
    files: input.files.map((file) => ({
      name: file.name,
      contentDigest: sha256(file.sql.replace(/\r\n/g, "\n")),
    })),
  });
  return `sha256:${sha256(payload)}`;
}

export function databaseIdentityFingerprint(
  input: StoreFactoryV2DatabaseIdentity
): string {
  return `sha256:${sha256(JSON.stringify(input))}`;
}

export interface StoreFactoryV2DatabaseIdentity {
  serverAddress: string | null;
  serverPort: number | null;
  databaseName: string;
  databaseUser: string;
  serverVersionNumber: string;
}

export interface StoreFactoryV2ConnectionTarget {
  scheme: "postgresql";
  host: string;
  port: number;
  database: string;
}

export type StoreFactoryV2ApplyTargetRefusal =
  | "APPLY_URL_ENV_NOT_DIRECT"
  | "APPLY_TARGET_RECOGNIZABLY_POOLED";

export function canonicalStoreFactoryV2ConnectionTarget(
  connectionString: string
): StoreFactoryV2ConnectionTarget {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("INVALID_POSTGRESQL_URL");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("INVALID_POSTGRESQL_URL");
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const encodedDatabase = parsed.pathname.startsWith("/")
    ? parsed.pathname.slice(1)
    : parsed.pathname;
  if (!host || !encodedDatabase || encodedDatabase.includes("/")) {
    throw new Error("POSTGRESQL_TARGET_INCOMPLETE");
  }

  let database: string;
  try {
    database = decodeURIComponent(encodedDatabase);
  } catch {
    throw new Error("INVALID_POSTGRESQL_DATABASE_NAME");
  }
  if (!database || database.includes("\0")) {
    throw new Error("INVALID_POSTGRESQL_DATABASE_NAME");
  }

  const port = parsed.port ? Number(parsed.port) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("INVALID_POSTGRESQL_PORT");
  }

  return { scheme: "postgresql", host, port, database };
}

export function formatStoreFactoryV2ConnectionTarget(
  target: StoreFactoryV2ConnectionTarget
): string {
  const host = target.host.includes(":") && !target.host.startsWith("[")
    ? `[${target.host}]`
    : target.host;
  return `${target.scheme}://${host}:${target.port}/${encodeURIComponent(target.database)}`;
}

export function storeFactoryV2DatabaseTargetFingerprint(input: {
  connectionTarget: StoreFactoryV2ConnectionTarget;
  databaseIdentity: StoreFactoryV2DatabaseIdentity;
}): string {
  return `sha256:${sha256(JSON.stringify({
    connectionTarget: input.connectionTarget,
    databaseIdentity: input.databaseIdentity,
  }))}`;
}

export function recognizableStoreFactoryV2PoolerSignal(
  connectionString: string
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return "invalid-url";
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (/(^|[.-])(pooler|pgbouncer)([.-]|$)/.test(host)) {
    return "hostname";
  }
  if (parsed.port === "6432" || parsed.port === "6543") {
    return `port:${parsed.port}`;
  }

  for (const [rawName, rawValue] of parsed.searchParams) {
    const name = rawName.toLowerCase();
    const value = rawValue.toLowerCase();
    if (
      ["pgbouncer", "pooler", "pooling", "connection_pool"].includes(name) &&
      ["1", "true", "yes", "on", "transaction", "session"].includes(value)
    ) {
      return `query:${name}`;
    }
  }
  return null;
}

export function validateStoreFactoryV2ApplyTarget(input: {
  urlEnv: string;
  connectionString: string;
}): StoreFactoryV2ApplyTargetRefusal | null {
  if (input.urlEnv !== "DIRECT_URL" && input.urlEnv !== "DATABASE_URL_UNPOOLED") {
    return "APPLY_URL_ENV_NOT_DIRECT";
  }
  if (recognizableStoreFactoryV2PoolerSignal(input.connectionString)) {
    return "APPLY_TARGET_RECOGNIZABLY_POOLED";
  }
  return null;
}

export function decideStoreFactoryV2SchemaApply(input: {
  report: StoreFactoryV2SchemaReport;
  targetFingerprint: string;
  confirmedTargetFingerprint?: string;
  ddlFingerprint: string;
  confirmedDdlFingerprint?: string;
}): StoreFactoryV2SchemaApplyDecision {
  if (
    !fingerprintsEqual(
      input.targetFingerprint,
      input.confirmedTargetFingerprint
    )
  ) {
    return "REFUSE_TARGET_CONFIRMATION";
  }
  if (!fingerprintsEqual(input.ddlFingerprint, input.confirmedDdlFingerprint)) {
    return "REFUSE_DDL_CONFIRMATION";
  }
  if (input.report.status === "PARTIAL") return "REFUSE_PARTIAL";
  if (input.report.status === "COMPLETE") return "NOOP_COMPLETE";
  return "APPLY";
}

function groupByName<T extends { name: string }>(
  artifacts: readonly T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const artifact of artifacts) {
    const existing = grouped.get(artifact.name);
    if (existing) existing.push(artifact);
    else grouped.set(artifact.name, [artifact]);
  }
  return grouped;
}

function equalOrderedColumns(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((column, index) => column === expected[index])
  );
}

function normalizeIndexPredicate(predicate: string | null): string | null {
  if (predicate === null) return null;
  return predicate
    .replace(/::(?:text|boolean|character varying)/gi, "")
    .replace(/[()\s"]/g, "")
    .toLowerCase();
}

export function inspectStoreFactoryV2Schema(
  inspection: StoreFactoryV2SchemaInspection
): StoreFactoryV2SchemaReport {
  const tables = new Set(inspection.tables);
  const columns = new Set(
    inspection.columns.map((column) => `${column.tableName}.${column.columnName}`)
  );
  const columnTypes = new Map(
    inspection.columns.map((column) => [
      `${column.tableName}.${column.columnName}`,
      column.dataType,
    ])
  );
  const columnContracts = new Map(
    (inspection.columnContracts ?? []).map((contract) => [
      contract.tableName,
      contract.fingerprint,
    ])
  );
  const checks = groupByName(inspection.checks);
  const foreignKeys = groupByName(inspection.foreignKeys);
  const triggers = groupByName(inspection.triggers);
  const functions = new Set(inspection.functions);
  const functionContracts = groupByName(inspection.functionContracts ?? []);
  const indexes = groupByName(inspection.indexes);
  const missing: string[] = [];
  const incompatible: string[] = [];

  for (const [tableName, requiredColumns] of Object.entries(
    STORE_FACTORY_V2_REQUIRED_COLUMNS
  )) {
    if (!tables.has(tableName)) {
      missing.push(`table public.${tableName}`);
      continue;
    }
    for (const columnName of requiredColumns) {
      if (!columns.has(`${tableName}.${columnName}`)) {
        missing.push(`column public.${tableName}.${columnName}`);
      }
    }
  }
  for (const [column, expectedType] of Object.entries(
    STORE_FACTORY_V2_REQUIRED_COLUMN_TYPES
  )) {
    if (!columns.has(column)) {
      missing.push(`typed column public.${column}`);
    } else if (columnTypes.get(column) !== expectedType) {
      incompatible.push(
        `column ${column} has type ${columnTypes.get(column) ?? "unknown"}; expected ${expectedType}`
      );
    }
  }
  for (const [tableName, expectedFingerprint] of Object.entries(
    STORE_FACTORY_V2_COLUMN_CONTRACT_FINGERPRINTS
  )) {
    if (!tables.has(tableName)) continue;
    const actualFingerprint = columnContracts.get(tableName);
    if (!actualFingerprint) {
      missing.push(`column contract public.${tableName}`);
    } else if (actualFingerprint !== expectedFingerprint) {
      incompatible.push(`table ${tableName} has incompatible column contract`);
    }
  }
  for (const name of STORE_FACTORY_V2_REQUIRED_CHECKS) {
    const candidates = checks.get(name) ?? [];
    if (candidates.length === 0) {
      missing.push(`validated check ${name}`);
      continue;
    }
    if (candidates.length !== 1) {
      incompatible.push(`check ${name} is ambiguous`);
      continue;
    }
    const check = candidates[0]!;
    if (!check.validated) incompatible.push(`check ${name} is not validated`);
    else if (
      check.tableName !==
        STORE_FACTORY_V2_CHECK_CONTRACTS[
          name as keyof typeof STORE_FACTORY_V2_CHECK_CONTRACTS
        ].tableName ||
      check.definitionFingerprint !==
        STORE_FACTORY_V2_CHECK_CONTRACTS[
          name as keyof typeof STORE_FACTORY_V2_CHECK_CONTRACTS
        ].fingerprint
    ) {
      incompatible.push(`check ${name} has incompatible definition`);
    }
  }
  for (const required of STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS) {
    const candidates = foreignKeys.get(required.name) ?? [];
    if (candidates.length === 0) {
      missing.push(`validated foreign key ${required.name}`);
      continue;
    }
    if (candidates.length !== 1) {
      incompatible.push(`foreign key ${required.name} is ambiguous`);
      continue;
    }
    const foreignKey = candidates[0]!;
    if (!foreignKey.validated) {
      incompatible.push(`foreign key ${required.name} is not validated`);
    } else if (
      foreignKey.tableName !== required.tableName ||
      !equalOrderedColumns(foreignKey.columns, required.columns) ||
      foreignKey.referencedTableName !== required.referencedTableName ||
      !equalOrderedColumns(
        foreignKey.referencedColumns,
        required.referencedColumns
      ) ||
      foreignKey.updateAction !== required.updateAction ||
      foreignKey.deleteAction !== required.deleteAction
    ) {
      incompatible.push(`foreign key ${required.name} has incompatible definition`);
    }
  }
  for (const required of STORE_FACTORY_V2_REQUIRED_TRIGGERS) {
    const candidates = triggers.get(required.name) ?? [];
    if (candidates.length === 0) {
      missing.push(`enabled trigger ${required.name}`);
      continue;
    }
    if (candidates.length !== 1) {
      incompatible.push(`trigger ${required.name} is ambiguous`);
      continue;
    }
    const trigger = candidates[0]!;
    if (!new Set(["O", "A"]).has(trigger.enabledMode)) {
      incompatible.push(
        `trigger ${required.name} has unsupported enabled mode ${trigger.enabledMode}`
      );
    } else if (
      trigger.tableName !== required.tableName ||
      trigger.functionName !== required.functionName
    ) {
      incompatible.push(`trigger ${required.name} has incompatible binding`);
    } else if (
      trigger.timing !== "BEFORE" ||
      trigger.rowLevel !== true ||
      trigger.whenExpression !== null ||
      trigger.argumentCount !== 0 ||
      trigger.definitionFingerprint !==
        STORE_FACTORY_V2_TRIGGER_DEFINITION_FINGERPRINTS[
          required.name as keyof typeof STORE_FACTORY_V2_TRIGGER_DEFINITION_FINGERPRINTS
        ]
    ) {
      incompatible.push(`trigger ${required.name} has incompatible definition`);
    }
  }
  for (const name of STORE_FACTORY_V2_REQUIRED_FUNCTIONS) {
    if (!functions.has(name)) missing.push(`function public.${name}`);
  }
  for (const [name, expectedFingerprint] of Object.entries(
    STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS
  )) {
    const candidates = functionContracts.get(name) ?? [];
    if (candidates.length === 0) {
      missing.push(`function contract public.${name}`);
    } else if (candidates.length !== 1) {
      incompatible.push(`function ${name} is ambiguous`);
    } else if (candidates[0]!.fingerprint !== expectedFingerprint) {
      incompatible.push(`function ${name} has incompatible contract`);
    }
  }
  for (const required of STORE_FACTORY_V2_REQUIRED_INDEXES) {
    const candidates = indexes.get(required.name) ?? [];
    if (candidates.length === 0) {
      missing.push(`ready index ${required.name}`);
      continue;
    }
    if (candidates.length !== 1) {
      incompatible.push(`index ${required.name} is ambiguous`);
      continue;
    }
    const index = candidates[0]!;
    if (!index.valid || !index.ready) {
      incompatible.push(`index ${required.name} is not valid and ready`);
    } else if (
      index.tableName !== required.tableName ||
      !equalOrderedColumns(index.columns, required.columns) ||
      index.unique !== required.unique ||
      normalizeIndexPredicate(index.predicate) !==
        normalizeIndexPredicate(required.predicate) ||
      index.definitionFingerprint !==
        STORE_FACTORY_V2_INDEX_DEFINITION_FINGERPRINTS[
          required.name as keyof typeof STORE_FACTORY_V2_INDEX_DEFINITION_FINGERPRINTS
        ]
    ) {
      incompatible.push(`index ${required.name} has incompatible definition`);
    }
  }

  const expected = countExpectedArtifacts();
  const satisfied = expected - missing.length - incompatible.length;
  const newTableNames = Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMNS).filter(
    (tableName) => !["Wishlist", "WishlistItem"].includes(tableName)
  );
  const hasAnyV2Artifact =
    newTableNames.some((tableName) => tables.has(tableName)) ||
    columns.has("WishlistItem.variantId") ||
    columns.has("WishlistItem.itemKey");
  const status =
    missing.length === 0 && incompatible.length === 0
      ? "COMPLETE"
      : hasAnyV2Artifact
        ? "PARTIAL"
        : "ABSENT";

  return {
    version: STORE_FACTORY_V2_SCHEMA_VERSION,
    status,
    expected,
    satisfied,
    missing,
    incompatible,
    persistenceEnabled: status === "COMPLETE",
  };
}

export interface StoreFactoryV2SchemaQueryClient {
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

/** Read-only catalog inspection; it never executes DDL or prints a DB URL. */
export async function readStoreFactoryV2SchemaCapability(
  client: StoreFactoryV2SchemaQueryClient
): Promise<StoreFactoryV2SchemaReport> {
  const tableNames = Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMNS);
  const [tables, columns, checks, foreignKeys, triggers, functions, indexes] = await Promise.all([
    client.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name::text AS table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      tableNames
    ),
    client.$queryRawUnsafe<
      Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        nullable: boolean;
        default_expression: string | null;
        identity: string;
        generated: string;
      }>
    >(
      `SELECT rel.relname::text AS table_name,
              attr.attname::text AS column_name,
              pg_catalog.format_type(attr.atttypid, attr.atttypmod) AS data_type,
              NOT attr.attnotnull AS nullable,
              pg_catalog.pg_get_expr(def.adbin, def.adrelid, true) AS default_expression,
              attr.attidentity::text AS identity,
              attr.attgenerated::text AS generated
       FROM pg_catalog.pg_attribute attr
       JOIN pg_catalog.pg_class rel ON rel.oid = attr.attrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
       LEFT JOIN pg_catalog.pg_attrdef def
         ON def.adrelid = attr.attrelid AND def.adnum = attr.attnum
       WHERE n.nspname = 'public'
         AND rel.relname = ANY($1::text[])
         AND attr.attnum > 0
         AND NOT attr.attisdropped`,
      tableNames
    ),
    client.$queryRawUnsafe<Array<{
      constraint_name: string;
      table_name: string;
      validated: boolean;
      definition: string;
    }>>(
      `SELECT con.conname::text AS constraint_name,
              rel.relname::text AS table_name,
              pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
              con.convalidated AS validated
       FROM pg_catalog.pg_constraint con
       JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public' AND con.contype = 'c'
         AND con.conname = ANY($1::text[])`,
      [...STORE_FACTORY_V2_REQUIRED_CHECKS]
    ),
    client.$queryRawUnsafe<
      Array<{
        constraint_name: string;
        table_name: string;
        columns: string[];
        referenced_table_name: string;
        referenced_columns: string[];
        update_action: string;
        delete_action: string;
        validated: boolean;
      }>
    >(
      `SELECT con.conname::text AS constraint_name,
              source_rel.relname::text AS table_name,
              ARRAY(
                SELECT source_att.attname::text
                FROM unnest(con.conkey::smallint[]) WITH ORDINALITY
                  AS source_key(attnum, key_order)
                JOIN pg_catalog.pg_attribute source_att
                  ON source_att.attrelid = con.conrelid
                 AND source_att.attnum = source_key.attnum
                ORDER BY source_key.key_order
              ) AS columns,
              target_rel.relname::text AS referenced_table_name,
              ARRAY(
                SELECT target_att.attname::text
                FROM unnest(con.confkey::smallint[]) WITH ORDINALITY
                  AS target_key(attnum, key_order)
                JOIN pg_catalog.pg_attribute target_att
                  ON target_att.attrelid = con.confrelid
                 AND target_att.attnum = target_key.attnum
                ORDER BY target_key.key_order
              ) AS referenced_columns,
              con.confupdtype::text AS update_action,
              con.confdeltype::text AS delete_action,
              con.convalidated AS validated
       FROM pg_catalog.pg_constraint con
       JOIN pg_catalog.pg_class source_rel ON source_rel.oid = con.conrelid
       JOIN pg_catalog.pg_namespace source_namespace
         ON source_namespace.oid = source_rel.relnamespace
       JOIN pg_catalog.pg_class target_rel ON target_rel.oid = con.confrelid
       JOIN pg_catalog.pg_namespace target_namespace
         ON target_namespace.oid = target_rel.relnamespace
       WHERE source_namespace.nspname = 'public'
         AND target_namespace.nspname = 'public'
         AND con.contype = 'f'
         AND con.conname = ANY($1::text[])`,
      STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS.map((foreignKey) => foreignKey.name)
    ),
    client.$queryRawUnsafe<
      Array<{
        trigger_name: string;
        table_name: string;
        function_name: string;
        enabled_mode: string;
        timing: string;
        events: string[];
        row_level: boolean;
        when_expression: string | null;
        argument_count: number;
        definition: string;
      }>
    >(
      `SELECT trg.tgname::text AS trigger_name,
              rel.relname::text AS table_name,
              proc.proname::text AS function_name,
              trg.tgenabled::text AS enabled_mode,
              CASE
                WHEN (trg.tgtype::integer & 64) <> 0 THEN 'INSTEAD OF'
                WHEN (trg.tgtype::integer & 2) <> 0 THEN 'BEFORE'
                ELSE 'AFTER'
              END AS timing,
              to_json(array_remove(ARRAY[
                CASE WHEN (trg.tgtype::integer & 4) <> 0 THEN 'INSERT'::text END,
                CASE WHEN (trg.tgtype::integer & 16) <> 0 THEN 'UPDATE'::text END,
                CASE WHEN (trg.tgtype::integer & 8) <> 0 THEN 'DELETE'::text END,
                CASE WHEN (trg.tgtype::integer & 32) <> 0 THEN 'TRUNCATE'::text END
              ], NULL)) AS events,
              (trg.tgtype::integer & 1) <> 0 AS row_level,
              pg_catalog.pg_get_expr(trg.tgqual, trg.tgrelid, true) AS when_expression,
              trg.tgnargs::integer AS argument_count,
              pg_catalog.pg_get_triggerdef(trg.oid, true) AS definition
       FROM pg_catalog.pg_trigger trg
       JOIN pg_catalog.pg_class rel ON rel.oid = trg.tgrelid
       JOIN pg_catalog.pg_namespace table_namespace
         ON table_namespace.oid = rel.relnamespace
       JOIN pg_catalog.pg_proc proc ON proc.oid = trg.tgfoid
       JOIN pg_catalog.pg_namespace function_namespace
         ON function_namespace.oid = proc.pronamespace
       WHERE table_namespace.nspname = 'public'
         AND function_namespace.nspname = 'public'
         AND NOT trg.tgisinternal
         AND trg.tgname = ANY($1::text[])`,
      STORE_FACTORY_V2_REQUIRED_TRIGGERS.map((trigger) => trigger.name)
    ),
    client.$queryRawUnsafe<Array<{
      function_name: string;
      identity_arguments: string;
      result_type: string;
      language: string;
      volatility: string;
      security_definer: boolean;
      leakproof: boolean;
      strict: boolean;
      parallel: string;
      config: string[] | null;
      source: string;
    }>>(
      `SELECT proc.proname::text AS function_name,
              pg_catalog.pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
              pg_catalog.pg_get_function_result(proc.oid) AS result_type,
              lang.lanname::text AS language,
              proc.provolatile::text AS volatility,
              proc.prosecdef AS security_definer,
              proc.proleakproof AS leakproof,
              proc.proisstrict AS strict,
              proc.proparallel::text AS parallel,
              proc.proconfig AS config,
              proc.prosrc AS source
       FROM pg_catalog.pg_proc proc
       JOIN pg_catalog.pg_namespace n ON n.oid = proc.pronamespace
       JOIN pg_catalog.pg_language lang ON lang.oid = proc.prolang
       WHERE n.nspname = 'public' AND proc.proname = ANY($1::text[])`,
      [...Object.keys(STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS)]
    ),
    client.$queryRawUnsafe<
      Array<{
        index_name: string;
        table_name: string;
        columns: string[];
        is_unique: boolean;
        predicate: string | null;
        valid: boolean;
        ready: boolean;
        definition: string;
      }>
    >(
      `SELECT idx.relname::text AS index_name,
              rel.relname::text AS table_name,
              ARRAY(
                SELECT indexed_att.attname::text
                FROM unnest(ind.indkey::smallint[]) WITH ORDINALITY
                  AS indexed_key(attnum, key_order)
                JOIN pg_catalog.pg_attribute indexed_att
                  ON indexed_att.attrelid = ind.indrelid
                 AND indexed_att.attnum = indexed_key.attnum
                WHERE indexed_key.key_order <= ind.indnkeyatts
                ORDER BY indexed_key.key_order
              ) AS columns,
              ind.indisunique AS is_unique,
              pg_catalog.pg_get_expr(ind.indpred, ind.indrelid, true) AS predicate,
              ind.indisvalid AS valid,
              ind.indisready AS ready,
              pg_catalog.pg_get_indexdef(ind.indexrelid) AS definition
       FROM pg_catalog.pg_index ind
       JOIN pg_catalog.pg_class idx ON idx.oid = ind.indexrelid
       JOIN pg_catalog.pg_namespace index_namespace
         ON index_namespace.oid = idx.relnamespace
       JOIN pg_catalog.pg_class rel ON rel.oid = ind.indrelid
       JOIN pg_catalog.pg_namespace table_namespace
         ON table_namespace.oid = rel.relnamespace
       WHERE index_namespace.nspname = 'public'
         AND table_namespace.nspname = 'public'
         AND idx.relname = ANY($1::text[])`,
      STORE_FACTORY_V2_REQUIRED_INDEXES.map((index) => index.name)
    ),
  ]);

  const inspectedColumns = columns.map((row) => ({
    tableName: row.table_name,
    columnName: row.column_name,
    dataType: row.data_type,
    nullable: row.nullable,
    defaultExpression: row.default_expression,
    identity: row.identity,
    generated: row.generated,
  }));

  return inspectStoreFactoryV2Schema({
    tables: tables.map((row) => row.table_name),
    columns: inspectedColumns,
    columnContracts: Object.entries(STORE_FACTORY_V2_REQUIRED_COLUMNS)
      .filter(([tableName]) => tables.some((row) => row.table_name === tableName))
      .map(([tableName, requiredColumns]) => ({
        tableName,
        fingerprint: storeFactoryV2ColumnContractFingerprint(
          inspectedColumns
            .filter(
              (column) =>
                column.tableName === tableName &&
                (requiredColumns as readonly string[]).includes(column.columnName)
            )
            .map((column) => ({
              columnName: column.columnName,
              dataType: column.dataType,
              nullable: column.nullable,
              defaultExpression: column.defaultExpression,
              identity: column.identity,
              generated: column.generated,
            }))
        ),
      })),
    checks: checks.map((row) => ({
      name: row.constraint_name,
      tableName: row.table_name,
      validated: row.validated,
      definitionFingerprint: storeFactoryV2SqlFingerprint(row.definition),
    })),
    foreignKeys: foreignKeys.map((row) => ({
      name: row.constraint_name,
      tableName: row.table_name,
      columns: row.columns,
      referencedTableName: row.referenced_table_name,
      referencedColumns: row.referenced_columns,
      updateAction: row.update_action,
      deleteAction: row.delete_action,
      validated: row.validated,
    })),
    triggers: triggers.map((row) => ({
      name: row.trigger_name,
      tableName: row.table_name,
      functionName: row.function_name,
      enabledMode: row.enabled_mode,
      timing: row.timing,
      events: row.events,
      rowLevel: row.row_level,
      whenExpression: row.when_expression,
      argumentCount: row.argument_count,
      definitionFingerprint: storeFactoryV2SqlFingerprint(row.definition),
    })),
    functions: functions.map((row) => row.function_name),
    functionContracts: functions.map((row) => ({
      name: row.function_name,
      fingerprint: storeFactoryV2FunctionContractFingerprint({
        identityArguments: row.identity_arguments,
        resultType: row.result_type,
        language: row.language,
        volatility: row.volatility,
        securityDefiner: row.security_definer,
        leakproof: row.leakproof,
        strict: row.strict,
        parallel: row.parallel,
        config: row.config,
        source: row.source,
      }),
    })),
    indexes: indexes.map((row) => ({
      name: row.index_name,
      tableName: row.table_name,
      columns: row.columns,
      unique: row.is_unique,
      predicate: row.predicate,
      valid: row.valid,
      ready: row.ready,
      definitionFingerprint: storeFactoryV2SqlFingerprint(row.definition),
    })),
  });
}

export interface StoreFactoryV2DdlBundle {
  version: string;
  files: readonly { name: string; sql: string }[];
  fingerprint?: string;
}

export function inspectStoreFactoryV2DdlBundle(
  input: StoreFactoryV2DdlBundle
): { valid: boolean; problems: string[] } {
  const problems: string[] = [];
  if (input.version !== STORE_FACTORY_V2_DDL_BUNDLE_VERSION) {
    problems.push(`DDL bundle version must be ${STORE_FACTORY_V2_DDL_BUNDLE_VERSION}`);
  }
  if (input.files.length < 2) {
    problems.push("DDL bundle must contain the catalog and revision expansions");
  }
  const seenNames = new Set<string>();
  for (const { name, sql } of input.files) {
    if (seenNames.has(name)) problems.push(`DDL bundle contains duplicate file ${name}`);
    seenNames.add(name);
    const normalized = sql.trim();
    if (!/^BEGIN\s*;/i.test(normalized) || !/COMMIT\s*;$/i.test(normalized)) {
      problems.push(`${name} must be one explicit transaction`);
    }
    if ((normalized.match(/^BEGIN\s*;$/gim) ?? []).length !== 1) {
      problems.push(`${name} must contain exactly one top-level BEGIN`);
    }
    if ((normalized.match(/^COMMIT\s*;$/gim) ?? []).length !== 1) {
      problems.push(`${name} must contain exactly one top-level COMMIT`);
    }
    if (/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM)\b/i.test(sql)) {
      problems.push(`${name} contains destructive DDL or data deletion`);
    }
  }
  const combined = input.files.map((file) => file.sql).join("\n");
  for (const tableName of Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMNS).filter(
    (table) => !["Wishlist", "WishlistItem"].includes(table)
  )) {
    if (!combined.includes(`\"${tableName}\"`)) {
      problems.push(`DDL does not contain ${tableName}`);
    }
  }
  for (const trigger of STORE_FACTORY_V2_REQUIRED_TRIGGERS) {
    if (!combined.includes(`\"${trigger.name}\"`)) {
      problems.push(`DDL does not contain trigger ${trigger.name}`);
    }
  }
  for (const foreignKey of STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS) {
    if (!combined.includes(`\"${foreignKey.name}\"`)) {
      problems.push(`DDL does not contain foreign key ${foreignKey.name}`);
    }
  }
  for (const check of STORE_FACTORY_V2_REQUIRED_CHECKS) {
    if (!combined.includes(`CONSTRAINT \"${check}\" CHECK`)) {
      problems.push(`DDL does not contain check ${check}`);
    }
  }
  for (const fn of Object.keys(STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS)) {
    if (!combined.includes(`CREATE FUNCTION \"${fn}\"`)) {
      problems.push(`DDL does not contain function ${fn}`);
    }
  }
  for (const index of STORE_FACTORY_V2_REQUIRED_INDEXES) {
    if (!combined.includes(`\"${index.name}\"`)) {
      problems.push(`DDL does not contain index ${index.name}`);
    }
  }
  if (input.fingerprint) {
    const actualFingerprint = storeFactoryV2DdlBundleFingerprint({
      version: input.version,
      files: input.files,
    });
    if (actualFingerprint !== input.fingerprint) {
      problems.push("DDL bundle fingerprint does not match its contents");
    }
  }
  return { valid: problems.length === 0, problems };
}

/** Backwards-compatible test helper for the original two-file bundle. */
export function inspectStoreFactoryV2Ddl(input: {
  revisionSql: string;
  catalogSql: string;
}): { valid: boolean; problems: string[] } {
  return inspectStoreFactoryV2DdlBundle({
    version: STORE_FACTORY_V2_DDL_BUNDLE_VERSION,
    files: [
      { name: "20260903_catalog_core_v2_v1.sql", sql: input.catalogSql },
      { name: "20260903_store_factory_v2_revision_v1.sql", sql: input.revisionSql },
    ],
  });
}

export function makeCompleteStoreFactoryV2Inspection(): StoreFactoryV2SchemaInspection {
  return {
    tables: Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMNS),
    columns: Object.entries(STORE_FACTORY_V2_REQUIRED_COLUMNS).flatMap(
      ([tableName, columnNames]) =>
        columnNames.map((columnName) => {
          const key = `${tableName}.${columnName}`;
          return {
            tableName,
            columnName,
            dataType:
              STORE_FACTORY_V2_REQUIRED_COLUMN_TYPES[
                key as keyof typeof STORE_FACTORY_V2_REQUIRED_COLUMN_TYPES
              ],
          };
        })
    ),
    columnContracts: Object.entries(
      STORE_FACTORY_V2_COLUMN_CONTRACT_FINGERPRINTS
    ).map(([tableName, fingerprint]) => ({ tableName, fingerprint })),
    checks: STORE_FACTORY_V2_REQUIRED_CHECKS.map((name) => ({
      name,
      tableName:
        STORE_FACTORY_V2_CHECK_CONTRACTS[
          name as keyof typeof STORE_FACTORY_V2_CHECK_CONTRACTS
        ].tableName,
      validated: true,
      definitionFingerprint:
        STORE_FACTORY_V2_CHECK_CONTRACTS[
          name as keyof typeof STORE_FACTORY_V2_CHECK_CONTRACTS
        ].fingerprint,
    })),
    foreignKeys: STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS.map((foreignKey) => ({
      ...foreignKey,
      validated: true,
    })),
    triggers: STORE_FACTORY_V2_REQUIRED_TRIGGERS.map((trigger) => ({
      ...trigger,
      enabledMode: "O",
      timing: "BEFORE",
      events: [],
      rowLevel: true,
      whenExpression: null,
      argumentCount: 0,
      definitionFingerprint:
        STORE_FACTORY_V2_TRIGGER_DEFINITION_FINGERPRINTS[
          trigger.name as keyof typeof STORE_FACTORY_V2_TRIGGER_DEFINITION_FINGERPRINTS
        ],
    })),
    functions: [...STORE_FACTORY_V2_REQUIRED_FUNCTIONS],
    functionContracts: Object.entries(
      STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS
    ).map(([name, fingerprint]) => ({ name, fingerprint })),
    indexes: STORE_FACTORY_V2_REQUIRED_INDEXES.map((index) => ({
      ...index,
      valid: true,
      ready: true,
      definitionFingerprint:
        STORE_FACTORY_V2_INDEX_DEFINITION_FINGERPRINTS[
          index.name as keyof typeof STORE_FACTORY_V2_INDEX_DEFINITION_FINGERPRINTS
        ],
    })),
  };
}

function countExpectedArtifacts(): number {
  return (
    Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMNS).length +
    Object.values(STORE_FACTORY_V2_REQUIRED_COLUMNS).reduce(
      (sum, columns) => sum + columns.length,
      0
    ) +
    Object.keys(STORE_FACTORY_V2_REQUIRED_COLUMN_TYPES).length +
    Object.keys(STORE_FACTORY_V2_COLUMN_CONTRACT_FINGERPRINTS).length +
    STORE_FACTORY_V2_REQUIRED_CHECKS.length +
    STORE_FACTORY_V2_REQUIRED_FOREIGN_KEYS.length +
    STORE_FACTORY_V2_REQUIRED_TRIGGERS.length +
    STORE_FACTORY_V2_REQUIRED_FUNCTIONS.length +
    Object.keys(STORE_FACTORY_V2_FUNCTION_CONTRACT_FINGERPRINTS).length +
    STORE_FACTORY_V2_REQUIRED_INDEXES.length
  );
}
