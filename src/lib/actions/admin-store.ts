"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getBoolean,
  getCsv,
  getLines,
  getNumber,
  getOptionalString,
  getString,
} from "@/lib/actions/form";
import {
  serializeStoreSettings,
  storeSettingsSchema,
  type StoreSettings,
} from "@/lib/settings/store-settings";

export interface AdminActionState {
  ok: boolean;
  error: string | null;
  message?: string;
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb hex color");

const storeUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  legalName: z.string().min(1, "Legal name is required"),
  primaryDomain: z.string().min(1, "Primary domain is required"),
  locale: z.string().min(2),
  currency: z.string().min(3).max(3),
  niche: z.string().min(1),
  positioning: z.string().min(1),
  audience: z.string().min(1),
  valueProposition: z.string().min(1),
  brandVoice: z.string().min(1),
  logoText: z.string().min(1),
  supportEmail: z.string().email("Enter a valid support email"),
  supportPhone: z.string().nullable(),
  shippingOriginDisclosure: z.string().min(1),
  defaultShippingDaysMin: z.number().int().min(1),
  defaultShippingDaysMax: z.number().int().min(1),
  returnPolicySummary: z.string().min(1),
  privacyPolicy: z.string().min(1),
  termsOfSale: z.string().min(1),
  isActive: z.boolean(),
});

const themeUpdateSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  borderRadius: z.string().min(1),
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
});

function readStoreSettingsForm(formData: FormData): StoreSettings {
  const raw = {
    seo: {
      defaultOgImage: getString(formData, "s_seo_defaultOgImage"),
      googleSiteVerification: getString(formData, "s_seo_googleSiteVerification"),
      robotsExtraDisallow: getLines(formData, "s_seo_robotsExtraDisallow"),
      hreflangLocales: getCsv(formData, "s_seo_hreflangLocales"),
    },
    homepage: {
      heroVariant: getString(formData, "s_home_heroVariant"),
      featuredCollectionSlug: getString(formData, "s_home_featuredCollectionSlug"),
      showQuizCta: getBoolean(formData, "s_home_showQuizCta"),
      showComparisonCta: getBoolean(formData, "s_home_showComparisonCta"),
      trustBarItems: getLines(formData, "s_home_trustBarItems"),
    },
    monetization: {
      targetMarginPercent: getNumber(formData, "s_mon_targetMarginPercent", 35),
      minMarginPercent: getNumber(formData, "s_mon_minMarginPercent", 15),
      enableCompareAtPrice: getBoolean(formData, "s_mon_enableCompareAtPrice"),
      bundleDiscountPercent: getNumber(formData, "s_mon_bundleDiscountPercent", 8),
      subscriptionSkus: getCsv(formData, "s_mon_subscriptionSkus"),
    },
    marketing: {
      metaPixelId: getString(formData, "s_mkt_metaPixelId"),
      googleAdsId: getString(formData, "s_mkt_googleAdsId"),
      utmDefaultSource: getString(formData, "s_mkt_utmDefaultSource"),
    },
    personalization: {
      enabled: getBoolean(formData, "s_per_enabled"),
      quizWeight: getNumber(formData, "s_per_quizWeight", 2),
      browseHistoryWeight: getNumber(formData, "s_per_browseHistoryWeight", 1),
    },
    automation: {
      autoPublishMinScore: getNumber(formData, "s_auto_autoPublishMinScore", 70),
      autoNoindexBelowScore: getNumber(formData, "s_auto_autoNoindexBelowScore", 40),
      importDefaultSupplier: getString(formData, "s_auto_importDefaultSupplier"),
      importKeywords: getCsv(formData, "s_auto_importKeywords"),
    },
    compliance: {
      showDropshipDisclosure: getBoolean(formData, "s_comp_showDropshipDisclosure"),
      importTaxDisclaimer: getString(formData, "s_comp_importTaxDisclaimer"),
      cookiePolicyUrl: getString(formData, "s_comp_cookiePolicyUrl"),
    },
  };
  // storeSettingsSchema fills any blank/invalid field with its default.
  return storeSettingsSchema.parse(raw);
}

export async function updateStoreAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const slug = getString(formData, "slug");
  if (!slug) return { ok: false, error: "Missing store identifier." };

  const storeParsed = storeUpdateSchema.safeParse({
    name: getString(formData, "name"),
    legalName: getString(formData, "legalName"),
    primaryDomain: getString(formData, "primaryDomain"),
    locale: getString(formData, "locale"),
    currency: getString(formData, "currency").toUpperCase(),
    niche: getString(formData, "niche"),
    positioning: getString(formData, "positioning"),
    audience: getString(formData, "audience"),
    valueProposition: getString(formData, "valueProposition"),
    brandVoice: getString(formData, "brandVoice"),
    logoText: getString(formData, "logoText"),
    supportEmail: getString(formData, "supportEmail"),
    supportPhone: getOptionalString(formData, "supportPhone"),
    shippingOriginDisclosure: getString(formData, "shippingOriginDisclosure"),
    defaultShippingDaysMin: getNumber(formData, "defaultShippingDaysMin", 5),
    defaultShippingDaysMax: getNumber(formData, "defaultShippingDaysMax", 12),
    returnPolicySummary: getString(formData, "returnPolicySummary"),
    privacyPolicy: getString(formData, "privacyPolicy"),
    termsOfSale: getString(formData, "termsOfSale"),
    isActive: getBoolean(formData, "isActive"),
  });
  if (!storeParsed.success) {
    return { ok: false, error: storeParsed.error.issues[0]?.message ?? "Invalid store data." };
  }

  const themeParsed = themeUpdateSchema.safeParse({
    primaryColor: getString(formData, "primaryColor"),
    secondaryColor: getString(formData, "secondaryColor"),
    accentColor: getString(formData, "accentColor"),
    backgroundColor: getString(formData, "backgroundColor"),
    textColor: getString(formData, "textColor"),
    borderRadius: getString(formData, "borderRadius"),
    fontHeading: getString(formData, "fontHeading"),
    fontBody: getString(formData, "fontBody"),
  });
  if (!themeParsed.success) {
    return { ok: false, error: themeParsed.error.issues[0]?.message ?? "Invalid theme data." };
  }

  if (storeParsed.data.defaultShippingDaysMax < storeParsed.data.defaultShippingDaysMin) {
    return { ok: false, error: "Shipping days max must be ≥ shipping days min." };
  }

  const settings = readStoreSettingsForm(formData);

  // Hostnames: one per line; the one matching primaryDomain is flagged primary.
  const hostnames = Array.from(
    new Set(
      [storeParsed.data.primaryDomain, ...getLines(formData, "domains")].map((host) =>
        host.toLowerCase()
      )
    )
  );

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return { ok: false, error: "Store not found." };

  // Guard against stealing a domain already mapped to another store.
  const conflict = await prisma.domain.findFirst({
    where: { hostname: { in: hostnames }, storeId: { not: store.id } },
  });
  if (conflict) {
    return { ok: false, error: `Domain ${conflict.hostname} is already used by another store.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: store.id },
      data: {
        ...storeParsed.data,
        theme: {
          upsert: {
            create: themeParsed.data,
            update: themeParsed.data,
          },
        },
        settings: {
          upsert: {
            create: { settings: serializeStoreSettings(settings) },
            update: { settings: serializeStoreSettings(settings) },
          },
        },
      },
    });

    await tx.domain.deleteMany({ where: { storeId: store.id } });
    await tx.domain.createMany({
      data: hostnames.map((hostname) => ({
        storeId: store.id,
        hostname,
        isPrimary: hostname === storeParsed.data.primaryDomain.toLowerCase(),
      })),
    });
  });

  revalidatePath(`/s/${slug}`, "layout");
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${slug}/edit`);

  return { ok: true, error: null, message: "Store saved." };
}
