import {
  buildStoreImportQueries,
  deriveStoreCategories,
} from "@/lib/ai/category-strategy";
import type {
  AiProvider,
  CategoryPlan,
  CategoryPlanInput,
  GuideOutline,
  GuideOutlineInput,
  ProductCopy,
  ProductCopyInput,
  StoreBlueprint,
  StoreBlueprintInput,
} from "@/lib/ai/types";

/**
 * Deterministic mock AI provider. Produces structured, guardrail-compliant
 * output from templates + a seeded hash, so the admin generator works fully
 * offline. Replace via getAiProvider() in store-blueprint.ts when wiring a
 * real LLM.
 */

const PALETTES: StoreBlueprint["themeColors"][] = [
  { primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b", background: "#fafaf9", text: "#1c1917" },
  { primary: "#1d4ed8", secondary: "#1e293b", accent: "#06b6d4", background: "#f8fafc", text: "#0f172a" },
  { primary: "#9d174d", secondary: "#4c0519", accent: "#fb923c", background: "#fff7f5", text: "#27141a" },
  { primary: "#3f6212", secondary: "#1a2e05", accent: "#eab308", background: "#f7fee7", text: "#1a2e05" },
  { primary: "#7c3aed", secondary: "#2e1065", accent: "#10b981", background: "#faf5ff", text: "#1e1b4b" },
  { primary: "#b45309", secondary: "#451a03", accent: "#0ea5e9", background: "#fffbeb", text: "#292524" },
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock-deterministic";

  async generateStoreBlueprint(
    input: StoreBlueprintInput
  ): Promise<StoreBlueprint> {
    const domainKey = input.domain ?? input.niche;
    const seed = hash(domainKey + input.niche);
    const nicheTitle = titleCase(input.niche);
    const brandName = `${nicheTitle.split(" ")[0]} ${["Haven", "Hub", "Studio", "Works", "Atelier", "Supply"][seed % 6]}`;

    // Categories come from the deterministic strategy (categoryHints -> vertical
    // detector -> merchandising fallback) — never from raw supplier keywords.
    const categories = deriveStoreCategories({
      niche: input.niche,
      endUser: input.endUser,
      categoryHints: input.categoryHints,
      supplierSearchHints: input.supplierSearchHints,
      negativeKeywords: input.negativeKeywords,
      audience: input.audience,
    });
    const productImportQueries = buildStoreImportQueries({
      niche: input.niche,
      endUser: input.endUser,
      categoryHints: input.categoryHints,
      supplierSearchHints: input.supplierSearchHints,
      negativeKeywords: input.negativeKeywords,
    });

    return {
      storeSlug: slugify(input.niche),
      brandName,
      tagline: `A focused ${nicheTitle} catalog for ${input.audience}, with supplier-backed product details.`,
      categories,
      homepageSections: [
        "Hero with niche value proposition",
        "Trust bar (shipping window, returns, support)",
        "Featured categories",
        "Top products by product score",
        "How-to-choose guide block",
        "Product finder quiz CTA",
        "Comparison CTA",
        "Newsletter capture",
        "FAQ",
        "Shipping & returns disclosure",
      ],
      seoTitle: `${brandName} — ${nicheTitle} for ${input.audience}`,
      seoDescription: `Browse ${input.niche} with supplier-provided specifications, price and delivery estimates for ${input.country}.`,
      guideIdeas: [
        `How to choose ${input.niche}: a practical buyer's guide`,
        `${nicheTitle} under $100: what you actually get`,
        `Beginner mistakes to avoid when buying ${input.niche}`,
        `${nicheTitle} comparison: budget vs. premium`,
        `How long does ${input.niche} shipping really take?`,
        `${nicheTitle} care and maintenance basics`,
        `Which ${input.niche} fits ${input.audience}?`,
        `${nicheTitle} specs decoded: what matters and what is marketing`,
        `Gift guide: ${input.niche} for every budget`,
        `Sustainability and ${input.niche}: what to look for`,
      ],
      faqIdeas: [
        "How long does delivery take?",
        "Where do products ship from?",
        "What is the return policy?",
        "Do prices include taxes and import fees?",
        "How do I track my order?",
        "What happens if my item arrives damaged?",
        "Do you offer warranties?",
        "How do I choose between models?",
        "Can I cancel or change my order?",
        "How do I contact support?",
      ],
      productImportQueries,
      themeColors: PALETTES[seed % PALETTES.length],
      trustCopy: [
        `Product records at ${brandName} are built from supplier catalog data and remain in noindex preview until the catalog gates pass.`,
        `Specifications, prices and delivery windows identify their supplier source where available.`,
        `Supplier estimates can change and must be checked again before a commercial launch.`,
        `Customer feedback is displayed only after it has been collected by this store from a completed order.`,
      ].join(" "),
      shippingDisclosure: `Orders are fulfilled by partner suppliers. Product pages show the currently available supplier delivery estimate for ${input.country}; actual transit can vary and must be confirmed before launch.`,
      monetizationIdeas: [
        "Bundle complementary accessories at a small discount",
        "Subscription for consumable refills where applicable",
        "Email flows: quiz result follow-up, guide digests",
        "Affiliate fallback links for low-margin hero products",
        "Premium support / extended warranty upsell",
      ],
      qualityChecklist: [
        "Shipping window stated on every product page",
        "Return policy linked near every add-to-cart",
        "No review markup without real review data",
        "Category pages have 3+ published products or noindex",
        "Each guide answers the query in the first 120 words",
        "All images have descriptive alt text",
        "Margin >= 25% or affiliate fallback configured",
        "Supplier reliability >= 0.7 for featured products",
      ],
    };
  }

  async generateCategoryPlan(input: CategoryPlanInput): Promise<CategoryPlan> {
    const keywords = input.keywords.length > 0 ? input.keywords : [input.niche];
    return {
      categories: keywords.slice(0, 5).map((keyword) => ({
        slug: slugify(keyword),
        name: titleCase(keyword),
        description: `${titleCase(keyword)} selected for ${input.audience}: compared on real specs, shipping speed and price-to-value.`,
        seoTitle: `Best ${titleCase(keyword)} for ${input.audience}`,
        targetQueries: [
          `best ${keyword}`,
          `${keyword} for ${input.audience}`,
          `${keyword} buying guide`,
        ],
      })),
    };
  }

  async generateBuyingGuideOutline(
    input: GuideOutlineInput
  ): Promise<GuideOutline> {
    return {
      title: `${titleCase(input.topic)}: A Practical Guide for ${titleCase(input.audience)}`,
      slug: slugify(input.topic),
      directAnswer: `Start by matching the ${input.niche} product class to your use case, then compare only the supplier facts available for relevant catalog items.`,
      sections: [
        { heading: "The short answer", points: ["Direct recommendation up front", "Who should buy what"] },
        { heading: "What actually matters", points: ["3-5 decision criteria", "Specs that are marketing noise"] },
        { heading: "Best for each use case", points: ["Budget pick", "Best overall", "Premium pick"] },
        { heading: "Comparison table", points: ["Side-by-side specs from the catalog"] },
        { heading: "Shipping and returns", points: ["Realistic delivery windows", "Return process"] },
        { heading: "FAQ", points: ["4-6 real buyer questions"] },
      ],
      faqIdeas: [
        `How much should I spend on ${input.niche}?`,
        `What is the most common mistake when buying ${input.niche}?`,
        "How long does shipping take?",
        "Can I return it if it does not fit my needs?",
      ],
    };
  }

  async generateProductCopy(input: ProductCopyInput): Promise<ProductCopy> {
    const specLine = input.specs
      .slice(0, 3)
      .map((spec) => `${spec.label}: ${spec.value}`)
      .join(", ");

    return {
      title: input.productTitle,
      subtitle: `Supplier catalog option for ${input.audience}`,
      shortDescription: `${input.productTitle}. Supplier-provided details — ${specLine || "see the available facts below"}. Current delivery estimate: ${input.shippingDaysMin}-${input.shippingDaysMax} business days.`,
      description: [
        `${input.productTitle} is a supplier catalog item associated with the ${input.niche} catalog. Product class relevance and supplier evidence must pass review before commercial launch.`,
        specLine ? `Available supplier specifications: ${specLine}.` : "No detailed supplier specifications are currently available.",
        `The current supplier delivery estimate is ${input.shippingDaysMin}-${input.shippingDaysMax} business days. This is an estimate, not a delivery guarantee.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      pros: [
        "Available supplier specifications are shown on the page",
        "Current supplier delivery estimate is displayed",
      ],
      cons: [
        "Supplier-provided details require merchant review before launch",
        `The ${input.shippingDaysMin}-${input.shippingDaysMax} business day estimate can change`,
      ],
      useCases: ["everyday", input.audience.toLowerCase().split(" ")[0] || "general"],
      faq: [
        {
          question: "How long does delivery take?",
          answer: `The currently available supplier estimate is ${input.shippingDaysMin}-${input.shippingDaysMax} business days. Actual transit and tracking availability can vary.`,
        },
        {
          question: "Can I return it?",
          answer: "Return eligibility depends on the published store policy and the item condition. Review the returns page before ordering.",
        },
      ],
      seoTitle: `${input.productTitle} — Supplier Specifications and Delivery Estimate`,
      seoDescription: `${input.productTitle}: available supplier specifications and the current ${input.shippingDaysMin}-${input.shippingDaysMax} business day delivery estimate.`,
    };
  }
}

export const mockAiProvider = new MockAiProvider();
