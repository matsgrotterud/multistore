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

export class TemuProvider implements CommerceProvider {
  key = "temu" as const;
  name = "Temu authorized provider";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.TEMU_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: enabled,
      details: enabled,
      images: enabled,
      pricing: enabled,
      inventory: enabled,
      affiliateLinks: enabled,
      checkout: false,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["TEMU_APP_KEY", "TEMU_APP_SECRET", "TEMU_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.TEMU_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Temu is disabled until authorized API credentials are configured."
        : "Temu credentials are present. Keep checkout disabled unless an approved seller/provider order API is active.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const temuProvider = new TemuProvider();
