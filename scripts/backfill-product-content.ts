import { prisma } from "@/lib/db";
import { buildImportedProductContent } from "@/lib/catalog/build-product-content";
import { convertCurrency } from "@/lib/pricing/normalize-price";
import { parseSpecs, parseStringArray, toJson } from "@/lib/utils/json";

/**
 * Backfill premium copy + store-currency pricing onto already-imported
 * products (Section B + F). Earlier imports stored empty pros/cons/FAQ, raw
 * supplier descriptions and supplier-currency prices; this regenerates them
 * from the supplier facts already in the database — no provider calls needed.
 *
 * Usage:
 *   dotenv -e .env.local -o -- tsx scripts/backfill-product-content.ts [--store=<slug>] [--force]
 *
 * Without --force, only products with empty pros AND empty FAQ are rewritten;
 * currency mismatches are always fixed.
 */

function arg(name: string): string | undefined {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit?.split("=")[1];
}
const FORCE = process.argv.includes("--force");
const STORE_SLUG = arg("store");

async function main() {
  const stores = await prisma.store.findMany({
    where: STORE_SLUG ? { slug: STORE_SLUG } : {},
    include: { categories: true },
  });

  let contentUpdated = 0;
  let currencyFixed = 0;

  for (const store of stores) {
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      include: { category: true, variants: true },
    });

    for (const product of products) {
      const prosEmpty = parseStringArray(product.pros).length === 0;
      const faqEmpty = parseSpecs(product.faq).length === 0 && product.faq.trim() === "[]";
      const needsContent = FORCE || (prosEmpty && faqEmpty);
      const needsCurrency = product.currency !== store.currency;

      if (!needsContent && !needsCurrency) continue;

      const data: Record<string, unknown> = {};

      if (needsCurrency) {
        const from = product.currency;
        const to = store.currency;
        data.currency = to;
        data.price = convertCurrency(product.price, from, to) ?? product.price;
        data.compareAtPrice = convertCurrency(product.compareAtPrice, from, to);
        data.cost = convertCurrency(product.cost, from, to) ?? product.cost;
        data.shippingCost = convertCurrency(product.shippingCost, from, to) ?? product.shippingCost;

        for (const variant of product.variants) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              price: convertCurrency(variant.price, from, to),
              compareAtPrice: convertCurrency(variant.compareAtPrice, from, to),
              cost: convertCurrency(variant.cost, from, to),
              shippingCost: convertCurrency(variant.shippingCost, from, to),
            },
          });
        }
        currencyFixed += 1;
      }

      if (needsContent) {
        let raw: Record<string, unknown> = {};
        try {
          raw = JSON.parse(product.supplierDataJson) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
        const content = await buildImportedProductContent({
          storeName: store.name,
          niche: store.niche,
          audience: store.audience,
          brandVoice: store.brandVoice,
          categoryName: product.category.name,
          rawTitle: (raw.rawTitle as string) || product.title,
          rawDescription: (raw.rawDescription as string) ?? product.description,
          brand: product.brand,
          specs: parseSpecs(product.specs),
          variantOptionSummaries: product.variants
            .map((variant) => variant.optionSummary)
            .filter(Boolean),
          shippingDaysMin: product.shippingDaysMin,
          shippingDaysMax: product.shippingDaysMax,
          countryOfOrigin: product.countryOfOrigin,
        });

        Object.assign(data, {
          title: content.title,
          subtitle: content.subtitle,
          description: content.description,
          shortDescription: content.shortDescription,
          imageAlt: product.imageAlt || content.imageAlt,
          pros: toJson(content.pros),
          cons: toJson(content.cons),
          specs: toJson(content.specs),
          useCases: toJson(content.useCases),
          faq: toJson(content.faq),
          seoTitle: content.seoTitle,
          seoDescription: content.seoDescription,
          qualityStatus: content.qualityStatus,
          noindex: content.noindex,
        });
        contentUpdated += 1;
      }

      await prisma.product.update({ where: { id: product.id }, data });
      console.log(
        `  ✓ ${store.slug}/${product.slug}` +
          (needsContent ? " [content]" : "") +
          (needsCurrency ? ` [currency ${product.currency}→${store.currency}]` : "")
      );
    }
  }

  console.log(
    `\nDone. Content rewritten: ${contentUpdated}. Currency fixed: ${currencyFixed}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
