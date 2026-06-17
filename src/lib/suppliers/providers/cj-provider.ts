import {
  cjFetch,
  getCjHealthInfo,
  getCjOrderConfig,
  isCjEnabled,
} from "@/lib/suppliers/providers/cj-auth";
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

const baseCapabilities: ProviderCapabilities = {
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
  id?: string;
  pid?: string;
  sku?: string;
  spu?: string;
  nameEn?: string;
  productName?: string;
  productNameEn?: string;
  productSku?: string;
  sellPrice?: number;
  nowPrice?: string;
  discountPrice?: string;
  bigImage?: string;
  productImage?: string;
  productImageSet?: string[] | string;
  productImageList?: unknown;
  productImages?: unknown;
  descriptionImages?: unknown;
  videoList?: string[] | string;
  productVideo?: string[] | string;
  description?: string;
  categoryName?: string;
  deliveryCycle?: string;
  listedNum?: number;
  warehouseInventoryNum?: number;
  totalVerifiedInventory?: number;
  productKeyEn?: string;
  variants?: CjVariant[];
  rawData?: unknown;
  [key: string]: unknown;
}

interface CjVariant {
  vid?: string;
  pid?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantKey?: string;
  variantProperty?: string;
  variantStandard?: string;
  variantImage?: string;
  variantSellPrice?: number;
  variantSugSellPrice?: number;
  inventories?: Array<{ totalInventory?: number; countryCode?: string }>;
  [key: string]: unknown;
}

interface CjListV2Response {
  content?: Array<{ productList?: CjProductListItem[] }>;
  list?: CjProductListItem[];
}

export class CjDropshippingProvider implements CommerceProvider {
  key = "cj" as const;
  name = "CJdropshipping";
  defaultFulfillmentMode = "DROPSHIP" as const;

  get capabilities(): ProviderCapabilities {
    return {
      ...baseCapabilities,
      checkout: getCjOrderConfig().enabled,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const info = getCjHealthInfo();
    const orderConfig = getCjOrderConfig();
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
      await cjFetch<CjListV2Response>(
        `/product/listV2?page=1&size=1&keyWord=${encodeURIComponent("brush")}`
      );
      return {
        key: this.key,
        name: this.name,
        status: "OK",
        message: orderConfig.enabled
          ? `CJ API reachable. Order API enabled with payType=${orderConfig.payType}.`
          : orderConfig.missingEnv.length > 0 && process.env.CJ_ORDER_API_ENABLED === "true"
            ? `CJ API reachable. Order API flag is on, but missing ${orderConfig.missingEnv.join(", ")}.`
            : "CJ API reachable. Order API remains disabled until explicitly enabled.",
        missingEnv:
          process.env.CJ_ORDER_API_ENABLED === "true" && orderConfig.missingEnv.length > 0
            ? orderConfig.missingEnv
            : undefined,
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    } catch (error) {
      return {
        key: this.key,
        name: this.name,
        status: "ERROR",
        message: error instanceof Error ? error.message : "CJ health check failed",
        missingEnv: info.missingEnv,
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    if (!isCjEnabled()) return [];
    const limit = Math.max(1, Math.min(input.limit ?? 12, 100));
    const data = await cjFetch<CjListV2Response>(
      `/product/listV2?page=1&size=${limit}&keyWord=${encodeURIComponent(input.query)}&features=enable_description,enable_video`
    );
    const list =
      data.list ??
      data.content?.flatMap((group) => group.productList ?? []) ??
      [];
    return validateSearchResults(
      this.key,
      list.map((item) => mapCjProduct(item, item)).filter(Boolean)
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    if (!isCjEnabled()) throw new Error("CJ is not enabled");
    const data = await cjFetch<CjProductListItem>(
      `/product/query?pid=${encodeURIComponent(input.externalId)}&features=enable_video`
    );
    const mapped = mapCjProduct(data, data);
    if (!mapped) throw new Error(`CJ product not found: ${input.externalId}`);
    return validateSearchResults(this.key, [mapped])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    const orderConfig = getCjOrderConfig();
    if (!orderConfig.enabled) {
      return {
        status: "ERROR",
        errorMessage:
          process.env.CJ_ORDER_API_ENABLED === "true"
            ? `CJ order API is missing ${orderConfig.missingEnv.join(", ")}.`
            : "CJ order API is not enabled. Set CJ_ORDER_API_ENABLED=true only after verifying the Create Order V2 contract in your CJ account.",
        requestJson: input,
      };
    }

    try {
      const products = await Promise.all(
        input.items.map(async (item) => {
          const variant =
            item.externalVariantId || item.sku
              ? { vid: item.externalVariantId, sku: item.sku }
              : await resolveCjVariant(item.externalId);
          return {
            vid: variant.vid,
            sku: variant.vid ? undefined : variant.sku,
            quantity: item.quantity,
            storeLineItemId: item.externalId,
          };
        })
      );
      const missingVariant = products.find((product) => !product.vid && !product.sku);
      if (missingVariant) {
        return {
          status: "ERROR",
          errorMessage: "CJ order requires a variant id (vid) or SKU for every line item.",
          requestJson: input,
        };
      }

      const countryCode = normalizeCountryCode(input.shippingAddress.country);
      if (!countryCode) {
        return {
          status: "ERROR",
          errorMessage: "CJ order requires a two-letter ISO shipping country code.",
          requestJson: input,
        };
      }

      const response = await cjFetch<{ orderId?: string; orderNum?: string }>(
        "/shopping/order/createOrderV2",
        {
          method: "POST",
          body: JSON.stringify({
            orderNumber: input.orderId,
            shippingZip: input.shippingAddress.postalCode,
            shippingCountryCode: countryCode,
            shippingCountry: countryCode,
            shippingProvince: input.shippingAddress.city,
            shippingCity: input.shippingAddress.city,
            shippingAddress: input.shippingAddress.addressLine1,
            shippingCustomerName: input.shippingAddress.name,
            email: input.shippingAddress.email,
            payType: orderConfig.payType,
            logisticName: orderConfig.logisticName,
            fromCountryCode: orderConfig.fromCountryCode,
            platform: "api",
            orderFlow: 1,
            products,
          }),
        }
      );

      return {
        status: orderConfig.payType === 2 ? "PLACED" : "PENDING",
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

async function resolveCjVariant(externalId: string): Promise<{ vid?: string; sku?: string }> {
  try {
    const details = await cjFetch<CjProductListItem>(
      `/product/query?pid=${encodeURIComponent(externalId)}`
    );
    const variant = details.variants?.find((entry) => entry.vid || entry.variantSku);
    return { vid: variant?.vid, sku: variant?.variantSku };
  } catch {
    return { vid: externalId };
  }
}

function mapCjProduct(item: CjProductListItem, rawData?: unknown): Record<string, unknown> | null {
  const externalId = item.pid ?? item.id;
  const title = item.productNameEn ?? item.nameEn ?? item.productName;
  const media = normalizeSupplierMediaUrls(item, title ?? "");
  const image = media.find((entry) => entry.mediaType === "IMAGE")?.url ?? item.bigImage ?? item.productImage;
  if (!externalId || !title || !image) return null;

  const delivery = parseDeliveryCycle(item.deliveryCycle);
  const inventory = item.totalVerifiedInventory ?? item.warehouseInventoryNum;
  const firstVariant = item.variants?.find((variant) => variant.vid || variant.variantSku);
  const supplierCost = parsePrice(
    item.sellPrice ?? firstVariant?.variantSellPrice ?? item.nowPrice ?? item.discountPrice
  );

  return {
    externalId,
    title,
    description: item.description ?? title,
    supplierCost,
    currency: "USD",
    stockStatus: inventory === 0 ? "OUT_OF_STOCK" : "IN_STOCK",
    shippingDaysMin: delivery?.min ?? 7,
    shippingDaysMax: delivery?.max ?? 18,
    countryOfOrigin: "CN",
    sourceUrl: `https://cjdropshipping.com/product/${externalId}.html`,
    fulfillmentMode: "DROPSHIP",
    sku: item.productSku ?? item.sku ?? item.spu ?? firstVariant?.variantSku,
    variants: normalizeCjVariants(item.variants ?? [], item.productKeyEn),
    media,
    signals: {
      source: "cj_api",
      listedNum: item.listedNum,
      defaultVariantId: firstVariant?.vid,
    },
    risk: {},
    rawData,
  };
}

function normalizeSupplierMediaUrls(raw: unknown, title: string): SupplierMedia[] {
  const candidates: Array<{ url: string; mediaType: "IMAGE" | "VIDEO"; keyPath: string }> = [];

  function add(url: unknown, keyPath: string): void {
    if (typeof url !== "string") return;
    for (const found of extractUrls(url)) {
      const normalized = normalizeHttpUrl(found);
      if (!normalized) continue;
      const mediaType = inferMediaType(normalized, keyPath);
      if (!mediaType) continue;
      candidates.push({ url: normalized, mediaType, keyPath });
    }
  }

  function walk(value: unknown, keyPath: string, depth = 0): void {
    if (depth > 5 || value == null) return;
    if (typeof value === "string") {
      add(value, keyPath);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${keyPath}[${index}]`, depth + 1));
      return;
    }
    if (typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        walk(entry, keyPath ? `${keyPath}.${key}` : key, depth + 1);
      }
    }
  }

  walk(raw, "");

  const seen = new Set<string>();
  const images: SupplierMedia[] = [];
  const videos: SupplierMedia[] = [];

  for (const candidate of candidates) {
    const dedupeKey = stripCacheBuster(candidate.url);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const media: SupplierMedia = {
      url: candidate.url,
      mediaType: candidate.mediaType,
      alt: title,
      sortOrder: 0,
    };
    if (candidate.mediaType === "VIDEO") {
      if (videos.length < 2) videos.push(media);
    } else if (images.length < 12) {
      images.push(media);
    }
  }

  return [...images, ...videos].map((entry, index) => ({ ...entry, sortOrder: index }));
}

function extractUrls(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (/^https?:\/\//i.test(trimmed)) return [trimmed];
  const matches = value.match(/https?:\/\/[^\s"'<>),]+/gi);
  return matches ?? [];
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function inferMediaType(url: string, keyPath: string): "IMAGE" | "VIDEO" | null {
  const haystack = `${url} ${keyPath}`.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(haystack) || /(video|videolist|productvideo)/.test(haystack)) {
    return "VIDEO";
  }
  if (
    /\.(jpe?g|png|webp|gif)(\?|$)/.test(haystack) ||
    /(image|images|img|photo|picture|pic|thumbnail|variantimage|bigimage)/.test(haystack)
  ) {
    return "IMAGE";
  }
  return null;
}

function stripCacheBuster(value: string): string {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(x-oss-|expires?|signature|token|spm|timestamp|ts)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return value;
  }
}

function normalizeCjVariants(variants: CjVariant[], productKeyEn?: string): Array<Record<string, unknown>> {
  const optionLabels = splitOptionList(productKeyEn);

  return variants
    .map((variant, index) => {
      const optionValues = splitOptionList(
        variant.variantKey ?? variant.variantProperty ?? variant.variantStandard
      );
      const options: Record<string, string> = {};
      optionValues.forEach((value, optionIndex) => {
        const label = optionLabels[optionIndex] ?? `Option ${optionIndex + 1}`;
        options[label] = value;
      });

      const inventoryQuantity = totalVariantInventory(variant);
      const optionSummary =
        variant.variantKey ??
        variant.variantProperty ??
        variant.variantStandard ??
        variant.variantNameEn ??
        variant.variantSku ??
        `Variant ${index + 1}`;

      return {
        externalVariantId: variant.vid,
        sku: variant.variantSku,
        title: variant.variantNameEn ?? optionSummary,
        optionSummary,
        options,
        supplierCost: parsePrice(variant.variantSellPrice ?? variant.variantSugSellPrice),
        stockStatus: inventoryQuantity === 0 ? "OUT_OF_STOCK" : "IN_STOCK",
        inventoryQuantity,
        imageUrl: typeof variant.variantImage === "string" ? normalizeHttpUrl(variant.variantImage) ?? undefined : undefined,
        rawData: variant,
      };
    })
    .filter((variant) => variant.externalVariantId || variant.sku || variant.optionSummary);
}

function splitOptionList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[-/|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function totalVariantInventory(variant: CjVariant): number | undefined {
  const totals = variant.inventories
    ?.map((entry) => entry.totalInventory)
    .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry));
  if (!totals || totals.length === 0) return undefined;
  return totals.reduce((sum, entry) => sum + entry, 0);
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const first = value.split("-")[0];
    const parsed = Number.parseFloat(first);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseDeliveryCycle(value: string | undefined): { min: number; max: number } | null {
  if (!value) return null;
  const matches = value.match(/\d+/g)?.map((entry) => Number.parseInt(entry, 10)) ?? [];
  if (matches.length === 0) return null;
  return { min: matches[0], max: matches[1] ?? matches[0] };
}

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

export const cjProvider = new CjDropshippingProvider();
