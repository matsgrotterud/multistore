import { prisma } from "@/lib/db";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import {
  normalizeStorefrontPresentation,
  recommendStorefrontPresentation,
} from "@/lib/storefront/presentation";
import { buildStoreFoundation } from "@/lib/storefront/store-foundation";
import { auditStoreFoundation } from "@/lib/storefront/store-foundation-audit";
import type {
  StoreFoundationAuditV1,
  StoreFoundationOverrides,
  StoreFoundationV1,
} from "@/lib/storefront/store-foundation-contract";

const DEFAULT_THEME = {
  primaryColor: "#1d4ed8",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
};

export interface StoreFoundationSource {
  name: string;
  logoText: string;
  niche: string;
  audience: string;
  brandVoice: string;
  positioning: string;
  locale: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  } | null;
  settings: { settings: string } | null;
}

export interface StoreFoundationStudioData {
  store: {
    slug: string;
    name: string;
    launchStatus: string;
    isActive: boolean;
  };
  foundation: StoreFoundationV1;
  currentAudit: StoreFoundationAuditV1;
  persisted: boolean;
}

export function proposeStoreFoundation(
  source: StoreFoundationSource,
  overrides?: StoreFoundationOverrides
): StoreFoundationV1 {
  const settings = parseStoreSettings(source.settings?.settings);
  const presentation = settings.presentation
    ? normalizeStorefrontPresentation(settings.presentation)
    : recommendStorefrontPresentation({
        niche: source.niche,
        positioning: source.positioning,
        brandVoice: source.brandVoice,
      });
  return buildStoreFoundation({
    identity: {
      brandName: source.name,
      logoText: source.logoText,
      niche: source.niche,
      audience: source.audience,
      brandVoice: source.brandVoice,
      locale: source.locale,
      country: countryFromLocale(source.locale),
    },
    positioning: source.positioning,
    presentation,
    theme: source.theme ?? DEFAULT_THEME,
    overrides,
  });
}

export async function getStoreFoundationStudioData(
  slug: string
): Promise<StoreFoundationStudioData | null> {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      logoText: true,
      niche: true,
      audience: true,
      brandVoice: true,
      positioning: true,
      locale: true,
      launchStatus: true,
      isActive: true,
      theme: {
        select: {
          primaryColor: true,
          backgroundColor: true,
          textColor: true,
        },
      },
      settings: { select: { settings: true } },
    },
  });
  if (!store) return null;

  const settings = parseStoreSettings(store.settings?.settings);
  const proposed = proposeStoreFoundation(store);
  const foundation = settings.foundation ?? proposed;
  const currentAudit = auditStoreFoundation(foundation, {
    expectedInputDigest: proposed.inputDigest,
  });

  return {
    store: {
      slug: store.slug,
      name: store.name,
      launchStatus: store.launchStatus,
      isActive: store.isActive,
    },
    foundation,
    currentAudit,
    persisted: settings.foundation !== null,
  };
}

function countryFromLocale(locale: string): string {
  const region = locale.trim().split(/[-_]/)[1]?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) ? region : "Unspecified market";
}
