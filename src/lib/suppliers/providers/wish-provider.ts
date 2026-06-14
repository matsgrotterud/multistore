import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";

export class WishProvider implements CommerceProvider {
  key = "wish" as const;
  name = "Wish Merchant API";
  defaultFulfillmentMode = "MANUAL" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.WISH_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: enabled,
      details: enabled,
      images: enabled,
      pricing: enabled,
      inventory: enabled,
      checkout: false,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["WISH_CLIENT_ID", "WISH_CLIENT_SECRET", "WISH_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.WISH_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Wish remains manual mode until merchant API credentials are configured."
        : "Wish credentials are present. Checkout is still disabled until an approved order flow is added.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const wishProvider = new WishProvider();
