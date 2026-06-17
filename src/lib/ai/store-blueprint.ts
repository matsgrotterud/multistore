import { z } from "zod";
import { checkContent, type GuardrailReport } from "@/lib/ai/content-guardrails";
import { mockAiProvider } from "@/lib/ai/mock-ai-provider";
import {
  sanitizePublicAudienceText,
  sanitizePublicCopy,
  type AudienceContext,
} from "@/lib/ai/audience-guardrails";
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

/** Split a comma/newline-separated string (or array) into a clean keyword list. */
function normalizeKeywordList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : value.split(/[,\n]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.slice(0, 20);
}

const keywordListSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => normalizeKeywordList(value));

/**
 * Store blueprint orchestration: validates input with Zod, calls the active
 * AI provider, then runs guardrails over the generated copy. The admin
 * generator consumes this; persisting a blueprint to the database is a
 * deliberate future step (the output shape already matches the seed format).
 */

export function getAiProvider(): AiProvider {
  // Swap in a real LLM-backed provider here (e.g. OpenAiProvider) once an
  // API key is configured. All output still flows through the guardrails.
  return mockAiProvider;
}

export const storeBlueprintInputSchema = z
  .object({
    domain: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    niche: z.string().trim().min(3, "Describe the store idea / niche, e.g. 'fish bait'"),
    // Persona fields are optional; a safe public audience is derived below.
    audience: z.string().trim().optional(),
    targetCustomer: z.string().trim().optional(),
    endUser: z.string().trim().optional(),
    ageRange: z.string().trim().optional(),
    productKeywords: keywordListSchema,
    supplierSearchHints: keywordListSchema,
    negativeKeywords: keywordListSchema,
    categoryHints: keywordListSchema,
    pricePositioning: z.enum(["budget", "value", "premium", "mixed"]).default("value"),
    productCountGoal: z.enum(["small", "standard", "broad"]).default("standard"),
    brandVoice: z.string().trim().min(3).default("clear, honest, practical"),
    locale: z.string().trim().min(2).default("en-US"),
    country: z.string().trim().min(2).default("United States"),
    currency: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value.toUpperCase() : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(data.domain)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a bare domain like 'example.com' or leave empty for test-only preview",
        path: ["domain"],
      });
    }
  })
  .transform((data) => {
    // Supplier hints absorb the legacy productKeywords; neither becomes a category.
    const supplierSearchHints = normalizeKeywordList([
      ...data.supplierSearchHints,
      ...data.productKeywords,
    ]);
    const audienceCtx: AudienceContext = {
      niche: data.niche,
      targetCustomer: data.targetCustomer ?? data.audience,
      endUser: data.endUser,
      ageRange: data.ageRange,
    };
    // Always derive a public-safe audience (no numeric buyer ages).
    const audience = sanitizePublicAudienceText(audienceCtx);
    return {
      ...data,
      supplierSearchHints,
      productKeywords: supplierSearchHints,
      audience,
    };
  });

export type ValidatedBlueprintInput = z.infer<typeof storeBlueprintInputSchema>;

export interface BlueprintResult {
  blueprint: StoreBlueprint;
  guardrails: GuardrailReport;
}

/**
 * Centralized public-copy guard: strips buyer-age demographics from every
 * shopper-visible blueprint string, regardless of which provider produced it.
 * Keeps end-user age for age-relevant niches (e.g. kids' toys).
 */
function sanitizeBlueprintPublicCopy(
  blueprint: StoreBlueprint,
  ctx: AudienceContext
): StoreBlueprint {
  const clean = (text: string) => sanitizePublicCopy(text, ctx);
  return {
    ...blueprint,
    tagline: clean(blueprint.tagline),
    seoTitle: clean(blueprint.seoTitle),
    seoDescription: clean(blueprint.seoDescription),
    categories: blueprint.categories.map((category) => ({
      ...category,
      name: clean(category.name),
      description: clean(category.description),
    })),
    guideIdeas: blueprint.guideIdeas.map(clean),
  };
}

export async function generateStoreBlueprint(
  rawInput: unknown
): Promise<BlueprintResult> {
  const input: StoreBlueprintInput = storeBlueprintInputSchema.parse(rawInput);
  const provider = getAiProvider();
  const rawBlueprint = await provider.generateStoreBlueprint(input);
  const blueprint = sanitizeBlueprintPublicCopy(rawBlueprint, {
    niche: input.niche,
    targetCustomer: input.targetCustomer,
    endUser: input.endUser,
    ageRange: input.ageRange,
  });

  const guardrails = checkContent({
    text: [
      blueprint.tagline,
      blueprint.seoDescription,
      blueprint.trustCopy,
      blueprint.shippingDisclosure,
      ...blueprint.categories.map((category) => category.description),
    ].join("\n"),
    pageShowsShippingDisclosure: blueprint.shippingDisclosure.length > 0,
    pageShowsReturnPolicy: true,
  });

  return { blueprint, guardrails };
}

export async function generateCategoryPlan(
  input: CategoryPlanInput
): Promise<CategoryPlan> {
  return getAiProvider().generateCategoryPlan(input);
}

export async function generateBuyingGuideOutline(
  input: GuideOutlineInput
): Promise<GuideOutline> {
  return getAiProvider().generateBuyingGuideOutline(input);
}

export const productCopyInputSchema = z.object({
  productTitle: z.string().min(3),
  niche: z.string().min(2),
  audience: z.string().min(2),
  brandVoice: z.string().min(2).default("clear, honest, practical"),
  specs: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .default([]),
  shippingDaysMin: z.coerce.number().int().min(1).default(5),
  shippingDaysMax: z.coerce.number().int().min(1).default(12),
});

export interface ProductCopyResult {
  copy: ProductCopy;
  guardrails: GuardrailReport;
}

export async function generateProductCopy(
  rawInput: unknown
): Promise<ProductCopyResult> {
  const input: ProductCopyInput = productCopyInputSchema.parse(rawInput);
  const rawCopy = await getAiProvider().generateProductCopy(input);

  // Strip any buyer-age leakage from shopper-visible product fields.
  const ctx: AudienceContext = { niche: input.niche };
  const clean = (text: string) => sanitizePublicCopy(text, ctx);
  const copy: ProductCopy = {
    ...rawCopy,
    subtitle: clean(rawCopy.subtitle),
    shortDescription: clean(rawCopy.shortDescription),
    description: clean(rawCopy.description),
    seoTitle: clean(rawCopy.seoTitle),
    seoDescription: clean(rawCopy.seoDescription),
  };

  const guardrails = checkContent({
    text: [copy.description, copy.shortDescription, ...copy.pros, ...copy.cons].join("\n"),
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });

  return { copy, guardrails };
}
