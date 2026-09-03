import { prisma } from "@/lib/db";
import type { StoreBlueprint, StoreBlueprintInput, ProductCountGoal } from "@/lib/ai/types";
import {
  deriveNegativeKeywords,
} from "@/lib/ai/category-strategy";
import {
  buildClassQueryPlanV1,
  buildGenerationResultV1,
  profileFromOntologyV1,
  resolveNicheIntentV1,
  resolveCatalogProviderKeysV1,
  GENERATION_RESULT_VERSION,
  EVALUATOR_VERSION,
  INTENT_VERSION,
  ONTOLOGY_VERSION,
  type GenerationResultV1,
  type ClassQueryPlanV1,
  type NicheIntentV1,
  type ProductClassProfileV1,
} from "@/lib/generator-v3";
import {
  completeGenerationRun,
  GENERATOR_VERSION,
  updateGenerationRun,
} from "@/lib/generator/generation-run";
import { decideCatalogVisibilityV3 } from "@/lib/stores/catalog-visibility-v3";
import { isProductCheckoutAvailable } from "@/lib/stores/checkout-availability";
import {
  ProviderSearchFailure,
  type ProviderQueryAttempt,
} from "@/lib/catalog/provider-search-policy";
import { assertSafeMediaWriteContext } from "@/lib/storage/media-storage-safety";
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStoreInfo,
} from "../../../prisma/seed-data/types";
import {
  importProductsForStore,
  importRelevantEnrichedCandidates,
} from "@/lib/suppliers/import-products";
import { resolveLocaleCurrency } from "@/lib/stores/locale-defaults";
import {
  getStorePreviewUrl,
  getStoreQueryPreviewUrl,
} from "@/lib/stores/preview-url";
import {
  DEFAULT_STORE_SETTINGS,
  serializeStoreSettings,
  type StoreSettings,
} from "@/lib/settings/store-settings";
import { recommendStorefrontPresentation } from "@/lib/storefront/presentation";
import { buildStoreFoundation } from "@/lib/storefront/store-foundation";

export interface CreateStoreFromBlueprintOptions {
  blueprint: StoreBlueprint;
  input: StoreBlueprintInput;
  /** Import mock supplier products into each category. Default true. */
  importProducts?: boolean;
  /** Publish imported products that meet the auto-publish score threshold. */
  autoPublishScored?: boolean;
  /** Persisted CatalogSyncRun.id used as the idempotency key. */
  generationRunId: string;
  /** Explicit local proof mode. Never inferred as a fallback from provider failure. */
  providerKeys?: string[];
  /** Exact signed-plan catalog truth. Runtime classes cannot be reconstructed from Store.niche. */
  preparedCatalogPlan?: {
    classProfile: ProductClassProfileV1;
    intent: NicheIntentV1;
    queryPlan: ClassQueryPlanV1;
    planDigest: string;
  };
}

export interface GeneratedProductSummary {
  slug: string;
  title: string;
  /** Internal preview path: /s/[store]/c/[category]/p/[product]. */
  previewPath: string;
  imageCount: number;
  variantCount: number;
  published: boolean;
  noindex: boolean;
  checkoutAvailable: boolean;
}

export interface CreateStoreFromBlueprintResult {
  storeSlug: string;
  storeName: string;
  previewUrl: string;
  previewQueryUrl: string;
  plannedDomain: string | null;
  launchStatus: "DRAFT" | "PREVIEW";
  runId: string;
  generationStatus: GenerationResultV1["status"];
  previewReady: boolean;
  manualReviewRequired: boolean;
  productClass: string | null;
  intentConfidence: number;
  policyDecision: NicheIntentV1["policyDecision"];
  liveCommerceAllowed: boolean;
  autonomousLaunchAllowed: boolean;
  categoriesCreated: number;
  productsDiscovered: number;
  productsImported: number;
  productsPublished: number;
  productsRelevant: number;
  productsPreviewVisible: number;
  importBudget: number;
  candidatesRejected: number;
  rejectionReasons: string[];
  guidesCreated: number;
  products: GeneratedProductSummary[];
  /** Supplier import queries used (store-wide), for admin visibility. */
  importQueries: string[];
  /** Imported products that ended up with zero images. */
  productsWithoutMedia: number;
  /** Non-fatal issues during import (per-category failures, etc.). */
  warnings: string[];
  providerAttempts: ProviderQueryAttempt[];
  /** Provider-independent brand/content/SEO draft stored for admin review. */
  foundationStatus: "PASS" | "REVIEW";
}

/**
 * Bounded, configurable import targets per product-count goal. Sync import stays
 * demo-fast; "broad" catalogs are imported at the standard bound for now and a
 * note is surfaced (background expansion is a future step).
 */
const IMPORT_GOALS: Record<
  ProductCountGoal,
  { maxCategories: number; perCategory: number; totalImport: number; minPublish: number }
> = {
  small: { maxCategories: 3, perCategory: 3, totalImport: 8, minPublish: 8 },
  standard: { maxCategories: 4, perCategory: 4, totalImport: 12, minPublish: 12 },
  broad: { maxCategories: 4, perCategory: 4, totalImport: 12, minPublish: 12 },
};

/** Upper bound on stored media per product (informational; ingestion-side cap). */
export const MAX_MEDIA_PER_PRODUCT = 8;

/**
 * Provider keys used for generated-store imports. Mirrors the resolution in
 * import-products.ts so StoreSupplierSettings and discovery stay consistent.
 */
function importProviderKeys(explicit?: string[]): string[] {
  return resolveCatalogProviderKeysV1({
    explicit,
    configuredCsv: process.env.CATALOG_IMPORT_PROVIDER_KEYS,
  });
}

function fulfillmentModeForProvider(providerKey: string): string {
  if (providerKey === "mock") return "MOCK";
  if (providerKey === "cj" || providerKey === "doba") return "DROPSHIP";
  return "AFFILIATE";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "store";
  let suffix = 2;
  while (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${slugify(base).slice(0, 40)}-${suffix++}`;
  }
  return slug;
}

function normalizeDomain(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function buildStoreSettings(
  blueprint: StoreBlueprint,
  input: StoreBlueprintInput,
  runId: string,
  intent: NicheIntentV1,
  queryPlan: ClassQueryPlanV1,
  classProfile: ProductClassProfileV1,
  planDigest: string | null,
  goal: { totalImport: number; minPublish: number }
): StoreSettings {
  const presentation = recommendStorefrontPresentation({
    niche: input.niche,
    positioning: blueprint.tagline,
    brandVoice: input.brandVoice,
  });
  const foundation = buildStoreFoundation({
    identity: {
      brandName: blueprint.brandName,
      logoText: blueprint.brandName.slice(0, 24),
      niche: input.niche,
      audience: input.audience,
      brandVoice: input.brandVoice,
      locale: input.locale,
      country: input.country,
    },
    positioning: blueprint.tagline,
    presentation,
    theme: {
      primaryColor: blueprint.themeColors.primary,
      backgroundColor: blueprint.themeColors.background,
      textColor: blueprint.themeColors.text,
    },
  });
  return {
    ...DEFAULT_STORE_SETTINGS,
    homepage: {
      ...DEFAULT_STORE_SETTINGS.homepage,
      showQuizCta: true,
      showComparisonCta: false,
      trustBarItems: blueprint.homepageSections
        .filter((section) => section.toLowerCase().includes("trust"))
        .slice(0, 3),
    },
    presentation,
    foundation,
    automation: {
      ...DEFAULT_STORE_SETTINGS.automation,
      importKeywords: queryPlan.queries.map((entry) => entry.query),
      importDefaultSupplier: "MockSupply Co",
    },
    compliance: {
      ...DEFAULT_STORE_SETTINGS.compliance,
      showDropshipDisclosure: true,
      importTaxDisclaimer: `Import duties or taxes may apply on delivery in ${input.country}.`,
    },
    generation: {
      contractVersion: GENERATION_RESULT_VERSION,
      runId,
      generatorVersion: GENERATOR_VERSION,
      intentVersion: INTENT_VERSION,
      ontologyVersion: ONTOLOGY_VERSION,
      evaluatorVersion: EVALUATOR_VERSION,
      status: "RUNNING",
      productClass: intent.productClass,
      intentConfidence: intent.confidence,
      policyDecision: intent.policyDecision,
      classProfile,
      planDigest,
      minimumProducts: goal.minPublish,
      relevantProducts: 0,
      previewVisibleProducts: 0,
      importedProducts: 0,
      importBudget: goal.totalImport,
      manualReviewRequired: intent.policyDecision === "MANUAL_REVIEW_REQUIRED",
      manualReviewStatus:
        intent.policyDecision === "MANUAL_REVIEW_REQUIRED" ? "PENDING" : "NOT_REQUIRED",
      humanLaunchApproved: false,
      humanLaunchApprovedBy: null,
      humanLaunchApprovedAt: null,
      liveCommerceAllowed: false,
      autonomousLaunchAllowed: false,
      completedAt: null,
      reasonCodes: [],
    },
  };
}

function completeStoreSettings(
  base: StoreSettings,
  intent: NicheIntentV1,
  result: GenerationResultV1
): StoreSettings {
  if (!base.generation) return base;
  return {
    ...base,
    generation: {
      ...base.generation,
      status: result.status,
      relevantProducts: result.counts.relevantProducts,
      previewVisibleProducts: result.counts.previewVisibleProducts,
      importedProducts: result.counts.importedProducts,
      importBudget: result.counts.importBudget,
      manualReviewRequired: result.manualReviewRequired,
      manualReviewStatus: result.manualReviewRequired ? "PENDING" : "NOT_REQUIRED",
      liveCommerceAllowed: result.liveCommerceAllowed,
      autonomousLaunchAllowed:
        result.status === "READY_FOR_PREVIEW" && intent.autonomousLaunchAllowed,
      completedAt: new Date().toISOString(),
      reasonCodes: result.reasonCodes,
    },
  };
}

function storeInfoForPolicies(
  slug: string,
  blueprint: StoreBlueprint,
  input: StoreBlueprintInput,
  plannedDomain: string | null,
  locale: string,
  currency: string
): SeedStoreInfo {
  const primaryDomain = plannedDomain ?? `${slug}.preview.example`;
  const supportDomain = plannedDomain ?? `${slug}.preview.example`;
  return {
    slug,
    name: blueprint.brandName,
    legalName: `${blueprint.brandName} (Preview)`,
    primaryDomain,
    locale,
    currency,
    niche: input.niche,
    positioning: blueprint.tagline,
    audience: input.audience,
    valueProposition: blueprint.tagline,
    brandVoice: input.brandVoice,
    logoText: blueprint.brandName.slice(0, 24),
    supportEmail: `support@${supportDomain}`,
    shippingOriginDisclosure: blueprint.shippingDisclosure,
    defaultShippingDaysMin: 5,
    defaultShippingDaysMax: 14,
    returnPolicySummary:
      "Return within 30 days of delivery if the item is unused and in original packaging. Contact support to start a return.",
  };
}

/**
 * Persist a generated blueprint as a real tenant: store, theme, settings,
 * categories, optional product import, FAQ and a starter buying guide.
 * New stores launch in PREVIEW mode (noindex) until a production domain is connected.
 */
export async function createStoreFromBlueprint(
  options: CreateStoreFromBlueprintOptions
): Promise<CreateStoreFromBlueprintResult> {
  const { blueprint, input } = options;
  const importProducts = options.importProducts ?? true;
  const autoPublishScored = options.autoPublishScored ?? true;

  // Hardening: when products (and therefore media) will be imported, refuse to
  // proceed if connected to a remote DB while media storage resolves to local.
  // Prevents writing machine-only /uploads/dev-media URLs into a remote DB.
  // Honors the explicit ALLOW_REMOTE_DB_LOCAL_MEDIA=true escape hatch. This runs
  // before any rows are created, so no orphaned store is left behind. It also
  // covers the headless generate-store script that bypasses the admin action.
  if (importProducts) {
    assertSafeMediaWriteContext();
  }

  const storeSlug = await ensureUniqueSlug(blueprint.storeSlug);
  const plannedDomain = normalizeDomain(input.domain);
  const { locale, currency } = resolveLocaleCurrency(input.locale, input.country);
  const policyInfo = storeInfoForPolicies(
    storeSlug,
    blueprint,
    input,
    plannedDomain,
    locale,
    currency
  );

  const goal = IMPORT_GOALS[input.productCountGoal] ?? IMPORT_GOALS.standard;
  const fallbackIntent = resolveNicheIntentV1({
    niche: input.niche,
    endUser: input.endUser,
    negativeKeywords: input.negativeKeywords,
  });
  const intent = options.preparedCatalogPlan?.intent ?? fallbackIntent;
  const queryPlan =
    options.preparedCatalogPlan?.queryPlan ?? buildClassQueryPlanV1(intent);
  const classProfile =
    options.preparedCatalogPlan?.classProfile ??
    profileFromOntologyV1(intent.productClass);
  const rebuiltQueryPlan = buildClassQueryPlanV1(intent);
  if (
    !classProfile ||
    intent.policyDecision === "BLOCK" ||
    intent.productClass !== classProfile.productClass ||
    queryPlan.productClass !== classProfile.productClass ||
    classProfile.policyDecision !== intent.policyDecision ||
    classProfile.liveCommerceAllowed !== intent.liveCommerceAllowed ||
    classProfile.autonomousLaunchAllowed !== intent.autonomousLaunchAllowed ||
    JSON.stringify(queryPlan) !== JSON.stringify(rebuiltQueryPlan) ||
    queryPlan.queries.length === 0
  ) {
    throw new Error("INSUFFICIENT_INTENT_EVIDENCE: no validated product class/query plan.");
  }
  const negativeKeywords = deriveNegativeKeywords({
    niche: input.niche,
    endUser: input.endUser,
    categoryHints: input.categoryHints,
    supplierSearchHints: input.supplierSearchHints,
    negativeKeywords: input.negativeKeywords,
  });

  // Categories are derived from the validated product class. A narrow honest
  // category is preferable to empty merchandising buckets.
  const categories = [classProfile.category].slice(0, goal.maxCategories);
  const initialSettings = buildStoreSettings(
    blueprint,
    input,
    options.generationRunId,
    intent,
    queryPlan,
    classProfile,
    options.preparedCatalogPlan?.planDigest ?? null,
    goal
  );

  const store = await prisma.store.create({
    data: {
      slug: storeSlug,
      name: blueprint.brandName,
      legalName: policyInfo.legalName,
      primaryDomain: policyInfo.primaryDomain,
      plannedDomain,
      launchStatus: "DRAFT",
      locale,
      currency,
      niche: input.niche,
      positioning: blueprint.tagline,
      audience: input.audience,
      valueProposition: blueprint.tagline,
      brandVoice: input.brandVoice,
      logoText: policyInfo.logoText,
      supportEmail: policyInfo.supportEmail,
      shippingOriginDisclosure: blueprint.shippingDisclosure,
      defaultShippingDaysMin: 5,
      defaultShippingDaysMax: 14,
      returnPolicySummary: policyInfo.returnPolicySummary,
      privacyPolicy: defaultPrivacyPolicy(policyInfo),
      termsOfSale: defaultTermsOfSale(policyInfo),
      isActive: false,
      theme: {
        create: {
          primaryColor: blueprint.themeColors.primary,
          secondaryColor: blueprint.themeColors.secondary,
          accentColor: blueprint.themeColors.accent,
          backgroundColor: blueprint.themeColors.background,
          textColor: blueprint.themeColors.text,
          borderRadius: "0.75rem",
          fontHeading: locale.startsWith("nb") ? "humanist" : "system-ui",
          fontBody: "system-ui",
        },
      },
      settings: {
        create: {
          settings: serializeStoreSettings(initialSettings),
        },
      },
      domains: {
        create: [
          ...(plannedDomain
            ? [{ hostname: plannedDomain, isPrimary: true }]
            : []),
          ...(plannedDomain
            ? [{ hostname: `www.${plannedDomain}`, isPrimary: false }]
            : []),
        ],
      },
    },
  });

  await updateGenerationRun(options.generationRunId, {
    storeId: store.id,
    normalizedInput: input,
    intent,
    policy: {
      decision: intent.policyDecision,
      liveCommerceAllowed: intent.liveCommerceAllowed,
      autonomousLaunchAllowed: intent.autonomousLaunchAllowed,
      classProfile,
      planDigest: options.preparedCatalogPlan?.planDigest ?? null,
    },
    phase: {
      phase: "STAGING_STORE_CREATED",
      status: "PASS",
      at: new Date().toISOString(),
      detail: `Inactive DRAFT ${store.slug}`,
    },
  });

  // Persist supplier import settings so discovery has store-specific thresholds
  // and the admin has visibility. Thresholds match the discovery quality-gate
  // floor (score>=50, margin>=25) so good supplier items are not pre-rejected.
  const warnings: string[] = [];
  // Foundation-only mode has no supplier authority and must not resolve a
  // configured/default provider or create StoreSupplierSettings rows.
  const providerKeys = importProducts
    ? importProviderKeys(options.providerKeys)
    : [];
  if (providerKeys.length === 1 && providerKeys[0] === "mock") {
    warnings.push(
      "Synthetic demo catalog enabled. Products, prices, inventory and media are test fixtures and cannot be used for live commerce."
    );
  }
  for (const providerKey of providerKeys) {
    await prisma.storeSupplierSettings.upsert({
      where: { storeId_providerKey: { storeId: store.id, providerKey } },
      update: {
        isEnabled: true,
        importQueries: JSON.stringify(queryPlan.queries.map((entry) => entry.query)),
      },
      create: {
        storeId: store.id,
        providerKey,
        isEnabled: true,
        fulfillmentMode: fulfillmentModeForProvider(providerKey),
        importQueries: JSON.stringify(queryPlan.queries.map((entry) => entry.query)),
        minMarginPercent: 25,
        minProductScore: 50,
        maxShippingDays: 18,
        autoPublish: options.autoPublishScored ?? true,
      },
    });
  }

  let productsImported = 0;
  let productsPublished = 0;
  let productsDiscovered = 0;
  let candidatesRejected = 0;
  let providerFailed = false;
  const importQueriesUsed = new Set<string>();
  const providerAttempts: ProviderQueryAttempt[] = [];
  const catalogSelections: unknown[] = [];
  // Bound synchronous import so generation stays demo-fast and never appears to
  // hang. Categories are still all created; products fill until the budget.
  const IMPORT_BUDGET = goal.totalImport;
  if (input.productCountGoal === "broad") {
    warnings.push(
      "Broad catalog requested: imported up to the demo-safe bound synchronously. Re-run import or background expansion can add more later."
    );
  }

  for (let index = 0; index < categories.length; index++) {
    const categorySeed = categories[index];
    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        slug: categorySeed.slug,
        name: categorySeed.name,
        description: categorySeed.description,
        seoTitle: `${categorySeed.name} | ${blueprint.brandName}`,
        seoDescription: categorySeed.description.slice(0, 155),
        heroTitle: categorySeed.name,
        heroSubtitle: categorySeed.description.slice(0, 120),
        sortOrder: index,
      },
    });

    if (importProducts && productsImported < IMPORT_BUDGET) {
      const categoryQueries = queryPlan.queries.map((entry) => entry.query);
      const query = categoryQueries[0]!;
      categoryQueries.forEach((value) => importQueriesUsed.add(value));
      try {
        const remainingBudget = IMPORT_BUDGET - productsImported;
        const imported = await importProductsForStore({
          storeSlug: store.slug,
          categorySlug: category.slug,
          query,
          queryVariants: categoryQueries.slice(1),
          negativeKeywords,
          intent,
          targetMargin: 0.35,
          limit: remainingBudget,
          providerKeys,
          pricePositioning: input.pricePositioning,
        });
        productsImported += imported.imported;
        productsDiscovered += imported.discovered;
        candidatesRejected += imported.rejected;
        providerAttempts.push(...imported.providerAttempts);
        catalogSelections.push(imported.selectionPlan);
      } catch (error) {
        // One category's import failure must never abort the whole store or
        // leave an orphaned empty store. Record it and continue.
        const message = error instanceof Error ? error.message : "Unknown import error";
        warnings.push(`Product import failed for category "${categorySeed.name}": ${message}`);
        if (error instanceof ProviderSearchFailure) {
          providerAttempts.push(...error.attempts);
        }
        providerFailed = true;
        console.error(`import failed for ${store.slug}/${category.slug}`, error);
      }
    }
  }

  // Budget-aware sweep: per-category import can leave relevant, media-backed
  // candidates unconverted because broad supplier queries overlap and
  // re-categorize the same products across categories. Fill the remaining budget
  // from leftover ENRICHED candidates so a single run reaches the publish target.
  if (importProducts && !providerFailed && productsImported < IMPORT_BUDGET) {
    try {
      const sweep = await importRelevantEnrichedCandidates({
        storeSlug: store.slug,
        remaining: IMPORT_BUDGET - productsImported,
        negativeKeywords,
        intent,
        providerKeys,
        pricePositioning: input.pricePositioning,
      });
      productsImported += sweep.imported;
      if (sweep.selectionPlan) catalogSelections.push(sweep.selectionPlan);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sweep error";
      warnings.push(`Candidate sweep import failed: ${message}`);
    }
  }

  if (autoPublishScored && productsImported > 0) {
    const drafts = await prisma.product.findMany({ where: { storeId: store.id } });
    for (const product of drafts) {
      const decision = decideCatalogVisibilityV3(
        { niche: store.niche, launchStatus: "DRAFT" },
        product
      );
      if (!decision.visible) continue;
      await prisma.product.update({
        where: { id: product.id },
        data: { isPublished: true, noindex: true },
      });
      productsPublished += 1;
    }
  }

  if (importProducts && productsImported > 0 && productsPublished < goal.minPublish) {
    warnings.push(
      `Only ${productsPublished} of ${productsImported} imported products were publishable (target ${goal.minPublish}). ` +
        `Products without usable stored media stay unpublished — see rejection reasons or re-run import.`
    );
  }

  const stagedProducts = await prisma.product.findMany({ where: { storeId: store.id } });
  const visibilityDecisions = stagedProducts.map((product) =>
    decideCatalogVisibilityV3({ niche: store.niche, launchStatus: "DRAFT" }, product)
  );
  const productsRelevant = visibilityDecisions.filter(
    (decision) => decision.evaluation?.relevance.state === "PASS"
  ).length;
  const productsPreviewVisible = visibilityDecisions.filter((decision) => decision.visible).length;
  const generationResult = buildGenerationResultV1({
    intent,
    providerFailed,
    minimumProducts: goal.minPublish,
    relevantProducts: productsRelevant,
    previewVisibleProducts: productsPreviewVisible,
    importedProducts: productsImported,
    importBudget: IMPORT_BUDGET,
  });

  await updateGenerationRun(options.generationRunId, {
    queryAttempts: providerAttempts,
    catalogSelections,
    counts: {
      discovered: productsDiscovered,
      rejected: candidatesRejected,
      relevant: productsRelevant,
      imported: productsImported,
      previewVisible: productsPreviewVisible,
      importBudget: IMPORT_BUDGET,
    },
    reasonCodes: generationResult.reasonCodes,
    phase: {
      phase: "CATALOG_CONTRACT",
      status: generationResult.previewReady ? "PASS" : "FAIL",
      at: new Date().toISOString(),
      detail: generationResult.status,
    },
  });

  let guidesCreated = 0;
  if (generationResult.previewReady) {
  const faqBody = JSON.stringify([
    {
      question: "What is the current delivery estimate?",
      answer: blueprint.shippingDisclosure,
    },
    {
      question: "How do returns work?",
      answer: policyInfo.returnPolicySummary,
    },
    {
      question: "Where does fulfillment happen?",
      answer: policyInfo.shippingOriginDisclosure,
    },
  ]);

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: "faq",
      type: "FAQ",
      title: `${blueprint.brandName} — FAQ`,
      excerpt: `Common questions about ${input.niche}, shipping and returns.`,
      body: faqBody,
      seoTitle: `FAQ | ${blueprint.brandName}`,
      seoDescription: blueprint.seoDescription.slice(0, 155),
      isPublished: true,
      noindex: true,
    },
  });

  const visibleStagedProducts = stagedProducts.filter((_, index) => visibilityDecisions[index]?.visible);
  const guideTitle = `How to compare ${input.niche} in this catalog`;
  const guideExcerpt =
    "A supplier-data checklist for reviewing the products currently visible in this preview.";
  const guideBody = [
    "## Start with the recorded facts",
    "",
    `This noindex preview currently contains ${visibleStagedProducts.length} relevant products. Compare the supplier-provided specifications, option identity, price and delivery estimate on each product page. These products have not been represented as independently tested.`,
    "",
    "## Current catalog evidence",
    "",
    ...visibleStagedProducts.slice(0, 8).map(
      (product) =>
        `- ${product.title}: ${product.price.toFixed(2)} ${product.currency}; supplier delivery estimate ${product.shippingDaysMin}–${product.shippingDaysMax} business days.`
    ),
    "",
    "## Shipping and returns",
    "",
    blueprint.shippingDisclosure,
    "",
    policyInfo.returnPolicySummary,
  ].join("\n");

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: `compare-${slugify(input.niche)}`,
      type: "GUIDE",
      title: guideTitle,
      excerpt: guideExcerpt,
      body: guideBody,
      seoTitle: `${guideTitle} | ${blueprint.brandName}`,
      seoDescription: guideExcerpt.slice(0, 155),
      heroImageUrl: visibleStagedProducts[0]?.imageUrl,
      relatedProductIds: JSON.stringify(visibleStagedProducts.slice(0, 4).map((product) => product.id)),
      isPublished: true,
      noindex: true,
    },
  });
  guidesCreated += 1;

  const topProducts = await prisma.product.findMany({
    where: { storeId: store.id, isPublished: true },
    orderBy: { productScore: "desc" },
    take: 4,
    select: { id: true },
  });

  if (topProducts.length > 0) {
    await prisma.collection.create({
      data: {
        storeId: store.id,
        slug: "featured",
        title: "Current catalog",
        description: `${topProducts.length} currently visible ${input.niche} products at ${blueprint.brandName}.`,
        productIds: JSON.stringify(topProducts.map((product) => product.id)),
        seoTitle: `Current catalog | ${blueprint.brandName}`,
        seoDescription: blueprint.seoDescription.slice(0, 155),
      },
    });
  }
  }

  const completedSettings = completeStoreSettings(initialSettings, intent, generationResult);
  const importedProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    include: {
      category: { select: { slug: true } },
      _count: { select: { images: true, variants: true } },
    },
  });
  const products: GeneratedProductSummary[] = importedProducts.map((product) => ({
    slug: product.slug,
    title: product.title,
    previewPath: `/s/${store.slug}/c/${product.category.slug}/p/${product.slug}`,
    imageCount: product._count.images,
    variantCount: product._count.variants,
    published: product.isPublished,
    noindex: product.noindex,
    checkoutAvailable: isProductCheckoutAvailable(product),
  }));

  const rejectedCandidates = await prisma.productCandidate.findMany({
    where: { storeId: store.id, status: "REJECTED" },
    select: { rejectionReason: true },
    take: 50,
  });
  const rejectionReasons = Array.from(
    new Set(
      rejectedCandidates
        .map((candidate) => candidate.rejectionReason?.trim())
        .filter((reason): reason is string => Boolean(reason))
    )
  ).slice(0, 6);

  const result: CreateStoreFromBlueprintResult = {
    storeSlug: store.slug,
    storeName: store.name,
    previewUrl: getStorePreviewUrl(store.slug),
    previewQueryUrl: getStoreQueryPreviewUrl(store.slug),
    plannedDomain,
    launchStatus: generationResult.previewReady ? "PREVIEW" : "DRAFT",
    runId: options.generationRunId,
    generationStatus: generationResult.status,
    previewReady: generationResult.previewReady,
    manualReviewRequired: generationResult.manualReviewRequired,
    productClass: intent.productClass,
    intentConfidence: intent.confidence,
    policyDecision: intent.policyDecision,
    liveCommerceAllowed: generationResult.liveCommerceAllowed,
    autonomousLaunchAllowed:
      generationResult.status === "READY_FOR_PREVIEW" && intent.autonomousLaunchAllowed,
    categoriesCreated: categories.length,
    productsDiscovered,
    productsImported,
    productsPublished,
    productsRelevant,
    productsPreviewVisible,
    importBudget: IMPORT_BUDGET,
    candidatesRejected,
    rejectionReasons,
    guidesCreated,
    products,
    importQueries: Array.from(importQueriesUsed).slice(0, 12),
    productsWithoutMedia: products.filter((product) => product.imageCount === 0).length,
    warnings,
    providerAttempts,
    foundationStatus: initialSettings.foundation?.audit.status ?? "REVIEW",
  };
  // This is the only visibility boundary in the current wizard path. The
  // store remains inactive while discovery, media, content and validation are
  // progressively staged. Activation and the terminal audit record commit in
  // one transaction, so a crash cannot expose a PREVIEW with a RUNNING audit.
  await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: store.id },
      data: {
        launchStatus: generationResult.previewReady ? "PREVIEW" : "DRAFT",
        isActive: generationResult.previewReady,
        settings: {
          update: { settings: serializeStoreSettings(completedSettings) },
        },
      },
    });
    await completeGenerationRun({
      runId: options.generationRunId,
      status: generationResult.status,
      result,
      reasonCodes: generationResult.reasonCodes,
      errorMessage:
        generationResult.status === "PROVIDER_FAILED"
          ? warnings.join(" ") || "Provider discovery failed."
          : undefined,
    }, tx);
  });
  return result;
}
