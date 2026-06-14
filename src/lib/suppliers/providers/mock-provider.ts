import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
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

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: true,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: true,
};

const fixtureProducts = [
  {
    externalId: "mock-ergonomic-lumbar-cushion",
    title: "Contour Memory Foam Lumbar Cushion",
    description:
      "A supportive lumbar cushion with a washable mesh cover, designed for long desk sessions and compact office chairs.",
    brand: "MockSupply Studio",
    price: 39,
    currency: "USD",
    supplierCost: 12,
    shippingCost: 4.5,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 12,
    countryOfOrigin: "CN",
    sku: "MOCK-LUMBAR-001",
    specs: [
      { label: "Material", value: "Memory foam, breathable mesh" },
      { label: "Cover", value: "Removable and washable" },
      { label: "Fit", value: "Office chairs, car seats, home workstations" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Contour Lumbar Cushion"),
  },
  {
    externalId: "mock-packable-daypack",
    title: "20L Packable Ripstop Daypack",
    description:
      "A lightweight daypack that folds into its own pocket, with water-resistant ripstop fabric and side bottle pockets.",
    brand: "MockSupply Studio",
    price: 34,
    currency: "USD",
    supplierCost: 9,
    shippingCost: 3.8,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 14,
    countryOfOrigin: "CN",
    sku: "MOCK-PACK-020",
    specs: [
      { label: "Volume", value: "20 L" },
      { label: "Weight", value: "280 g" },
      { label: "Fabric", value: "Water-resistant ripstop nylon" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Packable Daypack"),
  },
  {
    externalId: "mock-pet-slicker-brush",
    title: "Self-Cleaning Pet Slicker Brush",
    description:
      "A grooming brush with retractable stainless pins and one-click release for medium and long coats.",
    brand: "MockSupply Studio",
    price: 24,
    currency: "USD",
    supplierCost: 5,
    shippingCost: 2.7,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 11,
    countryOfOrigin: "CN",
    sku: "MOCK-PET-004",
    specs: [
      { label: "Pins", value: "Stainless steel" },
      { label: "Release", value: "One-click hair release" },
      { label: "Use", value: "Medium and long coats" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Pet Slicker Brush"),
  },
] satisfies Omit<ProductSearchResult, "providerKey">[];

export class MockCommerceProvider implements CommerceProvider {
  key = "mock" as const;
  name = "Mock Supplier";
  capabilities = capabilities;
  defaultFulfillmentMode = "MOCK" as const;

  async getHealth(): Promise<ProviderHealth> {
    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message: "Mock provider is enabled for local product discovery and media ingestion.",
      capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    const terms = input.query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = terms.length
      ? fixtureProducts.filter((product) =>
          terms.some((term) =>
            [product.title, product.description, product.brand, product.sku]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term)
          )
        )
      : fixtureProducts;

    return validateSearchResults(
      this.key,
      results.slice(0, input.limit ?? 12).map((result) => ({
        ...result,
        sourceUrl: `https://mock-supplier.example/products/${result.externalId}`,
        affiliateUrl: `https://mock-supplier.example/deals/${result.externalId}`,
        fulfillmentMode: "MOCK",
      }))
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    const product = fixtureProducts.find((item) => item.externalId === input.externalId);
    if (!product) throw new Error(`Mock product not found: ${input.externalId}`);
    return validateSearchResults(this.key, [
      {
        ...product,
        sourceUrl: input.sourceUrl ?? `https://mock-supplier.example/products/${product.externalId}`,
        affiliateUrl: `https://mock-supplier.example/deals/${product.externalId}`,
        fulfillmentMode: "MOCK",
      },
    ])[0];
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

function mockMedia(label: string): SupplierMedia[] {
  return [0, 1, 2].map((index) => ({
    url: `https://placehold.co/1000x1000/png?text=${encodeURIComponent(`${label} ${index + 1}`)}`,
    mediaType: "IMAGE",
    alt: `${label} product image ${index + 1}`,
    sortOrder: index,
  }));
}

export const mockCommerceProvider = new MockCommerceProvider();
