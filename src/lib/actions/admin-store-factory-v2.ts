"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  PrismaCatalogPersistenceRepositoryV2,
  buildCatalogProjectionV2,
  buildCatalogFixturePersistencePlanV2,
  executeCatalogPersistencePlanV2,
} from "@/lib/catalog-v2";
import {
  assertStoreFactoryV2AdminRuntimeEnabled,
  assertStoreFactoryV2PilotStoreEnabled,
  executeStoreFactoryV2AdminPointerMutation,
  executeStoreFactoryV2AdminReview,
  isStoreFactoryV2SameOriginMutation,
  parseStoreFactoryV2PilotStoreIds,
  storeFactoryV2AdminErrorCode,
  type ExecuteStoreFactoryV2AdminMutationDependencies,
} from "@/lib/admin/store-factory-v2-runtime";
import { prisma } from "@/lib/db";
import { readStoreFactoryV2SchemaCapability } from "@/lib/db/store-factory-v2-schema";
import {
  CATALOG_BINDING_V1,
  REFERENCE_STORE_BUILD_V2,
  ReferenceStoreBuildErrorV2,
  StoreFactoryV2Error,
  createPrismaStoreFactoryV2Repository,
  digestCanonicalArtifactV1,
  executeReferenceStoreBuildV2,
  referenceStoreBuildFixtureKeysV2,
} from "@/lib/store-factory-v2";

const reviewIntents = new Set(["APPROVE", "REJECT"]);
const pointerIntents = new Set(["PROMOTE", "ROLLBACK"]);

/**
 * The sole mutation entrypoint for Store Factory V2 admin controls. It
 * re-authenticates and re-attests the schema on every submission.
 */
export async function reviewStoreFactoryV2RevisionAction(
  formData: FormData
): Promise<void> {
  return mutateStoreFactoryV2Revision(formData, "REVIEW");
}

export async function mutateStoreFactoryV2PreviewPointerAction(
  formData: FormData
): Promise<void> {
  return mutateStoreFactoryV2Revision(formData, "POINTER");
}

/** Compatibility dispatcher retained for any stale rendered form. */
export async function mutateStoreFactoryV2RevisionAction(
  formData: FormData
): Promise<void> {
  const intent = String(formData.get("intent") ?? "").trim();
  return mutateStoreFactoryV2Revision(
    formData,
    reviewIntents.has(intent) ? "REVIEW" : "POINTER"
  );
}

async function mutateStoreFactoryV2Revision(
  formData: FormData,
  command: "REVIEW" | "POINTER"
): Promise<void> {
  await requireAdmin();
  await assertSameOriginAdminMutation();

  const intent = String(formData.get("intent") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const storeSlug = String(formData.get("storeSlug") ?? "").trim();
  const revisionId = String(formData.get("revisionId") ?? "").trim();
  const expectedOutputDigest = String(
    formData.get("expectedOutputDigest") ?? ""
  ).trim();
  const expectedPointerVersionValue = formData.get("expectedPointerVersion");
  const expectedPointerVersion =
    expectedPointerVersionValue === null ||
    String(expectedPointerVersionValue).trim() === ""
      ? Number.NaN
      : Number(expectedPointerVersionValue);
  const reason = String(formData.get("reason") ?? "").trim();

  // Build a redirect target only from a conservative slug/revision grammar.
  // Invalid input fails without allowing an attacker-controlled redirect.
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug)
    ? storeSlug
    : null;
  const safeRevisionId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(
    revisionId
  )
    ? revisionId
    : null;
  const validIntent =
    command === "REVIEW"
      ? reviewIntents.has(intent)
      : pointerIntents.has(intent);
  if (!safeSlug || !safeRevisionId || !validIntent) {
    throw new Error("Invalid Store Factory V2 action binding.");
  }

  let outcome: string;
  try {
    const schema = await readStoreFactoryV2SchemaCapability(prisma);
    const repository = createPrismaStoreFactoryV2Repository(prisma);
    const dependencies: ExecuteStoreFactoryV2AdminMutationDependencies = {
        featureEnabled: process.env.STOREFRONT_V2_ENABLED === "true",
        schema,
        pilotStoreIds: parseStoreFactoryV2PilotStoreIds(
          process.env.STOREFRONT_V2_PILOT_STORE_IDS
        ),
        repository,
        findStore: ({ id, slug }) =>
          prisma.store.findFirst({
            where: { id, slug },
            select: {
              id: true,
              slug: true,
              launchStatus: true,
              isActive: true,
            },
          }),
      };
    const result =
      command === "REVIEW"
        ? await executeStoreFactoryV2AdminReview(
            {
              intent,
              storeId,
              storeSlug,
              revisionId,
              expectedOutputDigest,
              reason,
            },
            dependencies
          )
        : await executeStoreFactoryV2AdminPointerMutation(
            {
              intent,
              storeId,
              storeSlug,
              revisionId,
              expectedPointerVersion,
              reason,
            },
            dependencies
          );
    if (result.scope !== "PREVIEW_ONLY" || result.liveStatusChanged !== false) {
      throw new Error("Preview-only settlement assertion failed.");
    }
    outcome = result.intent;
  } catch (error) {
    outcome = storeFactoryV2AdminErrorCode(error);
  }

  const path = `/admin/stores/${safeSlug}/experience`;
  revalidatePath(path);
  redirect(
    `${path}?revision=${encodeURIComponent(safeRevisionId)}&factoryResult=${encodeURIComponent(
      outcome
    )}`
  );
}

/**
 * Creates one provider-free, synthetic DRAFT revision for an exact tenant.
 * It cannot approve, promote, publish, route, index or alter commerce data.
 */
export async function buildReferenceStoreFactoryV2Action(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  await assertSameOriginAdminMutation();

  const storeId = String(formData.get("storeId") ?? "").trim();
  const storeSlug = String(formData.get("storeSlug") ?? "").trim();
  const fixtureKey = String(formData.get("fixtureKey") ?? "").trim();
  const experienceVariant = String(
    formData.get("experienceVariant") ?? ""
  ).trim();
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug)
    ? storeSlug
    : null;
  const safeFixture = referenceStoreBuildFixtureKeysV2.find(
    (candidate) => candidate === fixtureKey
  );
  if (
    !safeSlug ||
    !safeFixture ||
    (experienceVariant !== "BASELINE" && experienceVariant !== "REFINED")
  ) {
    throw new Error("Invalid reference Store Factory V2 build binding.");
  }

  let outcome = "BUILD_REFUSED";
  let revisionId: string | null = null;
  try {
    const schema = await readStoreFactoryV2SchemaCapability(prisma);
    const pilotStoreIds = parseStoreFactoryV2PilotStoreIds(
      process.env.STOREFRONT_V2_PILOT_STORE_IDS
    );
    assertStoreFactoryV2AdminRuntimeEnabled({
      featureEnabled: process.env.STOREFRONT_V2_ENABLED === "true",
      schema,
    });
    const store = await prisma.store.findFirst({
      where: { id: storeId, slug: safeSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        niche: true,
        launchStatus: true,
        isActive: true,
      },
    });
    if (!store) throw new Error("Store binding was not found.");
    assertStoreFactoryV2PilotStoreEnabled({ store, pilotStoreIds });

    const result = await executeReferenceStoreBuildV2(
      {
        version: REFERENCE_STORE_BUILD_V2,
        storeId,
        storeSlug: safeSlug,
        fixtureKey: safeFixture,
        experienceVariant,
      },
      {
        featureEnabled: process.env.STOREFRONT_V2_ENABLED === "true",
        schema,
        repository: createPrismaStoreFactoryV2Repository(prisma),
        requestedBy: "shared-admin-session",
        findStore: async ({ id, slug }) =>
          id === store.id && slug === store.slug
            ? {
                id: store.id,
                slug: store.slug,
                name: store.name,
                niche: store.niche,
              }
            : null,
        prepareCatalog: async ({ store, fixture }) => {
          const persistence = buildCatalogFixturePersistencePlanV2({
            storeId: store.id,
            fixture,
          });
          if (persistence.status !== "READY") {
            throw new Error(
              `Reference catalog persistence refused: ${persistence.reasonCodes.join(",")}`
            );
          }
          await executeCatalogPersistencePlanV2(
            new PrismaCatalogPersistenceRepositoryV2(prisma, {
              previewStoreGuard: {
                storeId: store.id,
                storeSlug: store.slug,
              },
            }),
            persistence.plan
          );
          const artifact = persistence.plan.rows.artifacts[0];
          const projected = buildCatalogProjectionV2(fixture);
          if (!artifact || projected.status !== "PROJECTED") {
            throw new Error("Reference catalog binding could not be derived.");
          }
          return {
            version: CATALOG_BINDING_V1,
            artifactId: artifact.id,
            artifactDigest: artifact.contentDigest,
            artifactContractVersion: artifact.contractVersion,
            projectionRef: projected.projection.projectionRef,
            projectionDigest: digestCanonicalArtifactV1(projected.projection),
            projectionContractVersion: projected.projection.version,
            sourceKind: artifact.sourceKind,
          };
        },
      }
    );
    revisionId = result.revision?.id ?? null;
    outcome =
      result.run.state === "SUCCEEDED" && revisionId
        ? result.replayed
          ? "BUILD_REPLAY"
          : "BUILD"
        : result.run.failureCode ?? "BUILD_FAILED";
  } catch (error) {
    outcome = referenceBuildErrorCode(error);
  }

  const path = `/admin/stores/${safeSlug}/experience`;
  revalidatePath(path);
  const query = new URLSearchParams({ factoryResult: outcome });
  if (revisionId) query.set("revision", revisionId);
  redirect(`${path}?${query.toString()}`);
}

function referenceBuildErrorCode(error: unknown): string {
  if (error instanceof ReferenceStoreBuildErrorV2) return error.code;
  if (error instanceof StoreFactoryV2Error) return error.code;
  const adminCode = storeFactoryV2AdminErrorCode(error);
  if (adminCode !== "ACTION_FAILED") return adminCode;
  return "BUILD_REFUSED";
}

async function assertSameOriginAdminMutation(): Promise<void> {
  const requestHeaders = await headers();
  if (
    !isStoreFactoryV2SameOriginMutation({
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      forwardedHost: requestHeaders.get("x-forwarded-host"),
      forwardedProto: requestHeaders.get("x-forwarded-proto"),
      secFetchSite: requestHeaders.get("sec-fetch-site"),
      trustForwardedHeaders:
        process.env.VERCEL === "1" ||
        process.env.STORE_FACTORY_V2_TRUST_PROXY_HEADERS === "true",
    })
  ) {
    throw new Error("Store Factory V2 mutation requires exact same-origin POST.");
  }
}
