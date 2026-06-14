import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { computeProductScore } from "../src/lib/products/product-score";
import {
  DEFAULT_STORE_SETTINGS,
  serializeStoreSettings,
} from "../src/lib/settings/store-settings";
import { bambooPolicies, bambooSeed } from "./seed-data/bamboo-toothbrushes";
import { dronesPolicies, dronesSeed } from "./seed-data/drones";
import { ergonomicPolicies, ergonomicSeed } from "./seed-data/ergonomic-office";
import { hikingPolicies, hikingSeed } from "./seed-data/hiking-gear";
import { petGroomingPolicies, petGroomingSeed } from "./seed-data/pet-grooming";
import type { SeedProductInput, SeedStore } from "./seed-data/types";

/**
 * Seed script: validates every product with Zod, computes margins and
 * product scores with the same libraries the app uses, and builds five
 * complete stores. Idempotent — re-running wipes and recreates seeded
 * stores by slug.
 *
 * Run with: npm run db:seed
 */

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Suppliers (reliability feeds the product score)
// ---------------------------------------------------------------------------

const SUPPLIERS: Array<{
  name: string;
  type: string;
  reliabilityScore: number;
  averageShippingDays: number;
  notes: string;
}> = [
  { name: "MockSupply Co", type: "aggregator", reliabilityScore: 0.85, averageShippingDays: 10, notes: "Default mock adapter supplier for local development." },
  { name: "SkyTech Wholesale", type: "dropship", reliabilityScore: 0.86, averageShippingDays: 10, notes: "Drone and electronics supplier; lithium battery shipping adds transit time." },
  { name: "GreenLeaf Supply", type: "dropship", reliabilityScore: 0.9, averageShippingDays: 8, notes: "Sustainable consumables; plastic-free packaging program." },
  { name: "ComfortLine Trading", type: "dropship", reliabilityScore: 0.88, averageShippingDays: 9, notes: "Ergonomics and home-office equipment." },
  { name: "PetCare Direct", type: "dropship", reliabilityScore: 0.87, averageShippingDays: 8, notes: "Pet grooming tools and care products." },
  { name: "TrailGear Wholesale", type: "dropship", reliabilityScore: 0.89, averageShippingDays: 10, notes: "Outdoor equipment; weights verified per production batch." },
];

const RELIABILITY = new Map(SUPPLIERS.map((supplier) => [supplier.name, supplier.reliabilityScore]));

// ---------------------------------------------------------------------------
// Validation (inline so the seed runs standalone under tsx)
// ---------------------------------------------------------------------------

const seedProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subtitle: z.string(),
  description: z.string().min(80),
  shortDescription: z.string().min(20).max(300),
  brand: z.string().min(1),
  sku: z.string().min(3),
  price: z.number().positive(),
  cost: z.number().positive(),
  shippingCost: z.number().min(0),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER"]),
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  returnable: z.boolean(),
  pros: z.array(z.string()).min(2),
  cons: z.array(z.string()).min(1),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).min(3),
  useCases: z.array(z.string()).min(1),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  seoTitle: z.string().min(10),
  seoDescription: z.string().min(40),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENT_FEE_RATE = 0.029;
const PAYMENT_FEE_FIXED = 0.3;

function grossMarginPercent(product: SeedProductInput): number {
  const fees = product.price * PAYMENT_FEE_RATE + PAYMENT_FEE_FIXED;
  const margin = product.price - product.cost - product.shippingCost - fees;
  return Math.round((margin / product.price) * 1000) / 10;
}

function placeholderImage(title: string, sku: string): string {
  return `/api/placeholder?label=${encodeURIComponent(title.slice(0, 36))}&seed=${encodeURIComponent(sku)}`;
}

// ---------------------------------------------------------------------------
// Store builder
// ---------------------------------------------------------------------------

async function seedStore(
  seed: SeedStore,
  policies: { privacyPolicy: string; termsOfSale: string }
): Promise<void> {
  const { store: info } = seed;
  console.log(`\nSeeding store: ${info.name} (${info.slug})`);

  // Idempotency: wipe and recreate this store.
  await prisma.store.deleteMany({ where: { slug: info.slug } });

  const store = await prisma.store.create({
    data: {
      slug: info.slug,
      name: info.name,
      legalName: info.legalName,
      primaryDomain: info.primaryDomain,
      locale: info.locale,
      currency: info.currency,
      niche: info.niche,
      positioning: info.positioning,
      audience: info.audience,
      valueProposition: info.valueProposition,
      brandVoice: info.brandVoice,
      logoText: info.logoText,
      supportEmail: info.supportEmail,
      supportPhone: info.supportPhone ?? null,
      shippingOriginDisclosure: info.shippingOriginDisclosure,
      defaultShippingDaysMin: info.defaultShippingDaysMin,
      defaultShippingDaysMax: info.defaultShippingDaysMax,
      returnPolicySummary: info.returnPolicySummary,
      privacyPolicy: policies.privacyPolicy,
      termsOfSale: policies.termsOfSale,
      isActive: true,
      theme: { create: seed.theme },
      settings: {
        create: { settings: serializeStoreSettings(DEFAULT_STORE_SETTINGS) },
      },
      domains: {
        create: seed.domains.map((hostname, index) => ({
          hostname,
          isPrimary: index === 0,
        })),
      },
    },
  });

  const productIdBySlug = new Map<string, string>();
  let productCount = 0;

  for (const categorySeed of seed.categories) {
    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        slug: categorySeed.slug,
        name: categorySeed.name,
        description: categorySeed.description,
        seoTitle: categorySeed.seoTitle,
        seoDescription: categorySeed.seoDescription,
        heroTitle: categorySeed.heroTitle,
        heroSubtitle: categorySeed.heroSubtitle,
        sortOrder: categorySeed.sortOrder,
      },
    });

    for (const productSeed of categorySeed.products) {
      const validation = seedProductSchema.safeParse(productSeed);
      if (!validation.success) {
        throw new Error(
          `Seed validation failed for ${info.slug}/${productSeed.slug}: ${validation.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")}`
        );
      }

      const marginPercent = grossMarginPercent(productSeed);
      const productScore = computeProductScore({
        marginPercent,
        shippingDaysMin: productSeed.shippingDaysMin,
        shippingDaysMax: productSeed.shippingDaysMax,
        supplierReliability: RELIABILITY.get(productSeed.supplierName) ?? 0.8,
        stockStatus: productSeed.stockStatus,
        returnRiskRate: productSeed.returnable ? 0.04 : 0.01,
        content: {
          descriptionLength: productSeed.description.length,
          prosCount: productSeed.pros.length,
          consCount: productSeed.cons.length,
          specsCount: productSeed.specs.length,
          faqCount: productSeed.faq.length,
          useCasesCount: productSeed.useCases.length,
          hasImageAlt: true,
        },
      });

      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: category.id,
          slug: productSeed.slug,
          title: productSeed.title,
          subtitle: productSeed.subtitle,
          description: productSeed.description,
          shortDescription: productSeed.shortDescription,
          brand: productSeed.brand,
          sku: productSeed.sku,
          gtin: productSeed.gtin ?? null,
          imageUrl: placeholderImage(productSeed.title, productSeed.sku),
          imageAlt: `${productSeed.title} — ${productSeed.subtitle}`,
          price: productSeed.price,
          compareAtPrice: productSeed.compareAtPrice ?? null,
          currency: info.currency,
          cost: productSeed.cost,
          shippingCost: productSeed.shippingCost,
          marginPercent,
          stockStatus: productSeed.stockStatus,
          supplierName: productSeed.supplierName,
          supplierProductId: productSeed.supplierProductId,
          shippingDaysMin: productSeed.shippingDaysMin,
          shippingDaysMax: productSeed.shippingDaysMax,
          countryOfOrigin: productSeed.countryOfOrigin ?? null,
          materials: productSeed.materials ?? null,
          warranty: productSeed.warranty ?? null,
          returnable: productSeed.returnable,
          // Honesty rule: no fake review data. Ratings stay null/0 until the
          // platform collects real verified reviews.
          ratingAverage: null,
          ratingCount: 0,
          pros: JSON.stringify(productSeed.pros),
          cons: JSON.stringify(productSeed.cons),
          specs: JSON.stringify(productSeed.specs),
          useCases: JSON.stringify(productSeed.useCases),
          faq: JSON.stringify(productSeed.faq),
          seoTitle: productSeed.seoTitle,
          seoDescription: productSeed.seoDescription,
          canonicalUrl: `https://${info.primaryDomain}/p/${productSeed.slug}`,
          productScore,
          isPublished: true,
          noindex: false,
        },
      });

      productIdBySlug.set(productSeed.slug, product.id);
      productCount += 1;
    }
  }

  const resolveIds = (slugs: string[]): string[] =>
    slugs
      .map((slug) => productIdBySlug.get(slug))
      .filter((id): id is string => {
        if (!id) throw new Error(`Unknown product slug referenced in content: ${id}`);
        return true;
      });

  for (const guide of seed.guides) {
    await prisma.contentPage.create({
      data: {
        storeId: store.id,
        slug: guide.slug,
        type: "GUIDE",
        title: guide.title,
        excerpt: guide.excerpt,
        body: guide.body,
        seoTitle: guide.seoTitle,
        seoDescription: guide.seoDescription,
        heroImageUrl: placeholderImage(guide.title, `guide-${guide.slug}`),
        relatedProductIds: JSON.stringify(resolveIds(guide.relatedProductSlugs)),
        isPublished: true,
        noindex: false,
      },
    });
  }

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: seed.comparison.slug,
      type: "COMPARISON",
      title: seed.comparison.title,
      excerpt: seed.comparison.excerpt,
      body: seed.comparison.body,
      seoTitle: seed.comparison.seoTitle,
      seoDescription: seed.comparison.seoDescription,
      relatedProductIds: JSON.stringify(resolveIds(seed.comparison.productSlugs)),
      isPublished: true,
      noindex: false,
    },
  });

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: "faq",
      type: "FAQ",
      title: `${info.name} — Frequently asked questions`,
      excerpt: `Shipping, returns and product questions for ${info.name}.`,
      body: JSON.stringify(seed.homepageFaq),
      seoTitle: `FAQ | ${info.name}`,
      seoDescription: `Common questions about shipping, returns and products at ${info.name}.`,
      isPublished: true,
      noindex: false,
    },
  });

  // A featured collection per store (top products by score).
  const topProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    take: 4,
    select: { id: true },
  });
  await prisma.collection.create({
    data: {
      storeId: store.id,
      slug: "featured",
      title: "Featured picks",
      description: `The current top-scoring products at ${info.name}.`,
      productIds: JSON.stringify(topProducts.map((product) => product.id)),
      seoTitle: `Featured picks | ${info.name}`,
      seoDescription: `Our current top-rated ${info.niche} picks, ranked by product score.`,
    },
  });

  // Example A/B experiment scaffold (inactive by default).
  await prisma.experiment.create({
    data: {
      storeId: store.id,
      key: "hero-cta-copy",
      name: "Homepage hero CTA copy",
      variantA: JSON.stringify({ cta: "Shop bestsellers" }),
      variantB: JSON.stringify({ cta: "Find my match in 60 seconds" }),
      isActive: false,
    },
  });

  console.log(`  ✓ ${seed.categories.length} categories, ${productCount} products, ${seed.guides.length} guides, 1 comparison, FAQ, collection`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Seeding suppliers…");
  for (const supplier of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      create: supplier,
      update: supplier,
    });
  }

  const stores: Array<[SeedStore, { privacyPolicy: string; termsOfSale: string }]> = [
    [dronesSeed, dronesPolicies],
    [bambooSeed, bambooPolicies],
    [ergonomicSeed, ergonomicPolicies],
    [petGroomingSeed, petGroomingPolicies],
    [hikingSeed, hikingPolicies],
  ];

  for (const [seed, policies] of stores) {
    await seedStore(seed, policies);
  }

  const totals = await prisma.$transaction([
    prisma.store.count(),
    prisma.product.count(),
    prisma.contentPage.count(),
  ]);
  console.log(
    `\nDone: ${totals[0]} stores, ${totals[1]} products, ${totals[2]} content pages.`
  );
  console.log("Open http://localhost:3000/?store=drones to browse.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
