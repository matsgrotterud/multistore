/**
 * AI content generation contracts. The default implementation is a
 * deterministic mock (mock-ai-provider.ts); a real LLM-backed provider can be
 * dropped in by implementing AiProvider and switching getAiProvider().
 * All provider output must pass content-guardrails.ts before publication.
 */

export interface StoreBlueprintInput {
  domain: string;
  niche: string;
  audience: string;
  productKeywords: string[];
  brandVoice: string;
  locale: string;
  country: string;
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
