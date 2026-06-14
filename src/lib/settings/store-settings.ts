import { z } from "zod";

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

export const HERO_VARIANTS = ["default", "video", "split"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

export const HERO_VARIANT_OPTIONS = HERO_VARIANTS.map((value) => ({
  value,
  label: value,
}));

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
