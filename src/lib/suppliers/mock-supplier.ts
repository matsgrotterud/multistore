import type {
  LandedCost,
  NormalizedSupplierProduct,
  RawSupplierProduct,
  ShippingEstimate,
  SupplierAdapter,
} from "@/lib/suppliers/types";
import { resolveProductImages } from "@/lib/images/resolve-product-images";

/**
 * Deterministic mock supplier used for local development and tests.
 * Swap in a real adapter (same interface) to integrate an actual supplier
 * API without touching the import pipeline or storefront.
 */

const MOCK_CATALOG: RawSupplierProduct[] = [
  {
    id: "MS-1001",
    title: "Foldable 4K Camera Drone",
    description:
      "Compact foldable drone with stabilized 4K camera, GPS return-to-home and 28 minute flight time.",
    imageUrl: "/api/placeholder?label=4K%20Drone&seed=ms-1001",
    costUsd: 96,
    shippingCostUsd: 9.5,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 7,
    estimatedShippingDaysMax: 14,
    stockQuantity: 230,
    attributes: { weight: "249 g", battery: "2453 mAh", range: "6 km" },
    keywords: ["drone", "camera", "4k", "foldable"],
  },
  {
    id: "MS-1002",
    title: "Bamboo Toothbrush 8-Pack, Soft Bristles",
    description:
      "Biodegradable moso bamboo handles with BPA-free soft nylon bristles, plastic-free packaging.",
    imageUrl: "/api/placeholder?label=Bamboo%208-Pack&seed=ms-1002",
    costUsd: 4.2,
    shippingCostUsd: 2.1,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 6,
    estimatedShippingDaysMax: 12,
    stockQuantity: 1800,
    attributes: { bristles: "soft nylon-6", handle: "moso bamboo" },
    keywords: ["toothbrush", "bamboo", "eco", "sustainable"],
  },
  {
    id: "MS-1003",
    title: "Memory Foam Lumbar Support Cushion",
    description:
      "Contoured memory foam lumbar cushion with breathable mesh cover and adjustable straps for office chairs.",
    imageUrl: "/api/placeholder?label=Lumbar%20Cushion&seed=ms-1003",
    costUsd: 11.4,
    shippingCostUsd: 4.8,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 8,
    estimatedShippingDaysMax: 15,
    stockQuantity: 540,
    attributes: { material: "memory foam", cover: "mesh, washable" },
    keywords: ["ergonomic", "lumbar", "office", "back pain"],
  },
  {
    id: "MS-1004",
    title: "Self-Cleaning Pet Slicker Brush",
    description:
      "Slicker brush with retractable stainless pins and one-click hair release, suitable for medium and long coats.",
    imageUrl: "/api/placeholder?label=Slicker%20Brush&seed=ms-1004",
    costUsd: 4.9,
    shippingCostUsd: 2.6,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 6,
    estimatedShippingDaysMax: 13,
    stockQuantity: 950,
    attributes: { pins: "stainless steel", release: "one-click" },
    keywords: ["pet", "grooming", "brush", "deshedding"],
  },
  {
    id: "MS-1005",
    title: "Ultralight Packable Daypack 20L",
    description:
      "Water-resistant ripstop nylon daypack that folds into its own pocket, 280 g total weight.",
    imageUrl: "/api/placeholder?label=Daypack%2020L&seed=ms-1005",
    costUsd: 8.7,
    shippingCostUsd: 3.4,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 7,
    estimatedShippingDaysMax: 14,
    stockQuantity: 720,
    attributes: { volume: "20 L", weight: "280 g", fabric: "ripstop nylon" },
    keywords: ["hiking", "backpack", "ultralight", "packable"],
  },
];

export class MockSupplierAdapter implements SupplierAdapter {
  readonly name = "MockSupply Co";
  readonly reliabilityScore = 0.85;

  async searchProducts(query: string): Promise<RawSupplierProduct[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [...MOCK_CATALOG];
    return MOCK_CATALOG.filter((product) =>
      terms.some(
        (term) =>
          product.title.toLowerCase().includes(term) ||
          product.keywords.some((keyword) => keyword.includes(term))
      )
    );
  }

  async getProduct(id: string): Promise<RawSupplierProduct | null> {
    return MOCK_CATALOG.find((product) => product.id === id) ?? null;
  }

  normalizeProduct(raw: RawSupplierProduct): NormalizedSupplierProduct {
    const shipping = this.estimateShipping(raw);
    const resolved = resolveProductImages({
      title: raw.title,
      slug: raw.id.toLowerCase(),
      sku: raw.id,
      niche: raw.keywords.join(" "),
      keywords: raw.keywords,
      scrapedImages: raw.galleryUrls?.length
        ? raw.galleryUrls.map((url, index) => ({
            url,
            source: "other" as const,
            supplierProductId: raw.id,
            sortOrder: index,
          }))
        : undefined,
    });
    return {
      supplierName: this.name,
      supplierProductId: raw.id,
      title: raw.title,
      description: raw.description,
      imageUrl: resolved.primaryUrl,
      galleryUrls: resolved.galleryUrls,
      supplierUrl: raw.supplierUrl,
      supplierSource: raw.supplierSource ?? "aliexpress",
      supplierSearchQuery: raw.supplierSearchQuery ?? raw.title,
      cost: raw.costUsd,
      shippingCost: shipping.costUsd,
      shippingDaysMin: shipping.daysMin,
      shippingDaysMax: shipping.daysMax,
      countryOfOrigin: raw.shipsFromCountry,
      stockStatus:
        raw.stockQuantity === 0
          ? "OUT_OF_STOCK"
          : raw.stockQuantity < 50
            ? "LOW_STOCK"
            : "IN_STOCK",
      specs: Object.entries(raw.attributes).map(([label, value]) => ({
        label,
        value,
      })),
      keywords: raw.keywords,
    };
  }

  estimateShipping(raw: RawSupplierProduct): ShippingEstimate {
    // A real adapter would call the supplier's shipping API per destination;
    // the mock adds a small buffer to the supplier's optimistic estimate.
    return {
      daysMin: raw.estimatedShippingDaysMin,
      daysMax: raw.estimatedShippingDaysMax + 2,
      costUsd: raw.shippingCostUsd,
    };
  }

  calculateLandedCost(raw: RawSupplierProduct): LandedCost {
    const shipping = this.estimateShipping(raw);
    // Duties/VAT vary by destination; 0 is a placeholder until a tax engine
    // is connected for the target market.
    const estimatedDuties = 0;
    return {
      unitCost: raw.costUsd,
      shippingCost: shipping.costUsd,
      estimatedDuties,
      total: raw.costUsd + shipping.costUsd + estimatedDuties,
    };
  }
}

export const mockSupplier = new MockSupplierAdapter();
