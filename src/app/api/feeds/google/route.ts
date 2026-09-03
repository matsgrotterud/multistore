import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  evaluateGoogleFeedEligibility,
  merchantProductId,
} from "@/lib/feeds/google";
import { selectPublicProductImage } from "@/lib/media/public-media";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { evaluateCheckoutCommerceEligibility } from "@/lib/orders/checkout-eligibility";
import { calculateCheckoutShipping } from "@/lib/orders/shipping";
import { absoluteUrl, canonicalUrl } from "@/lib/seo/canonical";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { isProductCheckoutAvailable } from "@/lib/stores/checkout-availability";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";
import { toJson } from "@/lib/utils/json";
import type { StockStatus } from "@/lib/types";
import {
  configuredCatalogFreshnessMaxAgeHours,
  evaluateCatalogFreshness,
} from "@/lib/catalog/catalog-freshness";

/**
 * Google Merchant Center product feed (RSS 2.0 XML with the g: namespace).
 *
 * Resolve the store by Host header or an explicit ?store=<slug> param:
 *   https://dronestore.example/api/feeds/google
 *   http://localhost:3000/api/feeds/google?store=drones
 *
 * IMPORTANT before submitting to a real Merchant Center account:
 * - Product data must be accurate (price, availability, identifiers/GTIN).
 * - Shipping settings, delivery times, return policy and tax settings must
 *   be configured in Merchant Center and match what the store actually does.
 * - Business information, contact details and the website claim must be
 *   verified. Misleading data leads to account suspension.
 * - This feed is a structural starting point, not a compliance guarantee.
 */

const AVAILABILITY: Record<StockStatus, string> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock",
  PREORDER: "preorder",
  UNKNOWN: "out_of_stock",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  const store = await resolveStoreForRequest({
    host: request.headers.get("host"),
    storeParam: request.nextUrl.searchParams.get("store"),
  });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const [rawProducts, settingsRow, supplierSettings] =
    store.launchStatus === "LIVE"
      ? await Promise.all([
          prisma.product.findMany({
            where: { storeId: store.id, isPublished: true, noindex: false },
            orderBy: { productScore: "desc" },
            include: {
              category: { select: { slug: true } },
              _count: { select: { variants: true } },
              images: {
                where: { ingestionStatus: "STORED" },
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
              mediaAssets: {
                where: {
                  mediaType: "IMAGE",
                  ingestionStatus: "STORED",
                  storageUrl: { not: null },
                },
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { storageUrl: true },
              },
            },
          }),
          prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
          prisma.storeSupplierSettings.findMany({ where: { storeId: store.id } }),
        ])
      : [[], null, []] as const;

  const storeSettings = parseStoreSettings(settingsRow?.settings);
  const freshnessNow = new Date();
  const freshnessMaxAgeHours = configuredCatalogFreshnessMaxAgeHours();
  const products = rawProducts.flatMap((product) => {
    const supplierSetting = product.providerKey
      ? supplierSettings.find(
          (candidate) => candidate.providerKey === product.providerKey
        )
      : null;
    const minimumMargin = Math.max(
      storeSettings.monetization.minMarginPercent,
      supplierSetting?.minMarginPercent ?? 0
    );
    const margin = calculateGrossMargin(product);
    const commerce = evaluateCheckoutCommerceEligibility({
      mode: "LIVE",
      store: {
        isActive: store.isActive,
        launchStatus: store.launchStatus,
        generation: storeSettings.generation,
      },
      product: {
        isPublished: product.isPublished,
        catalogVisible: true,
        mediaStatus: product.mediaStatus,
        qualityStatus: product.qualityStatus,
        supplierDataJson: product.supplierDataJson,
      },
      contributionMarginPercent: margin.grossMarginPercent,
      minimumContributionMarginPercent: minimumMargin,
    });
    const checkoutAvailable = isProductCheckoutAvailable(product, {
      ...process.env,
      MOCK_CHECKOUT: "false",
    });
    const catalogFreshness = evaluateCatalogFreshness({
      mode: "LIVE",
      lastSupplierSyncAt: product.lastSupplierSyncAt,
      supplierDataJson: product.supplierDataJson,
      maxAgeHours: freshnessMaxAgeHours,
      now: freshnessNow,
    });
    const supplierRouteReady =
      product.fulfillmentMode !== "DROPSHIP" ||
      Boolean(
        product.providerKey &&
          supplierSetting?.isEnabled &&
          supplierSetting.fulfillmentMode === "DROPSHIP"
      );
    const shippingWithinLimit =
      product.fulfillmentMode !== "DROPSHIP" ||
      Boolean(
        supplierSetting &&
          product.shippingDaysMax <= supplierSetting.maxShippingDays
      );
    const storedAssetUrls = product.mediaAssets.map((asset) => asset.storageUrl);
    const storedGalleryUrls = product.images.map((image) => image.url);
    const eligibility = evaluateGoogleFeedEligibility({
      storeLive: store.launchStatus === "LIVE",
      published: product.isPublished,
      noindex: product.noindex,
      commerceEligible: commerce.allowed,
      catalogFresh: catalogFreshness.allowed,
      checkoutAvailable,
      currencyMatches:
        product.currency.toUpperCase() === store.currency.toUpperCase(),
      stockStatus: product.stockStatus,
      variantCount: product._count.variants,
      storedImageAvailable:
        storedAssetUrls.some(Boolean) || storedGalleryUrls.length > 0,
      supplierRouteReady,
      shippingWithinLimit,
    });
    if (!eligibility.allowed) return [];
    return [{
      product,
      imageUrl: selectPublicProductImage({
        productImageUrl: product.imageUrl,
        storedAssetUrls,
        storedGalleryUrls,
      }),
      customerShipping: calculateCheckoutShipping(product.price),
    }];
  });

  const items = products
    .map(({ product, imageUrl, customerShipping }) => {
      const availability =
        AVAILABILITY[product.stockStatus as StockStatus] ?? "in_stock";
      return `    <item>
      <g:id>${escapeXml(merchantProductId(product))}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.shortDescription)}</g:description>
      <g:link>${escapeXml(canonicalUrl(store, product.category?.slug ? `/c/${product.category.slug}/p/${product.slug}` : `/p/${product.slug}`))}</g:link>
      <g:image_link>${escapeXml(absoluteUrl(store, imageUrl))}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${product.price.toFixed(2)} ${product.currency}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
${product.gtin ? `      <g:gtin>${escapeXml(product.gtin)}</g:gtin>\n` : `      <g:identifier_exists>false</g:identifier_exists>\n`}      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>${escapeXml(store.locale.split("-")[1] ?? "US")}</g:country>
        <g:service>Standard (${product.shippingDaysMin}-${product.shippingDaysMax} business days)</g:service>
        <g:price>${customerShipping.toFixed(2)} ${product.currency}</g:price>
      </g:shipping>
      <g:shipping_label>standard</g:shipping_label>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(store.name)}</title>
    <link>${escapeXml(canonicalUrl(store, "/"))}</link>
    <description>${escapeXml(store.positioning)}</description>
${items}
  </channel>
</rss>`;

  // Record feed access for monitoring (e.g. confirming Google fetches it).
  try {
    await prisma.cartEvent.create({
      data: {
        storeId: store.id,
        sessionId: "feed",
        eventName: "merchant_feed_view",
        payload: toJson({ productCount: products.length }),
      },
    });
  } catch {
    /* never fail the feed because of analytics */
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
