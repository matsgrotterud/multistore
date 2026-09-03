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

const syntheticDemoSignals = {
  source: "synthetic_local_demo_fixture",
  syntheticFixture: true,
  localDemoOnly: true,
  productionEligible: false,
  requiresMerchantReview: true,
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
  {
    externalId: "mock-demo-slime-mixing-station",
    title: "Demo DIY Slime Making Kit with Mixing Bowls",
    description:
      "Synthetic local-demo slime making kit fixture with two mixing bowls, measuring spoons, four reusable tubs and decorative mix-ins.",
    brand: "Synthetic Demo Supply",
    price: 31,
    currency: "USD",
    supplierCost: 10.5,
    shippingCost: 4.2,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 13,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-001",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Included storage", value: "4 reusable tubs" },
      { label: "Included tools", value: "2 bowls and 3 measuring spoons" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Slime Mixing Station"),
  },
  {
    externalId: "mock-demo-cloud-slime-textures",
    title: "Demo Cloud Slime Toy Texture Set",
    description:
      "Synthetic local-demo cloud slime toy fixture with three texture tubs, color mix-ins and a compartment storage case.",
    brand: "Synthetic Demo Supply",
    price: 27,
    currency: "USD",
    supplierCost: 8.75,
    shippingCost: 3.9,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 12,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-002",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Texture tubs", value: "3" },
      { label: "Storage", value: "Compartment case" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Cloud Slime Textures"),
  },
  {
    externalId: "mock-demo-fluffy-slime-jars",
    title: "Demo Fluffy Slime Kit with Storage Jars",
    description:
      "Synthetic local-demo fluffy slime kit fixture containing four labeled jars, mixing sticks and decorative foam pieces.",
    brand: "Synthetic Demo Supply",
    price: 25,
    currency: "USD",
    supplierCost: 7.8,
    shippingCost: 3.6,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 14,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-003",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Storage jars", value: "4" },
      { label: "Mixing sticks", value: "4" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Fluffy Slime Jars"),
  },
  {
    externalId: "mock-demo-glitter-slime-charms",
    title: "Demo Glitter Slime Making Kit with Charms",
    description:
      "Synthetic local-demo glitter slime making kit fixture with six small mix-in pots, reusable containers and shaping tools.",
    brand: "Synthetic Demo Supply",
    price: 29,
    currency: "USD",
    supplierCost: 9.4,
    shippingCost: 4,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 8,
    shippingDaysMax: 15,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-004",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Mix-in pots", value: "6" },
      { label: "Containers", value: "3 reusable containers" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Glitter Slime Charms"),
  },
  {
    externalId: "mock-demo-sensory-slime-sampler",
    title: "Demo Sensory Slime Kit Texture Sampler",
    description:
      "Synthetic local-demo sensory slime kit fixture with four texture tubs, scoops and a divided carrying tray.",
    brand: "Synthetic Demo Supply",
    price: 33,
    currency: "USD",
    supplierCost: 11.2,
    shippingCost: 4.5,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 13,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-005",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Texture tubs", value: "4" },
      { label: "Tray", value: "Divided carrying tray" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Sensory Slime Sampler"),
  },
  {
    externalId: "mock-demo-color-mixing-slime",
    title: "Demo Color Mixing Slime Toy Set",
    description:
      "Synthetic local-demo slime toy fixture with three color tubs, a mixing palette, portion cups and storage lids.",
    brand: "Synthetic Demo Supply",
    price: 23,
    currency: "USD",
    supplierCost: 7.1,
    shippingCost: 3.4,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 11,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-006",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Color tubs", value: "3" },
      { label: "Portion cups", value: "6" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Color Mixing Slime"),
  },
  {
    externalId: "mock-demo-galaxy-slime-tools",
    title: "Demo Galaxy Slime Kit with Mixing Tools",
    description:
      "Synthetic local-demo slime kit fixture with three themed tubs, a folding work mat, scoops and star-shaped mix-ins.",
    brand: "Synthetic Demo Supply",
    price: 30,
    currency: "USD",
    supplierCost: 9.8,
    shippingCost: 4.1,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 14,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-007",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Themed tubs", value: "3" },
      { label: "Work surface", value: "1 folding mat" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Galaxy Slime Tools"),
  },
  {
    externalId: "mock-demo-confetti-slime-craft",
    title: "Demo Confetti DIY Slime Kit Craft Set",
    description:
      "Synthetic local-demo DIY slime kit fixture with four storage tubs, confetti mix-ins, stirrers and a sorting tray.",
    brand: "Synthetic Demo Supply",
    price: 28,
    currency: "USD",
    supplierCost: 8.9,
    shippingCost: 3.8,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 8,
    shippingDaysMax: 15,
    countryOfOrigin: "CN",
    sku: "DEMO-SLIME-008",
    specs: [
      { label: "Fixture status", value: "Synthetic local demo product; not a production listing" },
      { label: "Storage tubs", value: "4" },
      { label: "Sorting tray", value: "1" },
    ],
    variants: [],
    risk: { requiresMaterialReview: true, requiresAgeLabelReview: true },
    signals: syntheticDemoSignals,
    media: mockMedia("Demo Confetti Slime Craft"),
  },
] satisfies Omit<ProductSearchResult, "providerKey">[];

const GENERATED_FIXTURE_PREFIX = "mock-demo-query";
const GENERATED_FIXTURE_COUNT = 12;

/**
 * Build a deterministic synthetic catalog only when the fixed fixture set has
 * no match. The normalized query is encoded into the external ID so a later
 * details request can reconstruct the exact same product without process-local
 * cache state.
 */
function generatedQueryFixtures(
  rawQuery: string
): Array<Omit<ProductSearchResult, "providerKey">> {
  const query = normalizeGeneratedQuery(rawQuery);
  if (!query) return [];
  return Array.from({ length: GENERATED_FIXTURE_COUNT }, (_, index) =>
    generatedQueryFixture(query, index)
  );
}

function generatedQueryFixture(
  query: string,
  index: number
): Omit<ProductSearchResult, "providerKey"> {
  const number = index + 1;
  const displayQuery = query.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const variation = [
    "Classic Profile",
    "Everyday Fit",
    "Structured Shape",
    "Lightweight Edition",
    "Textured Finish",
    "Adjustable Fit",
    "Travel Edition",
    "Heritage Shape",
    "Soft Finish",
    "Wide Profile",
    "Compact Edition",
    "Signature Shape",
  ][index];
  const externalId = `${GENERATED_FIXTURE_PREFIX}-${encodeURIComponent(query)}-${String(number).padStart(2, "0")}`;
  const title = `Synthetic Demo ${displayQuery} ${variation}`;

  return {
    externalId,
    title,
    description:
      `Synthetic local-demo ${query} fixture for validating catalog relevance, layouts and navigation. ` +
      "This is generated test data, not a supplier listing or production-ready product.",
    brand: "Synthetic Demo Supply",
    price: 28 + number * 1.5,
    currency: "USD",
    supplierCost: 8 + number * 0.55,
    shippingCost: 3.5 + (number % 3) * 0.35,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 6 + (number % 3),
    shippingDaysMax: 11 + (number % 4),
    sku: `DEMO-QUERY-${String(number).padStart(3, "0")}`,
    specs: [
      {
        label: "Fixture status",
        value: "Synthetic local demo product; not a production listing",
      },
      { label: "Generated query", value: query },
      { label: "Fixture number", value: String(number) },
    ],
    variants: [],
    risk: {
      syntheticDataOnly: true,
      requiresMerchantReview: true,
    },
    signals: {
      ...syntheticDemoSignals,
      generatedForQuery: true,
      normalizedQuery: query,
      deterministicFixtureNumber: number,
    },
    media: mockMedia(title),
  };
}

function reconstructGeneratedQueryFixture(
  externalId: string
): Omit<ProductSearchResult, "providerKey"> | null {
  const match = new RegExp(`^${GENERATED_FIXTURE_PREFIX}-(.+)-(\\d{2})$`).exec(
    externalId
  );
  if (!match) return null;

  try {
    const query = normalizeGeneratedQuery(decodeURIComponent(match[1]));
    const index = Number(match[2]) - 1;
    if (!query || !Number.isInteger(index) || index < 0 || index >= GENERATED_FIXTURE_COUNT) {
      return null;
    }
    const reconstructed = generatedQueryFixture(query, index);
    return reconstructed.externalId === externalId ? reconstructed : null;
  } catch {
    return null;
  }
}

function normalizeGeneratedQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10)
    .join(" ")
    .slice(0, 80)
    .trim();
}

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
    const fixedResults = terms.length
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
    const results =
      terms.length > 0 && fixedResults.length === 0
        ? generatedQueryFixtures(input.query)
        : fixedResults;

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
    const product =
      fixtureProducts.find((item) => item.externalId === input.externalId) ??
      reconstructGeneratedQueryFixture(input.externalId);
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
