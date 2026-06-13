import { z } from "zod";
import { checkContent, type GuardrailReport } from "@/lib/ai/content-guardrails";
import { mockAiProvider } from "@/lib/ai/mock-ai-provider";
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

export const storeBlueprintInputSchema = z.object({
  domain: z
    .string()
    .min(4, "Domain is required")
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Enter a bare domain like 'example.com'"),
  niche: z.string().min(3, "Describe the niche, e.g. 'espresso gear'"),
  audience: z.string().min(3, "Describe the audience, e.g. 'home baristas'"),
  productKeywords: z.array(z.string().min(2)).max(10).default([]),
  brandVoice: z.string().min(3).default("clear, honest, practical"),
  locale: z.string().min(2).default("en-US"),
  country: z.string().min(2).default("United States"),
});

export type ValidatedBlueprintInput = z.infer<typeof storeBlueprintInputSchema>;

export interface BlueprintResult {
  blueprint: StoreBlueprint;
  guardrails: GuardrailReport;
}

export async function generateStoreBlueprint(
  rawInput: unknown
): Promise<BlueprintResult> {
  const input: StoreBlueprintInput = storeBlueprintInputSchema.parse(rawInput);
  const provider = getAiProvider();
  const blueprint = await provider.generateStoreBlueprint(input);

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
  const copy = await getAiProvider().generateProductCopy(input);

  const guardrails = checkContent({
    text: [copy.description, copy.shortDescription, ...copy.pros, ...copy.cons].join("\n"),
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });

  return { copy, guardrails };
}
