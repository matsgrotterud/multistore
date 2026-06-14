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

export class AmazonProvider implements CommerceProvider {
  key = "amazon" as const;
  name = "Amazon Associates/SP-API";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const affiliate = Boolean(process.env.AMAZON_ASSOCIATE_TAG);
    const spApi = process.env.AMAZON_SP_API_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: affiliate || spApi,
      details: affiliate || spApi,
      images: affiliate || spApi,
      pricing: affiliate || spApi,
      inventory: spApi,
      checkout: false,
      affiliateLinks: affiliate,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["AMAZON_CREATOR_CREDENTIAL_ID", "AMAZON_CREATOR_CREDENTIAL_SECRET", "AMAZON_ASSOCIATE_TAG"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Amazon defaults to affiliate mode and needs Associates/API credentials before discovery."
        : "Amazon affiliate credentials are present. Direct checkout remains disabled.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const amazonProvider = new AmazonProvider();
