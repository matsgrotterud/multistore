import { prisma } from "@/lib/db";
import { fetchMedia } from "@/lib/media/fetch-media";
import { syncProductGallery } from "@/lib/media/sync-product-gallery";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import { getVercelBlobAuthMode } from "@/lib/storage/vercel-blob-provider";

/**
 * Repair media that points at the local dev filesystem (`/uploads/dev-media/...`)
 * or was never stored, by re-fetching from the supplier `sourceUrl` already on
 * record and re-uploading through the configured storage provider (Vercel Blob
 * when run with `.env.media-repair`).
 *
 * It never scrapes pages: the only source of truth is `ProductMediaAsset.sourceUrl`.
 * `sourceUrl`, `providerKey`, `externalId` and other audit fields are preserved.
 *
 * Usage:
 *   pnpm exec dotenv -e .env.media-repair -- pnpm run media:repair -- \
 *     --store=<slug> [--provider=<key>] [--limit=<n>] [--dry-run] [--force]
 */

const LOCAL_PREFIX = "/uploads/dev-media";

function arg(name: string): string | undefined {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit?.split("=").slice(1).join("=");
}
const STORE_SLUG = arg("store");
const PROVIDER = arg("provider");
const LIMIT = arg("limit") ? Math.max(1, Number(arg("limit"))) : undefined;
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

function isLocalUpload(url: string | null | undefined): boolean {
  return Boolean(url && url.startsWith(LOCAL_PREFIX));
}
function isBlobUrl(url: string | null | undefined): boolean {
  return Boolean(url && url.includes(".public.blob.vercel-storage.com/"));
}

/** An asset needs re-storing when it is unstored, local-only, or --force. */
function assetNeedsRepair(asset: { storageUrl: string | null; sourceUrl: string }): boolean {
  if (!asset.sourceUrl) return false;
  if (FORCE) return true;
  if (!asset.storageUrl) return true;
  return isLocalUpload(asset.storageUrl);
}

async function main() {
  if (!STORE_SLUG) {
    throw new Error("Missing required --store=<slug> argument.");
  }

  const provider = getStorageProvider();
  console.log(
    `Storage provider: ${provider.name}` +
      (provider.name === "vercel-blob" ? ` (auth mode: ${getVercelBlobAuthMode()})` : "")
  );
  console.log(
    `Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}${FORCE ? " + FORCE (re-store all)" : ""}`
  );

  const store = await prisma.store.findUnique({
    where: { slug: STORE_SLUG },
    select: { id: true, slug: true, name: true },
  });
  if (!store) throw new Error(`Store '${STORE_SLUG}' not found.`);

  // Detect products that need attention. With --force we sweep the whole store;
  // otherwise only products with any local-upload / unstored media.
  const brokenConditions = [
    { imageUrl: { startsWith: LOCAL_PREFIX } },
    { images: { some: { url: { startsWith: LOCAL_PREFIX } } } },
    { mediaAssets: { some: { storageUrl: { startsWith: LOCAL_PREFIX } } } },
    { mediaAssets: { some: { storageUrl: null } } },
  ];

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      ...(PROVIDER ? { providerKey: PROVIDER } : {}),
      ...(FORCE ? {} : { OR: brokenConditions }),
    },
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      mediaAssets: {
        select: { id: true, sourceUrl: true, storageUrl: true, mediaType: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "asc" },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(
    `\nStore ${store.slug}: ${products.length} product(s) ${FORCE ? "to sweep" : "needing repair"}.\n`
  );

  let assetsRepaired = 0;
  let assetsFailed = 0;
  let assetsSkipped = 0;
  let productsResynced = 0;

  for (const product of products) {
    const toRepair = product.mediaAssets.filter(assetNeedsRepair);
    const alreadyOk = product.mediaAssets.length - toRepair.length;
    console.log(
      `• ${product.slug} — ${product.mediaAssets.length} asset(s), ${toRepair.length} to repair, ` +
        `${alreadyOk} ok · imageUrl=${isLocalUpload(product.imageUrl) ? "LOCAL" : isBlobUrl(product.imageUrl) ? "blob" : "other"}`
    );

    if (DRY_RUN) {
      for (const asset of toRepair) {
        console.log(`    would re-fetch + store: ${asset.sourceUrl}`);
      }
      continue;
    }

    let repairedThisProduct = 0;
    for (const asset of toRepair) {
      try {
        const fetched = await fetchMedia(asset.sourceUrl);
        const storageKey = `media/${fetched.contentHash}.${fetched.extension}`;
        const stored = await provider.putObject({
          key: storageKey,
          body: fetched.body,
          contentType: fetched.contentType,
        });

        await prisma.productMediaAsset.update({
          where: { id: asset.id },
          data: {
            storageUrl: stored.url,
            storageKey: stored.key,
            contentHash: fetched.contentHash,
            contentType: fetched.contentType,
            fileSize: fetched.fileSize,
            ingestionStatus: "STORED",
            errorMessage: null,
          },
        });
        assetsRepaired += 1;
        repairedThisProduct += 1;
        console.log(`    ✓ stored ${asset.sourceUrl} -> ${stored.url}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await prisma.productMediaAsset.update({
          where: { id: asset.id },
          data: { ingestionStatus: "FAILED", errorMessage: message },
        });
        assetsFailed += 1;
        console.error(`    ✗ failed ${asset.sourceUrl}: ${message}`);
      }
    }
    assetsSkipped += alreadyOk;

    // Rebuild ProductImage rows + Product.imageUrl from the (now blob-backed)
    // assets, even if no asset was re-stored (fixes a stale imageUrl).
    await syncProductGallery(product.id);
    productsResynced += 1;
    if (repairedThisProduct === 0 && toRepair.length === 0) {
      console.log("    resynced gallery (no asset changes needed)");
    }
  }

  console.log(
    `\nDone. Products: ${products.length}, resynced: ${productsResynced}. ` +
      `Assets repaired: ${assetsRepaired}, failed: ${assetsFailed}, already-ok: ${assetsSkipped}.`
  );
  if (DRY_RUN) console.log("(dry run — no changes were written)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
