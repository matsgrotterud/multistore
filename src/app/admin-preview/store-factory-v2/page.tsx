import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReferenceShopperPreviewFrameV2 } from "@/components/storefront-v2/ReferenceShopperPreviewFrame";
import { requireAdmin } from "@/lib/admin/auth";
import {
  loadPersistedStoreFactoryWorkspaceV2,
  parseStoreFactoryV2PilotStoreIds,
} from "@/lib/admin/store-factory-v2-runtime";
import { prisma } from "@/lib/db";
import { readStoreFactoryV2SchemaCapability } from "@/lib/db/store-factory-v2-schema";
import {
  buildReferenceStoreFactoryFixturesV2,
} from "@/lib/reference-store-factory-v2";
import { createPrismaStoreFactoryV2Repository } from "@/lib/store-factory-v2";
import { parseStoreFactoryV2PreviewSearchParams } from "@/lib/store-factory-v2/preview-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Store Factory V2 Preview",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

async function persistedDocument(input: {
  storeSlug: string;
  revisionId: string;
}) {
  if (process.env.STOREFRONT_V2_ENABLED !== "true") {
    notFound();
  }

  const [store, schema] = await Promise.all([
    prisma.store.findUnique({
      where: { slug: input.storeSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        niche: true,
        launchStatus: true,
        isActive: true,
      },
    }),
    readStoreFactoryV2SchemaCapability(prisma).catch(() => null),
  ]);
  if (!store || schema?.status !== "COMPLETE" || !schema.persistenceEnabled) {
    notFound();
  }
  let pilotStoreIds: ReadonlySet<string>;
  try {
    pilotStoreIds = parseStoreFactoryV2PilotStoreIds(
      process.env.STOREFRONT_V2_PILOT_STORE_IDS
    );
  } catch {
    notFound();
  }
  if (
    store.launchStatus !== "PREVIEW" ||
    !store.isActive ||
    !pilotStoreIds.has(store.id)
  ) {
    notFound();
  }

  const loaded = await loadPersistedStoreFactoryWorkspaceV2(
    {
      storeId: store.id,
      storeSlug: store.slug,
      storeName: store.name,
      niche: store.niche,
      launchStatus: store.launchStatus,
      isActive: store.isActive,
      requestedRevisionId: input.revisionId,
    },
    {
      db: prisma,
      repository: createPrismaStoreFactoryV2Repository(prisma),
      featureEnabled: true,
      schema,
      pilotStoreIds,
    }
  ).catch(() => null);

  if (!loaded || loaded.status !== "LOADED") notFound();
  return loaded.workspace.renderDocument;
}

export default async function InternalStoreFactoryV2PreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = parseStoreFactoryV2PreviewSearchParams(await searchParams);
  if (!query) notFound();

  if (query.mode === "persisted") {
    const document = await persistedDocument({
      storeSlug: query.storeSlug,
      revisionId: query.revisionId,
    });
    return <ReferenceShopperPreviewFrameV2 document={document} />;
  }

  const fixture = buildReferenceStoreFactoryFixturesV2().find(
    (candidate) => candidate.key === query.fixture
  );
  const revision = query.revisionId
    ? fixture?.revisions.find((candidate) => candidate.id === query.revisionId)
    : fixture?.revisions.find(
        (candidate) => candidate.id === fixture.selectedRevisionId
      );
  if (!revision) notFound();

  return <ReferenceShopperPreviewFrameV2 document={revision.renderDocument} />;
}
