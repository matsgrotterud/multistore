import { z } from "zod";
import {
  apparelCatalogFixtureV2,
  buildCatalogFixturePersistencePlanV2,
  buildCatalogProjectionV2,
  consumableCatalogFixtureV2,
  droneCatalogFixtureV2,
  type CatalogProjectionV2,
  type CatalogReferenceFixtureV2,
} from "@/lib/catalog-v2";
import type { StoreFactoryV2SchemaReport } from "@/lib/db/store-factory-v2-schema";
import {
  catalogProjectionToStoreExperienceV2,
  proposeStoreExperienceV2,
  storeExperienceManifestV2Schema,
  type StoreExperienceManifestV2,
} from "@/lib/storefront-v2";
import {
  CATALOG_SHAPE_V1,
  STORE_BRIEF_V1,
  STORE_BUILD_REQUEST_V2,
  STORE_CONTENT_PROPOSAL_V1,
  STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
  STORE_REVISION_CANDIDATE_V1,
  CatalogBindingV1Schema,
  deriveStoreBuildRequestKeyV2,
  digestCanonicalArtifactV1,
  type CatalogBindingV1,
  type StoreBuildRequestV2,
  type StoreContentProposalV1,
  type StoreRevisionCandidateV1,
} from "./contracts";
import type { StoreFactoryV2Repository } from "./repository";
import {
  StoreFactoryV2Service,
  type StoreBuildResultV2,
} from "./service";

export const REFERENCE_STORE_BUILD_V2 = "reference-store-build.v2" as const;
export const referenceStoreBuildFixtureKeysV2 = [
  "drones",
  "apparel",
  "consumables",
] as const;
export type ReferenceStoreBuildFixtureKeyV2 =
  (typeof referenceStoreBuildFixtureKeysV2)[number];

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const ReferenceStoreBuildInputV2Schema = z
  .object({
    version: z.literal(REFERENCE_STORE_BUILD_V2),
    storeId: identifierSchema,
    storeSlug: slugSchema,
    fixtureKey: z.enum(referenceStoreBuildFixtureKeysV2),
    experienceVariant: z.enum(["BASELINE", "REFINED"]),
  })
  .strict();

export type ReferenceStoreBuildInputV2 = z.infer<
  typeof ReferenceStoreBuildInputV2Schema
>;

export interface ReferenceStoreBuildStoreV2 {
  id: string;
  slug: string;
  name: string;
  niche: string;
}

export interface ExecuteReferenceStoreBuildDependenciesV2 {
  featureEnabled: boolean;
  schema: StoreFactoryV2SchemaReport;
  repository: StoreFactoryV2Repository;
  findStore(input: {
    id: string;
    slug: string;
  }): Promise<ReferenceStoreBuildStoreV2 | null>;
  prepareCatalog?(input: {
    store: ReferenceStoreBuildStoreV2;
    fixtureKey: ReferenceStoreBuildFixtureKeyV2;
    fixture: CatalogReferenceFixtureV2;
  }): Promise<CatalogBindingV1>;
  requestedBy: string;
  clock?: () => Date;
}

export class ReferenceStoreBuildErrorV2 extends Error {
  constructor(
    readonly code:
      | "FEATURE_DISABLED"
      | "SCHEMA_NOT_COMPLETE"
      | "STORE_BINDING_NOT_FOUND"
      | "BASE_REVISION_REQUIRED"
      | "CATALOG_BINDING_INVALID"
      | "REFERENCE_CATALOG_INVALID"
      | "REFERENCE_EXPERIENCE_INVALID"
  ) {
    super(code);
    this.name = "ReferenceStoreBuildErrorV2";
  }
}

/**
 * Auth-neutral core behind the admin server action. Authentication stays at
 * the action boundary; this function independently re-checks feature, schema
 * and tenant binding before the repository can claim a build run.
 */
export async function executeReferenceStoreBuildV2(
  value: unknown,
  dependencies: ExecuteReferenceStoreBuildDependenciesV2
): Promise<StoreBuildResultV2> {
  const input = ReferenceStoreBuildInputV2Schema.parse(value);
  if (!dependencies.featureEnabled) {
    throw new ReferenceStoreBuildErrorV2("FEATURE_DISABLED");
  }
  if (
    dependencies.schema.status !== "COMPLETE" ||
    dependencies.schema.persistenceEnabled !== true
  ) {
    throw new ReferenceStoreBuildErrorV2("SCHEMA_NOT_COMPLETE");
  }
  const store = await dependencies.findStore({
    id: input.storeId,
    slug: input.storeSlug,
  });
  if (!store || store.id !== input.storeId || store.slug !== input.storeSlug) {
    throw new ReferenceStoreBuildErrorV2("STORE_BINDING_NOT_FOUND");
  }

  const fixture = referenceFixtureV2(input.fixtureKey);
  if (!dependencies.prepareCatalog) {
    throw new ReferenceStoreBuildErrorV2("CATALOG_BINDING_INVALID");
  }
  const catalogBinding = await dependencies.prepareCatalog({
    store,
    fixtureKey: input.fixtureKey,
    fixture,
  });
  const projected = buildCatalogProjectionV2(fixture);
  const persistence = buildCatalogFixturePersistencePlanV2({
    storeId: store.id,
    fixture,
  });
  if (projected.status !== "PROJECTED") {
    throw new ReferenceStoreBuildErrorV2("REFERENCE_CATALOG_INVALID");
  }
  const parsedBinding = CatalogBindingV1Schema.safeParse(catalogBinding);
  if (
    !parsedBinding.success ||
    persistence.status !== "READY" ||
    parsedBinding.data.sourceKind !== "REFERENCE_FIXTURE" ||
    parsedBinding.data.artifactId !==
      persistence.plan.rows.artifacts[0]?.id ||
    parsedBinding.data.artifactDigest !==
      persistence.plan.rows.artifacts[0]?.contentDigest ||
    parsedBinding.data.artifactContractVersion !== fixture.version ||
    parsedBinding.data.projectionRef !== projected.projection.projectionRef ||
    parsedBinding.data.projectionDigest !==
      digestCanonicalArtifactV1(projected.projection)
  ) {
    throw new ReferenceStoreBuildErrorV2("CATALOG_BINDING_INVALID");
  }
  let baseRevision: StoreBuildRequestV2["baseRevision"] = null;
  if (input.experienceVariant === "REFINED") {
    const pointer = await dependencies.repository.getPreviewPointer(store.id);
    const active = pointer.activeRevisionId
      ? await dependencies.repository.getRevision(pointer.activeRevisionId)
      : null;
    if (!active || active.storeId !== store.id || active.status !== "APPROVED") {
      throw new ReferenceStoreBuildErrorV2("BASE_REVISION_REQUIRED");
    }
    baseRevision = { revisionId: active.id, outputDigest: active.outputDigest };
  }
  const request = buildReferenceStoreRequestV2({
    input,
    store,
    fixture,
    catalogBinding: parsedBinding.data,
    baseRevision,
    requestedBy: dependencies.requestedBy,
  });
  const service = new StoreFactoryV2Service({
    repository: dependencies.repository,
    clock: dependencies.clock,
    assembler: {
      assemble: ({ request: claimedRequest }) =>
        assembleReferenceStoreRevisionV2(claimedRequest, fixture),
    },
  });
  return service.buildRevision(request);
}

export function assembleReferenceStoreRevisionV2(
  request: StoreBuildRequestV2,
  fixture: CatalogReferenceFixtureV2
): StoreRevisionCandidateV1 {
  const projected = buildCatalogProjectionV2(fixture);
  if (projected.status !== "PROJECTED") {
    throw new ReferenceStoreBuildErrorV2("REFERENCE_CATALOG_INVALID");
  }
  const experienceCatalog = catalogProjectionToStoreExperienceV2({
    catalog: projected.projection,
    store: { name: request.brief.name, niche: request.brief.niche },
    verifiedClaims: [],
  });
  const experience = proposeStoreExperienceV2(experienceCatalog);
  if (experience.status !== "PROPOSED") {
    throw new ReferenceStoreBuildErrorV2("REFERENCE_EXPERIENCE_INVALID");
  }
  return {
    version: STORE_REVISION_CANDIDATE_V1,
    catalogProjection: projected.projection,
    experienceManifest:
      request.experienceVariant === "REFINED"
        ? refineReferenceManifestV2(experience.manifest)
        : experience.manifest,
    contentProposal: buildReferenceContentV2(request, projected.projection),
  };
}

export function referenceStoreBuildRequestKeyV2(
  input: StoreBuildRequestV2
): string {
  return deriveStoreBuildRequestKeyV2(input);
}

function buildReferenceStoreRequestV2(input: {
  input: ReferenceStoreBuildInputV2;
  store: ReferenceStoreBuildStoreV2;
  fixture: CatalogReferenceFixtureV2;
  catalogBinding: CatalogBindingV1;
  baseRevision: StoreBuildRequestV2["baseRevision"];
  requestedBy: string;
}): StoreBuildRequestV2 {
  const projected = buildCatalogProjectionV2(input.fixture);
  if (projected.status !== "PROJECTED") {
    throw new ReferenceStoreBuildErrorV2("REFERENCE_CATALOG_INVALID");
  }
  const root = projected.projection.taxonomy.nodes
    .filter((node) => node.parentId === null)
    .sort(
      (left, right) =>
        left.position - right.position ||
        left.taxonomyNodeId.localeCompare(right.taxonomyNodeId)
    )[0];
  const currency = projectionCurrency(projected.projection);
  return {
    version: STORE_BUILD_REQUEST_V2,
    storeId: input.store.id,
    requestedBy: input.requestedBy,
    catalogBinding: input.catalogBinding,
    baseRevision: input.baseRevision,
    experienceVariant: input.input.experienceVariant,
    runtimeCapabilityVersion: STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
    brief: {
      version: STORE_BRIEF_V1,
      name: safeText(input.store.name, 120),
      niche: safeText(input.store.niche, 240),
      audience: "Shoppers comparing the current reviewed product catalog",
      positioning: "Evidence-led selection with explicit availability",
      valueProposition:
        "A clear catalog experience built from normalized product facts",
      brandVoice: "Clear, useful and measured",
      locale: "en-US",
      currency,
    },
    catalogShape: {
      version: CATALOG_SHAPE_V1,
      productClass: `reference.${input.input.fixtureKey}`,
      targetProductCount: projected.projection.products.length,
      minimumPreviewProductCount: projected.projection.products.length,
      categories: [
        {
          key: root?.slug ?? projected.projection.taxonomy.nodes[0].slug,
          name: root?.name ?? projected.projection.taxonomy.nodes[0].name,
          targetProductCount: projected.projection.products.length,
        },
      ],
    },
  };
}

function buildReferenceContentV2(
  request: StoreBuildRequestV2,
  catalog: CatalogProjectionV2
): StoreContentProposalV1 {
  const storeName = safeText(request.brief.name, 50);
  const niche = safeText(request.brief.niche, 80);
  return {
    version: STORE_CONTENT_PROPOSAL_V1,
    catalogProjectionRef: catalog.projectionRef,
    homepage: {
      headline: safeText(
        request.experienceVariant === "REFINED"
          ? `${storeName}, thoughtfully selected`
          : `${storeName} catalog`,
        140
      ),
      introduction: safeText(
        `Explore ${niche} with normalized specifications, options and explicit availability.`,
        600
      ),
      seoTitle: safeText(`${storeName} | ${niche}`, 70),
      seoDescription: safeText(
        `Review ${niche} using structured product information and current catalog availability.`,
        180
      ),
    },
    taxonomy: catalog.taxonomy.nodes.map((node) => ({
      taxonomyNodeId: node.taxonomyNodeId,
      title: safeText(node.name, 160),
      introduction: safeText(
        node.description ?? `Explore products organized under ${node.name}.`,
        800
      ),
    })),
    products: catalog.products.map((product) => ({
      productId: product.productId,
      headline: safeText(product.title, 160),
      summary: safeText(product.subtitle ?? product.description, 800),
    })),
    guides: [],
  };
}

function projectionCurrency(projection: CatalogProjectionV2): string {
  const currencies = new Set(
    projection.products.flatMap((product) =>
      product.price.state === "KNOWN" ? [product.price.money.currency] : []
    )
  );
  return currencies.size === 1 ? [...currencies][0] : "NOK";
}

function refineReferenceManifestV2(
  manifest: StoreExperienceManifestV2
): StoreExperienceManifestV2 {
  const refined = structuredClone(manifest);
  refined.designTokens.spacing = {
    ...refined.designTokens.spacing,
    sectionGap: "large",
  };
  refined.designTokens.shape = {
    ...refined.designTokens.shape,
    cardStyle: "elevated",
    shadow: "soft",
  };
  refined.chrome.header.variant = "centered";
  const hero = refined.pages.home.blocks.find((block) => block.type === "hero");
  if (hero?.type === "hero") {
    hero.layout = "editorial";
    hero.eyebrow = "A more focused edit";
  }
  return storeExperienceManifestV2Schema.parse(refined);
}

function safeText(value: string, max: number): string {
  const normalized = value.replace(/[<>{}]/g, " ").replace(/\s+/g, " ").trim();
  const fallback = normalized || "Catalog";
  return fallback.length <= max ? fallback : fallback.slice(0, max).trimEnd();
}

function referenceFixtureV2(
  key: ReferenceStoreBuildFixtureKeyV2
): CatalogReferenceFixtureV2 {
  return {
    drones: droneCatalogFixtureV2,
    apparel: apparelCatalogFixtureV2,
    consumables: consumableCatalogFixtureV2,
  }[key];
}
