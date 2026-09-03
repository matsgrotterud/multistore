import { prisma } from "@/lib/db";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { contrastRatio } from "@/lib/theme";
import { proposeStoreFoundation } from "@/lib/admin/store-foundation";
import { auditStoreFoundation } from "@/lib/storefront/store-foundation-audit";
import {
  evaluateStoreOperatingReadiness,
  type StoreOperatingReadiness,
} from "@/lib/readiness/store-operating-readiness";
import {
  decideAdminContentPolicy,
  validateFaqBody,
} from "@/lib/content/admin-content-policy";
import { CONTENT_PAGE_TYPES, type ContentPageType } from "@/lib/types";

export interface StoreReadinessPortfolioReport {
  stores: StoreOperatingReadiness[];
  summary: {
    totalStores: number;
    readyForReview: number;
    needsWork: number;
    launchAuthorized: 0;
    activeUnattributableExperiments: number;
  };
}

export interface PersistedContentPolicyRow {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  noindex: boolean;
}

/**
 * Read-only database collector for provider-independent store readiness. It
 * performs no network, provider, AI, DNS, payment or persistence operation.
 */
export async function getStoreReadinessPortfolioReport(): Promise<StoreReadinessPortfolioReport> {
  const stores = await prisma.store.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      legalName: true,
      logoText: true,
      niche: true,
      positioning: true,
      audience: true,
      valueProposition: true,
      brandVoice: true,
      locale: true,
      supportEmail: true,
      privacyPolicy: true,
      termsOfSale: true,
      returnPolicySummary: true,
      shippingOriginDisclosure: true,
      primaryDomain: true,
      plannedDomain: true,
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
      domains: { select: { hostname: true, isPrimary: true } },
      contentPages: {
        select: {
          id: true,
          type: true,
          title: true,
          excerpt: true,
          body: true,
          seoTitle: true,
          seoDescription: true,
          isPublished: true,
          noindex: true,
        },
      },
      experiments: { select: { isActive: true } },
      _count: { select: { cartEvents: true } },
    },
  });

  const reports = stores.map((store) => {
    const settings = parseStoreSettings(store.settings?.settings);
    const proposed = proposeStoreFoundation(store);
    const currentAudit = settings.foundation
      ? auditStoreFoundation(settings.foundation, {
          expectedInputDigest: proposed.inputDigest,
        })
      : null;
    const inputCurrent =
      settings.foundation?.inputDigest === proposed.inputDigest;
    const theme = store.theme ?? {
      primaryColor: "#1d4ed8",
      backgroundColor: "#f8fafc",
      textColor: "#0f172a",
    };
    const malformedSeoPages = store.contentPages.filter(
      (page) =>
        page.title.trim().length < 3 ||
        page.body.trim().length < 20 ||
        page.seoTitle.trim().length < 10 ||
        page.seoTitle.trim().length > 70 ||
        page.seoDescription.trim().length < 40 ||
        page.seoDescription.trim().length > 170
    ).length;
    const publishedPages = store.contentPages.filter(
      (page) => page.isPublished
    ).length;
    const policyViolationPages = countPersistedContentPolicyViolations({
      storeLaunchStatus: store.launchStatus,
      pages: store.contentPages,
    });
    const intendedHostname = productionHostnameIntent({
      plannedDomain: store.plannedDomain,
      primaryDomain: store.primaryDomain,
    });

    return evaluateStoreOperatingReadiness({
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        launchStatus: store.launchStatus,
        isActive: store.isActive,
      },
      foundation: {
        persisted: settings.foundation !== null,
        auditStatus: currentAudit?.status ?? "REVIEW",
        inputCurrent,
        seoDraftNoindex:
          settings.foundation?.seoDraft.status === "DRAFT_NOINDEX",
      },
      brand: {
        identityFieldsComplete: [
          store.name,
          store.logoText,
          store.niche,
          store.positioning,
          store.audience,
          store.valueProposition,
          store.brandVoice,
        ].every((value) => value.trim().length > 0),
        supportEmailPresent: /.+@.+\..+/.test(store.supportEmail),
        legalNameLooksProvisional:
          /\b(?:preview|placeholder|tbd)\b/i.test(store.legalName) ||
          store.supportEmail.endsWith(".preview.example"),
      },
      design: {
        presentationExplicit: settings.presentation !== null,
        textContrastPasses:
          contrastRatio(theme.textColor, theme.backgroundColor) >= 4.5,
      },
      content: {
        totalPages: store.contentPages.length,
        publishedPages,
        draftPages: store.contentPages.length - publishedPages,
        malformedSeoPages,
        policyViolationPages,
        nonLivePublishedWithoutNoindex:
          store.launchStatus === "LIVE"
            ? 0
            : store.contentPages.filter(
                (page) => page.isPublished && !page.noindex
              ).length,
        types: Array.from(
          new Set(store.contentPages.map((page) => page.type))
        ).sort(),
      },
      seo: {
        defaultOgImagePresent: settings.seo.defaultOgImage.trim().length > 0,
        // Verified from src/app/robots.ts and centralized metadata builders;
        // this collector intentionally performs no request or domain probe.
        robotsFailClosedForNonLive: true,
      },
      legal: {
        privacyPresent: store.privacyPolicy.trim().length > 0,
        termsPresent: store.termsOfSale.trim().length > 0,
        returnsPresent: store.returnPolicySummary.trim().length > 0,
        shippingDisclosurePresent:
          store.shippingOriginDisclosure.trim().length > 0,
        // requireAdmin is a shared-password session and exposes no actor ID.
        authenticatedReviewerAvailable: false,
      },
      consent: {
        cookiePolicyUrlPresent:
          settings.compliance.cookiePolicyUrl.trim().length > 0,
        versionedConsentContract: true,
        withdrawalControlAvailable: true,
      },
      domain: {
        intendedHostname,
        mappedHostnameCount: store.domains.length,
        // Domain rows are routing data, not verification receipts.
        ownershipVerified: null,
        dnsReady: null,
        tlsReady: null,
      },
      measurement: {
        eventCount: store._count.cartEvents,
        hostBoundIngestion: true,
        authenticatedTelemetry: false,
        marketingIdsConfigured: Boolean(
          settings.marketing.metaPixelId.trim() ||
            settings.marketing.googleAdsId.trim()
        ),
      },
      experimentation: {
        totalExperiments: store.experiments.length,
        activeExperiments: store.experiments.filter(
          (experiment) => experiment.isActive
        ).length,
        assignmentLedgerAvailable: false,
        orderAttributionAvailable: false,
      },
    });
  });

  const ordered = [...reports].sort((left, right) => {
    const decision = { NEEDS_WORK: 0, READY_FOR_REVIEW: 1 } as const;
    return (
      decision[left.preCatalogDecision] - decision[right.preCatalogDecision] ||
      left.store.name.localeCompare(right.store.name) ||
      left.store.id.localeCompare(right.store.id)
    );
  });

  return {
    stores: ordered,
    summary: {
      totalStores: ordered.length,
      readyForReview: ordered.filter(
        (report) => report.preCatalogDecision === "READY_FOR_REVIEW"
      ).length,
      needsWork: ordered.filter(
        (report) => report.preCatalogDecision === "NEEDS_WORK"
      ).length,
      launchAuthorized: 0,
      activeUnattributableExperiments: stores.reduce(
        (total, store) =>
          total +
          store.experiments.filter((experiment) => experiment.isActive).length,
        0
      ),
    },
  };
}

export function countPersistedContentPolicyViolations(input: {
  storeLaunchStatus: string;
  pages: readonly PersistedContentPolicyRow[];
}): number {
  return input.pages.filter((page) => {
    if (!isContentPageType(page.type)) return true;
    if (page.type === "FAQ" && !validateFaqBody(page.body)) return true;
    const siblings = input.pages.filter((sibling) => sibling.id !== page.id);
    const decision = decideAdminContentPolicy({
      storeLaunchStatus: input.storeLaunchStatus,
      type: page.type,
      title: page.title,
      excerpt: page.excerpt,
      body: page.body,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      requestedPublished: page.isPublished,
      requestedNoindex: page.noindex,
      siblingTexts: siblings.map((sibling) => sibling.body),
      anotherPublishedSingletonExists: siblings.some(
        (sibling) => sibling.type === page.type && sibling.isPublished
      ),
    });
    return (
      decision.isPublished !== page.isPublished ||
      decision.noindex !== page.noindex
    );
  }).length;
}

function isContentPageType(value: string): value is ContentPageType {
  return (CONTENT_PAGE_TYPES as readonly string[]).includes(value);
}

function productionHostnameIntent(input: {
  plannedDomain: string | null;
  primaryDomain: string;
}): string | null {
  const planned = input.plannedDomain?.trim().toLowerCase();
  if (planned) return planned;
  const primary = input.primaryDomain.trim().toLowerCase();
  if (!primary || primary.endsWith(".preview.example")) return null;
  return primary;
}
