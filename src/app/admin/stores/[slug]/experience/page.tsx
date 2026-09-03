import Link from "next/link";
import { notFound } from "next/navigation";
import { PersistedStoreFactoryV2CommandCenter } from "@/components/admin/PersistedStoreFactoryV2CommandCenter";
import { StoreFactoryV2CommandCenter, type StoreFactorySchemaCapabilityViewV2 } from "@/components/admin/StoreFactoryV2CommandCenter";
import {
  loadPersistedStoreFactoryWorkspaceV2,
  parseStoreFactoryV2PilotStoreIds,
  storeFactoryV2AdminErrorCode,
} from "@/lib/admin/store-factory-v2-runtime";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  readStoreFactoryV2SchemaCapability,
  STORE_FACTORY_V2_SCHEMA_VERSION,
  type StoreFactoryV2SchemaReport,
} from "@/lib/db/store-factory-v2-schema";
import {
  buildReferenceStoreFactoryFixturesV2,
  isReferenceStoreFixtureKeyV2,
} from "@/lib/reference-store-factory-v2";
import { createPrismaStoreFactoryV2Repository } from "@/lib/store-factory-v2";

export const dynamic = "force-dynamic";

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readSchemaCapability(): Promise<{
  view: StoreFactorySchemaCapabilityViewV2;
  report: StoreFactoryV2SchemaReport | null;
}> {
  try {
    const report = await readStoreFactoryV2SchemaCapability(prisma);
    return { view: { check: "AVAILABLE", ...report }, report };
  } catch {
    return {
      view: {
        check: "UNAVAILABLE",
        version: STORE_FACTORY_V2_SCHEMA_VERSION,
        status: "UNAVAILABLE",
        expected: 0,
        satisfied: 0,
        missing: [],
        incompatible: [],
        persistenceEnabled: false,
      },
      report: null,
    };
  }
}

export default async function StoreExperienceV2Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      niche: true,
      launchStatus: true,
      isActive: true,
    },
  });
  if (!store) notFound();

  const requestedFixture = firstQueryValue(query.fixture);
  const initialFixtureKey = isReferenceStoreFixtureKeyV2(requestedFixture)
    ? requestedFixture
    : "drones";
  const requestedRevisionId = firstQueryValue(query.revision);
  const resultCode = firstQueryValue(query.factoryResult);
  const featureFlagEnabled = process.env.STOREFRONT_V2_ENABLED === "true";
  let pilotStoreIds: ReadonlySet<string> = new Set();
  let pilotConfigurationValid = true;
  try {
    pilotStoreIds = parseStoreFactoryV2PilotStoreIds(
      process.env.STOREFRONT_V2_PILOT_STORE_IDS
    );
  } catch {
    pilotConfigurationValid = false;
  }
  const pilotEnabled =
    pilotConfigurationValid &&
    store.launchStatus === "PREVIEW" &&
    store.isActive &&
    pilotStoreIds.has(store.id);
  const schemaCapability = await readSchemaCapability();
  let persistenceNotice: string | null = null;
  let persistenceFailureCode: string | null = null;

  if (
    featureFlagEnabled &&
    schemaCapability.report?.status === "COMPLETE" &&
    schemaCapability.report.persistenceEnabled &&
    pilotEnabled
  ) {
    if (
      requestedRevisionId &&
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(requestedRevisionId)
    ) {
      notFound();
    }
    let persisted: Awaited<
      ReturnType<typeof loadPersistedStoreFactoryWorkspaceV2>
    > | null = null;
    try {
      persisted = await loadPersistedStoreFactoryWorkspaceV2(
        {
          storeId: store.id,
          storeSlug: store.slug,
          storeName: store.name,
          niche: store.niche,
          launchStatus: store.launchStatus,
          isActive: store.isActive,
          requestedRevisionId,
        },
        {
          db: prisma,
          repository: createPrismaStoreFactoryV2Repository(prisma),
          featureEnabled: featureFlagEnabled,
          schema: schemaCapability.report,
          pilotStoreIds,
        }
      );
    } catch (error) {
      persistenceFailureCode = storeFactoryV2AdminErrorCode(error);
    }
    if (persisted?.status === "REVISION_NOT_FOUND") notFound();
    if (persisted?.status === "LOADED") {
      return (
        <div>
          <StoreBreadcrumb slug={store.slug} name={store.name} />
          <PersistedStoreFactoryV2CommandCenter
            workspace={persisted.workspace}
            resultCode={resultCode}
          />
        </div>
      );
    }
    if (persisted?.status === "EMPTY") {
      persistenceNotice =
        "Persistence is enabled, but this tenant has no Store Factory V2 revisions. Showing the synthetic reference lab without writing data.";
    }
    if (persistenceFailureCode) {
      return (
        <div>
          <StoreBreadcrumb slug={store.slug} name={store.name} />
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
            <p className="text-xs font-bold uppercase tracking-wide">
              Persisted preview refused
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              No revision artifact was rendered
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6">
              Runtime validation failed closed ({persistenceFailureCode}). The tenant, launch state, preview pointer and revision records were not changed.
            </p>
            <Link
              href="/admin/store-factory-v2"
              className="mt-4 inline-flex rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Open synthetic reference lab
            </Link>
          </section>
        </div>
      );
    }
  }

  if (
    featureFlagEnabled &&
    schemaCapability.report?.persistenceEnabled &&
    !pilotEnabled
  ) {
    persistenceNotice = pilotConfigurationValid
      ? "Persisted Store Factory V2 is locked for this store. It must be active, PREVIEW and explicitly listed in STOREFRONT_V2_PILOT_STORE_IDS."
      : "Persisted Store Factory V2 is locked because STOREFRONT_V2_PILOT_STORE_IDS is invalid.";
  }

  const fixtures = buildReferenceStoreFactoryFixturesV2();

  return (
    <div>
      <StoreBreadcrumb slug={store.slug} name={store.name} />
      {persistenceNotice ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {persistenceNotice}
        </div>
      ) : null}
      <StoreFactoryV2CommandCenter
        fixtures={fixtures}
        initialFixtureKey={initialFixtureKey}
        initialRevisionId={requestedRevisionId}
        schemaCapability={schemaCapability.view}
        featureFlagEnabled={featureFlagEnabled}
        pilotEnabled={pilotEnabled}
        actualStore={store}
      />
    </div>
  );
}

function StoreBreadcrumb({ slug, name }: { slug: string; name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
      <Link href="/admin/stores" className="hover:underline">
        Stores
      </Link>{" "}
      /{" "}
      <Link href={`/admin/stores/${slug}/edit`} className="hover:underline">
        {name}
      </Link>{" "}
      / <span className="text-slate-900">Experience V2</span>
    </nav>
  );
}
