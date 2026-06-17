/**
 * AI content generation contracts. The default implementation is a
 * deterministic mock (mock-ai-provider.ts); a real LLM-backed provider can be
 * dropped in by implementing AiProvider and switching getAiProvider().
 * All provider output must pass content-guardrails.ts before publication.
 */

export type PricePositioning = "budget" | "value" | "premium" | "mixed";
export type ProductCountGoal = "small" | "standard" | "broad";

export interface StoreBlueprintInput {
  /** Planned production domain. Optional — preview works without one. */
  domain?: string;
  /** What the store is about, e.g. "fish bait". Required. */
  niche: string;
  /**
   * Sanitized, public-safe audience phrase (no numeric ages). Derived from
   * targetCustomer/endUser by the schema; downstream copy may interpolate it.
   */
  audience: string;
  /** Buyer persona, e.g. "casual anglers". Influences positioning/tone only. */
  targetCustomer?: string;
  /** Who uses the product if different from buyer, e.g. "dogs", "toddlers". */
  endUser?: string;
  /** Only public-facing when product-relevant (kids/baby). Never buyer age. */
  ageRange?: string;
  /** Legacy alias, merged into supplierSearchHints. Never becomes a category. */
  productKeywords: string[];
  /** Supplier discovery hints. Influence queries only, not category names. */
  supplierSearchHints: string[];
  /** Terms to avoid in supplier matches. */
  negativeKeywords: string[];
  /** Optional explicit category ideas. Empty = AI/vertical-derived categories. */
  categoryHints: string[];
  pricePositioning: PricePositioning;
  productCountGoal: ProductCountGoal;
  brandVoice: string;
  locale: string;
  country: string;
  /** Optional currency override; otherwise derived from locale/country. */
  currency?: string;
}

export interface StoreBlueprint {
  storeSlug: string;
  brandName: string;
  tagline: string;
  categories: { slug: string; name: string; description: string }[];
  homepageSections: string[];
  seoTitle: string;
  seoDescription: string;
  guideIdeas: string[];
  faqIdeas: string[];
  productImportQueries: string[];
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  trustCopy: string;
  shippingDisclosure: string;
  monetizationIdeas: string[];
  qualityChecklist: string[];
}

export interface CategoryPlanInput {
  niche: string;
  audience: string;
  keywords: string[];
}

export interface CategoryPlan {
  categories: {
    slug: string;
    name: string;
    description: string;
    seoTitle: string;
    targetQueries: string[];
  }[];
}

export interface GuideOutlineInput {
  niche: string;
  topic: string;
  audience: string;
}

export interface GuideOutline {
  title: string;
  slug: string;
  directAnswer: string;
  sections: { heading: string; points: string[] }[];
  faqIdeas: string[];
}

export interface ProductCopyInput {
  productTitle: string;
  niche: string;
  audience: string;
  brandVoice: string;
  specs: { label: string; value: string }[];
  shippingDaysMin: number;
  shippingDaysMax: number;
}

export interface ProductCopy {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  faq: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
}

export interface AiProvider {
  readonly name: string;
  generateStoreBlueprint(input: StoreBlueprintInput): Promise<StoreBlueprint>;
  generateCategoryPlan(input: CategoryPlanInput): Promise<CategoryPlan>;
  generateBuyingGuideOutline(input: GuideOutlineInput): Promise<GuideOutline>;
  generateProductCopy(input: ProductCopyInput): Promise<ProductCopy>;
}
