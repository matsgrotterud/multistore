import { z } from "zod";
import { canonicalizeCatalogValue, digestCatalogValue } from "./canonical";
import {
  COLLECTION_V2,
  EVIDENCE_V2,
  PRODUCT_REVISION_V2,
  TAXONOMY_V2,
  AttributeValueV2Schema,
  CatalogReferenceFixtureV2Schema,
  isImmediatelyPurchasableV2,
  type AttributeDefinitionV2,
  type AttributeValueV2,
  type AvailabilityV2,
  type CatalogReferenceFixtureV2,
  type MoneyV2,
  type ProductRevisionV2,
  type RetailPriceV2,
  type SupplierObservationV2,
} from "./contracts";
import {
  CatalogProjectionV2Schema,
  type CatalogProjectionAttributeDefinitionV2,
  type CatalogProjectionV2,
} from "./catalog-projection";
import { projectStorefrontProductV2 } from "./projection";

export const CATALOG_PERSISTENCE_PLAN_V2 =
  "catalog-persistence-plan.v2" as const;

const storeIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/);

/** Decimal transport for Prisma/Postgres BIGINT fields; adapters convert it to bigint. */
export type CatalogDbBigIntV2 = `${number}`;
type IsoDateTime = string;
type NullablePriceState = "KNOWN" | "UNKNOWN" | null;

export interface CatalogArtifactRowV2 {
  id: string;
  storeId: string;
  sourceKind: "REFERENCE_FIXTURE" | "CATALOG_PROJECTION";
  sourceRef: string;
  contractVersion: string;
  description: string | null;
  generatedAt: IsoDateTime;
  taxonomyRef: string;
  taxonomyContractVersion: typeof TAXONOMY_V2;
  artifactJson: string;
  contentDigest: string;
  createdAt: IsoDateTime;
}

export interface CatalogProductRowV2 {
  id: string;
  storeId: string;
  legacyProductId: null;
  canonicalKey: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CatalogVariantIdentityRowV2 {
  id: string;
  storeId: string;
  productId: string;
  stableKey: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CatalogProductRevisionRowV2 {
  id: string;
  storeId: string;
  artifactId: string;
  productId: string;
  artifactRevisionRef: string;
  revisionNumber: CatalogDbBigIntV2;
  contractVersion: typeof PRODUCT_REVISION_V2;
  source:
    | "LEGACY_ADAPTER"
    | "MERCHANT"
    | "SYNTHETIC_FIXTURE"
    | "PROVIDER_PROPOSAL";
  revisionState: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "UNKNOWN";
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  brand: string | null;
  seoTitle: string;
  seoDescription: string;
  retailPriceState: "KNOWN" | "UNKNOWN";
  retailPriceMinor: CatalogDbBigIntV2 | null;
  currency: string | null;
  compareAtPriceMinor: CatalogDbBigIntV2 | null;
  compareAtPriceCurrency: string | null;
  availability: AvailabilityV2;
  purchasable: boolean;
  revisionJson: string;
  contentDigest: string;
  reasonCodesJson: string;
  createdAt: IsoDateTime;
  sealedAt: null;
}

export interface CatalogSellableVariantRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  variantIdentityId: string;
  stableKey: string;
  label: string;
  optionValuesJson: string;
  retailPriceState: NullablePriceState;
  retailPriceMinor: CatalogDbBigIntV2 | null;
  currency: string | null;
  compareAtPriceMinor: CatalogDbBigIntV2 | null;
  compareAtPriceCurrency: string | null;
  availability: AvailabilityV2;
  isDefault: boolean;
  sortOrder: number;
  createdAt: IsoDateTime;
}

export interface CatalogTaxonomyNodeRowV2 {
  id: string;
  storeId: string;
  artifactId: string;
  taxonomyRef: string;
  contractVersion: typeof TAXONOMY_V2;
  parentId: string | null;
  key: string;
  slug: string;
  title: string;
  description: string | null;
  pathJson: string;
  depth: number;
  sortOrder: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CatalogProductTaxonomyPlacementRowV2 {
  storeId: string;
  productRevisionId: string;
  taxonomyNodeId: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CatalogAttributeDefinitionRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  stableKey: string;
  key: string;
  label: string;
  valueType: AttributeDefinitionV2["dataType"];
  cardinality: AttributeDefinitionV2["cardinality"];
  scope: AttributeDefinitionV2["scope"];
  variantAxis: boolean;
  storefrontVisible: boolean;
  unitCode: string | null;
  facetable: boolean;
  comparable: boolean;
  required: boolean;
  sortOrder: number;
  createdAt: IsoDateTime;
}

export interface CatalogTaxonomyAttributeDefinitionRowV2 {
  storeId: string;
  taxonomyNodeId: string;
  definitionId: string;
  sortOrder: number;
}

export interface CatalogAttributeOptionRowV2 {
  id: string;
  storeId: string;
  definitionId: string;
  key: string;
  label: string;
  sortOrder: number;
  createdAt: IsoDateTime;
}

export interface CatalogProductAttributeValueRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  variantId: string | null;
  definitionId: string;
  assignmentScopeKey: string;
  valuesJson: string;
  normalizedValuesJson: string;
  createdAt: IsoDateTime;
}

export interface CatalogCollectionRowV2 {
  id: string;
  storeId: string;
  artifactId: string;
  stableKey: string;
  contractVersion: typeof COLLECTION_V2;
  slug: string;
  title: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  kind: "MANUAL" | "RULE_BASED" | "UNKNOWN";
  publicationState: "PUBLIC" | "INTERNAL" | "UNKNOWN";
  position: number;
  ruleJson: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CatalogCollectionItemRowV2 {
  collectionId: string;
  productRevisionId: string;
  storeId: string;
  sortOrder: number;
  evidenceIdsJson: string;
}

export interface CatalogMediaAssetRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  stableKey: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT" | "UNKNOWN";
  role:
    | "PRIMARY"
    | "GALLERY"
    | "VARIANT"
    | "SWATCH"
    | "LIFESTYLE"
    | "SIZE_GUIDE"
    | "INSTRUCTIONAL"
    | "UNKNOWN";
  publicationState: "PUBLIC_READY" | "INTERNAL_ONLY" | "UNKNOWN";
  sortOrder: number;
  publicUrl: string | null;
  mimeType: string | null;
  altText: string;
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
  sourceKind:
    | "MERCHANT_OWNED"
    | "SUPPLIER_LICENSED"
    | "STOCK_LICENSED"
    | "SYNTHETIC"
    | "UNKNOWN";
  sourceUrl: string | null;
  rightsStatus: "VERIFIED" | "REVIEW_REQUIRED" | "UNKNOWN";
  evidenceIdsJson: string;
  createdAt: IsoDateTime;
}

export interface CatalogMediaVariantRowV2 {
  storeId: string;
  mediaId: string;
  variantId: string;
}

export interface CatalogPurchaseOptionRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  stableKey: string;
  kind: "SINGLE" | "BUNDLE" | "UNKNOWN";
  label: string;
  quantity: CatalogDbBigIntV2;
  variantId: string | null;
  retailPriceState: "KNOWN" | "UNKNOWN";
  retailPriceMinor: CatalogDbBigIntV2 | null;
  currency: string | null;
  compareAtPriceMinor: CatalogDbBigIntV2 | null;
  compareAtPriceCurrency: string | null;
  availability: AvailabilityV2;
  repeatPurchaseState: "ELIGIBLE" | "INELIGIBLE" | "UNKNOWN";
  repeatIntervalDaysJson: string;
  sortOrder: number;
  createdAt: IsoDateTime;
}

export interface CatalogEvidenceRowV2 {
  id: string;
  storeId: string;
  productRevisionId: string;
  stableKey: string;
  contractVersion: typeof EVIDENCE_V2;
  kind:
    | "MANUAL_ASSERTION"
    | "SUPPLIER_OBSERVATION"
    | "MEDIA_INGESTION"
    | "DERIVED"
    | "UNKNOWN";
  state: "VERIFIED" | "UNVERIFIED" | "REJECTED" | "UNKNOWN";
  subjectType:
    | "PRODUCT"
    | "VARIANT"
    | "ATTRIBUTE"
    | "MEDIA"
    | "COLLECTION_MEMBERSHIP"
    | "UNKNOWN";
  subjectRef: string;
  recordedAt: IsoDateTime;
  sourceRef: string | null;
  contentDigest: string;
  notesJson: string;
  createdAt: IsoDateTime;
}

export interface CatalogSupplierOfferRowV2 {
  id: string;
  storeId: string;
  productId: string;
  variantIdentityId: string | null;
  contractVersion: string;
  stableKey: string;
  supplierAccountRef: string;
  sourceOfferRef: string;
  state: "ACTIVE" | "INACTIVE" | "UNKNOWN";
  observedCurrency: string;
  latestObservationId: null;
  evidenceIdsJson: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CatalogSupplierObservationRowV2 {
  id: string;
  storeId: string;
  offerId: string;
  contractVersion: string;
  stableKey: string;
  observedAt: IsoDateTime;
  outcome: "OBSERVED" | "FAILED" | "UNKNOWN";
  unitCostState: "KNOWN" | "UNKNOWN";
  unitCostMinor: CatalogDbBigIntV2 | null;
  unitCostCurrency: string | null;
  shippingState: "KNOWN" | "UNKNOWN";
  shippingMinor: CatalogDbBigIntV2 | null;
  shippingCurrency: string | null;
  inventoryState: "KNOWN" | "UNKNOWN";
  inventoryQuantity: CatalogDbBigIntV2 | null;
  availability: AvailabilityV2;
  shippingDaysMin: number | null;
  shippingDaysMax: number | null;
  sourcePayloadDigest: string;
  evidenceIdsJson: string;
  reasonCodesJson: string;
  createdAt: IsoDateTime;
}

export interface CatalogPersistenceRowsV2 {
  artifacts: CatalogArtifactRowV2[];
  products: CatalogProductRowV2[];
  variantIdentities: CatalogVariantIdentityRowV2[];
  revisions: CatalogProductRevisionRowV2[];
  variants: CatalogSellableVariantRowV2[];
  taxonomyNodes: CatalogTaxonomyNodeRowV2[];
  taxonomyPlacements: CatalogProductTaxonomyPlacementRowV2[];
  attributeDefinitions: CatalogAttributeDefinitionRowV2[];
  taxonomyAttributeDefinitions: CatalogTaxonomyAttributeDefinitionRowV2[];
  attributeOptions: CatalogAttributeOptionRowV2[];
  attributeValues: CatalogProductAttributeValueRowV2[];
  collections: CatalogCollectionRowV2[];
  collectionItems: CatalogCollectionItemRowV2[];
  mediaAssets: CatalogMediaAssetRowV2[];
  mediaVariants: CatalogMediaVariantRowV2[];
  purchaseOptions: CatalogPurchaseOptionRowV2[];
  evidence: CatalogEvidenceRowV2[];
  supplierOffers: CatalogSupplierOfferRowV2[];
  supplierObservations: CatalogSupplierObservationRowV2[];
}

export interface CatalogOfferLatestObservationUpdateV2 {
  offerId: string;
  latestObservationId: string;
  updatedAt: IsoDateTime;
}

export interface CatalogRevisionSealUpdateV2 {
  productRevisionId: string;
  sealedAt: IsoDateTime;
}

export interface CatalogPersistencePlanV2 {
  version: typeof CATALOG_PERSISTENCE_PLAN_V2;
  storeId: string;
  sourceArtifact: {
    kind: CatalogArtifactRowV2["sourceKind"];
    ref: string;
    digest: string;
  };
  rows: CatalogPersistenceRowsV2;
  offerLatestObservationUpdates: CatalogOfferLatestObservationUpdateV2[];
  revisionSealUpdates: CatalogRevisionSealUpdateV2[];
  planRef: string;
}

export type CatalogPersistenceRefusalReasonV2 =
  | "INVALID_STORE_ID"
  | "INVALID_REFERENCE_FIXTURE"
  | "INVALID_CATALOG_PROJECTION"
  | "PROJECTION_REVISION_NUMBERS_REQUIRED"
  | "AMBIGUOUS_PROJECTION_ATTRIBUTE"
  | "SCHEMA_CONSTRAINT_CONFLICT"
  | "PERSISTENCE_UNIQUE_CONFLICT"
  | "PERSISTENCE_RELATION_CONFLICT"
  | "INVALID_UNKNOWN_SEMANTICS"
  | "TEMPORAL_CONFLICT";

export type CatalogPersistenceBuildResultV2 =
  | { status: "READY"; plan: CatalogPersistencePlanV2; reasonCodes: [] }
  | {
      status: "REFUSED";
      plan: null;
      reasonCodes: CatalogPersistenceRefusalReasonV2[];
    };

interface BuildState {
  reasons: Set<CatalogPersistenceRefusalReasonV2>;
}

interface PriceColumns {
  retailPriceState: NullablePriceState;
  retailPriceMinor: CatalogDbBigIntV2 | null;
  currency: string | null;
  compareAtPriceMinor: CatalogDbBigIntV2 | null;
  compareAtPriceCurrency: string | null;
}

function dbBigInt(value: number): CatalogDbBigIntV2 {
  return String(value) as CatalogDbBigIntV2;
}

function stableId(kind: string, storeId: string, logicalPath: string): string {
  return `cv2:${kind}:${digestCatalogValue({ storeId, logicalPath })}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareTimestamps(left: string, right: string): number {
  const difference = Date.parse(left) - Date.parse(right);
  return difference === 0 ? compareText(left, right) : difference;
}

function compareSupplierObservationRecency(
  left: SupplierObservationV2,
  right: SupplierObservationV2
): number {
  const instantOrder = Date.parse(left.observedAt) - Date.parse(right.observedAt);
  return instantOrder === 0
    ? compareText(left.observationId, right.observationId)
    : instantOrder;
}

function priceColumns(
  price: RetailPriceV2 | null,
  compareAtPrice: MoneyV2 | null
): PriceColumns {
  const money = price?.state === "KNOWN" ? price.money : null;
  return {
    retailPriceState: price?.state ?? null,
    retailPriceMinor: money ? dbBigInt(money.amountMinor) : null,
    currency: money?.currency ?? null,
    compareAtPriceMinor: compareAtPrice
      ? dbBigInt(compareAtPrice.amountMinor)
      : null,
    compareAtPriceCurrency: compareAtPrice?.currency ?? null,
  };
}

function emptyRows(): CatalogPersistenceRowsV2 {
  return {
    artifacts: [],
    products: [],
    variantIdentities: [],
    revisions: [],
    variants: [],
    taxonomyNodes: [],
    taxonomyPlacements: [],
    attributeDefinitions: [],
    taxonomyAttributeDefinitions: [],
    attributeOptions: [],
    attributeValues: [],
    collections: [],
    collectionItems: [],
    mediaAssets: [],
    mediaVariants: [],
    purchaseOptions: [],
    evidence: [],
    supplierOffers: [],
    supplierObservations: [],
  };
}

function maxTimestamp(values: readonly string[]): string {
  return [...values].sort(compareTimestamps).at(-1)!;
}

function minTimestamp(values: readonly string[]): string {
  return [...values].sort(compareTimestamps)[0];
}

function productStatus(
  revisions: readonly ProductRevisionV2[]
): CatalogProductRowV2["status"] {
  const latest = [...revisions].sort((left, right) => {
    if (left.revisionNumber !== right.revisionNumber) {
      return right.revisionNumber - left.revisionNumber;
    }
    return compareText(right.revisionId, left.revisionId);
  })[0];
  if (latest?.revisionState === "PUBLISHED") return "ACTIVE";
  if (latest?.revisionState === "ARCHIVED") return "ARCHIVED";
  return "DRAFT";
}

function revisionPurchasable(revision: ProductRevisionV2): boolean {
  const projection = projectStorefrontProductV2(revision);
  return projection.status === "PROJECTED" && projection.product.purchasable;
}

function assignmentValuesJson(value: AttributeValueV2): string {
  return canonicalizeCatalogValue(value.values);
}

function int32(value: number): boolean {
  return Number.isInteger(value) && value >= -2_147_483_648 && value <= 2_147_483_647;
}

function validHttps(value: string | null): boolean {
  return value === null || value.startsWith("https://");
}

function validateSchemaScalars(
  fixture: CatalogReferenceFixtureV2,
  state: BuildState
): void {
  if (
    fixture.productRevisions.some(
      (revision) =>
        !int32(revision.taxonomyNodeIds.length) ||
        revision.attributeDefinitions.some(
          (definition) =>
            !int32(definition.position) ||
            (definition.unitCode !== null &&
              !/^[A-Za-z0-9.%/_-]{1,24}$/.test(definition.unitCode))
        ) ||
        revision.variants.some((variant) => !int32(variant.position)) ||
        revision.purchaseOptions.some((option) => !int32(option.position)) ||
        revision.media.some(
          (media) =>
            !int32(media.position) ||
            !validHttps(media.publicUrl) ||
            !validHttps(media.rights.sourceUrl) ||
            (media.width !== null && !int32(media.width)) ||
            (media.height !== null && !int32(media.height))
        ) ||
        revision.collectionMemberships.some(
          (membership) => !int32(membership.position)
        )
    ) ||
    fixture.taxonomy.nodes.some(
      (node) => !int32(node.depth) || !int32(node.position)
    ) ||
    fixture.collections.some((collection) => !int32(collection.position)) ||
    fixture.supplierObservations.some(
      (observation) =>
        (observation.shipping.state === "KNOWN" &&
          (!int32(observation.shipping.minDays) ||
            !int32(observation.shipping.maxDays)))
    )
  ) {
    state.reasons.add("SCHEMA_CONSTRAINT_CONFLICT");
  }
  if (
    fixture.productRevisions.some(
      (revision) => Date.parse(revision.createdAt) > Date.parse(fixture.generatedAt)
    )
  ) {
    state.reasons.add("TEMPORAL_CONFLICT");
  }
}

interface ArtifactContext {
  artifactId: string;
  artifactPath: string;
  generatedAt: string;
  taxonomyRef: string;
}

function fixtureArtifactContext(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  fixture: CatalogReferenceFixtureV2
): ArtifactContext {
  const contentDigest = digestCatalogValue(fixture);
  const artifactPath = `fixture/${fixture.fixtureId}/${contentDigest}`;
  const artifactId = stableId("artifact", storeId, artifactPath);
  rows.artifacts.push({
    id: artifactId,
    storeId,
    sourceKind: "REFERENCE_FIXTURE",
    sourceRef: fixture.fixtureId,
    contractVersion: fixture.version,
    description: fixture.description,
    generatedAt: fixture.generatedAt,
    taxonomyRef: fixture.taxonomy.taxonomyId,
    taxonomyContractVersion: fixture.taxonomy.version,
    artifactJson: canonicalizeCatalogValue(fixture),
    contentDigest,
    createdAt: fixture.generatedAt,
  });
  return {
    artifactId,
    artifactPath,
    generatedAt: fixture.generatedAt,
    taxonomyRef: fixture.taxonomy.taxonomyId,
  };
}

function projectionArtifactContext(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  projection: CatalogProjectionV2
): ArtifactContext {
  const contentDigest = digestCatalogValue(projection);
  const artifactPath = `projection/${projection.projectionRef}/${contentDigest}`;
  const artifactId = stableId("artifact", storeId, artifactPath);
  rows.artifacts.push({
    id: artifactId,
    storeId,
    sourceKind: "CATALOG_PROJECTION",
    sourceRef: projection.projectionRef,
    contractVersion: projection.version,
    description: null,
    generatedAt: projection.generatedAt,
    taxonomyRef: projection.taxonomy.taxonomyId,
    taxonomyContractVersion: TAXONOMY_V2,
    artifactJson: canonicalizeCatalogValue(projection),
    contentDigest,
    createdAt: projection.generatedAt,
  });
  return {
    artifactId,
    artifactPath,
    generatedAt: projection.generatedAt,
    taxonomyRef: projection.taxonomy.taxonomyId,
  };
}

function addTaxonomyRows(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  context: ArtifactContext,
  nodes: CatalogReferenceFixtureV2["taxonomy"]["nodes"]
): Map<string, string> {
  const ids = new Map(
    nodes.map((node) => [
      node.taxonomyNodeId,
      stableId(
        "taxonomy",
        storeId,
        `${context.artifactPath}/taxonomy/${node.taxonomyNodeId}`
      ),
    ])
  );
  rows.taxonomyNodes.push(
    ...[...nodes]
      .sort((left, right) => {
        if (left.depth !== right.depth) return left.depth - right.depth;
        return compareText(left.path.join("/"), right.path.join("/"));
      })
      .map((node) => ({
        id: ids.get(node.taxonomyNodeId)!,
        storeId,
        artifactId: context.artifactId,
        taxonomyRef: context.taxonomyRef,
        contractVersion: TAXONOMY_V2,
        parentId: node.parentId ? ids.get(node.parentId)! : null,
        key: node.taxonomyNodeId,
        slug: node.slug,
        title: node.name,
        description: node.description,
        pathJson: canonicalizeCatalogValue(node.path),
        depth: node.depth,
        sortOrder: node.position,
        createdAt: context.generatedAt,
        updatedAt: context.generatedAt,
      }))
  );
  return ids;
}

function addFixtureCollections(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  context: ArtifactContext,
  fixture: CatalogReferenceFixtureV2
): Map<string, string> {
  const ids = new Map<string, string>();
  for (const collection of fixture.collections) {
    const id = stableId(
      "collection",
      storeId,
      `${context.artifactPath}/collection/${collection.collectionId}`
    );
    ids.set(collection.collectionId, id);
    rows.collections.push({
      id,
      storeId,
      artifactId: context.artifactId,
      stableKey: collection.collectionId,
      contractVersion: collection.version,
      slug: collection.slug,
      title: collection.title,
      description: collection.description,
      seoTitle: null,
      seoDescription: null,
      kind: collection.kind,
      publicationState: collection.publicationState,
      position: collection.position,
      ruleJson: null,
      createdAt: context.generatedAt,
      updatedAt: context.generatedAt,
    });
  }
  return ids;
}

function addProjectionCollections(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  context: ArtifactContext,
  projection: CatalogProjectionV2
): Map<string, string> {
  const ids = new Map<string, string>();
  for (const collection of projection.collections) {
    const id = stableId(
      "collection",
      storeId,
      `${context.artifactPath}/collection/${collection.collectionId}`
    );
    ids.set(collection.collectionId, id);
    rows.collections.push({
      id,
      storeId,
      artifactId: context.artifactId,
      stableKey: collection.collectionId,
      contractVersion: COLLECTION_V2,
      slug: collection.slug,
      title: collection.title,
      description: collection.description,
      seoTitle: null,
      seoDescription: null,
      kind: "UNKNOWN",
      publicationState: "PUBLIC",
      position: collection.position,
      ruleJson: null,
      createdAt: context.generatedAt,
      updatedAt: context.generatedAt,
    });
  }
  return ids;
}

function groupFixtureRevisions(
  revisions: readonly ProductRevisionV2[]
): Map<string, ProductRevisionV2[]> {
  const grouped = new Map<string, ProductRevisionV2[]>();
  for (const revision of revisions) {
    const productRevisions = grouped.get(revision.productId) ?? [];
    productRevisions.push(revision);
    grouped.set(revision.productId, productRevisions);
  }
  return grouped;
}

function addFixtureProductsAndIdentities(
  rows: CatalogPersistenceRowsV2,
  storeId: string,
  fixture: CatalogReferenceFixtureV2
): {
  productIds: Map<string, string>;
  variantIdentityIds: Map<string, string>;
} {
  const productIds = new Map<string, string>();
  const variantIdentityIds = new Map<string, string>();
  for (const [sourceProductId, revisions] of groupFixtureRevisions(
    fixture.productRevisions
  )) {
    const productId = stableId("product", storeId, `product/${sourceProductId}`);
    const timestamps = revisions.map((revision) => revision.createdAt);
    productIds.set(sourceProductId, productId);
    rows.products.push({
      id: productId,
      storeId,
      legacyProductId: null,
      canonicalKey: sourceProductId,
      status: productStatus(revisions),
      createdAt: minTimestamp(timestamps),
      updatedAt: maxTimestamp([...timestamps, fixture.generatedAt]),
    });
    const variantTimes = new Map<string, string[]>();
    for (const revision of revisions) {
      for (const variant of revision.variants) {
        const times = variantTimes.get(variant.variantId) ?? [];
        times.push(revision.createdAt);
        variantTimes.set(variant.variantId, times);
      }
    }
    for (const [sourceVariantId, times] of variantTimes) {
      const identityId = stableId(
        "variant-identity",
        storeId,
        `product/${sourceProductId}/variant/${sourceVariantId}`
      );
      variantIdentityIds.set(`${sourceProductId}\0${sourceVariantId}`, identityId);
      rows.variantIdentities.push({
        id: identityId,
        storeId,
        productId,
        stableKey: sourceVariantId,
        createdAt: minTimestamp(times),
        updatedAt: maxTimestamp(times),
      });
    }
  }
  return { productIds, variantIdentityIds };
}

function fixtureDefinitionRows(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  revision: ProductRevisionV2;
  revisionPath: string;
  revisionRowId: string;
  taxonomyRowIds: Map<string, string>;
}): Map<string, string> {
  const ids = new Map<string, string>();
  for (const definition of input.revision.attributeDefinitions) {
    const definitionId = stableId(
      "attribute-definition",
      input.storeId,
      `${input.revisionPath}/definition/${definition.attributeDefinitionId}`
    );
    ids.set(definition.attributeDefinitionId, definitionId);
    input.rows.attributeDefinitions.push({
      id: definitionId,
      storeId: input.storeId,
      productRevisionId: input.revisionRowId,
      stableKey: definition.attributeDefinitionId,
      key: definition.key,
      label: definition.label,
      valueType: definition.dataType,
      cardinality: definition.cardinality,
      scope: definition.scope,
      variantAxis: definition.variantAxis,
      storefrontVisible: definition.storefrontVisible,
      unitCode: definition.unitCode,
      facetable: definition.facetable,
      comparable: definition.comparable,
      required: definition.required,
      sortOrder: definition.position,
      createdAt: input.revision.createdAt,
    });
    definition.allowedValues.forEach((option, index) => {
      input.rows.attributeOptions.push({
        id: stableId(
          "attribute-option",
          input.storeId,
          `${input.revisionPath}/definition/${definition.attributeDefinitionId}/option/${option.code}`
        ),
        storeId: input.storeId,
        definitionId,
        key: option.code,
        label: option.label,
        sortOrder: index,
        createdAt: input.revision.createdAt,
      });
    });
    for (const taxonomyNodeId of input.revision.taxonomyNodeIds) {
      input.rows.taxonomyAttributeDefinitions.push({
        storeId: input.storeId,
        taxonomyNodeId: input.taxonomyRowIds.get(taxonomyNodeId)!,
        definitionId,
        sortOrder: definition.position,
      });
    }
  }
  return ids;
}

function addAttributeValueRow(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  revisionPath: string;
  revisionRowId: string;
  variantRowId: string | null;
  definitionRowId: string;
  definitionStableKey: string;
  value: AttributeValueV2;
  createdAt: string;
}): void {
  const assignmentScopeKey = input.variantRowId ?? "PRODUCT";
  input.rows.attributeValues.push({
    id: stableId(
      "attribute-value",
      input.storeId,
      `${input.revisionPath}/assignment/${assignmentScopeKey}/definition/${input.definitionStableKey}`
    ),
    storeId: input.storeId,
    productRevisionId: input.revisionRowId,
    variantId: input.variantRowId,
    definitionId: input.definitionRowId,
    assignmentScopeKey,
    valuesJson: assignmentValuesJson(input.value),
    normalizedValuesJson: assignmentValuesJson(input.value),
    createdAt: input.createdAt,
  });
}

function addFixtureRevisionRows(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  fixture: CatalogReferenceFixtureV2;
  context: ArtifactContext;
  productIds: Map<string, string>;
  variantIdentityIds: Map<string, string>;
  taxonomyRowIds: Map<string, string>;
  collectionRowIds: Map<string, string>;
  state: BuildState;
}): {
  revisionIds: Map<string, string>;
  sellableVariantIds: Map<string, string>;
  sealUpdates: CatalogRevisionSealUpdateV2[];
} {
  const revisionIds = new Map<string, string>();
  const sellableVariantIds = new Map<string, string>();
  const sealUpdates: CatalogRevisionSealUpdateV2[] = [];

  for (const revision of input.fixture.productRevisions) {
    const revisionPath = `${input.context.artifactPath}/revision/${revision.revisionId}`;
    const revisionRowId = stableId(
      "revision",
      input.storeId,
      revisionPath
    );
    revisionIds.set(revision.revisionId, revisionRowId);
    const price = priceColumns(revision.price, revision.compareAtPrice);
    input.rows.revisions.push({
      id: revisionRowId,
      storeId: input.storeId,
      artifactId: input.context.artifactId,
      productId: input.productIds.get(revision.productId)!,
      artifactRevisionRef: revision.revisionId,
      revisionNumber: dbBigInt(revision.revisionNumber),
      contractVersion: revision.contractVersion,
      source: "SYNTHETIC_FIXTURE",
      revisionState: revision.revisionState,
      slug: revision.slug,
      title: revision.title,
      subtitle: revision.subtitle,
      description: revision.description,
      brand: revision.brand,
      seoTitle: revision.seoTitle,
      seoDescription: revision.seoDescription,
      retailPriceState: revision.price.state,
      retailPriceMinor: price.retailPriceMinor,
      currency: price.currency,
      compareAtPriceMinor: price.compareAtPriceMinor,
      compareAtPriceCurrency: price.compareAtPriceCurrency,
      availability: revision.availability,
      purchasable: revisionPurchasable(revision),
      revisionJson: canonicalizeCatalogValue(revision),
      contentDigest: digestCatalogValue(revision),
      reasonCodesJson: canonicalizeCatalogValue(revision.reasonCodes),
      createdAt: revision.createdAt,
      sealedAt: null,
    });
    sealUpdates.push({
      productRevisionId: revisionRowId,
      sealedAt: input.context.generatedAt,
    });

    revision.taxonomyNodeIds.forEach((taxonomyNodeId, index) => {
      input.rows.taxonomyPlacements.push({
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        taxonomyNodeId: input.taxonomyRowIds.get(taxonomyNodeId)!,
        isPrimary: index === 0,
        sortOrder: index,
      });
    });

    const definitionIds = fixtureDefinitionRows({
      rows: input.rows,
      storeId: input.storeId,
      revision,
      revisionPath,
      revisionRowId,
      taxonomyRowIds: input.taxonomyRowIds,
    });
    const definitions = new Map(
      revision.attributeDefinitions.map((definition) => [
        definition.attributeDefinitionId,
        definition,
      ])
    );

    for (const variant of revision.variants) {
      const variantRowId = stableId(
        "sellable-variant",
        input.storeId,
        `${revisionPath}/variant/${variant.variantId}`
      );
      sellableVariantIds.set(
        `${revision.revisionId}\0${variant.variantId}`,
        variantRowId
      );
      const optionValues = Object.fromEntries(
        [...variant.attributeValues]
          .sort((left, right) =>
            compareText(
              left.attributeDefinitionId,
              right.attributeDefinitionId
            )
          )
          .map((value) => [
            value.attributeDefinitionId,
            { dataType: value.dataType, values: value.values },
          ])
      );
      input.rows.variants.push({
        id: variantRowId,
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        variantIdentityId: input.variantIdentityIds.get(
          `${revision.productId}\0${variant.variantId}`
        )!,
        stableKey: variant.variantId,
        label: variant.label,
        optionValuesJson: canonicalizeCatalogValue(optionValues),
        ...priceColumns(variant.price, variant.compareAtPrice),
        availability: variant.availability,
        isDefault: variant.isDefault,
        sortOrder: variant.position,
        createdAt: revision.createdAt,
      });
    }

    for (const value of revision.attributeValues) {
      addAttributeValueRow({
        rows: input.rows,
        storeId: input.storeId,
        revisionPath,
        revisionRowId,
        variantRowId: null,
        definitionRowId: definitionIds.get(value.attributeDefinitionId)!,
        definitionStableKey: value.attributeDefinitionId,
        value,
        createdAt: revision.createdAt,
      });
    }
    for (const variant of revision.variants) {
      const variantRowId = sellableVariantIds.get(
        `${revision.revisionId}\0${variant.variantId}`
      )!;
      for (const value of variant.attributeValues) {
        addAttributeValueRow({
          rows: input.rows,
          storeId: input.storeId,
          revisionPath,
          revisionRowId,
          variantRowId,
          definitionRowId: definitionIds.get(value.attributeDefinitionId)!,
          definitionStableKey: value.attributeDefinitionId,
          value,
          createdAt: revision.createdAt,
        });
      }
    }

    for (const option of revision.purchaseOptions) {
      const optionPrice = priceColumns(option.price, option.compareAtPrice);
      const variantId = option.variantId
        ? sellableVariantIds.get(
            `${revision.revisionId}\0${option.variantId}`
          )
        : null;
      if (option.variantId && !variantId) {
        input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
      }
      input.rows.purchaseOptions.push({
        id: stableId(
          "purchase-option",
          input.storeId,
          `${revisionPath}/purchase-option/${option.purchaseOptionId}`
        ),
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        stableKey: option.purchaseOptionId,
        kind: option.kind,
        label: option.label,
        quantity: dbBigInt(option.quantity),
        variantId: variantId ?? null,
        retailPriceState: option.price.state,
        retailPriceMinor: optionPrice.retailPriceMinor,
        currency: optionPrice.currency,
        compareAtPriceMinor: optionPrice.compareAtPriceMinor,
        compareAtPriceCurrency: optionPrice.compareAtPriceCurrency,
        availability: option.availability,
        repeatPurchaseState: option.repeatPurchase.state,
        repeatIntervalDaysJson: canonicalizeCatalogValue(
          option.repeatPurchase.intervalDays
        ),
        sortOrder: option.position,
        createdAt: revision.createdAt,
      });
    }

    for (const evidence of revision.evidence) {
      input.rows.evidence.push({
        id: stableId(
          "evidence",
          input.storeId,
          `${revisionPath}/evidence/${evidence.evidenceId}`
        ),
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        stableKey: evidence.evidenceId,
        contractVersion: evidence.version,
        kind: evidence.kind,
        state: evidence.state,
        subjectType: evidence.subjectType,
        subjectRef: evidence.subjectRef,
        recordedAt: evidence.recordedAt,
        sourceRef: evidence.sourceRef,
        contentDigest: evidence.contentDigest,
        notesJson: canonicalizeCatalogValue(evidence.notes),
        createdAt: evidence.recordedAt,
      });
    }

    for (const membership of revision.collectionMemberships) {
      input.rows.collectionItems.push({
        collectionId: input.collectionRowIds.get(membership.collectionId)!,
        productRevisionId: revisionRowId,
        storeId: input.storeId,
        sortOrder: membership.position,
        evidenceIdsJson: canonicalizeCatalogValue(membership.evidenceIds),
      });
    }

    for (const media of revision.media) {
      const mediaRowId = stableId(
        "media",
        input.storeId,
        `${revisionPath}/media/${media.mediaId}`
      );
      input.rows.mediaAssets.push({
        id: mediaRowId,
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        stableKey: media.mediaId,
        kind: media.kind,
        role: media.role,
        publicationState: media.publicationState,
        sortOrder: media.position,
        publicUrl: media.publicUrl,
        mimeType: media.mimeType,
        altText: media.altText,
        width: media.width,
        height: media.height,
        focalX: media.focalPoint?.x ?? null,
        focalY: media.focalPoint?.y ?? null,
        sourceKind: media.rights.sourceKind,
        sourceUrl: media.rights.sourceUrl,
        rightsStatus: media.rights.state,
        evidenceIdsJson: canonicalizeCatalogValue(media.evidenceIds),
        createdAt: revision.createdAt,
      });
      for (const variantId of media.variantIds) {
        const variantRowId = sellableVariantIds.get(
          `${revision.revisionId}\0${variantId}`
        );
        if (!variantRowId) {
          input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
          continue;
        }
        input.rows.mediaVariants.push({
          storeId: input.storeId,
          mediaId: mediaRowId,
          variantId: variantRowId,
        });
      }
    }

    for (const value of [
      ...revision.attributeValues,
      ...revision.variants.flatMap((variant) => variant.attributeValues),
    ]) {
      if (!definitions.has(value.attributeDefinitionId)) {
        input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
      }
    }
  }
  return { revisionIds, sellableVariantIds, sealUpdates };
}

function addFixtureSupplierRows(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  fixture: CatalogReferenceFixtureV2;
  productIds: Map<string, string>;
  variantIdentityIds: Map<string, string>;
  state: BuildState;
}): CatalogOfferLatestObservationUpdateV2[] {
  const offerIds = new Map<string, string>();
  const observationIds = new Map<string, string>();
  const observationsByOffer = new Map<string, SupplierObservationV2[]>();

  for (const offer of input.fixture.supplierOffers) {
    const id = stableId("offer", input.storeId, `offer/${offer.offerId}`);
    offerIds.set(offer.offerId, id);
    const variantIdentityId = offer.variantId
      ? input.variantIdentityIds.get(`${offer.productId}\0${offer.variantId}`)
      : null;
    if (offer.variantId && !variantIdentityId) {
      input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
    }
    input.rows.supplierOffers.push({
      id,
      storeId: input.storeId,
      productId: input.productIds.get(offer.productId)!,
      variantIdentityId: variantIdentityId ?? null,
      contractVersion: offer.version,
      stableKey: offer.offerId,
      supplierAccountRef: offer.supplierAccountRef,
      sourceOfferRef: offer.sourceOfferRef,
      state: offer.state,
      observedCurrency: offer.observedCurrency,
      latestObservationId: null,
      evidenceIdsJson: canonicalizeCatalogValue(offer.evidenceIds),
      createdAt: offer.createdAt,
      updatedAt: offer.createdAt,
    });
  }

  for (const observation of input.fixture.supplierObservations) {
    const id = stableId(
      "observation",
      input.storeId,
      `observation/${observation.observationId}`
    );
    observationIds.set(observation.observationId, id);
    const observations = observationsByOffer.get(observation.offerId) ?? [];
    observations.push(observation);
    observationsByOffer.set(observation.offerId, observations);
    const unitCost =
      observation.unitCost.state === "KNOWN" ? observation.unitCost.money : null;
    const shipping =
      observation.shipping.state === "KNOWN" ? observation.shipping : null;
    input.rows.supplierObservations.push({
      id,
      storeId: input.storeId,
      offerId: offerIds.get(observation.offerId)!,
      contractVersion: observation.contractVersion,
      stableKey: observation.observationId,
      observedAt: observation.observedAt,
      outcome: observation.outcome,
      unitCostState: observation.unitCost.state,
      unitCostMinor: unitCost ? dbBigInt(unitCost.amountMinor) : null,
      unitCostCurrency: unitCost?.currency ?? null,
      shippingState: observation.shipping.state,
      shippingMinor: shipping ? dbBigInt(shipping.cost.amountMinor) : null,
      shippingCurrency: shipping?.cost.currency ?? null,
      inventoryState: observation.inventory.state,
      inventoryQuantity:
        observation.inventory.state === "KNOWN" &&
        observation.inventory.quantity !== null
          ? dbBigInt(observation.inventory.quantity)
          : null,
      availability: observation.inventory.availability,
      shippingDaysMin: shipping?.minDays ?? null,
      shippingDaysMax: shipping?.maxDays ?? null,
      sourcePayloadDigest: observation.sourcePayloadDigest,
      evidenceIdsJson: canonicalizeCatalogValue(observation.evidenceIds),
      reasonCodesJson: canonicalizeCatalogValue(observation.reasonCodes),
      createdAt: observation.observedAt,
    });
  }

  return input.fixture.supplierOffers.flatMap((offer) => {
    const observations = observationsByOffer.get(offer.offerId) ?? [];
    const latestObservation = [...observations].sort(
      compareSupplierObservationRecency
    ).at(-1);
    if (!latestObservation) {
      if (offer.latestObservationId !== null) {
        input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
      }
      return [];
    }
    if (offer.latestObservationId !== latestObservation.observationId) {
      input.state.reasons.add("TEMPORAL_CONFLICT");
      return [];
    }
    const latestObservationId = observationIds.get(offer.latestObservationId);
    if (!latestObservationId) {
      input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
      return [];
    }
    return [
      {
        offerId: offerIds.get(offer.offerId)!,
        latestObservationId,
        updatedAt: maxTimestamp([
          offer.createdAt,
          ...observations.map((observation) => observation.observedAt),
        ]),
      },
    ];
  });
}

function projectionRevisionNumbers(
  projection: CatalogProjectionV2,
  values: Readonly<Record<string, number>> | undefined
): Map<string, number> | null {
  if (!values) return null;
  const expected = new Set(projection.products.map((product) => product.revisionId));
  const entries = Object.entries(values);
  if (
    entries.length !== expected.size ||
    entries.some(
      ([revisionId, value]) =>
        !expected.has(revisionId) ||
        !Number.isSafeInteger(value) ||
        value <= 0
    )
  ) {
    return null;
  }
  return new Map(entries);
}

function applicableProjectionDefinitions(
  projection: CatalogProjectionV2,
  taxonomyNodeIds: readonly string[]
): CatalogProjectionAttributeDefinitionV2[] {
  return projection.attributeDefinitions.filter((definition) =>
    definition.appliesToTaxonomyNodeIds.some((taxonomyNodeId) =>
      taxonomyNodeIds.includes(taxonomyNodeId)
    )
  );
}

function projectionDefinitionForAttribute(
  definitions: readonly CatalogProjectionAttributeDefinitionV2[],
  scope: "PRODUCT" | "VARIANT",
  key: string,
  state: BuildState
): CatalogProjectionAttributeDefinitionV2 | null {
  const matching = definitions.filter(
    (definition) => definition.scope === scope && definition.key === key
  );
  if (matching.length !== 1) {
    state.reasons.add("AMBIGUOUS_PROJECTION_ATTRIBUTE");
    return null;
  }
  return matching[0];
}

function projectionAssignment(
  definition: CatalogProjectionAttributeDefinitionV2,
  value: string | number | boolean | Array<string | number | boolean>,
  state: BuildState
): AttributeValueV2 | null {
  const values = Array.isArray(value) ? value : [value];
  const candidate = AttributeValueV2Schema.safeParse({
    attributeDefinitionId: definition.attributeDefinitionId,
    dataType: definition.dataType,
    values,
  });
  const allowedValues = new Set(
    definition.allowedValues.map((option) => option.code)
  );
  if (
    !candidate.success ||
    (definition.cardinality === "SINGLE" && values.length !== 1) ||
    (definition.dataType === "ENUM" &&
      values.some(
        (entry) => typeof entry !== "string" || !allowedValues.has(entry)
      ))
  ) {
    state.reasons.add("SCHEMA_CONSTRAINT_CONFLICT");
    return null;
  }
  return candidate.data;
}

function addProjectionDefinitionRows(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  productRevisionId: string;
  revisionPath: string;
  createdAt: string;
  definitions: readonly CatalogProjectionAttributeDefinitionV2[];
  taxonomyRowIds: Map<string, string>;
}): Map<string, string> {
  const ids = new Map<string, string>();
  for (const definition of input.definitions) {
    const id = stableId(
      "attribute-definition",
      input.storeId,
      `${input.revisionPath}/definition/${definition.attributeDefinitionId}`
    );
    ids.set(definition.attributeDefinitionId, id);
    input.rows.attributeDefinitions.push({
      id,
      storeId: input.storeId,
      productRevisionId: input.productRevisionId,
      stableKey: definition.attributeDefinitionId,
      key: definition.key,
      label: definition.label,
      valueType: definition.dataType,
      cardinality: definition.cardinality,
      scope: definition.scope,
      variantAxis: definition.variantAxis,
      storefrontVisible: true,
      unitCode: definition.unitCode,
      facetable: definition.facetable,
      comparable: definition.comparable,
      required: false,
      sortOrder: definition.position,
      createdAt: input.createdAt,
    });
    definition.allowedValues.forEach((option, index) => {
      input.rows.attributeOptions.push({
        id: stableId(
          "attribute-option",
          input.storeId,
          `${input.revisionPath}/definition/${definition.attributeDefinitionId}/option/${option.code}`
        ),
        storeId: input.storeId,
        definitionId: id,
        key: option.code,
        label: option.label,
        sortOrder: index,
        createdAt: input.createdAt,
      });
    });
    for (const taxonomyNodeId of definition.appliesToTaxonomyNodeIds) {
      input.rows.taxonomyAttributeDefinitions.push({
        storeId: input.storeId,
        taxonomyNodeId: input.taxonomyRowIds.get(taxonomyNodeId)!,
        definitionId: id,
        sortOrder: definition.position,
      });
    }
  }
  return ids;
}

function validateProjectionScalars(
  projection: CatalogProjectionV2,
  state: BuildState
): void {
  if (
    projection.taxonomy.nodes.some(
      (node) => !int32(node.depth) || !int32(node.position)
    ) ||
    projection.collections.some((collection) => !int32(collection.position)) ||
    projection.attributeDefinitions.some(
      (definition) =>
        !int32(definition.position) ||
        (definition.unitCode !== null &&
          !/^[A-Za-z0-9.%/_-]{1,24}$/.test(definition.unitCode))
    ) ||
    projection.products.some(
      (product) =>
        product.media.some(
          (media) => !int32(media.position) || !validHttps(media.publicUrl)
        )
    )
  ) {
    state.reasons.add("SCHEMA_CONSTRAINT_CONFLICT");
  }
}

function addProjectionProductRows(input: {
  rows: CatalogPersistenceRowsV2;
  storeId: string;
  projection: CatalogProjectionV2;
  revisionNumbers: Map<string, number>;
  context: ArtifactContext;
  taxonomyRowIds: Map<string, string>;
  collectionRowIds: Map<string, string>;
  state: BuildState;
}): CatalogRevisionSealUpdateV2[] {
  const sealUpdates: CatalogRevisionSealUpdateV2[] = [];

  for (const product of input.projection.products) {
    const productRowId = stableId(
      "product",
      input.storeId,
      `product/${product.productId}`
    );
    const revisionPath = `${input.context.artifactPath}/revision/${product.revisionId}`;
    const revisionRowId = stableId(
      "revision",
      input.storeId,
      revisionPath
    );
    input.rows.products.push({
      id: productRowId,
      storeId: input.storeId,
      legacyProductId: null,
      canonicalKey: product.productId,
      status: "DRAFT",
      createdAt: input.projection.generatedAt,
      updatedAt: input.projection.generatedAt,
    });

    const revisionEnvelope = {
      contractVersion: PRODUCT_REVISION_V2,
      sourceProjectionRef: input.projection.projectionRef,
      revisionNumber: input.revisionNumbers.get(product.revisionId)!,
      revisionState: "DRAFT",
      product,
      reasonCodes: ["CATALOG_PROJECTION_REQUIRES_INTERNAL_REVIEW"],
    };
    const productPrice = priceColumns(product.price, product.compareAtPrice);
    input.rows.revisions.push({
      id: revisionRowId,
      storeId: input.storeId,
      artifactId: input.context.artifactId,
      productId: productRowId,
      artifactRevisionRef: product.revisionId,
      revisionNumber: dbBigInt(input.revisionNumbers.get(product.revisionId)!),
      contractVersion: PRODUCT_REVISION_V2,
      source: "PROVIDER_PROPOSAL",
      revisionState: "DRAFT",
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      brand: product.brand,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      retailPriceState: product.price.state,
      retailPriceMinor: productPrice.retailPriceMinor,
      currency: productPrice.currency,
      compareAtPriceMinor: productPrice.compareAtPriceMinor,
      compareAtPriceCurrency: productPrice.compareAtPriceCurrency,
      availability: product.availability,
      purchasable: false,
      revisionJson: canonicalizeCatalogValue(revisionEnvelope),
      contentDigest: digestCatalogValue(revisionEnvelope),
      reasonCodesJson: canonicalizeCatalogValue(
        revisionEnvelope.reasonCodes
      ),
      createdAt: input.projection.generatedAt,
      sealedAt: null,
    });
    sealUpdates.push({
      productRevisionId: revisionRowId,
      sealedAt: input.projection.generatedAt,
    });

    product.taxonomyNodeIds.forEach((taxonomyNodeId, index) => {
      input.rows.taxonomyPlacements.push({
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        taxonomyNodeId: input.taxonomyRowIds.get(taxonomyNodeId)!,
        isPrimary: index === 0,
        sortOrder: index,
      });
    });

    const applicableDefinitions = applicableProjectionDefinitions(
      input.projection,
      product.taxonomyNodeIds
    );
    const definitionIds = addProjectionDefinitionRows({
      rows: input.rows,
      storeId: input.storeId,
      productRevisionId: revisionRowId,
      revisionPath,
      createdAt: input.projection.generatedAt,
      definitions: applicableDefinitions,
      taxonomyRowIds: input.taxonomyRowIds,
    });

    for (const attribute of product.attributes) {
      const definition = projectionDefinitionForAttribute(
        applicableDefinitions,
        "PRODUCT",
        attribute.key,
        input.state
      );
      if (!definition) continue;
      const value = projectionAssignment(definition, attribute.value, input.state);
      if (!value) continue;
      addAttributeValueRow({
        rows: input.rows,
        storeId: input.storeId,
        revisionPath,
        revisionRowId,
        variantRowId: null,
        definitionRowId: definitionIds.get(definition.attributeDefinitionId)!,
        definitionStableKey: definition.attributeDefinitionId,
        value,
        createdAt: input.projection.generatedAt,
      });
    }

    const variantRowIds = new Map<string, string>();
    for (const [index, variant] of product.variants.entries()) {
      const identityId = stableId(
        "variant-identity",
        input.storeId,
        `product/${product.productId}/variant/${variant.variantId}`
      );
      const variantRowId = stableId(
        "sellable-variant",
        input.storeId,
        `${revisionPath}/variant/${variant.variantId}`
      );
      variantRowIds.set(variant.variantId, variantRowId);
      input.rows.variantIdentities.push({
        id: identityId,
        storeId: input.storeId,
        productId: productRowId,
        stableKey: variant.variantId,
        createdAt: input.projection.generatedAt,
        updatedAt: input.projection.generatedAt,
      });
      const optionValues = Object.fromEntries(
        [...variant.attributes]
          .sort((left, right) => compareText(left.key, right.key))
          .map((attribute) => [attribute.key, attribute.value])
      );
      input.rows.variants.push({
        id: variantRowId,
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        variantIdentityId: identityId,
        stableKey: variant.variantId,
        label: variant.label,
        optionValuesJson: canonicalizeCatalogValue(optionValues),
        ...priceColumns(variant.price, variant.compareAtPrice),
        availability: variant.availability,
        isDefault: false,
        sortOrder: index,
        createdAt: input.projection.generatedAt,
      });
      for (const attribute of variant.attributes) {
        const definition = projectionDefinitionForAttribute(
          applicableDefinitions,
          "VARIANT",
          attribute.key,
          input.state
        );
        if (!definition) continue;
        const value = projectionAssignment(definition, attribute.value, input.state);
        if (!value) continue;
        addAttributeValueRow({
          rows: input.rows,
          storeId: input.storeId,
          revisionPath,
          revisionRowId,
          variantRowId,
          definitionRowId: definitionIds.get(definition.attributeDefinitionId)!,
          definitionStableKey: definition.attributeDefinitionId,
          value,
          createdAt: input.projection.generatedAt,
        });
      }
    }

    for (const [index, option] of product.purchaseOptions.entries()) {
      const variantId = option.variantId
        ? variantRowIds.get(option.variantId)
        : null;
      if (option.variantId && !variantId) {
        input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
      }
      const optionPrice = priceColumns(option.price, option.compareAtPrice);
      input.rows.purchaseOptions.push({
        id: stableId(
          "purchase-option",
          input.storeId,
          `${revisionPath}/purchase-option/${option.purchaseOptionId}`
        ),
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        stableKey: option.purchaseOptionId,
        kind: option.kind,
        label: option.label,
        quantity: dbBigInt(option.quantity),
        variantId: variantId ?? null,
        retailPriceState: option.price.state,
        retailPriceMinor: optionPrice.retailPriceMinor,
        currency: optionPrice.currency,
        compareAtPriceMinor: optionPrice.compareAtPriceMinor,
        compareAtPriceCurrency: optionPrice.compareAtPriceCurrency,
        availability: option.availability,
        repeatPurchaseState: option.repeatPurchase.state,
        repeatIntervalDaysJson: canonicalizeCatalogValue(
          option.repeatPurchase.intervalDays
        ),
        sortOrder: index,
        createdAt: input.projection.generatedAt,
      });
    }

    for (const membership of product.collections) {
      input.rows.collectionItems.push({
        collectionId: input.collectionRowIds.get(membership.collectionId)!,
        productRevisionId: revisionRowId,
        storeId: input.storeId,
        sortOrder: membership.position,
        evidenceIdsJson: "[]",
      });
    }

    const mediaRowIds = new Map<string, string>();
    for (const media of product.media) {
      const id = stableId(
        "media",
        input.storeId,
        `${revisionPath}/media/${media.mediaId}`
      );
      mediaRowIds.set(media.mediaId, id);
      input.rows.mediaAssets.push({
        id,
        storeId: input.storeId,
        productRevisionId: revisionRowId,
        stableKey: media.mediaId,
        kind: media.kind,
        role: media.role,
        publicationState: "INTERNAL_ONLY",
        sortOrder: media.position,
        publicUrl: media.publicUrl,
        mimeType: null,
        altText: media.altText,
        width: null,
        height: null,
        focalX: media.focalPoint?.x ?? null,
        focalY: media.focalPoint?.y ?? null,
        sourceKind: "UNKNOWN",
        sourceUrl: null,
        rightsStatus: "UNKNOWN",
        evidenceIdsJson: "[]",
        createdAt: input.projection.generatedAt,
      });
    }
    const mediaVariantPairs = new Set<string>();
    for (const media of product.media) {
      for (const variantId of media.variantIds) {
        mediaVariantPairs.add(`${media.mediaId}\0${variantId}`);
      }
    }
    for (const variant of product.variants) {
      for (const mediaId of variant.mediaIds) {
        mediaVariantPairs.add(`${mediaId}\0${variant.variantId}`);
      }
    }
    for (const pair of mediaVariantPairs) {
      const [mediaId, variantId] = pair.split("\0");
      const mediaRowId = mediaRowIds.get(mediaId);
      const variantRowId = variantRowIds.get(variantId);
      if (!mediaRowId || !variantRowId) {
        input.state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
        continue;
      }
      input.rows.mediaVariants.push({
        storeId: input.storeId,
        mediaId: mediaRowId,
        variantId: variantRowId,
      });
    }
  }
  return sealUpdates;
}

function hasDuplicate<T>(values: readonly T[], key: (value: T) => string): boolean {
  const seen = new Set<string>();
  for (const value of values) {
    const candidate = key(value);
    if (seen.has(candidate)) return true;
    seen.add(candidate);
  }
  return false;
}

function validateUniqueConstraints(
  rows: CatalogPersistenceRowsV2,
  updates: readonly CatalogOfferLatestObservationUpdateV2[],
  state: BuildState
): void {
  const duplicate =
    hasDuplicate(rows.artifacts, (row) => row.id) ||
    hasDuplicate(
      rows.artifacts,
      (row) =>
        `${row.storeId}\0${row.sourceKind}\0${row.sourceRef}\0${row.contentDigest}`
    ) ||
    hasDuplicate(rows.products, (row) => row.id) ||
    hasDuplicate(rows.products, (row) => `${row.storeId}\0${row.canonicalKey}`) ||
    hasDuplicate(rows.variantIdentities, (row) => row.id) ||
    hasDuplicate(
      rows.variantIdentities,
      (row) => `${row.productId}\0${row.stableKey}`
    ) ||
    hasDuplicate(rows.revisions, (row) => row.id) ||
    hasDuplicate(
      rows.revisions,
      (row) => `${row.artifactId}\0${row.productId}\0${row.revisionNumber}`
    ) ||
    hasDuplicate(
      rows.revisions,
      (row) => `${row.artifactId}\0${row.artifactRevisionRef}`
    ) ||
    hasDuplicate(rows.variants, (row) => row.id) ||
    hasDuplicate(
      rows.variants,
      (row) => `${row.productRevisionId}\0${row.stableKey}`
    ) ||
    hasDuplicate(
      rows.variants,
      (row) => `${row.productRevisionId}\0${row.variantIdentityId}`
    ) ||
    hasDuplicate(rows.taxonomyNodes, (row) => row.id) ||
    hasDuplicate(
      rows.taxonomyNodes,
      (row) => `${row.artifactId}\0${row.key}`
    ) ||
    hasDuplicate(
      rows.taxonomyNodes,
      (row) => `${row.artifactId}\0${row.pathJson}`
    ) ||
    hasDuplicate(
      rows.taxonomyPlacements,
      (row) => `${row.productRevisionId}\0${row.taxonomyNodeId}`
    ) ||
    hasDuplicate(rows.attributeDefinitions, (row) => row.id) ||
    hasDuplicate(
      rows.attributeDefinitions,
      (row) => `${row.productRevisionId}\0${row.stableKey}`
    ) ||
    hasDuplicate(
      rows.taxonomyAttributeDefinitions,
      (row) => `${row.taxonomyNodeId}\0${row.definitionId}`
    ) ||
    hasDuplicate(rows.attributeOptions, (row) => row.id) ||
    hasDuplicate(
      rows.attributeOptions,
      (row) => `${row.definitionId}\0${row.key}`
    ) ||
    hasDuplicate(rows.attributeValues, (row) => row.id) ||
    hasDuplicate(
      rows.attributeValues,
      (row) =>
        `${row.productRevisionId}\0${row.assignmentScopeKey}\0${row.definitionId}`
    ) ||
    hasDuplicate(rows.collections, (row) => row.id) ||
    hasDuplicate(
      rows.collections,
      (row) => `${row.artifactId}\0${row.stableKey}`
    ) ||
    hasDuplicate(
      rows.collections,
      (row) => `${row.artifactId}\0${row.slug}`
    ) ||
    hasDuplicate(
      rows.collectionItems,
      (row) => `${row.collectionId}\0${row.productRevisionId}`
    ) ||
    hasDuplicate(rows.mediaAssets, (row) => row.id) ||
    hasDuplicate(
      rows.mediaAssets,
      (row) => `${row.productRevisionId}\0${row.stableKey}`
    ) ||
    hasDuplicate(
      rows.mediaVariants,
      (row) => `${row.mediaId}\0${row.variantId}`
    ) ||
    hasDuplicate(rows.purchaseOptions, (row) => row.id) ||
    hasDuplicate(
      rows.purchaseOptions,
      (row) => `${row.productRevisionId}\0${row.stableKey}`
    ) ||
    hasDuplicate(rows.evidence, (row) => row.id) ||
    hasDuplicate(
      rows.evidence,
      (row) => `${row.productRevisionId}\0${row.stableKey}`
    ) ||
    hasDuplicate(rows.supplierOffers, (row) => row.id) ||
    hasDuplicate(
      rows.supplierOffers,
      (row) => `${row.storeId}\0${row.stableKey}`
    ) ||
    hasDuplicate(rows.supplierObservations, (row) => row.id) ||
    hasDuplicate(
      rows.supplierObservations,
      (row) => `${row.storeId}\0${row.stableKey}`
    ) ||
    hasDuplicate(updates, (row) => row.latestObservationId);
  if (duplicate) state.reasons.add("PERSISTENCE_UNIQUE_CONFLICT");

  const primaryCounts = new Map<string, number>();
  for (const placement of rows.taxonomyPlacements) {
    if (!placement.isPrimary) continue;
    primaryCounts.set(
      placement.productRevisionId,
      (primaryCounts.get(placement.productRevisionId) ?? 0) + 1
    );
  }
  if ([...primaryCounts.values()].some((count) => count > 1)) {
    state.reasons.add("PERSISTENCE_UNIQUE_CONFLICT");
  }
  const publicPrimaryCounts = new Map<string, number>();
  for (const media of rows.mediaAssets) {
    if (media.role !== "PRIMARY" || media.publicationState !== "PUBLIC_READY") {
      continue;
    }
    publicPrimaryCounts.set(
      media.productRevisionId,
      (publicPrimaryCounts.get(media.productRevisionId) ?? 0) + 1
    );
  }
  if ([...publicPrimaryCounts.values()].some((count) => count > 1)) {
    state.reasons.add("PERSISTENCE_UNIQUE_CONFLICT");
  }
}

function validateRelations(
  rows: CatalogPersistenceRowsV2,
  updates: readonly CatalogOfferLatestObservationUpdateV2[],
  seals: readonly CatalogRevisionSealUpdateV2[],
  state: BuildState
): void {
  const artifacts = new Set(rows.artifacts.map((row) => row.id));
  const products = new Set(rows.products.map((row) => row.id));
  const identities = new Map(
    rows.variantIdentities.map((row) => [row.id, row.productId])
  );
  const revisions = new Map(rows.revisions.map((row) => [row.id, row]));
  const variants = new Map(rows.variants.map((row) => [row.id, row]));
  const taxonomy = new Map(rows.taxonomyNodes.map((row) => [row.id, row]));
  const definitions = new Map(
    rows.attributeDefinitions.map((row) => [row.id, row])
  );
  const collections = new Map(rows.collections.map((row) => [row.id, row]));
  const media = new Map(rows.mediaAssets.map((row) => [row.id, row]));
  const offers = new Map(rows.supplierOffers.map((row) => [row.id, row]));
  const observations = new Map(
    rows.supplierObservations.map((row) => [row.id, row])
  );
  const invalid =
    rows.revisions.some(
      (row) => !artifacts.has(row.artifactId) || !products.has(row.productId)
    ) ||
    rows.variantIdentities.some((row) => !products.has(row.productId)) ||
    rows.variants.some((row) => {
      const revision = revisions.get(row.productRevisionId);
      return (
        !revision ||
        identities.get(row.variantIdentityId) !== revision.productId ||
        !rows.variantIdentities.some(
          (identity) =>
            identity.id === row.variantIdentityId &&
            identity.stableKey === row.stableKey
        )
      );
    }) ||
    rows.taxonomyNodes.some(
      (row) =>
        !artifacts.has(row.artifactId) ||
        (row.parentId !== null &&
          taxonomy.get(row.parentId)?.artifactId !== row.artifactId)
    ) ||
    rows.taxonomyPlacements.some((row) => {
      const revision = revisions.get(row.productRevisionId);
      const node = taxonomy.get(row.taxonomyNodeId);
      return !revision || !node || revision.artifactId !== node.artifactId;
    }) ||
    rows.attributeDefinitions.some(
      (row) => !revisions.has(row.productRevisionId)
    ) ||
    rows.attributeOptions.some((row) => !definitions.has(row.definitionId)) ||
    rows.taxonomyAttributeDefinitions.some((row) => {
      const node = taxonomy.get(row.taxonomyNodeId);
      const definition = definitions.get(row.definitionId);
      const revision = definition
        ? revisions.get(definition.productRevisionId)
        : undefined;
      return !node || !revision || node.artifactId !== revision.artifactId;
    }) ||
    rows.attributeValues.some((row) => {
      const definition = definitions.get(row.definitionId);
      const variant = row.variantId ? variants.get(row.variantId) : null;
      return (
        !definition ||
        definition.productRevisionId !== row.productRevisionId ||
        row.assignmentScopeKey !== (row.variantId ?? "PRODUCT") ||
        (definition.scope === "PRODUCT" && row.variantId !== null) ||
        (definition.scope === "VARIANT" && row.variantId === null) ||
        (variant !== null && variant?.productRevisionId !== row.productRevisionId)
      );
    }) ||
    rows.collections.some((row) => !artifacts.has(row.artifactId)) ||
    rows.collectionItems.some((row) => {
      const collection = collections.get(row.collectionId);
      const revision = revisions.get(row.productRevisionId);
      return (
        !collection ||
        !revision ||
        collection.artifactId !== revision.artifactId
      );
    }) ||
    rows.mediaAssets.some((row) => !revisions.has(row.productRevisionId)) ||
    rows.mediaVariants.some((row) => {
      const mediaRow = media.get(row.mediaId);
      const variant = variants.get(row.variantId);
      return (
        !mediaRow ||
        !variant ||
        mediaRow.productRevisionId !== variant.productRevisionId
      );
    }) ||
    rows.purchaseOptions.some((row) => {
      const variant = row.variantId ? variants.get(row.variantId) : null;
      return (
        !revisions.has(row.productRevisionId) ||
        (variant !== null && variant?.productRevisionId !== row.productRevisionId)
      );
    }) ||
    rows.evidence.some((row) => !revisions.has(row.productRevisionId)) ||
    rows.supplierOffers.some(
      (row) =>
        !products.has(row.productId) ||
        (row.variantIdentityId !== null &&
          identities.get(row.variantIdentityId) !== row.productId)
    ) ||
    rows.supplierObservations.some((row) => !offers.has(row.offerId)) ||
    updates.some((update) => {
      const observation = observations.get(update.latestObservationId);
      return !offers.has(update.offerId) || observation?.offerId !== update.offerId;
    }) ||
    seals.length !== rows.revisions.length ||
    seals.some((seal) => {
      const revision = revisions.get(seal.productRevisionId);
      return (
        !revision || Date.parse(seal.sealedAt) < Date.parse(revision.createdAt)
      );
    });
  if (invalid) state.reasons.add("PERSISTENCE_RELATION_CONFLICT");
}

function invalidPriceColumns(
  stateValue: NullablePriceState,
  minor: CatalogDbBigIntV2 | null,
  currency: string | null,
  compareMinor: CatalogDbBigIntV2 | null,
  compareCurrency: string | null
): boolean {
  if (stateValue === null || stateValue === "UNKNOWN") {
    return (
      minor !== null ||
      currency !== null ||
      compareMinor !== null ||
      compareCurrency !== null
    );
  }
  return minor === null || currency === null;
}

function validateUnknownSemantics(
  rows: CatalogPersistenceRowsV2,
  state: BuildState
): void {
  const invalid =
    rows.revisions.some(
      (row) =>
        invalidPriceColumns(
          row.retailPriceState,
          row.retailPriceMinor,
          row.currency,
          row.compareAtPriceMinor,
          row.compareAtPriceCurrency
        ) ||
        (row.purchasable &&
          (row.retailPriceState !== "KNOWN" ||
            !isImmediatelyPurchasableV2(row.availability)))
    ) ||
    rows.variants.some((row) =>
      invalidPriceColumns(
        row.retailPriceState,
        row.retailPriceMinor,
        row.currency,
        row.compareAtPriceMinor,
        row.compareAtPriceCurrency
      )
    ) ||
    rows.purchaseOptions.some((row) =>
      invalidPriceColumns(
        row.retailPriceState,
        row.retailPriceMinor,
        row.currency,
        row.compareAtPriceMinor,
        row.compareAtPriceCurrency
      )
    ) ||
    rows.supplierObservations.some((row) => {
      const unknownCost =
        row.unitCostState === "UNKNOWN" &&
        (row.unitCostMinor !== null || row.unitCostCurrency !== null);
      const unknownShipping =
        row.shippingState === "UNKNOWN" &&
        (row.shippingMinor !== null ||
          row.shippingCurrency !== null ||
          row.shippingDaysMin !== null ||
          row.shippingDaysMax !== null);
      const unknownInventory =
        row.inventoryState === "UNKNOWN" &&
        (row.inventoryQuantity !== null || row.availability !== "UNKNOWN");
      const failedWithFacts =
        row.outcome !== "OBSERVED" &&
        (row.unitCostState !== "UNKNOWN" ||
          row.shippingState !== "UNKNOWN" ||
          row.inventoryState !== "UNKNOWN" ||
          row.availability !== "UNKNOWN");
      return unknownCost || unknownShipping || unknownInventory || failedWithFacts;
    }) ||
    rows.mediaAssets.some(
      (row) =>
        (row.rightsStatus === "UNKNOWN" && row.sourceKind !== "UNKNOWN") ||
        (row.publicationState === "PUBLIC_READY" &&
          (row.rightsStatus !== "VERIFIED" || row.publicUrl === null))
    );
  if (invalid) state.reasons.add("INVALID_UNKNOWN_SEMANTICS");
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function validateSerializedLimits(
  rows: CatalogPersistenceRowsV2,
  state: BuildState
): void {
  const invalid =
    rows.artifacts.some((row) => utf8Length(row.artifactJson) > 8_388_608) ||
    rows.revisions.some(
      (row) =>
        utf8Length(row.revisionJson) > 768_000 ||
        utf8Length(row.reasonCodesJson) > 128_000
    ) ||
    rows.variants.some((row) => utf8Length(row.optionValuesJson) > 64_000) ||
    rows.attributeValues.some(
      (row) =>
        utf8Length(row.valuesJson) > 64_000 ||
        utf8Length(row.normalizedValuesJson) > 64_000
    ) ||
    rows.collectionItems.some(
      (row) => utf8Length(row.evidenceIdsJson) > 128_000
    ) ||
    rows.mediaAssets.some(
      (row) => utf8Length(row.evidenceIdsJson) > 128_000
    ) ||
    rows.purchaseOptions.some(
      (row) => utf8Length(row.repeatIntervalDaysJson) > 16_000
    ) ||
    rows.evidence.some((row) => utf8Length(row.notesJson) > 128_000) ||
    rows.supplierOffers.some(
      (row) => utf8Length(row.evidenceIdsJson) > 128_000
    ) ||
    rows.supplierObservations.some(
      (row) =>
        utf8Length(row.evidenceIdsJson) > 128_000 ||
        utf8Length(row.reasonCodesJson) > 128_000
    );
  if (invalid) state.reasons.add("SCHEMA_CONSTRAINT_CONFLICT");
}

function sortRows(rows: CatalogPersistenceRowsV2): void {
  rows.artifacts.sort((left, right) => compareText(left.id, right.id));
  rows.products.sort((left, right) => compareText(left.id, right.id));
  rows.variantIdentities.sort((left, right) => compareText(left.id, right.id));
  rows.revisions.sort((left, right) => compareText(left.id, right.id));
  rows.variants.sort((left, right) => compareText(left.id, right.id));
  rows.taxonomyNodes.sort((left, right) => {
    if (left.depth !== right.depth) return left.depth - right.depth;
    return compareText(left.id, right.id);
  });
  rows.taxonomyPlacements.sort((left, right) =>
    compareText(
      `${left.productRevisionId}\0${String(left.sortOrder).padStart(12, "0")}\0${left.taxonomyNodeId}`,
      `${right.productRevisionId}\0${String(right.sortOrder).padStart(12, "0")}\0${right.taxonomyNodeId}`
    )
  );
  rows.attributeDefinitions.sort((left, right) =>
    compareText(left.id, right.id)
  );
  rows.taxonomyAttributeDefinitions.sort((left, right) =>
    compareText(
      `${left.taxonomyNodeId}\0${left.definitionId}`,
      `${right.taxonomyNodeId}\0${right.definitionId}`
    )
  );
  rows.attributeOptions.sort((left, right) => compareText(left.id, right.id));
  rows.attributeValues.sort((left, right) => compareText(left.id, right.id));
  rows.collections.sort((left, right) => compareText(left.id, right.id));
  rows.collectionItems.sort((left, right) =>
    compareText(
      `${left.collectionId}\0${left.productRevisionId}`,
      `${right.collectionId}\0${right.productRevisionId}`
    )
  );
  rows.mediaAssets.sort((left, right) => compareText(left.id, right.id));
  rows.mediaVariants.sort((left, right) =>
    compareText(
      `${left.mediaId}\0${left.variantId}`,
      `${right.mediaId}\0${right.variantId}`
    )
  );
  rows.purchaseOptions.sort((left, right) => compareText(left.id, right.id));
  rows.evidence.sort((left, right) => compareText(left.id, right.id));
  rows.supplierOffers.sort((left, right) => compareText(left.id, right.id));
  rows.supplierObservations.sort((left, right) =>
    compareText(left.id, right.id)
  );
}

function finalizePlan(input: {
  storeId: string;
  rows: CatalogPersistenceRowsV2;
  sourceKind: CatalogArtifactRowV2["sourceKind"];
  sourceRef: string;
  sourceDigest: string;
  offerUpdates: CatalogOfferLatestObservationUpdateV2[];
  sealUpdates: CatalogRevisionSealUpdateV2[];
  state: BuildState;
}): CatalogPersistenceBuildResultV2 {
  sortRows(input.rows);
  input.offerUpdates.sort((left, right) => compareText(left.offerId, right.offerId));
  input.sealUpdates.sort((left, right) =>
    compareText(left.productRevisionId, right.productRevisionId)
  );
  validateUniqueConstraints(input.rows, input.offerUpdates, input.state);
  validateRelations(
    input.rows,
    input.offerUpdates,
    input.sealUpdates,
    input.state
  );
  validateUnknownSemantics(input.rows, input.state);
  validateSerializedLimits(input.rows, input.state);
  if (input.state.reasons.size > 0) {
    return {
      status: "REFUSED",
      plan: null,
      reasonCodes: [...input.state.reasons].sort(compareText),
    };
  }
  const content: Omit<CatalogPersistencePlanV2, "planRef"> = {
    version: CATALOG_PERSISTENCE_PLAN_V2,
    storeId: input.storeId,
    sourceArtifact: {
      kind: input.sourceKind,
      ref: input.sourceRef,
      digest: input.sourceDigest,
    },
    rows: input.rows,
    offerLatestObservationUpdates: input.offerUpdates,
    revisionSealUpdates: input.sealUpdates,
  };
  return {
    status: "READY",
    plan: {
      ...content,
      planRef: `cv2:plan:${digestCatalogValue(content)}`,
    },
    reasonCodes: [],
  };
}

export function buildCatalogFixturePersistencePlanV2(input: {
  storeId: string;
  fixture: unknown;
}): CatalogPersistenceBuildResultV2 {
  const parsedStoreId = storeIdSchema.safeParse(input.storeId);
  if (!parsedStoreId.success) {
    return { status: "REFUSED", plan: null, reasonCodes: ["INVALID_STORE_ID"] };
  }
  const parsedFixture = CatalogReferenceFixtureV2Schema.safeParse(input.fixture);
  if (!parsedFixture.success) {
    return {
      status: "REFUSED",
      plan: null,
      reasonCodes: ["INVALID_REFERENCE_FIXTURE"],
    };
  }
  const storeId = parsedStoreId.data;
  const fixture = parsedFixture.data;
  const rows = emptyRows();
  const state: BuildState = { reasons: new Set() };
  validateSchemaScalars(fixture, state);
  const context = fixtureArtifactContext(rows, storeId, fixture);
  const taxonomyRowIds = addTaxonomyRows(
    rows,
    storeId,
    context,
    fixture.taxonomy.nodes
  );
  const collectionRowIds = addFixtureCollections(
    rows,
    storeId,
    context,
    fixture
  );
  const identities = addFixtureProductsAndIdentities(rows, storeId, fixture);
  const revisions = addFixtureRevisionRows({
    rows,
    storeId,
    fixture,
    context,
    productIds: identities.productIds,
    variantIdentityIds: identities.variantIdentityIds,
    taxonomyRowIds,
    collectionRowIds,
    state,
  });
  const offerUpdates = addFixtureSupplierRows({
    rows,
    storeId,
    fixture,
    productIds: identities.productIds,
    variantIdentityIds: identities.variantIdentityIds,
    state,
  });
  return finalizePlan({
    storeId,
    rows,
    sourceKind: "REFERENCE_FIXTURE",
    sourceRef: fixture.fixtureId,
    sourceDigest: rows.artifacts[0].contentDigest,
    offerUpdates,
    sealUpdates: revisions.sealUpdates,
    state,
  });
}

export function buildCatalogProjectionPersistencePlanV2(input: {
  storeId: string;
  projection: unknown;
  revisionNumbers?: Readonly<Record<string, number>>;
}): CatalogPersistenceBuildResultV2 {
  const parsedStoreId = storeIdSchema.safeParse(input.storeId);
  if (!parsedStoreId.success) {
    return { status: "REFUSED", plan: null, reasonCodes: ["INVALID_STORE_ID"] };
  }
  const parsedProjection = CatalogProjectionV2Schema.safeParse(input.projection);
  if (!parsedProjection.success) {
    return {
      status: "REFUSED",
      plan: null,
      reasonCodes: ["INVALID_CATALOG_PROJECTION"],
    };
  }
  const projection = parsedProjection.data;
  const revisionNumbers = projectionRevisionNumbers(
    projection,
    input.revisionNumbers
  );
  if (!revisionNumbers) {
    return {
      status: "REFUSED",
      plan: null,
      reasonCodes: ["PROJECTION_REVISION_NUMBERS_REQUIRED"],
    };
  }
  const storeId = parsedStoreId.data;
  const rows = emptyRows();
  const state: BuildState = { reasons: new Set() };
  validateProjectionScalars(projection, state);
  const context = projectionArtifactContext(rows, storeId, projection);
  const taxonomyRowIds = addTaxonomyRows(
    rows,
    storeId,
    context,
    projection.taxonomy.nodes
  );
  const collectionRowIds = addProjectionCollections(
    rows,
    storeId,
    context,
    projection
  );
  const sealUpdates = addProjectionProductRows({
    rows,
    storeId,
    projection,
    revisionNumbers,
    context,
    taxonomyRowIds,
    collectionRowIds,
    state,
  });
  return finalizePlan({
    storeId,
    rows,
    sourceKind: "CATALOG_PROJECTION",
    sourceRef: projection.projectionRef,
    sourceDigest: rows.artifacts[0].contentDigest,
    offerUpdates: [],
    sealUpdates,
    state,
  });
}

export function isCatalogPersistencePlanIntactV2(
  plan: CatalogPersistencePlanV2
): boolean {
  const { planRef, ...content } = plan;
  return planRef === `cv2:plan:${digestCatalogValue(content)}`;
}

export const CATALOG_PERSISTENCE_INSERT_ORDER_V2 = [
  "CatalogArtifactV2",
  "CatalogProductV2",
  "CatalogVariantIdentityV2",
  "CatalogTaxonomyNodeV2",
  "CatalogCollectionV2",
  "CatalogProductRevisionV2",
  "CatalogSellableVariantV2",
  "CatalogProductTaxonomyPlacementV2",
  "CatalogAttributeDefinitionV2",
  "CatalogAttributeOptionV2",
  "CatalogTaxonomyAttributeDefinitionV2",
  "CatalogProductAttributeValueV2",
  "CatalogCollectionItemV2",
  "CatalogMediaAssetV2",
  "CatalogMediaVariantV2",
  "CatalogPurchaseOptionV2",
  "CatalogEvidenceV2",
  "CatalogSupplierOfferV2",
  "CatalogSupplierOfferObservationV2",
] as const;

export type CatalogPersistenceModelV2 =
  (typeof CATALOG_PERSISTENCE_INSERT_ORDER_V2)[number];

const rowsByModel: Record<
  CatalogPersistenceModelV2,
  keyof CatalogPersistenceRowsV2
> = {
  CatalogArtifactV2: "artifacts",
  CatalogProductV2: "products",
  CatalogVariantIdentityV2: "variantIdentities",
  CatalogTaxonomyNodeV2: "taxonomyNodes",
  CatalogCollectionV2: "collections",
  CatalogProductRevisionV2: "revisions",
  CatalogSellableVariantV2: "variants",
  CatalogProductTaxonomyPlacementV2: "taxonomyPlacements",
  CatalogAttributeDefinitionV2: "attributeDefinitions",
  CatalogAttributeOptionV2: "attributeOptions",
  CatalogTaxonomyAttributeDefinitionV2: "taxonomyAttributeDefinitions",
  CatalogProductAttributeValueV2: "attributeValues",
  CatalogCollectionItemV2: "collectionItems",
  CatalogMediaAssetV2: "mediaAssets",
  CatalogMediaVariantV2: "mediaVariants",
  CatalogPurchaseOptionV2: "purchaseOptions",
  CatalogEvidenceV2: "evidence",
  CatalogSupplierOfferV2: "supplierOffers",
  CatalogSupplierOfferObservationV2: "supplierObservations",
};

export type CatalogPersistenceOperationV2 =
  | {
      kind: "ENSURE_ROWS";
      model: CatalogPersistenceModelV2;
      rows: readonly unknown[];
      mutableColumns: readonly string[];
    }
  | ({ kind: "SET_LATEST_OBSERVATION" } & CatalogOfferLatestObservationUpdateV2)
  | ({ kind: "SEAL_REVISION" } & CatalogRevisionSealUpdateV2);

export function catalogPersistenceOperationsV2(
  plan: CatalogPersistencePlanV2
): CatalogPersistenceOperationV2[] {
  if (!isCatalogPersistencePlanIntactV2(plan)) {
    throw new Error("INVALID_CATALOG_PERSISTENCE_PLAN");
  }
  const inserts: CatalogPersistenceOperationV2[] =
    CATALOG_PERSISTENCE_INSERT_ORDER_V2.flatMap((model) => {
      const rows = plan.rows[rowsByModel[model]];
      if (rows.length === 0) return [];
      const mutableColumns =
        model === "CatalogProductRevisionV2"
          ? ["sealedAt"]
          : model === "CatalogSupplierOfferV2"
            ? ["latestObservationId", "updatedAt"]
            : [];
      return [{ kind: "ENSURE_ROWS", model, rows, mutableColumns }];
    });
  return [
    ...inserts,
    ...plan.offerLatestObservationUpdates.map((update) => ({
      kind: "SET_LATEST_OBSERVATION" as const,
      ...update,
    })),
    ...plan.revisionSealUpdates.map((update) => ({
      kind: "SEAL_REVISION" as const,
      ...update,
    })),
  ];
}

/**
 * ENSURE_ROWS must insert absent rows, accept byte-equivalent existing rows
 * (excluding declared mutableColumns), and reject conflicting rows. Pointer
 * and seal operations must likewise be idempotent or reject conflicts.
 */
export interface CatalogPersistenceTransactionV2 {
  execute(operation: CatalogPersistenceOperationV2): Promise<void>;
}

export interface CatalogPersistenceRepositoryV2 {
  transaction<T>(
    work: (transaction: CatalogPersistenceTransactionV2) => Promise<T>
  ): Promise<T>;
}

/** Executes one intact plan in exactly one caller-provided transaction. */
export async function executeCatalogPersistencePlanV2(
  repository: CatalogPersistenceRepositoryV2,
  plan: CatalogPersistencePlanV2
): Promise<void> {
  const operations = catalogPersistenceOperationsV2(plan);
  await repository.transaction(async (transaction) => {
    for (const operation of operations) {
      await transaction.execute(operation);
    }
  });
}
