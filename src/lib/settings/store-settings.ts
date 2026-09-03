import { z } from "zod";
import { storefrontPresentationV1Schema } from "@/lib/storefront/presentation";
import { storeFoundationV1Schema } from "@/lib/storefront/store-foundation-contract";

/**
 * Per-store settings.
 *
 * Stored as a JSON-encoded string on StoreSettings.settings (SQLite has no
 * native JSON). Every field has a default, so `parseStoreSettings` always
 * returns a fully-populated object even for stores created before a field
 * existed — callers never have to null-check individual settings.
 *
 * These settings drive mass-production: SEO defaults applied to every page,
 * homepage layout, monetization targets used by the pricing/score tooling,
 * marketing pixel IDs, personalization weights, automation thresholds for
 * auto-publishing imported products, and compliance disclosures.
 */

export const HERO_VARIANTS = [
  "default",
  "video",
  "split",
  "editorial",
  "showcase",
  "minimal",
] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

export const HERO_VARIANT_OPTIONS = HERO_VARIANTS.map((value) => ({
  value,
  label: value,
}));

export const FOUNDATION_STORE_CREATION_VERSION =
  "foundation-store-creation.v1" as const;

const generatorTerminalStatusSchema = z.enum([
  "RUNNING",
  "READY_FOR_PREVIEW",
  "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
  "POLICY_BLOCKED",
  "INSUFFICIENT_RELEVANT_PRODUCTS",
  "INSUFFICIENT_INTENT_EVIDENCE",
  "PROVIDER_FAILED",
  "VALIDATION_FAILED",
  "CANCELLED",
]);

const productClassProfileSchema = z.object({
  version: z.literal("product-class-profile.v1"),
  source: z.enum(["STATIC_ONTOLOGY", "RUNTIME_PROVISIONAL"]),
  serverOwned: z.literal(true),
  requiresAdminConfirmation: z.boolean(),
  productClass: z.string().min(1),
  normalizedProductType: z.string().min(1),
  headNoun: z.string().min(1),
  classConcepts: z.array(z.string().min(1)).min(1),
  qualifiers: z.array(z.string()),
  excludedClasses: z.array(
    z.object({
      className: z.string().min(1),
      concepts: z.array(z.string().min(1)),
    })
  ),
  policyDecision: z.enum(["ALLOW", "MANUAL_REVIEW_REQUIRED", "BLOCK"]),
  riskFlags: z.array(z.string()),
  category: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
  }),
  liveCommerceAllowed: z.boolean(),
  autonomousLaunchAllowed: z.boolean(),
  profileHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const storeSettingsSchema = z.object({
  seo: z
    .object({
      defaultOgImage: z.string().default(""),
      googleSiteVerification: z.string().default(""),
      robotsExtraDisallow: z.array(z.string()).default([]),
      hreflangLocales: z.array(z.string()).default([]),
    })
    .default({}),
  homepage: z
    .object({
      heroVariant: z.enum(HERO_VARIANTS).default("default"),
      featuredCollectionSlug: z.string().default("featured"),
      showQuizCta: z.boolean().default(true),
      showComparisonCta: z.boolean().default(true),
      trustBarItems: z.array(z.string()).default([]),
    })
    .default({}),
  presentation: storefrontPresentationV1Schema
    .nullable()
    .catch(null)
    .default(null),
  foundation: storeFoundationV1Schema
    .nullable()
    .catch(null)
    .default(null),
  foundationCreation: z
    .object({
      version: z.literal(FOUNDATION_STORE_CREATION_VERSION),
      idempotencyKey: z
        .string()
        .regex(/^foundation-[a-z0-9][a-z0-9_-]{7,79}$/),
      inputFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .nullable()
    .catch(null)
    .default(null),
  monetization: z
    .object({
      targetMarginPercent: z.number().min(0).max(95).default(35),
      minMarginPercent: z.number().min(0).max(95).default(15),
      enableCompareAtPrice: z.boolean().default(true),
      bundleDiscountPercent: z.number().min(0).max(90).default(8),
      subscriptionSkus: z.array(z.string()).default([]),
    })
    .default({}),
  marketing: z
    .object({
      metaPixelId: z.string().default(""),
      googleAdsId: z.string().default(""),
      utmDefaultSource: z.string().default(""),
    })
    .default({}),
  personalization: z
    .object({
      enabled: z.boolean().default(true),
      quizWeight: z.number().min(0).max(10).default(2),
      browseHistoryWeight: z.number().min(0).max(10).default(1),
    })
    .default({}),
  automation: z
    .object({
      autoPublishMinScore: z.number().min(0).max(100).default(70),
      autoNoindexBelowScore: z.number().min(0).max(100).default(40),
      importDefaultSupplier: z.string().default("MockSupply Co"),
      importKeywords: z.array(z.string()).default([]),
    })
    .default({}),
  compliance: z
    .object({
      showDropshipDisclosure: z.boolean().default(true),
      importTaxDisclaimer: z
        .string()
        .default(
          "Import duties or taxes may apply on delivery depending on your country."
        ),
      cookiePolicyUrl: z.string().default(""),
    })
    .default({}),
  generation: z
    .object({
      contractVersion: z.string(),
      runId: z.string(),
      generatorVersion: z.string(),
      intentVersion: z.string(),
      ontologyVersion: z.string(),
      evaluatorVersion: z.string(),
      status: generatorTerminalStatusSchema,
      productClass: z.string().nullable(),
      intentConfidence: z.number().min(0).max(1),
      policyDecision: z.enum(["ALLOW", "MANUAL_REVIEW_REQUIRED", "BLOCK"]),
      classProfile: productClassProfileSchema.nullable().optional(),
      planDigest: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
      minimumProducts: z.number().int().nonnegative(),
      relevantProducts: z.number().int().nonnegative(),
      previewVisibleProducts: z.number().int().nonnegative(),
      importedProducts: z.number().int().nonnegative(),
      importBudget: z.number().int().nonnegative(),
      manualReviewRequired: z.boolean(),
      manualReviewStatus: z.enum(["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"]),
      humanLaunchApproved: z.boolean(),
      humanLaunchApprovedBy: z.string().nullable(),
      humanLaunchApprovedAt: z.string().nullable(),
      liveCommerceAllowed: z.boolean(),
      autonomousLaunchAllowed: z.boolean(),
      completedAt: z.string().nullable(),
      reasonCodes: z.array(z.string()),
    })
    .nullable()
    .default(null),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

/** Fully-defaulted settings, used as the base for new stores and the editor. */
export const DEFAULT_STORE_SETTINGS: StoreSettings = storeSettingsSchema.parse({});

/**
 * Parse a JSON-encoded settings string into a fully-defaulted object. Unknown
 * or malformed input degrades to defaults rather than throwing, mirroring the
 * resilience of src/lib/utils/json.ts.
 */
export function parseStoreSettings(raw: string | null | undefined): StoreSettings {
  if (!raw) return DEFAULT_STORE_SETTINGS;
  try {
    const parsed = storeSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function serializeStoreSettings(settings: StoreSettings): string {
  return JSON.stringify(settings);
}

/**
 * Normal store fields are merchant-editable, while these versioned artifacts
 * are owned by their dedicated engines. Preserve them exactly across the
 * broad settings form so an unrelated save cannot erase audit evidence.
 */
export function preserveVersionedStoreArtifacts(
  merchantSettings: StoreSettings,
  currentSettings: StoreSettings
): StoreSettings {
  return {
    ...merchantSettings,
    presentation: currentSettings.presentation,
    foundation: currentSettings.foundation,
    foundationCreation: currentSettings.foundationCreation,
    generation: currentSettings.generation,
  };
}
