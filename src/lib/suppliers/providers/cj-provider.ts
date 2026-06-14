import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import { cjFetch, getCjHealthInfo, isCjEnabled } from "@/lib/suppliers/providers/cj-auth";
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
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: false,
  checkout: false,
  tracking: true,
  returns: false,
  affiliateLinks: false,
};

interface CjProductListItem {
  pid?: string;
  productName?: string;
  productNameEn?: string;
  sellPrice?: number;
  bigImage?: string;
  productImage?: string;
  productImageSet?: string[];
  description?: string;
  categoryName?: string;
}

export class CjDropshippingProvider implements CommerceProvider {
  key = "cj" as const;
  name = "CJdropshipping";
  capabilities = capabilities;
  defaultFulfillmentMode = "DROPSHIP" as const;

  async getHealth(): Promise<ProviderHealth> {
    const info = getCjHealthInfo();
    if (!info.enabled) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Set CJ_ENABLED=true to activate CJdropshipping.",
        missingEnv: info.missingEnv,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    if (!info.configured) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "CJ credentials missing.",
        missingEnv: info.missingEnv,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    try {
      await cjFetch<{ total?: number }>(
        `/product/list?pageNum=1&pageSize=1&keyword=${encodeURIComponent("brush")}`
      );
      return {
        key: this.key,
        name: this.name,
        status: "OK",
        message: "CJ API reachable. Order API requires verified CJ order endpoint before checkout is enabled.",
        capabilities: {
          ...capabilities,
          checkout: process.env.CJ_ORDER_API_ENABLED === "true",
        },
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    } catch (error) {
      return {
        key: this.key,
        name: this.name,
        status: "ERROR",
        message: error instanceof Error ? error.message : "CJ health check failed",
        missingEnv: info.missingEnv,
        capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    if (!isCjEnabled()) return [];
    const data = await cjFetch<{ list?: CjProductListItem[] }>(
      `/product/list?pageNum=1&pageSize=${input.limit ?? 12}&keyword=${encodeURIComponent(input.query)}`
    );
    const list = data.list ?? [];
    return validateSearchResults(
      this.key,
      list.map((item) => mapCjProduct(item)).filter(Boolean)
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    if (!isCjEnabled()) throw new Error("CJ is not enabled");
    const data = await cjFetch<CjProductListItem>(
      `/product/query?pid=${encodeURIComponent(input.externalId)}`
    );
    const mapped = mapCjProduct(data);
    if (!mapped) throw new Error(`CJ product not found: ${input.externalId}`);
    return validateSearchResults(this.key, [mapped])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    if (process.env.CJ_ORDER_API_ENABLED !== "true") {
      return {
        status: "ERROR",
        errorMessage:
          "CJ order API is not enabled. Set CJ_ORDER_API_ENABLED=true only after verifying the create-order endpoint contract in your CJ account.",
        requestJson: input,
      };
    }

    try {
      const response = await cjFetch<{ orderId?: string; orderNum?: string }>(
        "/shopping/order/createOrderV2",
        {
          method: "POST",
          body: JSON.stringify({
            orderNumber: input.orderId,
            shippingZip: input.shippingAddress.postalCode,
            shippingCountryCode: input.shippingAddress.country,
            shippingCountry: input.shippingAddress.country,
            shippingProvince: input.shippingAddress.city,
            shippingCity: input.shippingAddress.city,
            shippingAddress: input.shippingAddress.addressLine1,
            shippingCustomerName: input.shippingAddress.name,
            products: input.items.map((item) => ({
              vid: item.externalId,
              quantity: item.quantity,
            })),
          }),
        }
      );

      return {
        status: "PLACED",
        externalOrderId: response.orderId ?? response.orderNum,
        requestJson: input,
        responseJson: response,
      };
    } catch (error) {
      return {
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "CJ order placement failed",
        requestJson: input,
      };
    }
  }
}

function mapCjProduct(item: CjProductListItem): Record<string, unknown> | null {
  const externalId = item.pid;
  const title = item.productNameEn ?? item.productName;
  const image = item.bigImage ?? item.productImage;
  if (!externalId || !title || !image) return null;

  const gallery = [image, ...(item.productImageSet ?? [])].filter(Boolean);
  return {
    externalId,
    title,
    description: item.description ?? title,
    price: item.sellPrice,
    currency: "USD",
    stockStatus: "IN_STOCK",
    shippingDaysMin: 7,
    shippingDaysMax: 18,
    countryOfOrigin: "CN",
    sourceUrl: `https://cjdropshipping.com/product/${externalId}.html`,
    fulfillmentMode: "DROPSHIP",
    media: gallery.map((url, index) => ({
      url,
      mediaType: "IMAGE",
      alt: title,
      sortOrder: index,
    })),
    signals: { source: "cj_api" },
    risk: {},
  };
}

export const cjProvider = new CjDropshippingProvider();
