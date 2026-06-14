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

export class AlibabaProvider implements CommerceProvider {
  key = "alibaba" as const;
  name = "Alibaba supplier integration";
  defaultFulfillmentMode = "MANUAL" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.ALIBABA_ENABLED === "true";
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
    const missing = ["ALIBABA_APP_KEY", "ALIBABA_APP_SECRET", "ALIBABA_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.ALIBABA_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Alibaba remains manual mode until authorized supplier/API credentials are configured."
        : "Alibaba credentials are present. Checkout is disabled until a supplier order integration is approved.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const alibabaProvider = new AlibabaProvider();
