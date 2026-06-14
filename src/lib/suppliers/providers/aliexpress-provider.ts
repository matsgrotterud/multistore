import crypto from "node:crypto";
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

export class AliExpressProvider implements CommerceProvider {
  key = "aliexpress" as const;
  name = "AliExpress Affiliate/Open Platform";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const configured = hasAliExpressCredentials();
    const checkout = process.env.ALIEXPRESS_DROPSHIP_ENABLED === "true";
    return {
      search: configured,
      details: configured,
      images: configured,
      video: false,
      pricing: configured,
      inventory: configured,
      checkout,
      tracking: checkout,
      returns: false,
      affiliateLinks: Boolean(process.env.ALIEXPRESS_TRACKING_ID),
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET"].filter((key) => !process.env[key]);
    if (missing.length) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "AliExpress credentials are missing. Fixture mode is available for pipeline testing only.",
        missingEnv: missing,
        capabilities: { ...this.capabilities, search: false, details: false, images: false, pricing: false, inventory: false },
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    if (!process.env.ALIEXPRESS_API_ENDPOINT || !process.env.ALIEXPRESS_SEARCH_METHOD) {
      return {
        key: this.key,
        name: this.name,
        status: "DEGRADED",
        message: "AliExpress credentials exist, but endpoint/method env vars are not configured. Fixture mode remains active.",
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message: "AliExpress API configuration is present.",
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    if (!hasAliExpressCredentials() || !process.env.ALIEXPRESS_API_ENDPOINT || !process.env.ALIEXPRESS_SEARCH_METHOD) {
      return validateSearchResults(this.key, aliExpressFixtures(input.query, input.limit ?? 12));
    }

    throw new Error(
      "AliExpress signed API transport is scaffolded, but product method mapping must be configured before live imports."
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    const match = aliExpressFixtures("", 12).find((item) => item.externalId === input.externalId);
    if (!match) throw new ProviderAuthMissingError(this.key, ["ALIEXPRESS_PRODUCT_METHOD"]);
    return validateSearchResults(this.key, [match])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export function signAliExpressParams(
  params: Record<string, string | number | boolean | undefined>,
  appSecret: string
): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${String(value)}`)
    .join("");

  return crypto
    .createHmac("sha256", appSecret)
    .update(canonical)
    .digest("hex")
    .toUpperCase();
}

function hasAliExpressCredentials(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}

function aliExpressFixtures(query: string, limit: number): Omit<ProductSearchResult, "providerKey">[] {
  const items: Omit<ProductSearchResult, "providerKey">[] = [
    fixture("ae-mock-cable-organizer", "Magnetic Cable Organizer Set", "Desk cable clips and magnetic cable anchors for cleaner workstations."),
    fixture("ae-mock-bike-light", "USB Rechargeable Bike Light Kit", "Front and rear LED safety lights with weather-resistant housings."),
    fixture("ae-mock-kitchen-scale", "Compact Digital Kitchen Scale", "Slim kitchen scale with tare function and stainless weighing surface."),
  ];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = terms.length
    ? items.filter((item) => terms.some((term) => item.title.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)))
    : items;
  return filtered.slice(0, limit);
}

function fixture(externalId: string, title: string, description: string): Omit<ProductSearchResult, "providerKey"> {
  return {
    externalId,
    sourceUrl: `https://www.aliexpress.com/item/${externalId}.html`,
    affiliateUrl: `https://www.aliexpress.com/item/${externalId}.html?aff_fcid=mock`,
    title,
    description,
    brand: "AliExpress supplier",
    price: 29,
    currency: "USD",
    supplierCost: 9,
    shippingCost: 3.5,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 8,
    shippingDaysMax: 16,
    countryOfOrigin: "CN",
    sku: externalId.toUpperCase(),
    specs: [{ label: "Mode", value: "AliExpress fixture" }],
    variants: [],
    media: [0, 1, 2].map((index) => ({
      url: `https://placehold.co/1000x1000/png?text=${encodeURIComponent(`${title} ${index + 1}`)}`,
      mediaType: "IMAGE" as const,
      alt: `${title} image ${index + 1}`,
      sortOrder: index,
    })),
    signals: { source: "aliexpress_fixture", fixtureMode: true },
    risk: {},
    fulfillmentMode: "AFFILIATE",
  };
}

export const aliexpressProvider = new AliExpressProvider();
