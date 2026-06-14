import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  type CommerceProvider,
  type CreateSupplierOrderResult,
  type CreateDropshipOrderInput,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope";

export class EbayProvider implements CommerceProvider {
  key = "ebay" as const;
  name = "eBay Browse API";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const checkout = process.env.EBAY_BUY_ORDER_ENABLED === "true";
    return {
      search: true,
      details: true,
      images: true,
      video: false,
      pricing: true,
      inventory: true,
      checkout,
      tracking: checkout,
      returns: false,
      affiliateLinks: true,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = requiredEnv(["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    if (missing.length) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "eBay search requires OAuth client credentials.",
        missingEnv: missing,
        capabilities: { ...this.capabilities, search: false, details: false, images: false, pricing: false, inventory: false },
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message:
        process.env.EBAY_BUY_ORDER_ENABLED === "true"
          ? "eBay Browse API is configured. Buy/order capability flag is enabled; verify account approval before routing orders."
          : "eBay Browse API is configured in affiliate/search mode.",
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    assertConfigured(this.key, ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    const token = await this.fetchToken();
    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", input.query);
    url.searchParams.set("limit", String(Math.min(input.limit ?? 20, 50)));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`eBay search failed (${response.status}): ${await response.text()}`);
    }

    const body = (await response.json()) as { itemSummaries?: unknown[] };
    return validateSearchResults(
      this.key,
      (body.itemSummaries ?? []).map((item) => normalizeEbayItem(item))
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    assertConfigured(this.key, ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    const token = await this.fetchToken();
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(input.externalId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US",
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      throw new Error(`eBay details failed (${response.status}): ${await response.text()}`);
    }
    return validateSearchResults(this.key, [normalizeEbayItem(await response.json())])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }

  private async fetchToken(): Promise<string> {
    const credentials = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString("base64");
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: EBAY_SCOPE,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`eBay OAuth failed (${response.status}): ${await response.text()}`);
    }
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("eBay OAuth response did not include access_token.");
    return body.access_token;
  }
}

interface EbayRawItem {
  itemId?: string;
  legacyItemId?: string;
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  title?: string;
  shortDescription?: string;
  brand?: string;
  price?: { value?: string | number; currency?: string };
  shippingOptions?: Array<{ shippingCost?: { value?: string | number } }>;
  additionalImages?: Array<{ imageUrl?: string }>;
  image?: { imageUrl?: string };
  estimatedAvailabilities?: Array<{ availabilityThresholdType?: string }>;
  localizedAspects?: Array<{ name?: string; value?: string }>;
  condition?: string;
  seller?: unknown;
  buyingOptions?: unknown;
  itemLocation?: unknown;
}

function normalizeEbayItem(item: unknown): Omit<ProductSearchResult, "providerKey"> {
  const raw = item as EbayRawItem;
  const priceValue = Number(raw.price?.value);
  const shipping = Array.isArray(raw.shippingOptions) ? raw.shippingOptions[0] : undefined;
  const shippingCost = Number(shipping?.shippingCost?.value);
  const additionalImages = Array.isArray(raw.additionalImages) ? raw.additionalImages : [];
  const media: SupplierMedia[] = [
    raw.image?.imageUrl,
    ...additionalImages.map((image: { imageUrl?: string }) => image.imageUrl),
  ]
    .filter((url): url is string => typeof url === "string" && url.startsWith("http"))
    .map((url, index) => ({
      url,
      mediaType: "IMAGE",
      alt: raw.title ? `${raw.title} image ${index + 1}` : `eBay image ${index + 1}`,
      sortOrder: index,
    }));

  return {
    externalId: String(raw.itemId ?? raw.legacyItemId ?? raw.itemWebUrl),
    sourceUrl: raw.itemWebUrl,
    affiliateUrl: raw.itemAffiliateWebUrl,
    title: String(raw.title ?? "Untitled eBay item"),
    description: raw.shortDescription,
    brand: raw.brand,
    price: Number.isFinite(priceValue) ? priceValue : undefined,
    currency: raw.price?.currency,
    shippingCost: Number.isFinite(shippingCost) ? shippingCost : undefined,
    stockStatus: raw.estimatedAvailabilities?.[0]?.availabilityThresholdType === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "UNKNOWN",
    specs: Array.isArray(raw.localizedAspects)
      ? raw.localizedAspects.map((aspect: { name?: string; value?: string }) => ({
          label: String(aspect.name ?? "Attribute"),
          value: String(aspect.value ?? ""),
        }))
      : [],
    variants: [],
    media,
    signals: {
      source: "ebay_browse_api",
      condition: raw.condition,
      seller: raw.seller,
      buyingOptions: raw.buyingOptions,
      itemLocation: raw.itemLocation,
      shippingOptions: raw.shippingOptions,
    },
    risk: {},
    rawData: raw,
    fulfillmentMode: "AFFILIATE",
  };
}

function requiredEnv(keys: string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}

function assertConfigured(providerKey: string, keys: string[]): void {
  const missing = requiredEnv(keys);
  if (missing.length) throw new ProviderAuthMissingError(providerKey, missing);
}

export const ebayProvider = new EbayProvider();
