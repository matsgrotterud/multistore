import {
  apparelCatalogFixtureV2,
  buildCatalogProjectionV2,
  consumableCatalogFixtureV2,
  digestCatalogValue,
  droneCatalogFixtureV2,
  type CatalogReferenceFixtureV2,
} from "@/lib/catalog-v2";
import { diffStoreRevisionV2, type StoreRevisionDiffV2 } from "@/lib/revision-diff-v2";
import {
  catalogProjectionToStoreExperienceV2,
  proposeStoreExperienceV2,
  StoreExperienceRenderDocumentV2Schema,
  STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
  validateStoreExperienceManifestV2,
  type StoreExperienceCatalogProjectionV2,
  type StoreExperienceManifestV2,
  type StoreExperienceRenderDocumentV2,
} from "@/lib/storefront-v2";

export const REFERENCE_STORE_FACTORY_V2 = "reference-store-factory.v2" as const;

export const referenceStoreFixtureKeysV2 = [
  "drones",
  "apparel",
  "consumables",
] as const;

export type ReferenceStoreFixtureKeyV2 =
  (typeof referenceStoreFixtureKeysV2)[number];

export interface ReferenceStoreBuildEventV2 {
  sequence: number;
  phase:
    | "BRIEF_VALIDATED"
    | "CATALOG_PROJECTED"
    | "EXPERIENCE_PROPOSED"
    | "DETERMINISTIC_QA"
    | "DRAFT_REVISION_CREATED";
  status: "COMPLETED";
  detail: string;
  contractVersion: string;
}

export interface ReferenceStoreRevisionV2 {
  id: string;
  revisionNumber: number;
  status: "APPROVED" | "DRAFT";
  label: string;
  createdAt: string;
  catalogDigest: string;
  manifestDigest: string;
  manifest: StoreExperienceManifestV2;
  renderDocument: StoreExperienceRenderDocumentV2;
  synthetic: true;
  persisted: false;
}

export interface ReferenceStoreFactoryFixtureV2 {
  version: typeof REFERENCE_STORE_FACTORY_V2;
  key: ReferenceStoreFixtureKeyV2;
  label: string;
  storeName: string;
  niche: string;
  summary: string;
  expectedProductCount: number;
  catalog: StoreExperienceCatalogProjectionV2;
  proposalId: string;
  revisions: readonly [ReferenceStoreRevisionV2, ReferenceStoreRevisionV2];
  activeReferenceRevisionId: string;
  selectedRevisionId: string;
  diff: StoreRevisionDiffV2;
  buildTimeline: readonly ReferenceStoreBuildEventV2[];
  guardrails: readonly string[];
}

interface ReferenceFixtureDefinitionV2 {
  key: ReferenceStoreFixtureKeyV2;
  fixture: CatalogReferenceFixtureV2;
  label: string;
  storeName: string;
  niche: string;
  summary: string;
  expectedProductCount: number;
}

const FIXTURE_DEFINITIONS: readonly ReferenceFixtureDefinitionV2[] = [
  {
    key: "drones",
    fixture: droneCatalogFixtureV2,
    label: "Drone store",
    storeName: "Flight Atlas",
    niche: "Camera drones",
    summary:
      "Specification-led catalog with range, flight time, camera and safety facets.",
    expectedProductCount: 10,
  },
  {
    key: "apparel",
    fixture: apparelCatalogFixtureV2,
    label: "Apparel store",
    storeName: "Field & Form",
    niche: "Trail footwear and outerwear",
    summary:
      "Editorial apparel catalog with size, color and variant-specific imagery.",
    expectedProductCount: 4,
  },
  {
    key: "consumables",
    fixture: consumableCatalogFixtureV2,
    label: "Consumables store",
    storeName: "North Roast",
    niche: "Whole-bean coffee",
    summary:
      "Repeat-purchase catalog with bundles and explicit out-of-stock states.",
    expectedProductCount: 4,
  },
] as const;

const REFERENCE_TIME = "2026-09-03T09:00:00.000Z";

function cloneManifest(
  manifest: StoreExperienceManifestV2
): StoreExperienceManifestV2 {
  return structuredClone(manifest);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}

function safeReferenceText(value: string, max: number): string {
  const normalized = value
    .replace(/[<>{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = normalized || "Catalog";
  return fallback.length <= max ? fallback : fallback.slice(0, max).trimEnd();
}

function buildReferenceBrief(
  definition: ReferenceFixtureDefinitionV2,
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceRenderDocumentV2["brief"] {
  const currencies = new Set(
    catalog.products.flatMap((product) =>
      product.price.state === "KNOWN" ? [product.price.money.currency] : []
    )
  );
  return {
    version: "store-brief.v1",
    name: definition.storeName,
    niche: definition.niche,
    audience: "Shoppers comparing the current reviewed product catalog",
    positioning: "Evidence-led selection with explicit availability",
    valueProposition:
      "A clear catalog experience built from normalized product facts",
    brandVoice: "Clear, useful and measured",
    locale: "en-US",
    currency: currencies.size === 1 ? [...currencies][0] : "NOK",
  };
}

function buildReferenceContentProposal(
  brief: StoreExperienceRenderDocumentV2["brief"],
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceRenderDocumentV2["contentProposal"] {
  const storeName = safeReferenceText(brief.name, 50);
  const niche = safeReferenceText(brief.niche, 80);
  return {
    version: "store-content-proposal.v1",
    catalogProjectionRef: catalog.projectionRef,
    homepage: {
      headline: safeReferenceText(`${storeName} catalog`, 140),
      introduction: safeReferenceText(
        `Explore ${niche} with normalized specifications, options and explicit availability.`,
        600
      ),
      seoTitle: safeReferenceText(`${storeName} | ${niche}`, 70),
      seoDescription: safeReferenceText(
        `Review ${niche} using structured product information and current catalog availability.`,
        180
      ),
    },
    taxonomy: catalog.categories.map((category) => ({
      taxonomyNodeId: category.categoryId,
      title: safeReferenceText(category.title, 160),
      introduction: safeReferenceText(
        category.description ??
          `Explore products organized under ${category.title}.`,
        800
      ),
    })),
    products: catalog.products.map((product) => ({
      productId: product.productId,
      headline: safeReferenceText(product.title, 160),
      summary: safeReferenceText(product.subtitle ?? product.description, 800),
    })),
    guides: [],
  };
}

function buildReferenceRenderDocument(input: {
  revisionId: string;
  brief: StoreExperienceRenderDocumentV2["brief"];
  catalog: StoreExperienceCatalogProjectionV2;
  manifest: StoreExperienceManifestV2;
  contentProposal: StoreExperienceRenderDocumentV2["contentProposal"];
}): StoreExperienceRenderDocumentV2 {
  return StoreExperienceRenderDocumentV2Schema.parse({
    version: STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
    revisionId: input.revisionId,
    brief: input.brief,
    catalog: input.catalog,
    manifest: input.manifest,
    contentProposal: input.contentProposal,
    artifactDigests: {
      catalog: digestCatalogValue(input.catalog),
      manifest: digestCatalogValue(input.manifest),
      contentProposal: digestCatalogValue(input.contentProposal),
    },
    activation: {
      scope: "PREVIEW_ONLY",
      liveAuthorized: false,
      indexingAuthorized: false,
    },
  });
}

function buildCatalogProjection(
  definition: ReferenceFixtureDefinitionV2
): StoreExperienceCatalogProjectionV2 {
  const projected = buildCatalogProjectionV2(definition.fixture);
  if (projected.status === "REFUSED") {
    throw new Error(
      `Reference fixture ${definition.key} cannot be projected: ${projected.reasonCodes.join(",")}`
    );
  }
  if (projected.projection.products.length !== definition.expectedProductCount) {
    throw new Error(
      `Reference fixture ${definition.key} expected ${definition.expectedProductCount} projected products, received ${projected.projection.products.length}`
    );
  }
  return catalogProjectionToStoreExperienceV2({
    catalog: projected.projection,
    store: {
      name: definition.storeName,
      niche: definition.niche,
    },
    // Synthetic fixture data cannot independently prove operational claims.
    verifiedClaims: [],
  });
}

function makeBaselineManifest(
  current: StoreExperienceManifestV2,
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceManifestV2 {
  const baseline = cloneManifest(current);
  baseline.designTokens.spacing = {
    density:
      current.designTokens.spacing.density === "compact"
        ? "comfortable"
        : "compact",
    sectionGap:
      current.designTokens.spacing.sectionGap === "small" ? "medium" : "small",
    contentWidth: current.designTokens.spacing.contentWidth,
  };
  baseline.designTokens.shape.cardStyle =
    current.designTokens.shape.cardStyle === "bordered" ? "flat" : "bordered";
  baseline.chrome.header.variant =
    current.chrome.header.variant === "compact" ? "standard" : "compact";

  const validation = validateStoreExperienceManifestV2(baseline, catalog);
  if (!validation.success) {
    throw new Error(
      `Reference baseline manifest failed validation: ${validation.issues
        .map((issue) => `${issue.code}@${issue.path}`)
        .join(",")}`
    );
  }
  return validation.manifest;
}

function buildReferenceFixture(
  definition: ReferenceFixtureDefinitionV2
): ReferenceStoreFactoryFixtureV2 {
  const catalog = buildCatalogProjection(definition);
  const proposal = proposeStoreExperienceV2(catalog);
  if (proposal.status !== "PROPOSED") {
    const validationIssues = proposal.validation?.issues
      .map((issue) => `${issue.code}@${issue.path}`)
      .join(",");
    throw new Error(
      `Reference experience ${definition.key} was refused: ${proposal.reasonCodes.join(
        ","
      )}${validationIssues ? ` (${validationIssues})` : ""}`
    );
  }

  const currentValidation = validateStoreExperienceManifestV2(
    proposal.manifest,
    catalog
  );
  if (!currentValidation.success) {
    throw new Error(`Validated proposal became invalid for ${definition.key}`);
  }

  const currentManifest = currentValidation.manifest;
  const baselineManifest = makeBaselineManifest(currentManifest, catalog);
  const brief = buildReferenceBrief(definition, catalog);
  const contentProposal = buildReferenceContentProposal(brief, catalog);
  const catalogDigest = digestCatalogValue(catalog);
  const baselineDigest = digestCatalogValue(baselineManifest);
  const currentDigest = digestCatalogValue(currentManifest);
  const baselineRevisionId = `reference-${definition.key}-revision-${baselineDigest.slice(-12)}`;
  const currentRevisionId = `reference-${definition.key}-revision-${currentDigest.slice(-12)}`;
  const baselineRenderDocument = buildReferenceRenderDocument({
    revisionId: baselineRevisionId,
    brief,
    catalog,
    manifest: baselineManifest,
    contentProposal,
  });
  const currentRenderDocument = buildReferenceRenderDocument({
    revisionId: currentRevisionId,
    brief,
    catalog,
    manifest: currentManifest,
    contentProposal,
  });
  const baselineRevision: ReferenceStoreRevisionV2 = {
    id: baselineRevisionId,
    revisionNumber: 1,
    status: "APPROVED",
    label: "Approved reference baseline",
    createdAt: REFERENCE_TIME,
    catalogDigest,
    manifestDigest: baselineDigest,
    manifest: baselineRenderDocument.manifest,
    renderDocument: baselineRenderDocument,
    synthetic: true,
    persisted: false,
  };
  const currentRevision: ReferenceStoreRevisionV2 = {
    id: currentRevisionId,
    revisionNumber: 2,
    status: "DRAFT",
    label: "Current deterministic proposal",
    createdAt: "2026-09-03T09:00:01.000Z",
    catalogDigest,
    manifestDigest: currentDigest,
    manifest: currentRenderDocument.manifest,
    renderDocument: currentRenderDocument,
    synthetic: true,
    persisted: false,
  };
  const revisions = deepFreeze(
    [baselineRevision, currentRevision] as [
      ReferenceStoreRevisionV2,
      ReferenceStoreRevisionV2,
    ]
  );

  return deepFreeze({
    version: REFERENCE_STORE_FACTORY_V2,
    key: definition.key,
    label: definition.label,
    storeName: definition.storeName,
    niche: definition.niche,
    summary: definition.summary,
    expectedProductCount: definition.expectedProductCount,
    catalog: currentRenderDocument.catalog,
    proposalId: proposal.proposalId,
    revisions,
    activeReferenceRevisionId: baselineRevision.id,
    selectedRevisionId: currentRevision.id,
    diff: diffStoreRevisionV2(baselineManifest, currentManifest),
    buildTimeline: [
      {
        sequence: 1,
        phase: "BRIEF_VALIDATED",
        status: "COMPLETED",
        detail: `${definition.storeName} synthetic reference brief accepted.`,
        contractVersion: "store-brief.v1",
      },
      {
        sequence: 2,
        phase: "CATALOG_PROJECTED",
        status: "COMPLETED",
        detail: `${catalog.products.length} products passed the public Catalog V2 whitelist.`,
        contractVersion: "catalog-projection.v2",
      },
      {
        sequence: 3,
        phase: "EXPERIENCE_PROPOSED",
        status: "COMPLETED",
        detail: "A structured manifest was generated without HTML, CSS or executable code.",
        contractVersion: "store-experience-proposal.v2",
      },
      {
        sequence: 4,
        phase: "DETERMINISTIC_QA",
        status: "COMPLETED",
        detail: "Schema, references, contrast, claims and protected shells passed.",
        contractVersion: "store-experience-manifest.v2",
      },
      {
        sequence: 5,
        phase: "DRAFT_REVISION_CREATED",
        status: "COMPLETED",
        detail: "Immutable in-memory reference snapshot created; database persistence is not implied.",
        contractVersion: "store-revision.v1",
      },
    ],
    guardrails: [
      "SYNTHETIC_REFERENCE_DATA",
      "NO_PROVIDER_OR_NETWORK_CALLS",
      "ADMIN_ONLY_NOINDEX_PREVIEW",
      "COMMERCE_AND_ANALYTICS_DISABLED",
      "NO_LIVE_STATUS_OR_DOMAIN_CHANGES",
    ],
  });
}

export function buildReferenceStoreFactoryFixturesV2(): readonly ReferenceStoreFactoryFixtureV2[] {
  return deepFreeze(FIXTURE_DEFINITIONS.map(buildReferenceFixture));
}

export function isReferenceStoreFixtureKeyV2(
  value: string | null | undefined
): value is ReferenceStoreFixtureKeyV2 {
  return referenceStoreFixtureKeysV2.some((key) => key === value);
}

export function selectReferenceStoreRevisionV2(
  fixture: ReferenceStoreFactoryFixtureV2,
  revisionId: string | null | undefined
): ReferenceStoreRevisionV2 {
  return (
    fixture.revisions.find((revision) => revision.id === revisionId) ??
    fixture.revisions[1]
  );
}
