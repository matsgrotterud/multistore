import { prisma } from "@/lib/db";
import {
  generateStoreBlueprint,
  storeBlueprintInputSchema,
} from "@/lib/ai/store-blueprint";
import { createStoreFromBlueprint } from "@/lib/stores/create-from-blueprint";

/**
 * Headless generator: runs the EXACT same blueprint + import pipeline the admin
 * action uses (same Zod schema + createStoreFromBlueprint), without the admin
 * auth wrapper. Proof/repro tool only.
 *
 *   dotenv -e .env.local -o -- tsx scripts/generate-store.ts \
 *     --niche="vegan dog toys" --targetCustomer="dog owners" --endUser=dogs
 */

function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf("=");
  return eq === -1 ? "true" : hit.slice(eq + 1);
}

async function main() {
  const niche = arg("niche", "vegan dog toys")!;
  // Build the same raw input shape the admin form submits, then parse it through
  // the shared schema so normalization/age-guardrails/derivation are identical.
  const rawInput = {
    domain: undefined,
    niche,
    targetCustomer: arg("targetCustomer", arg("audience")),
    endUser: arg("endUser"),
    ageRange: arg("ageRange"),
    supplierSearchHints: arg("supplierSearchHints", arg("keywords", "")),
    negativeKeywords: arg("negativeKeywords", ""),
    categoryHints: arg("categoryHints", ""),
    pricePositioning: arg("pricePositioning", "value")!,
    productCountGoal: arg("productCountGoal", "standard")!,
    brandVoice: arg("brandVoice", "warm, honest, practical")!,
    locale: arg("locale", "en-US")!,
    country: arg("country", "United States")!,
  };
  const input = storeBlueprintInputSchema.parse(rawInput);

  console.log(`Generating store for niche="${niche}" ...`);
  console.log(`  publicAudience="${input.audience}" categoryHints=${JSON.stringify(input.categoryHints)} goal=${input.productCountGoal}`);
  const started = Date.now();
  const { blueprint, guardrails } = await generateStoreBlueprint(input);
  console.log(`blueprint: ${blueprint.brandName} (slug=${blueprint.storeSlug}) guardrails.passed=${guardrails.passed}`);
  console.log(`categories: ${blueprint.categories.map((c) => c.name).join(", ")}`);
  console.log(`import queries: ${JSON.stringify(blueprint.productImportQueries)}`);

  if (!guardrails.passed) {
    console.error("Guardrails blocked the blueprint:", guardrails.flags);
    await prisma.$disconnect();
    process.exit(1);
  }

  const result = await createStoreFromBlueprint({
    blueprint,
    input,
    importProducts: true,
    autoPublishScored: true,
  });

  console.log(`\nDONE in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
