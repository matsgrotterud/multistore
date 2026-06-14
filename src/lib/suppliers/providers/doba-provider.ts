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
import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";

const capabilities: ProviderCapabilities = {
  search: false,
  details: false,
  images: false,
  video: false,
  pricing: false,
  inventory: false,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: false,
};

function isEnabled(): boolean {
  return process.env.DOBA_ENABLED === "true";
}

function missingEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.DOBA_ACCESS_KEY) missing.push("DOBA_ACCESS_KEY");
  if (!process.env.DOBA_APP_KEY) missing.push("DOBA_APP_KEY");
  if (!process.env.DOBA_APP_SECRET) missing.push("DOBA_APP_SECRET");
  return missing;
}

export class DobaProvider implements CommerceProvider {
  key = "doba" as const;
  name = "Doba";
  capabilities = capabilities;
  defaultFulfillmentMode = "DROPSHIP" as const;

  async getHealth(): Promise<ProviderHealth> {
    if (!isEnabled()) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Set DOBA_ENABLED=true to activate Doba integration scaffold.",
        missingEnv: ["DOBA_ENABLED", ...missingEnv()],
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    const missing = missingEnv();
    if (missing.length > 0) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Doba credentials missing.",
        missingEnv: missing,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "DEGRADED",
      message:
        "Doba scaffold is configured but product/order endpoints are not wired until the API contract is confirmed.",
      capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    return [];
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    throw new UnsupportedCapabilityError(this.key, "details");
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    return [];
  }

  async createDropshipOrder(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    return {
      status: "ERROR",
      errorMessage:
        "Doba order API is not implemented yet. Confirm Doba endpoint contract before enabling checkout.",
      requestJson: input,
    };
  }
}

export const dobaProvider = new DobaProvider();
