import { prisma } from "@/lib/db";
import type { StoreBlueprint, StoreBlueprintInput } from "@/lib/ai/types";
import { generateBuyingGuideOutline } from "@/lib/ai/store-blueprint";
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStoreInfo,
} from "../../../prisma/seed-data/types";
import { importProductsForStore } from "@/lib/suppliers/import-products";
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

export interface CreateStoreFromBlueprintOptions {
  blueprint: StoreBlueprint;
  input: StoreBlueprintInput;
  /** Import mock supplier products into each category. Default true. */
  importProducts?: boolean;
  /** Publish imported products that meet the auto-publish score threshold. */
  autoPublishScored?: boolean;
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
  launchStatus: "PREVIEW";
  categoriesCreated: number;
  productsDiscovered: number;
  productsImported: number;
  productsPublished: number;
  candidatesRejected: number;
  rejectionReasons: string[];
  guidesCreated: number;
  products: GeneratedProductSummary[];
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
  input: StoreBlueprintInput
): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    homepage: {
      ...DEFAULT_STORE_SETTINGS.homepage,
      showQuizCta: true,
      showComparisonCta: blueprint.categories.length >= 2,
      trustBarItems: blueprint.homepageSections
        .filter((section) => section.toLowerCase().includes("trust"))
        .slice(0, 3),
    },
    automation: {
      ...DEFAULT_STORE_SETTINGS.automation,
      importKeywords: blueprint.productImportQueries,
      importDefaultSupplier: "MockSupply Co",
    },
    compliance: {
      ...DEFAULT_STORE_SETTINGS.compliance,
      showDropshipDisclosure: true,
      importTaxDisclaimer: `Import duties or taxes may apply on delivery in ${input.country}.`,
    },
  };
}

function buildProductQueryVariants(input: StoreBlueprintInput, categoryName: string): string[] {
  const niche = input.niche.toLowerCase();
  const variants = [
    input.niche,
    `${input.niche} ${categoryName}`,
    categoryName,
    ...input.productKeywords.map((keyword) => `${keyword} ${input.niche}`),
  ];

  if (/(toy|toys|child|children|kid|kids)/i.test(niche)) {
    variants.push(
      "wooden toys",
      "educational toys",
      "montessori toys",
      "stem toys",
      "puzzle toys"
    );
  }
  if (/(pet|groom|dog|cat)/i.test(niche)) {
    variants.push("pet grooming brush", "pet comb", "dog grooming", "cat grooming brush");
  }
  if (/(hiking|camp|outdoor|backpack)/i.test(niche)) {
    variants.push("hiking backpack", "camping gear", "trekking accessories");
  }

  return variants;
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

  const categories = blueprint.categories.slice(0, 4);
  if (categories.length === 0) {
    categories.push({
      slug: slugify(input.niche) || "catalog",
      name: input.niche,
      description: blueprint.tagline,
    });
  }

  const store = await prisma.store.create({
    data: {
      slug: storeSlug,
      name: blueprint.brandName,
      legalName: policyInfo.legalName,
      primaryDomain: policyInfo.primaryDomain,
      plannedDomain,
      launchStatus: "PREVIEW",
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
      isActive: true,
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
          settings: serializeStoreSettings(buildStoreSettings(blueprint, input)),
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

  let productsImported = 0;
  let productsPublished = 0;
  let productsDiscovered = 0;
  let candidatesRejected = 0;

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

    if (importProducts) {
      const query =
        blueprint.productImportQueries[index] ??
        blueprint.productImportQueries[0] ??
        categorySeed.name;
      const imported = await importProductsForStore({
        storeSlug: store.slug,
        categorySlug: category.slug,
        query,
        queryVariants: buildProductQueryVariants(input, categorySeed.name),
        targetMargin: 0.35,
      });
      productsImported += imported.imported;
      productsDiscovered += imported.discovered;
      candidatesRejected += imported.rejected;

      if (autoPublishScored && imported.imported > 0) {
        const settings = buildStoreSettings(blueprint, input);
        const threshold = settings.automation.autoPublishMinScore;
        // Publish high-scoring imports with media. `noindex` is left to the
        // product's own (content-quality-driven) value so READY products can be
        // indexed once the store goes Live; preview stores are noindexed via
        // launchStatus regardless.
        const publishResult = await prisma.product.updateMany({
          where: {
            storeId: store.id,
            categoryId: category.id,
            productScore: { gte: threshold },
            mediaStatus: "OK",
          },
          data: { isPublished: true },
        });
        productsPublished += publishResult.count;
      }
    }
  }

  const faqBody = JSON.stringify(
    blueprint.faqIdeas.slice(0, 8).map((question) => ({
      question,
      answer: blueprint.shippingDisclosure,
    }))
  );

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

  let guidesCreated = 0;
  const guideTopic = blueprint.guideIdeas[0] ?? `How to choose ${input.niche}`;
  const outline = await generateBuyingGuideOutline({
    niche: input.niche,
    topic: guideTopic,
    audience: input.audience,
  });

  const guideBody = [
    `## ${outline.directAnswer}`,
    "",
    outline.sections
      .map(
        (section) =>
          `## ${section.heading}\n\n${section.points.map((point) => `- ${point}`).join("\n")}`
      )
      .join("\n\n"),
    "",
    "## Shipping & returns",
    "",
    blueprint.shippingDisclosure,
    "",
    blueprint.trustCopy,
  ].join("\n");

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: outline.slug || slugify(guideTopic),
      type: "GUIDE",
      title: outline.title,
      excerpt: outline.directAnswer,
      body: guideBody,
      seoTitle: `${outline.title} | ${blueprint.brandName}`,
      seoDescription: outline.directAnswer.slice(0, 155),
      heroImageUrl: `/api/placeholder?label=${encodeURIComponent(blueprint.brandName)}&seed=guide`,
      relatedProductIds: "[]",
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
        title: "Featured picks",
        description: `Top-scoring ${input.niche} products at ${blueprint.brandName}.`,
        productIds: JSON.stringify(topProducts.map((product) => product.id)),
        seoTitle: `Featured | ${blueprint.brandName}`,
        seoDescription: blueprint.seoDescription.slice(0, 155),
      },
    });
  }

  const importedProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    include: {
      category: { select: { slug: true } },
      _count: { select: { images: true, variants: true } },
    },
  });
  const manualCjFulfillment =
    process.env.CJ_MANUAL_FULFILLMENT_ENABLED === "true" ||
    process.env.MANUAL_FULFILLMENT_ENABLED === "true";
  const products: GeneratedProductSummary[] = importedProducts.map((product) => ({
    slug: product.slug,
    title: product.title,
    previewPath: `/s/${store.slug}/c/${product.category.slug}/p/${product.slug}`,
    imageCount: product._count.images,
    variantCount: product._count.variants,
    published: product.isPublished,
    noindex: product.noindex,
    checkoutAvailable:
      product.fulfillmentMode === "MOCK" ||
      (product.fulfillmentMode === "DROPSHIP" &&
        Boolean(product.externalId) &&
        (product.providerKey === "mock" ||
          (product.providerKey === "cj" && manualCjFulfillment))),
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

  return {
    storeSlug: store.slug,
    storeName: store.name,
    previewUrl: getStorePreviewUrl(store.slug),
    previewQueryUrl: getStoreQueryPreviewUrl(store.slug),
    plannedDomain,
    launchStatus: "PREVIEW",
    categoriesCreated: categories.length,
    productsDiscovered,
    productsImported,
    productsPublished,
    candidatesRejected,
    rejectionReasons,
    guidesCreated,
    products,
  };
}
