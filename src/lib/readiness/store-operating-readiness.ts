export const STORE_OPERATING_READINESS_VERSION =
  "store-operating-readiness.v1" as const;

export type StoreReadinessArea =
  | "FOUNDATION"
  | "BRAND"
  | "DESIGN"
  | "CONTENT"
  | "SEO"
  | "LEGAL"
  | "CONSENT"
  | "DOMAIN"
  | "MEASUREMENT"
  | "EXPERIMENTATION";

export type StoreReadinessStatus = "PASS" | "REVIEW" | "BLOCKED" | "UNKNOWN";

export interface StoreReadinessGate {
  area: StoreReadinessArea;
  status: StoreReadinessStatus;
  reasonCode: string;
  summary: string;
  evidenceRefs: string[];
}

export interface StoreReadinessAction {
  priority: "P0" | "P1" | "P2";
  area: StoreReadinessArea;
  code: string;
  title: string;
  detail: string;
}

export interface StoreOperatingReadinessInput {
  store: {
    id: string;
    slug: string;
    name: string;
    launchStatus: string;
    isActive: boolean;
  };
  foundation: {
    persisted: boolean;
    auditStatus: "PASS" | "REVIEW";
    inputCurrent: boolean;
    seoDraftNoindex: boolean;
  };
  brand: {
    identityFieldsComplete: boolean;
    supportEmailPresent: boolean;
    legalNameLooksProvisional: boolean;
  };
  design: {
    presentationExplicit: boolean;
    textContrastPasses: boolean;
  };
  content: {
    totalPages: number;
    publishedPages: number;
    draftPages: number;
    malformedSeoPages: number;
    policyViolationPages: number;
    nonLivePublishedWithoutNoindex: number;
    types: string[];
  };
  seo: {
    defaultOgImagePresent: boolean;
    robotsFailClosedForNonLive: boolean;
  };
  legal: {
    privacyPresent: boolean;
    termsPresent: boolean;
    returnsPresent: boolean;
    shippingDisclosurePresent: boolean;
    authenticatedReviewerAvailable: boolean;
  };
  consent: {
    cookiePolicyUrlPresent: boolean;
    versionedConsentContract: boolean;
    withdrawalControlAvailable: boolean;
  };
  domain: {
    intendedHostname: string | null;
    mappedHostnameCount: number;
    ownershipVerified: boolean | null;
    dnsReady: boolean | null;
    tlsReady: boolean | null;
  };
  measurement: {
    eventCount: number;
    hostBoundIngestion: boolean;
    authenticatedTelemetry: boolean;
    marketingIdsConfigured: boolean;
  };
  experimentation: {
    totalExperiments: number;
    activeExperiments: number;
    assignmentLedgerAvailable: boolean;
    orderAttributionAvailable: boolean;
  };
}

export interface StoreOperatingReadiness {
  version: typeof STORE_OPERATING_READINESS_VERSION;
  store: StoreOperatingReadinessInput["store"];
  preCatalogDecision: "READY_FOR_REVIEW" | "NEEDS_WORK";
  launchAuthorized: false;
  gates: StoreReadinessGate[];
  actions: StoreReadinessAction[];
  limitations: string[];
}

/**
 * Provider-independent readiness for work that can be completed before a
 * catalog exists. This never authorizes LIVE, indexing, checkout or spend.
 */
export function evaluateStoreOperatingReadiness(
  input: StoreOperatingReadinessInput
): StoreOperatingReadiness {
  const gates = [
    foundationGate(input),
    brandGate(input),
    designGate(input),
    contentGate(input),
    seoGate(input),
    legalGate(input),
    consentGate(input),
    domainGate(input),
    measurementGate(input),
    experimentationGate(input),
  ];
  const foundationalAreas = new Set<StoreReadinessArea>([
    "FOUNDATION",
    "BRAND",
    "DESIGN",
    "CONTENT",
    "SEO",
  ]);
  const foundationalBlocked = gates.some(
    (gate) => foundationalAreas.has(gate.area) && gate.status === "BLOCKED"
  );

  return {
    version: STORE_OPERATING_READINESS_VERSION,
    store: input.store,
    preCatalogDecision: foundationalBlocked ? "NEEDS_WORK" : "READY_FOR_REVIEW",
    launchAuthorized: false,
    gates,
    actions: actionsFor(gates),
    limitations: [
      "This report evaluates provider-independent preparation only and cannot approve a catalog, checkout or LIVE transition.",
      "Legal text presence is not legal review, and the shared-password admin has no authenticated operator identity.",
      "A planned or mapped hostname is not ownership, DNS, TLS or canonical evidence.",
      "CartEvent rows are unauthenticated advisory telemetry and can be spoofed.",
      "The current Experiment model has no assignment ledger or verified order attribution.",
    ],
  };
}

function foundationGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.foundation.persisted) {
    return gate(
      "FOUNDATION",
      "BLOCKED",
      "FOUNDATION_NOT_SAVED",
      "No versioned Store Foundation draft is saved.",
      ["settings.foundation"]
    );
  }
  if (!input.foundation.inputCurrent || input.foundation.auditStatus !== "PASS") {
    return gate(
      "FOUNDATION",
      "BLOCKED",
      "FOUNDATION_STALE_OR_REVIEW",
      "Foundation identity, copy or design evidence needs review.",
      ["settings.foundation.inputDigest", "settings.foundation.audit"]
    );
  }
  return gate(
    "FOUNDATION",
    "PASS",
    "FOUNDATION_CURRENT",
    "The saved foundation is current and passes its provider-independent audit.",
    ["settings.foundation.foundationDigest"]
  );
}

function brandGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.brand.identityFieldsComplete || !input.brand.supportEmailPresent) {
    return gate(
      "BRAND",
      "BLOCKED",
      "BRAND_IDENTITY_INCOMPLETE",
      "Brand identity or customer contact fields are incomplete.",
      ["store.identity", "store.supportEmail"]
    );
  }
  if (input.brand.legalNameLooksProvisional) {
    return gate(
      "BRAND",
      "REVIEW",
      "SELLER_IDENTITY_PROVISIONAL",
      "Brand identity is usable for a draft, but seller identity remains provisional.",
      ["store.legalName"]
    );
  }
  return gate(
    "BRAND",
    "PASS",
    "BRAND_IDENTITY_COMPLETE",
    "Core brand and contact fields are present.",
    ["store.identity", "store.supportEmail"]
  );
}

function designGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.design.textContrastPasses) {
    return gate(
      "DESIGN",
      "BLOCKED",
      "TEXT_CONTRAST_FAILED",
      "Theme body text does not meet the 4.5:1 contrast threshold.",
      ["store.theme.textColor", "store.theme.backgroundColor"]
    );
  }
  if (!input.design.presentationExplicit) {
    return gate(
      "DESIGN",
      "REVIEW",
      "PRESENTATION_NOT_EXPLICIT",
      "The store still relies on a compatibility or recommended presentation rather than an explicit saved direction.",
      ["settings.presentation"]
    );
  }
  return gate(
    "DESIGN",
    "PASS",
    "PRESENTATION_EXPLICIT",
    "A versioned presentation is saved and body text contrast passes.",
    ["settings.presentation", "store.theme"]
  );
}

function contentGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (input.content.policyViolationPages > 0) {
    return gate(
      "CONTENT",
      "BLOCKED",
      "CONTENT_POLICY_VIOLATION",
      `${input.content.policyViolationPages} persisted content page(s) violate current claim, route, FAQ or singleton publication policy.`,
      ["contentPage.policy", "admin-content-policy.v1"]
    );
  }
  if (input.content.nonLivePublishedWithoutNoindex > 0) {
    return gate(
      "CONTENT",
      "BLOCKED",
      "NONLIVE_CONTENT_ROW_INDEXABLE",
      `${input.content.nonLivePublishedWithoutNoindex} published content row(s) would become indexable immediately after a LIVE transition.`,
      ["contentPage.isPublished", "contentPage.noindex"]
    );
  }
  if (input.content.malformedSeoPages > 0) {
    return gate(
      "CONTENT",
      "REVIEW",
      "CONTENT_SEO_INCOMPLETE",
      `${input.content.malformedSeoPages} content page(s) have incomplete or out-of-bound metadata.`,
      ["contentPage.seoTitle", "contentPage.seoDescription"]
    );
  }
  if (input.content.totalPages === 0) {
    return gate(
      "CONTENT",
      "REVIEW",
      "CONTENT_INVENTORY_EMPTY",
      "No persistent content pages exist yet; foundation briefs can be refined without publishing them.",
      ["contentPage.count"]
    );
  }
  return gate(
    "CONTENT",
    "PASS",
    "CONTENT_INVENTORY_VALID",
    `${input.content.totalPages} content page(s) have structurally valid metadata and safe row-level index settings.`,
    ["contentPage.count", "contentPage.metadata"]
  );
}

function seoGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.foundation.seoDraftNoindex || !input.seo.robotsFailClosedForNonLive) {
    return gate(
      "SEO",
      "BLOCKED",
      "NOINDEX_CONTRACT_MISSING",
      "Foundation SEO or non-LIVE robots behavior is not fail-closed.",
      ["settings.foundation.seoDraft.status", "robots.nonLive"]
    );
  }
  return gate(
    "SEO",
    input.seo.defaultOgImagePresent ? "PASS" : "REVIEW",
    input.seo.defaultOgImagePresent ? "SEO_DRAFT_COMPLETE" : "OG_IMAGE_PENDING",
    input.seo.defaultOgImagePresent
      ? "Noindex draft metadata and a default social image are configured."
      : "Noindex draft metadata is safe; a default social image remains to be produced.",
    ["settings.foundation.seoDraft", "settings.seo.defaultOgImage"]
  );
}

function legalGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  const present =
    input.legal.privacyPresent &&
    input.legal.termsPresent &&
    input.legal.returnsPresent &&
    input.legal.shippingDisclosurePresent;
  if (!present) {
    return gate(
      "LEGAL",
      "BLOCKED",
      "POLICY_TEXT_INCOMPLETE",
      "One or more privacy, terms, returns or disclosure fields are empty.",
      ["store.policyFields"]
    );
  }
  return gate(
    "LEGAL",
    "REVIEW",
    input.legal.authenticatedReviewerAvailable
      ? "POLICY_REVIEW_REQUIRED"
      : "AUTHENTICATED_REVIEWER_UNAVAILABLE",
    "Policy text exists, but presence is not verified legal review or launch evidence.",
    ["store.policyFields", "admin.actorIdentity"]
  );
}

function consentGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.consent.cookiePolicyUrlPresent) {
    return gate(
      "CONSENT",
      "BLOCKED",
      "COOKIE_POLICY_URL_MISSING",
      "No cookie policy URL is configured.",
      ["settings.compliance.cookiePolicyUrl"]
    );
  }
  if (
    !input.consent.versionedConsentContract ||
    !input.consent.withdrawalControlAvailable
  ) {
    return gate(
      "CONSENT",
      "REVIEW",
      "CONSENT_LIFECYCLE_INCOMPLETE",
      "Consent is opt-in, but policy versioning and a persistent withdrawal/preferences control are missing.",
      ["consent.contract", "consent.withdrawal"]
    );
  }
  return gate(
    "CONSENT",
    "PASS",
    "CONSENT_LIFECYCLE_READY",
    "Versioned consent and withdrawal controls are available.",
    ["consent.contract"]
  );
}

function domainGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.domain.intendedHostname) {
    return gate(
      "DOMAIN",
      "BLOCKED",
      "DOMAIN_INTENT_MISSING",
      "No production hostname intent is recorded.",
      ["store.plannedDomain"]
    );
  }
  if (
    input.domain.ownershipVerified !== true ||
    input.domain.dnsReady !== true ||
    input.domain.tlsReady !== true
  ) {
    return gate(
      "DOMAIN",
      "UNKNOWN",
      "DOMAIN_EVIDENCE_UNAVAILABLE",
      `Hostname ${input.domain.intendedHostname} is intent or routing data only; ownership, DNS and TLS are not verified.`,
      ["store.plannedDomain", "domain.mapping"]
    );
  }
  return gate(
    "DOMAIN",
    "PASS",
    "DOMAIN_EVIDENCE_VERIFIED",
    "Ownership, DNS and TLS evidence are verified for the intended hostname.",
    ["domain.ownership", "domain.dns", "domain.tls"]
  );
}

function measurementGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (!input.measurement.hostBoundIngestion || !input.measurement.authenticatedTelemetry) {
    return gate(
      "MEASUREMENT",
      "REVIEW",
      "TELEMETRY_ADVISORY_ONLY",
      `${input.measurement.eventCount} event(s) exist, but client-selected tenant data remains unauthenticated and advisory.`,
      ["cartEvent.count", "track.tenantBinding"]
    );
  }
  return gate(
    "MEASUREMENT",
    "PASS",
    "MEASUREMENT_CONTRACT_READY",
    "Tenant-bound authenticated telemetry is available.",
    ["track.contract"]
  );
}

function experimentationGate(input: StoreOperatingReadinessInput): StoreReadinessGate {
  if (input.experimentation.activeExperiments > 0) {
    return gate(
      "EXPERIMENTATION",
      "BLOCKED",
      "UNATTRIBUTABLE_EXPERIMENT_ACTIVE",
      `${input.experimentation.activeExperiments} experiment(s) are active without a safe assignment and order-attribution ledger.`,
      ["experiment.isActive", "experiment.assignmentLedger"]
    );
  }
  return gate(
    "EXPERIMENTATION",
    "REVIEW",
    "EXPERIMENT_RUNTIME_NOT_READY",
    `${input.experimentation.totalExperiments} inactive experiment draft(s); no winner or lift may be claimed.`,
    ["experiment.count", "experiment.assignmentLedger", "order.attribution"]
  );
}

function gate(
  area: StoreReadinessArea,
  status: StoreReadinessStatus,
  reasonCode: string,
  summary: string,
  evidenceRefs: string[]
): StoreReadinessGate {
  return { area, status, reasonCode, summary, evidenceRefs };
}

function actionsFor(gates: readonly StoreReadinessGate[]): StoreReadinessAction[] {
  return gates
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => ({
      priority: gate.status === "BLOCKED" ? "P0" as const : gate.status === "UNKNOWN" ? "P1" as const : "P2" as const,
      area: gate.area,
      code: gate.reasonCode,
      title: actionTitle(gate),
      detail: gate.summary,
    }))
    .sort((left, right) => {
      const priority = { P0: 0, P1: 1, P2: 2 } as const;
      return (
        priority[left.priority] - priority[right.priority] ||
        left.area.localeCompare(right.area) ||
        left.code.localeCompare(right.code)
      );
    });
}

function actionTitle(gate: StoreReadinessGate): string {
  const titles: Partial<Record<string, string>> = {
    FOUNDATION_NOT_SAVED: "Save the versioned Store Foundation",
    FOUNDATION_STALE_OR_REVIEW: "Refresh and review the Store Foundation",
    BRAND_IDENTITY_INCOMPLETE: "Complete brand and contact identity",
    TEXT_CONTRAST_FAILED: "Repair theme contrast",
    NONLIVE_CONTENT_ROW_INDEXABLE: "Keep non-LIVE content rows noindex",
    NOINDEX_CONTRACT_MISSING: "Restore fail-closed noindex behavior",
    POLICY_TEXT_INCOMPLETE: "Complete policy drafts",
    COOKIE_POLICY_URL_MISSING: "Add a cookie policy destination",
    DOMAIN_INTENT_MISSING: "Record a production hostname intent",
    UNATTRIBUTABLE_EXPERIMENT_ACTIVE: "Deactivate unattributable experiments",
  };
  return titles[gate.reasonCode] ?? `Review ${gate.area.toLowerCase()}`;
}
