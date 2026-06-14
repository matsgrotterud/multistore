import crypto from "node:crypto";

const API_URL = process.env.ALIEXPRESS_API_URL ?? "https://api-sg.aliexpress.com/sync";

export interface AliExpressApiProduct {
  productId: string;
  title: string;
  salePrice: string;
  imageUrl: string;
  galleryUrls: string[];
  productUrl: string;
}

export function isAliExpressApiConfigured(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}

function signParams(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  const payload = `${appSecret}${concatenated}${appSecret}`;
  return crypto.createHash("md5").update(payload, "utf8").digest("hex").toUpperCase();
}

function timestampGmt8(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false })
    .replace("T", " ");
}

async function callAliExpressApi(
  method: string,
  businessParams: Record<string, string>
): Promise<unknown> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error("ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET are required");
  }

  const payload: Record<string, string> = {
    method,
    app_key: appKey,
    sign_method: "md5",
    timestamp: timestampGmt8(),
    format: "json",
    v: "2.0",
    ...businessParams,
  };

  payload.sign = signParams(payload, appSecret);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(payload),
  });

  if (!response.ok) {
    throw new Error(`AliExpress API HTTP ${response.status}`);
  }

  return response.json();
}

function parseGallery(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.startsWith("http"));
  }
  if (typeof raw === "string") {
    return raw
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter((part) => part.startsWith("http"));
  }
  return [];
}

function mapProduct(item: Record<string, unknown>): AliExpressApiProduct | null {
  const productId = String(item.product_id ?? item.productId ?? "");
  const title = String(item.product_title ?? item.title ?? "");
  const imageUrl = String(
    item.product_main_image_url ?? item.product_main_image ?? item.image_url ?? ""
  );
  if (!productId || !imageUrl) return null;

  const galleryUrls = [
    imageUrl,
    ...parseGallery(item.product_small_image_urls),
    ...parseGallery(item.product_video_url),
  ].filter(Boolean);

  return {
    productId,
    title,
    salePrice: String(item.sale_price ?? item.target_sale_price ?? ""),
    imageUrl,
    galleryUrls: [...new Set(galleryUrls)],
    productUrl: String(
      item.product_detail_url ??
        item.promotion_link ??
        `https://www.aliexpress.com/item/${productId}.html`
    ),
  };
}

export async function searchAliExpressProductsApi(
  keywords: string,
  pageSize = 5
): Promise<AliExpressApiProduct[]> {
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  const data = (await callAliExpressApi("aliexpress.affiliate.product.query", {
    keywords,
    page_no: "1",
    page_size: String(pageSize),
    target_currency: "USD",
    target_language: "EN",
    ship_to_country: "US",
    ...(trackingId ? { tracking_id: trackingId } : {}),
  })) as Record<string, unknown>;

  const response =
    (data.aliexpress_affiliate_product_query_response as Record<string, unknown> | undefined) ??
    (data as Record<string, unknown>);
  const result = (response.resp_result as Record<string, unknown> | undefined) ?? response;
  const productsContainer = result.result as Record<string, unknown> | undefined;
  const products = productsContainer?.products as Record<string, unknown> | undefined;
  const list = products?.product;

  const items = Array.isArray(list) ? list : list ? [list] : [];
  return items
    .map((item) => mapProduct(item as Record<string, unknown>))
    .filter((item): item is AliExpressApiProduct => item !== null);
}

export async function getAliExpressProductDetailApi(
  productId: string
): Promise<AliExpressApiProduct | null> {
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  const data = (await callAliExpressApi("aliexpress.affiliate.productdetail.get", {
    product_ids: productId,
    target_currency: "USD",
    target_language: "EN",
    ...(trackingId ? { tracking_id: trackingId } : {}),
  })) as Record<string, unknown>;

  const response =
    (data.aliexpress_affiliate_productdetail_get_response as Record<string, unknown> | undefined) ??
    (data as Record<string, unknown>);
  const result = (response.resp_result as Record<string, unknown> | undefined) ?? response;
  const productsContainer = result.result as Record<string, unknown> | undefined;
  const products = productsContainer?.products as Record<string, unknown> | undefined;
  const list = products?.product;
  const item = Array.isArray(list) ? list[0] : list;
  if (!item || typeof item !== "object") return null;
  return mapProduct(item as Record<string, unknown>);
}
