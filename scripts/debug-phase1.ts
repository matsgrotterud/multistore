import { prisma } from "@/lib/db";
import { parseFaq, parseSpecs, parseStringArray } from "@/lib/utils/json";

/**
 * Phase 1 commerce-loop proof script. Prints the env flags, store + product
 * diagnostics and recent orders so the full loop can be verified from the DB
 * without guessing. Run:
 *   dotenv -e .env.local -o -- tsx scripts/debug-phase1.ts
 */

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3010";

function flag(name: string): string {
  return process.env[name] ? process.env[name]! : "(unset)";
}

function checkoutAvailable(product: {
  fulfillmentMode: string;
  providerKey: string | null;
  externalId: string | null;
}): boolean {
  const cjManual =
    process.env.CJ_MANUAL_FULFILLMENT_ENABLED === "true" ||
    process.env.MANUAL_FULFILLMENT_ENABLED === "true";
  switch (product.fulfillmentMode) {
    case "AFFILIATE":
      return false;
    case "MOCK":
      return true;
    case "MANUAL":
      return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
    case "DROPSHIP":
      if (!product.externalId) return false;
      if (product.providerKey === "cj") {
        return (
          (process.env.CJ_ENABLED === "true" &&
            process.env.CJ_ORDER_API_ENABLED === "true" &&
            Boolean(process.env.CJ_LOGISTIC_NAME) &&
            Boolean(process.env.CJ_FROM_COUNTRY_CODE)) ||
          cjManual
        );
      }
      return product.providerKey === "mock";
    default:
      return false;
  }
}

function completeness(product: {
  title: string;
  subtitle: string;
  description: string;
  pros: string;
  cons: string;
  specs: string;
  faq: string;
  useCases: string;
  seoTitle: string;
  seoDescription: string;
}): { score: number; missing: string[] } {
  const checks: Array<[string, boolean]> = [
    ["title", product.title.trim().length > 0],
    ["subtitle", product.subtitle.trim().length > 0],
    ["description", product.description.trim().length >= 80],
    ["pros", parseStringArray(product.pros).length >= 1],
    ["cons", parseStringArray(product.cons).length >= 1],
    ["specs", parseSpecs(product.specs).length >= 1],
    ["faq", parseFaq(product.faq).length >= 1],
    ["useCases", parseStringArray(product.useCases).length >= 1],
    ["seoTitle", product.seoTitle.trim().length > 0],
    ["seoDescription", product.seoDescription.trim().length > 0],
  ];
  return {
    score: checks.filter(([, ok]) => ok).length,
    missing: checks.filter(([, ok]) => !ok).map(([name]) => name),
  };
}

async function main() {
  console.log("=".repeat(72));
  console.log("PHASE 1 COMMERCE DEBUG");
  console.log("=".repeat(72));
  console.log("\nENV FLAGS (no secrets):");
  for (const name of [
    "CJ_ENABLED",
    "CJ_ORDER_API_ENABLED",
    "CJ_MANUAL_FULFILLMENT_ENABLED",
    "MANUAL_FULFILLMENT_ENABLED",
    "MOCK_CHECKOUT",
    "PAYMENT_CAPTURE_MODE",
    "MEDIA_STORAGE_PROVIDER",
  ]) {
    console.log(`  ${name.padEnd(32)} = ${flag(name)}`);
  }
  console.log(`  BASE_URL                         = ${BASE}`);

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { products: true, categories: true } } },
  });

  console.log("\nSTORES:");
  for (const store of stores) {
    console.log(
      `  ${store.slug.padEnd(24)} ${store.launchStatus.padEnd(8)} ${store.currency} ` +
        `· ${store._count.categories} cats · ${store._count.products} products`
    );
  }

  const generated = stores.filter((store) => store.launchStatus !== "LIVE");
  console.log(`\nGENERATED (preview) stores: ${generated.map((s) => s.slug).join(", ") || "none"}`);

  for (const store of stores) {
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      include: {
        category: { select: { slug: true } },
        _count: { select: { images: true, mediaAssets: true, variants: true } },
      },
      orderBy: { productScore: "desc" },
    });
    if (products.length === 0) continue;

    const cjCount = products.filter((p) => p.providerKey === "cj").length;
    console.log("\n" + "-".repeat(72));
    console.log(`STORE ${store.slug} (${store.launchStatus}, ${store.currency}) — ${products.length} products, ${cjCount} CJ`);
    console.log("-".repeat(72));

    for (const product of products) {
      const cat = product.category?.slug ?? "?";
      const previewUrl = `${BASE}/s/${store.slug}/c/${cat}/p/${product.slug}`;
      const canonicalPath = `/c/${cat}/p/${product.slug}`;
      const placeholder = product.imageUrl.startsWith("/api/placeholder");
      const { score, missing } = completeness(product);
      console.log(
        `\n  • ${product.slug}\n` +
          `    category=${cat} published=${product.isPublished} noindex=${product.noindex} quality=${product.qualityStatus}\n` +
          `    provider=${product.providerKey ?? "-"} fulfillment=${product.fulfillmentMode} externalId=${product.externalId ?? "-"}\n` +
          `    price=${product.price} ${product.currency} checkoutAvailable=${checkoutAvailable(product)}\n` +
          `    imageUrl placeholder=${placeholder ? "YES" : "no"} images=${product._count.images} mediaAssets=${product._count.mediaAssets} variants=${product._count.variants}\n` +
          `    copyCompleteness=${score}/10${missing.length ? ` (missing: ${missing.join(", ")})` : ""}\n` +
          `    canonicalPath=${canonicalPath}\n` +
          `    OPEN: ${previewUrl}`
      );
    }
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      store: { select: { slug: true } },
      supplierOrders: { select: { providerKey: true, status: true } },
    },
  });
  console.log("\n" + "=".repeat(72));
  console.log("LAST 10 ORDERS");
  console.log("=".repeat(72));
  for (const order of orders) {
    const sup =
      order.supplierOrders.map((s) => `${s.providerKey}:${s.status}`).join(", ") || "none";
    console.log(
      `  ${order.orderNumber.padEnd(20)} ${order.store.slug.padEnd(20)} ` +
        `status=${order.status} pay=${order.paymentStatus} fulfill=${order.fulfillmentStatus} supplier=[${sup}]`
    );
  }
  if (orders.length === 0) console.log("  (no orders yet)");

  console.log("\nDone.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
