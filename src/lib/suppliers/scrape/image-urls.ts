import type { ScrapedSupplierImage } from "@/lib/images/types";

const MARKETPLACE_IMAGE_HOST =
  /(?:alicdn\.com|aliexpress-media\.com|ebayimg\.com|temu\.com|wish\.com|alibaba\.com)/i;

const SKIP_IMAGE_PATTERN =
  /(?:logo|icon|avatar|badge|banner|sprite|payment|flag|\/48x48|\/20x20|\/702x72|-tps-\d+-\d+|imgextra\/i\d+\/O1CN)/i;

/** Strip markdown artifacts from a raw URL token. */
export function cleanRawImageUrl(raw: string): string {
  let url = raw.trim();
  const markdownSplit = url.indexOf("](");
  if (markdownSplit > 0) url = url.slice(0, markdownSplit);
  url = url.replace(/^[\[(]+/, "").replace(/[)\]"',]+$/, "");
  url = url.replace(/(\.(?:jpg|jpeg|png|webp|avif))(?:_\.\w+)?[^a-zA-Z0-9./-]*$/i, "$1");
  return url.split("?")[0];
}

/** Normalize AliExpress/eBay thumbnail URLs to full-size CDN URLs. */
export function normalizeMarketplaceImageUrl(url: string): string {
  let normalized = cleanRawImageUrl(url);
  if (!normalized) return "";

  normalized = normalized.replace(/\.(jpg|jpeg|png|webp|avif)_\d+x\d+q?\d*\.(?:jpg|jpeg|avif)$/i, ".$1");
  normalized = normalized.replace(/_(?:\d+x\d+q?\d*)\.(jpg|jpeg|png|webp|avif)$/i, ".$1");
  normalized = normalized.replace(/\.avif$/i, ".jpg");
  normalized = normalized.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/i, ".$1");

  if (SKIP_IMAGE_PATTERN.test(normalized)) return "";
  if (normalized.includes("imgextra/")) return "";
  if (/\/\d{1,2}x\d{1,2}\.(png|jpg|webp)$/i.test(normalized)) return "";

  return normalized;
}

function scoreImageUrl(url: string): number {
  let score = 0;
  if (url.includes("aliexpress-media.com/kf/")) score += 50;
  if (url.includes("ae-pic-")) score += 30;
  if (url.includes("ae01.alicdn.com/kf/")) score += 25;
  if (url.includes("ebayimg.com")) score += 20;
  if (url.includes("_220x220") || url.includes("_480x480")) score -= 20;
  if (url.includes(".png")) score -= 5;
  return score;
}

export function rankMarketplaceImageUrls(urls: string[]): string[] {
  return [...new Set(urls)].sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a));
}

export function extractMarketplaceImageUrls(text: string): string[] {
  const pattern =
    /https?:\/\/[^\s"'<>]+(?:alicdn\.com|aliexpress-media\.com|ebayimg\.com|temu\.com|wish\.com|alibaba\.com)[^\s"'<>]*\.(?:jpg|jpeg|png|webp|avif)(?:[^\s"'<>]*)?/gi;
  const matches = text.match(pattern) ?? [];
  const urls: string[] = [];

  for (const raw of matches) {
    const normalized = normalizeMarketplaceImageUrl(raw);
    if (!normalized || !MARKETPLACE_IMAGE_HOST.test(normalized)) continue;
    urls.push(normalized);
  }

  return rankMarketplaceImageUrls(urls);
}

export function extractAliExpressProductIds(text: string): string[] {
  const ids = new Set<string>();
  const pathMatches = text.matchAll(/\/item\/(\d{10,20})\.html/gi);
  for (const match of pathMatches) {
    ids.add(match[1]);
  }
  const looseMatches = text.matchAll(/\b(100500\d{10,13}|3256\d{10,13})\b/g);
  for (const match of looseMatches) {
    ids.add(match[1]);
  }
  return [...ids];
}

export function toScrapedImages(
  urls: string[],
  source: ScrapedSupplierImage["source"],
  supplierProductId: string,
  max = 6
): ScrapedSupplierImage[] {
  return urls.slice(0, max).map((url, index) => ({
    url,
    source,
    supplierProductId,
    sortOrder: index,
  }));
}

export function aliExpressItemUrl(productId: string): string {
  return `https://www.aliexpress.com/item/${productId}.html`;
}

export function aliExpressSearchUrl(query: string): string {
  return `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
}

export function ebaySearchUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
}

export function temuSearchUrl(query: string): string {
  return `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
}
