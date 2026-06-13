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
    const seed = hash(input.domain + input.niche);
    const nicheTitle = titleCase(input.niche);
    const brandName = `${nicheTitle.split(" ")[0]} ${["Haven", "Hub", "Studio", "Works", "Atelier", "Supply"][seed % 6]}`;
    const keywords = input.productKeywords.length > 0 ? input.productKeywords : [input.niche];

    return {
      storeSlug: slugify(input.niche),
      brandName,
      tagline: `${nicheTitle} chosen for ${input.audience}, explained honestly.`,
      categories: keywords.slice(0, 4).map((keyword) => ({
        slug: slugify(keyword),
        name: titleCase(keyword),
        description: `Curated ${keyword} picks for ${input.audience}, compared on real specs, shipping time and value.`,
      })),
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
      seoDescription: `Compare ${input.niche} on specs, shipping time and price. Honest pros and cons, transparent supplier shipping, ${input.country} support.`,
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
      productImportQueries: keywords.map((keyword) => `${keyword} best sellers`),
      themeColors: PALETTES[seed % PALETTES.length],
      trustCopy: `Every product is checked against our quality checklist before listing. Delivery typically takes a stated realistic window, returns are accepted per our published policy, and support replies within one business day.`,
      shippingDisclosure: `Orders are fulfilled by partner suppliers and typically arrive within a realistic stated window for ${input.country}. We never claim local stock we do not hold.`,
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
      directAnswer: `The short answer: match the ${input.niche} to your actual use case and budget first, then compare the two or three models that fit. This guide shows exactly how.`,
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
      subtitle: `Built for ${input.audience}`,
      shortDescription: `${input.productTitle} for ${input.audience}. Key specs — ${specLine || "see full table below"}. Ships in ${input.shippingDaysMin}-${input.shippingDaysMax} business days from our partner supplier.`,
      description: [
        `${input.productTitle} is selected for ${input.audience} in the ${input.niche} niche. We list it because the spec-to-price ratio holds up against alternatives we compared, not because of hype.`,
        specLine ? `Key specifications: ${specLine}.` : "",
        `Like everything in this store, it ships from a partner supplier with a realistic ${input.shippingDaysMin}-${input.shippingDaysMax} business day delivery window — we publish the real estimate instead of promising next-day delivery we cannot guarantee.`,
        `If it is not right for you, the standard return policy applies; the process is described on the returns page.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      pros: [
        "Strong spec-to-price ratio in its class",
        "Clear, published shipping window",
        "Covered by the standard return policy",
      ],
      cons: [
        `Ships from a partner supplier (${input.shippingDaysMin}-${input.shippingDaysMax} business days), not locally`,
        "Not the premium option if budget is unlimited",
      ],
      useCases: ["everyday", input.audience.toLowerCase().split(" ")[0] || "general"],
      faq: [
        {
          question: "How long does delivery take?",
          answer: `Typically ${input.shippingDaysMin}-${input.shippingDaysMax} business days. The order confirmation includes tracking as soon as the supplier hands the parcel to the carrier.`,
        },
        {
          question: "Can I return it?",
          answer: "Yes — the standard return policy applies. See the returns page for the exact window and process.",
        },
      ],
      seoTitle: `${input.productTitle} — Specs, Price & Honest Review-Free Assessment`,
      seoDescription: `${input.productTitle} for ${input.audience}: real specs, transparent ${input.shippingDaysMin}-${input.shippingDaysMax} day shipping, honest pros and cons.`,
    };
  }
}

export const mockAiProvider = new MockAiProvider();
