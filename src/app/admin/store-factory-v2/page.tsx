import { StoreFactoryV2CommandCenter, type StoreFactorySchemaCapabilityViewV2 } from "@/components/admin/StoreFactoryV2CommandCenter";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  readStoreFactoryV2SchemaCapability,
  STORE_FACTORY_V2_SCHEMA_VERSION,
} from "@/lib/db/store-factory-v2-schema";
import {
  buildReferenceStoreFactoryFixturesV2,
  isReferenceStoreFixtureKeyV2,
} from "@/lib/reference-store-factory-v2";

export const dynamic = "force-dynamic";

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readSchemaCapability(): Promise<StoreFactorySchemaCapabilityViewV2> {
  try {
    const report = await readStoreFactoryV2SchemaCapability(prisma);
    return { check: "AVAILABLE", ...report };
  } catch {
    return {
      check: "UNAVAILABLE",
      version: STORE_FACTORY_V2_SCHEMA_VERSION,
      status: "UNAVAILABLE",
      expected: 0,
      satisfied: 0,
      missing: [],
      incompatible: [],
      persistenceEnabled: false,
    };
  }
}

export default async function StoreFactoryV2Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const requestedFixture = firstQueryValue(query.fixture);
  const initialFixtureKey = isReferenceStoreFixtureKeyV2(requestedFixture)
    ? requestedFixture
    : "drones";
  const initialRevisionId = firstQueryValue(query.revision);
  const [fixtures, schemaCapability] = await Promise.all([
    Promise.resolve(buildReferenceStoreFactoryFixturesV2()),
    readSchemaCapability(),
  ]);

  return (
    <StoreFactoryV2CommandCenter
      fixtures={fixtures}
      initialFixtureKey={initialFixtureKey}
      initialRevisionId={initialRevisionId}
      schemaCapability={schemaCapability}
      featureFlagEnabled={process.env.STOREFRONT_V2_ENABLED === "true"}
    />
  );
}
