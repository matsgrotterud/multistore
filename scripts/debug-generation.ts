import { prisma } from "@/lib/db";
import { getProviderHealthReport } from "@/lib/suppliers/catalog/provider-health";
import { getMediaStorageSafetyReport } from "@/lib/storage/media-storage-safety";

const LOCAL_UPLOAD_PREFIX = "/uploads/dev-media";

/**
 * Generator/import diagnostic. Explains, for a store, exactly where the
 * niche -> blueprint -> discovery -> import -> publish chain succeeded or broke.
 *
 * Run:
 *   dotenv -e .env.local -o -- tsx scripts/debug-generation.ts --latest
 *   dotenv -e .env.local -o -- tsx scripts/debug-generation.ts --store=fish-bait
 */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf("=");
  return eq === -1 ? "true" : hit.slice(eq + 1);
}

function flag(name: string): string {
  return process.env[name] ? process.env[name]! : "(unset)";
}

function group<T>(rows: T[], key: (row: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const k = key(row);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

async function resolveStoreSlugs(): Promise<string[]> {
  const explicit = arg("store");
  if (explicit && explicit !== "true") return [explicit];
  if (arg("latest")) {
    const latest = await prisma.store.findFirst({ orderBy: { createdAt: "desc" } });
    return latest ? [latest.slug] : [];
  }
  // default: every store
  const stores = await prisma.store.findMany({ orderBy: { createdAt: "desc" }, select: { slug: true } });
  return stores.map((s) => s.slug);
}

async function reportStore(slug: string) {
  console.log("\n" + "=".repeat(72));
  console.log(`STORE: ${slug}`);
  console.log("=".repeat(72));

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    console.log("  store exists: NO");
    return;
  }
  console.log(`  store exists: YES (${store.id})`);
  console.log(`  launchStatus: ${store.launchStatus}  currency: ${store.currency}  niche: ${store.niche}`);
  console.log(`  storefront URL: /s/${store.slug}`);
  console.log(`  admin URL:      /admin/stores/${store.slug}/edit`);

  const [categories, products, candidates, settings, jobs, runs] = await Promise.all([
    prisma.category.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { storeId: store.id },
      include: { _count: { select: { images: true, variants: true, mediaAssets: true } }, category: { select: { slug: true } } },
      orderBy: { productScore: "desc" },
    }),
    prisma.productCandidate.findMany({ where: { storeId: store.id } }),
    prisma.storeSupplierSettings.findMany({ where: { storeId: store.id } }),
    prisma.catalogJob.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.catalogSyncRun.findMany({ where: { storeId: store.id }, orderBy: { startedAt: "desc" }, take: 10 }),
  ]);

  const published = products.filter((p) => p.isPublished);
  const imageRows = products.reduce((n, p) => n + p._count.images, 0);
  const variantRows = products.reduce((n, p) => n + p._count.variants, 0);
  const mediaAssetRows = products.reduce((n, p) => n + p._count.mediaAssets, 0);

  const localMediaProducts = products.filter((p) => p.imageUrl?.startsWith(LOCAL_UPLOAD_PREFIX));

  console.log("\n  --- counts ---");
  console.log(`  categories:            ${categories.length}  [${categories.map((c) => c.slug).join(", ")}]`);
  console.log(`  products:              ${products.length}`);
  console.log(`  published products:    ${published.length}`);
  console.log(`  LOCAL imageUrl (/uploads/dev-media): ${localMediaProducts.length}`);
  if (localMediaProducts.length > 0) {
    console.log(
      `    -> repair: pnpm exec dotenv -e .env.media-repair -- pnpm run media:repair -- --store=${slug} --force`
    );
  }
  console.log(`  ProductImage rows:     ${imageRows}`);
  console.log(`  ProductVariant rows:   ${variantRows}`);
  console.log(`  ProductMediaAsset:     ${mediaAssetRows}`);
  console.log(`  product candidates:    ${candidates.length}`);
  console.log(`  candidates by status:  ${JSON.stringify(group(candidates, (c) => c.status))}`);
  console.log(`  candidates by provider:${JSON.stringify(group(candidates, (c) => c.providerKey))}`);

  const rejected = candidates.filter((c) => c.status === "REJECTED");
  if (rejected.length > 0) {
    const reasons = group(rejected, (c) => (c.rejectionReason ?? "(none)").trim());
    console.log("\n  --- rejection reasons ---");
    for (const [reason, count] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${count}x  ${reason}`);
    }
  }

  console.log("\n  --- supplier settings ---");
  if (settings.length === 0) {
    console.log("   (none) — no StoreSupplierSettings rows for this store");
  } else {
    for (const s of settings) {
      let queries: unknown = [];
      try { queries = JSON.parse(s.importQueries); } catch { /* ignore */ }
      console.log(
        `   ${s.providerKey}: enabled=${s.isEnabled} minScore=${s.minProductScore} minMargin=${s.minMarginPercent} maxShipDays=${s.maxShippingDays} autoPublish=${s.autoPublish}`
      );
      console.log(`     importQueries: ${JSON.stringify(queries)}`);
    }
  }

  console.log("\n  --- catalog jobs / sync runs ---");
  console.log(`   CatalogJob rows: ${jobs.length}  ${JSON.stringify(group(jobs, (j) => j.status))}`);
  console.log(`   CatalogSyncRun rows: ${runs.length}  ${JSON.stringify(group(runs, (r) => r.status))}`);
  for (const r of runs.slice(0, 3)) {
    console.log(`     run ${r.startedAt.toISOString()} status=${r.status} provider=${r.providerKey ?? "-"} ${r.errorMessage ? "err=" + r.errorMessage : ""}`);
  }

  if (products.length > 0) {
    console.log("\n  --- products ---");
    for (const p of products.slice(0, 12)) {
      console.log(
        `   [${p.isPublished ? "PUB" : "drafted"}] ${p.title.slice(0, 50)} | score=${p.productScore} media=${p._count.images}img/${p._count.mediaAssets}assets variants=${p._count.variants} noindex=${p.noindex} mediaStatus=${p.mediaStatus}`
      );
      console.log(`        /s/${store.slug}/c/${p.category?.slug ?? "?"}/p/${p.slug}`);
    }
  }

  // Reason chain for zero products
  if (products.length === 0) {
    console.log("\n  --- REASON CHAIN (products = 0) ---");
    if (categories.length === 0) console.log("   * no categories created");
    if (settings.length === 0) console.log("   * no StoreSupplierSettings (provider import never configured for store)");
    const enriched = candidates.filter((c) => c.status === "ENRICHED");
    const imported = candidates.filter((c) => c.status === "IMPORTED");
    if (candidates.length === 0) {
      console.log("   * 0 candidates -> discovery returned nothing OR discovery never ran (provider down / query mismatch)");
    } else {
      console.log(`   * candidates exist: ${candidates.length} (enriched=${enriched.length} rejected=${rejected.length} imported=${imported.length})`);
      if (enriched.length === 0 && rejected.length > 0) console.log("   * ALL candidates rejected by quality gates -> see rejection reasons above");
      if (enriched.length > 0 && imported.length === 0) console.log("   * enriched candidates exist but none imported -> import step not run / relevance filter excluded them");
    }
  }
}

async function main() {
  console.log("=== ENV FLAGS ===");
  for (const name of [
    "CJ_ENABLED",
    "CJ_ORDER_API_ENABLED",
    "CJ_MANUAL_FULFILLMENT_ENABLED",
    "CATALOG_IMPORT_PROVIDER_KEYS",
    "MOCK_CHECKOUT",
    "MEDIA_STORAGE_PROVIDER",
  ]) {
    console.log(`  ${name}=${flag(name)}`);
  }

  console.log("\n=== MEDIA STORAGE SAFETY ===");
  const safety = getMediaStorageSafetyReport();
  console.log(`  DB target:          ${safety.dbIsRemote ? "REMOTE" : "local"}${safety.dbHost ? ` (${safety.dbHost})` : ""}`);
  console.log(`  requested provider: ${safety.requestedProvider ?? "(unset)"}`);
  console.log(`  effective provider: ${safety.effectiveProvider}`);
  console.log(`  blob token present: ${safety.hasBlobToken}  vercel runtime: ${safety.isVercelRuntime}`);
  console.log(`  override enabled:   ${safety.overrideEnabled}`);
  console.log(`  ${safety.unsafe ? "!! UNSAFE !!" : "status OK"}: ${safety.message}`);

  console.log("\n=== PROVIDER HEALTH ===");
  try {
    const health = await getProviderHealthReport();
    for (const h of health) {
      console.log(
        `  ${h.key}: status=${h.status} ${h.message}${h.missingEnv?.length ? " missingEnv=" + h.missingEnv.join(",") : ""}`
      );
    }
  } catch (error) {
    console.log(`  provider health failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const slugs = await resolveStoreSlugs();
  if (slugs.length === 0) {
    console.log("\n(no stores found)");
  }
  for (const slug of slugs) {
    await reportStore(slug);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
