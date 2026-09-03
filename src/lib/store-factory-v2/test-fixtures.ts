import {
  buildCatalogProjectionV2,
  digestCatalogValue,
  droneCatalogFixtureV2,
} from "@/lib/catalog-v2";
import {
  catalogProjectionToStoreExperienceV2,
  proposeStoreExperienceV2,
} from "@/lib/storefront-v2";
import {
  CATALOG_SHAPE_V1,
  STORE_BRIEF_V1,
  STORE_BUILD_REQUEST_V1,
  STORE_BUILD_REQUEST_V2,
  CATALOG_BINDING_V1,
  STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
  STORE_CONTENT_PROPOSAL_V1,
  STORE_REVISION_CANDIDATE_V1,
  type StoreBuildRequestV1,
  type StoreBuildRequestV2,
  type StoreRevisionCandidateV1,
} from "./contracts";

export function storeFactoryBuildRequestFixtureV1(
  requestKey = "request-fixture-1"
): StoreBuildRequestV1 {
  return {
    version: STORE_BUILD_REQUEST_V1,
    storeId: "store-1",
    requestKey,
    requestedBy: "admin@example.test",
    brief: {
      version: STORE_BRIEF_V1,
      name: "Flight Atlas",
      niche: "camera drones",
      audience: "New aerial photographers",
      positioning: "Evidence-led equipment",
      valueProposition: "Clear specifications and safe buying guidance",
      brandVoice: "Precise and calm",
      locale: "en-US",
      currency: "NOK",
    },
    catalogShape: {
      version: CATALOG_SHAPE_V1,
      productClass: "consumer.camera-drone",
      targetProductCount: 10,
      minimumPreviewProductCount: 8,
      categories: [
        { key: "drones", name: "Drones", targetProductCount: 10 },
      ],
    },
  };
}

export function storeFactoryBuildRequestFixtureV2(input?: {
  experienceVariant?: "BASELINE" | "REFINED";
  baseRevision?: StoreBuildRequestV2["baseRevision"];
  requestedBy?: string;
}): StoreBuildRequestV2 {
  const legacy = storeFactoryBuildRequestFixtureV1();
  const projected = buildCatalogProjectionV2(droneCatalogFixtureV2);
  if (projected.status !== "PROJECTED") {
    throw new Error("Catalog fixture projection failed");
  }
  const experienceVariant = input?.experienceVariant ?? "BASELINE";
  return {
    version: STORE_BUILD_REQUEST_V2,
    storeId: legacy.storeId,
    requestedBy: input?.requestedBy ?? legacy.requestedBy,
    brief: legacy.brief,
    catalogShape: legacy.catalogShape,
    catalogBinding: {
      version: CATALOG_BINDING_V1,
      artifactId: "artifact-store-1-drones",
      artifactDigest: digestCatalogValue(droneCatalogFixtureV2),
      artifactContractVersion: droneCatalogFixtureV2.version,
      projectionRef: projected.projection.projectionRef,
      projectionDigest: digestCatalogValue(projected.projection).replace(
        /^sha256:/,
        ""
      ),
      projectionContractVersion: projected.projection.version,
      sourceKind: "REFERENCE_FIXTURE",
    },
    baseRevision:
      experienceVariant === "REFINED"
        ? input?.baseRevision ?? {
            revisionId: "revision-base",
            outputDigest: "a".repeat(64),
          }
        : null,
    experienceVariant,
    runtimeCapabilityVersion: STORE_FACTORY_RUNTIME_CAPABILITY_V2_1,
  };
}

export function storeRevisionCandidateFixtureV1(
  request: StoreBuildRequestV1 | StoreBuildRequestV2 =
    storeFactoryBuildRequestFixtureV1()
): StoreRevisionCandidateV1 {
  const catalogResult = buildCatalogProjectionV2(droneCatalogFixtureV2);
  if (catalogResult.status !== "PROJECTED") {
    throw new Error(
      `Catalog fixture projection failed: ${catalogResult.reasonCodes.join(",")}`
    );
  }
  const catalogProjection = catalogResult.projection;
  const experienceResult = proposeStoreExperienceV2(
    catalogProjectionToStoreExperienceV2({
      catalog: catalogProjection,
      store: { name: request.brief.name, niche: request.brief.niche },
      verifiedClaims: [],
    })
  );
  if (experienceResult.status !== "PROPOSED") {
    throw new Error(
      `Experience fixture proposal failed: ${experienceResult.reasonCodes.join(",")}`
    );
  }

  return {
    version: STORE_REVISION_CANDIDATE_V1,
    catalogProjection,
    experienceManifest: experienceResult.manifest,
    contentProposal: {
      version: STORE_CONTENT_PROPOSAL_V1,
      catalogProjectionRef: catalogProjection.projectionRef,
      homepage: {
        headline: `${request.brief.name} drone selection`,
        introduction:
          "Compare published specifications and availability before choosing a drone.",
        seoTitle: `${request.brief.name} camera drones`,
        seoDescription:
          "Explore camera drones with clear specifications and availability details.",
      },
      taxonomy: catalogProjection.taxonomy.nodes.map((node) => ({
        taxonomyNodeId: node.taxonomyNodeId,
        title: node.name,
        introduction: node.description ?? `Explore the ${node.name} catalog.`,
      })),
      products: catalogProjection.products.map((product) => ({
        productId: product.productId,
        headline: product.title,
        summary: product.subtitle ?? product.description.slice(0, 700),
      })),
      guides: [
        {
          slug: "choose-a-camera-drone",
          title: "How to choose a camera drone",
          summary: "Use published specifications to compare suitable models.",
          sections: [
            {
              heading: "Start with the intended use",
              paragraphs: [
                "Compare camera, flight and portability facts against your own priorities.",
              ],
            },
          ],
          relatedProductRefs: catalogProjection.products
            .slice(0, 3)
            .map((product) => product.productId),
        },
      ],
    },
  };
}
