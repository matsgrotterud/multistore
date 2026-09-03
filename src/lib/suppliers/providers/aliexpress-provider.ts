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
} from "@/lib/suppliers/providers/types";

export class AliExpressProvider implements CommerceProvider {
  key = "aliexpress" as const;
  name = "AliExpress Affiliate/Open Platform";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    return {
      // Signing helpers exist, but product response mapping and transport are
      // not implemented. Do not advertise scaffolded code as a live adapter.
      search: false,
      details: false,
      images: false,
      video: false,
      pricing: false,
      inventory: false,
      checkout: false,
      tracking: false,
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
        message: "AliExpress credentials are missing and the live product transport is not implemented.",
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
        message: "AliExpress credentials exist, but endpoint/method configuration and live product mapping are incomplete.",
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "DEGRADED",
      message: "AliExpress configuration is present, but live product mapping is not implemented.",
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void input;
    const missing = [
      "ALIEXPRESS_APP_KEY",
      "ALIEXPRESS_APP_SECRET",
      "ALIEXPRESS_API_ENDPOINT",
      "ALIEXPRESS_SEARCH_METHOD",
    ].filter((key) => !process.env[key]);
    if (missing.length > 0) throw new ProviderAuthMissingError(this.key, missing);
    throw new UnsupportedCapabilityError(this.key, "search");
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    void input;
    throw new UnsupportedCapabilityError(this.key, "details");
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

export const aliexpressProvider = new AliExpressProvider();
