import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { absoluteUrl, canonicalUrl } from "@/lib/seo/canonical";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";
import { toJson } from "@/lib/utils/json";
import type { StockStatus } from "@/lib/types";

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

  // Only published, indexable products belong in the feed.
  const products = await prisma.product.findMany({
    where: { storeId: store.id, isPublished: true },
    orderBy: { productScore: "desc" },
    include: { category: { select: { slug: true } } },
  });

  const items = products
    .map((product) => {
      const availability =
        AVAILABILITY[product.stockStatus as StockStatus] ?? "in_stock";
      return `    <item>
      <g:id>${escapeXml(product.sku)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.shortDescription)}</g:description>
      <g:link>${escapeXml(canonicalUrl(store, product.category?.slug ? `/c/${product.category.slug}/p/${product.slug}` : `/p/${product.slug}`))}</g:link>
      <g:image_link>${escapeXml(absoluteUrl(store, product.imageUrl))}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${product.price.toFixed(2)} ${product.currency}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
${product.gtin ? `      <g:gtin>${escapeXml(product.gtin)}</g:gtin>\n` : `      <g:identifier_exists>false</g:identifier_exists>\n`}      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>${escapeXml(store.locale.split("-")[1] ?? "US")}</g:country>
        <g:service>Standard (${product.shippingDaysMin}-${product.shippingDaysMax} business days)</g:service>
        <g:price>${product.shippingCost.toFixed(2)} ${product.currency}</g:price>
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
