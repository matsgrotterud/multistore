import { prisma } from "@/lib/db";
import { generateStoreBlueprint } from "@/lib/ai/store-blueprint";
import { createStoreFromBlueprint } from "@/lib/stores/create-from-blueprint";

/**
 * Headless generator: runs the exact same blueprint + import pipeline the admin
 * action uses, without the admin auth wrapper. Proof/repro tool only.
 *
 *   dotenv -e .env.local -o -- tsx scripts/generate-store.ts --niche="vegan dog toys"
 */

function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf("=");
  return eq === -1 ? "true" : hit.slice(eq + 1);
}

async function main() {
  const niche = arg("niche", "vegan dog toys")!;
  const input = {
    domain: undefined,
    niche,
    audience: arg("audience", "eco-conscious pet owners")!,
    productKeywords: (arg("keywords", "") ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    brandVoice: arg("brandVoice", "warm, honest, practical")!,
    locale: arg("locale", "en-US")!,
    country: arg("country", "United States")!,
  };

  console.log(`Generating store for niche="${niche}" ...`);
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
