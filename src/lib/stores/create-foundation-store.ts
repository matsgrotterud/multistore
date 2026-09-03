import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  FOUNDATION_STORE_CREATION_VERSION,
  parseStoreSettings,
  serializeStoreSettings,
  type StoreSettings,
} from "@/lib/settings/store-settings";
import {
  buildFoundationStorePlan,
  type FoundationStorePlanV1,
} from "./foundation-store-plan";

const foundationStoreCreationRequestSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^foundation-[a-z0-9][a-z0-9_-]{7,79}$/,
      "Invalid foundation creation request key"
    ),
});

type FoundationStoreTransaction = Prisma.TransactionClient;

export interface FoundationStoreDatabase {
  $transaction<T>(
    callback: (tx: FoundationStoreTransaction) => Promise<T>
  ): Promise<T>;
}

export interface CreateFoundationStoreResult {
  storeSlug: string;
  storeName: string;
  launchStatus: string;
  isActive: boolean;
  foundationStatus: "PASS" | "REVIEW";
  foundationDigest: string;
  plannedDomain: string | null;
  replayed: boolean;
}

/**
 * Create an inactive foundation with a database-serialized idempotency key.
 * The transaction locks both the request key and the human slug namespace, so
 * retries return one exact Store and concurrent similar names cannot race.
 */
export async function createFoundationStore(
  rawInput: unknown,
  db: FoundationStoreDatabase = prisma
): Promise<CreateFoundationStoreResult> {
  const request = foundationStoreCreationRequestSchema.parse(rawInput);
  const plan = buildFoundationStorePlan(rawInput);
  const creation: NonNullable<StoreSettings["foundationCreation"]> = {
    version: FOUNDATION_STORE_CREATION_VERSION,
    idempotencyKey: request.idempotencyKey,
    inputFingerprint: plan.foundation.inputDigest,
  };

  let lastCollision: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        await lockFoundationCreation(tx, `request:${request.idempotencyKey}`);
        const replay = await findFoundationCreation(tx, request.idempotencyKey);
        if (replay) {
          return resultFromPersistedCreation({
            ...replay,
            expectedInputFingerprint: creation.inputFingerprint,
            replayed: true,
          });
        }

        await lockFoundationCreation(tx, `slug:${plan.baseSlug}`);
        const slug = await ensureUniqueSlug(tx, plan.baseSlug);
        const previewDomain = `${slug}.preview.example`;
        const settings: StoreSettings = {
          ...plan.settings,
          foundationCreation: creation,
        };
        const store = await tx.store.create({
          data: storeCreateData(plan, slug, previewDomain, settings),
          select: {
            slug: true,
            name: true,
            launchStatus: true,
            isActive: true,
            plannedDomain: true,
          },
        });

        return {
          storeSlug: store.slug,
          storeName: store.name,
          launchStatus: store.launchStatus,
          isActive: store.isActive,
          foundationStatus: plan.foundation.audit.status,
          foundationDigest: plan.foundation.foundationDigest,
          plannedDomain: store.plannedDomain,
          replayed: false,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        lastCollision = error;
        continue;
      }
      throw error;
    }
  }
  throw lastCollision ?? new Error("Could not allocate a unique foundation store.");
}

function storeCreateData(
  plan: FoundationStorePlanV1,
  slug: string,
  previewDomain: string,
  settings: StoreSettings
) {
  return {
    slug,
    name: plan.brandName,
    legalName: `${plan.brandName} (Foundation draft)`,
    primaryDomain: previewDomain,
    plannedDomain: plan.plannedDomain,
    locale: plan.locale,
    currency: plan.currency,
    niche: plan.foundation.identity.niche,
    positioning: plan.positioning,
    audience: plan.foundation.identity.audience,
    valueProposition: plan.positioning,
    brandVoice: plan.foundation.identity.brandVoice,
    logoText: plan.foundation.identity.logoText,
    supportEmail: `support@${previewDomain}`,
    shippingOriginDisclosure:
      "Fulfillment is not configured. This inactive foundation cannot accept orders.",
    defaultShippingDaysMin: 5,
    defaultShippingDaysMax: 14,
    returnPolicySummary:
      "Returns terms are not configured because this inactive foundation cannot accept orders.",
    privacyPolicy:
      "Draft only. Before launch, the merchant must publish a reviewed privacy policy covering identity, purposes, processors, retention and visitor rights.",
    termsOfSale:
      "Draft only. Commerce is disabled. Reviewed seller identity, pricing, tax, fulfillment, cancellation and dispute terms are required before launch.",
    launchStatus: "DRAFT",
    isActive: false,
    theme: { create: plan.theme },
    settings: {
      create: { settings: serializeStoreSettings(settings) },
    },
    // A planned hostname is intent only. No Domain routing-authority row is
    // created until a separate verified launch-control workflow exists.
  } as const;
}

async function lockFoundationCreation(
  tx: FoundationStoreTransaction,
  scope: string
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`foundation-store:${scope}`}))`;
}

async function findFoundationCreation(
  tx: FoundationStoreTransaction,
  idempotencyKey: string
) {
  const rows = await tx.storeSettings.findMany({
    where: {
      settings: { contains: `\"idempotencyKey\":\"${idempotencyKey}\"` },
    },
    take: 3,
    select: {
      settings: true,
      store: {
        select: {
          slug: true,
          name: true,
          launchStatus: true,
          isActive: true,
          plannedDomain: true,
        },
      },
    },
  });
  const matches = rows
    .map((row) => ({ row, settings: parseStoreSettings(row.settings) }))
    .filter(
      ({ settings }) =>
        settings.foundationCreation?.idempotencyKey === idempotencyKey
    );
  if (matches.length > 1) {
    throw new Error("Foundation creation idempotency evidence is not unique.");
  }
  const match = matches[0];
  if (!match?.settings.foundation || !match.settings.foundationCreation) return null;
  return {
    store: match.row.store,
    foundation: match.settings.foundation,
    creation: match.settings.foundationCreation,
  };
}

function resultFromPersistedCreation(input: {
  store: {
    slug: string;
    name: string;
    launchStatus: string;
    isActive: boolean;
    plannedDomain: string | null;
  };
  foundation: NonNullable<StoreSettings["foundation"]>;
  creation: NonNullable<StoreSettings["foundationCreation"]>;
  expectedInputFingerprint: string;
  replayed: boolean;
}): CreateFoundationStoreResult {
  if (input.creation.inputFingerprint !== input.expectedInputFingerprint) {
    throw new Error(
      "Foundation creation request key was already used for different input."
    );
  }
  return {
    storeSlug: input.store.slug,
    storeName: input.store.name,
    launchStatus: input.store.launchStatus,
    isActive: input.store.isActive,
    foundationStatus: input.foundation.audit.status,
    foundationDigest: input.foundation.foundationDigest,
    plannedDomain: input.store.plannedDomain,
    replayed: input.replayed,
  };
}

async function ensureUniqueSlug(
  tx: FoundationStoreTransaction,
  base: string
): Promise<string> {
  let slug = base || "foundation-store";
  for (let suffix = 2; suffix <= 100; suffix += 1) {
    const existing = await tx.store.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base.slice(0, 40)}-${suffix}`;
  }
  throw new Error("Foundation store slug namespace is exhausted.");
}
