import { z } from "zod";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/lib/settings/store-settings";
import { recommendStorefrontPresentation } from "@/lib/storefront/presentation";
import { buildStoreFoundation } from "@/lib/storefront/store-foundation";
import type { StoreFoundationV1 } from "@/lib/storefront/store-foundation-contract";

export const FOUNDATION_STORE_PLAN_VERSION = "foundation-store-plan.v1" as const;

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
    "Enter a bare production hostname such as example.com"
  )
  .refine(
    (value) => !/\.(?:example|invalid|localhost|test)$/.test(value),
    "Reserved development hostnames cannot be a production-domain intent"
  );

export const foundationStoreInputSchema = z.object({
  brandName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || undefined),
  niche: z.string().trim().min(3).max(160),
  audience: z.string().trim().min(3).max(240),
  brandVoice: z.string().trim().min(3).max(240),
  locale: z.string().trim().min(2).max(20).default("nb-NO"),
  country: z.string().trim().min(2).max(80).default("Norway"),
  plannedDomain: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(hostnameSchema.optional()),
});

export type FoundationStoreInput = z.infer<typeof foundationStoreInputSchema>;

export interface FoundationStorePlanV1 {
  version: typeof FOUNDATION_STORE_PLAN_VERSION;
  baseSlug: string;
  brandName: string;
  positioning: string;
  primaryDomain: string;
  plannedDomain: string | null;
  locale: string;
  currency: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontHeading: string;
    fontBody: string;
  };
  foundation: StoreFoundationV1;
  settings: StoreSettings;
}

const PALETTES = [
  ["#0f766e", "#134e4a", "#f59e0b", "#fafaf9", "#1c1917"],
  ["#1d4ed8", "#1e293b", "#06b6d4", "#f8fafc", "#0f172a"],
  ["#9d174d", "#4c0519", "#fb923c", "#fff7f5", "#27141a"],
  ["#3f6212", "#1a2e05", "#eab308", "#f7fee7", "#1a2e05"],
  ["#7c3aed", "#2e1065", "#10b981", "#faf5ff", "#1e1b4b"],
] as const;
const BRAND_SUFFIXES = ["Studio", "Atelier", "Works", "House", "Collective", "Form"] as const;

export function buildFoundationStorePlan(raw: unknown): FoundationStorePlanV1 {
  const input = foundationStoreInputSchema.parse(raw);
  const seed = stableNumber(
    `${input.brandName ?? ""}:${input.niche}:${input.audience}:${input.locale}`
  );
  const baseSlug = slugify(input.brandName ?? input.niche) || "foundation-store";
  const firstWord = titleCase(input.niche).split(" ")[0] || "Store";
  const brandName =
    input.brandName ??
    `${firstWord.slice(0, 64)} ${BRAND_SUFFIXES[seed % BRAND_SUFFIXES.length]}`;
  const palette = PALETTES[seed % PALETTES.length];
  const positioning = `A focused brand foundation for ${input.audience}, created around ${input.niche}. Product-led claims remain locked pending evidence.`;
  const presentation = recommendStorefrontPresentation({
    niche: input.niche,
    positioning,
    brandVoice: input.brandVoice,
  });
  const theme = {
    primaryColor: palette[0],
    secondaryColor: palette[1],
    accentColor: palette[2],
    backgroundColor: palette[3],
    textColor: palette[4],
    borderRadius: "0.75rem",
    fontHeading: input.locale.startsWith("nb") ? "humanist" : "system-ui",
    fontBody: "system-ui",
  };
  const foundation = buildStoreFoundation({
    identity: {
      brandName,
      logoText: brandName.slice(0, 24),
      niche: input.niche,
      audience: input.audience,
      brandVoice: input.brandVoice,
      locale: input.locale,
      country: input.country,
    },
    positioning,
    presentation,
    theme,
  });
  const currency = currencyFor(input.locale, input.country);
  const primaryDomain = `${baseSlug}.preview.example`;
  const settings: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    presentation,
    foundation,
    compliance: {
      ...DEFAULT_STORE_SETTINGS.compliance,
      showDropshipDisclosure: false,
      importTaxDisclaimer:
        "Commerce, fulfillment and tax treatment are not configured for this inactive foundation.",
    },
    automation: {
      ...DEFAULT_STORE_SETTINGS.automation,
      importDefaultSupplier: "",
      importKeywords: [],
    },
    personalization: {
      ...DEFAULT_STORE_SETTINGS.personalization,
      enabled: false,
    },
  };

  return {
    version: FOUNDATION_STORE_PLAN_VERSION,
    baseSlug,
    brandName,
    positioning,
    primaryDomain,
    plannedDomain: input.plannedDomain ?? null,
    locale: input.locale,
    currency,
    theme,
    foundation,
    settings,
  };
}

function stableNumber(value: string): number {
  let result = 0;
  for (const character of value) {
    result = (result * 31 + character.charCodeAt(0)) >>> 0;
  }
  return result;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function currencyFor(locale: string, country: string): string {
  const normalized = `${locale} ${country}`.toLowerCase();
  if (/\b(?:no|norway|nb-no|nn-no)\b/.test(normalized)) return "NOK";
  if (/\b(?:se|sweden|sv-se)\b/.test(normalized)) return "SEK";
  if (/\b(?:dk|denmark|da-dk)\b/.test(normalized)) return "DKK";
  if (/\b(?:gb|united kingdom|en-gb)\b/.test(normalized)) return "GBP";
  if (/\b(?:de|fr|es|it|nl|fi|euro)\b/.test(normalized)) return "EUR";
  return "USD";
}
