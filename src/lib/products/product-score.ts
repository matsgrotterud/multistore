import type { StockStatus } from "@/lib/types";

/**
 * Product scoring (0-100).
 *
 * The productScore drives which products get featured on homepages, the
 * default category sort, and quiz recommendations. It blends commercial
 * health (margin, shipping, supplier) with content quality so the platform
 * naturally promotes products that are both profitable and well-presented.
 */

export interface ProductScoreInput {
  /** Gross margin as a percent of price (0-100). */
  marginPercent: number;
  shippingDaysMin: number;
  shippingDaysMax: number;
  /** Supplier reliability 0-1 (from the Supplier table). */
  supplierReliability: number;
  stockStatus: StockStatus;
  /** Fraction of orders expected to be returned (0-1). */
  returnRiskRate: number;
  content: {
    descriptionLength: number;
    prosCount: number;
    consCount: number;
    specsCount: number;
    faqCount: number;
    useCasesCount: number;
    hasImageAlt: boolean;
  };
  /**
   * Placeholder for real search-demand data (e.g. keyword volume from an SEO
   * API). 0-1; defaults to neutral 0.5 until a data source is connected.
   */
  seoDemand?: number;
  /**
   * Placeholder for compliance screening (certifications, restricted
   * categories, IP risk). 0 = no known risk, 1 = high risk.
   */
  complianceRisk?: number;
}

const WEIGHTS = {
  margin: 25,
  shipping: 15,
  supplier: 15,
  stock: 10,
  returnRisk: 10,
  content: 15,
  seoDemand: 5,
  compliance: 5,
};

export function computeProductScore(input: ProductScoreInput): number {
  // Margin: 0% -> 0, >=45% -> full marks.
  const marginScore = clamp01(input.marginPercent / 45);

  // Shipping: <=4 days avg -> full marks, >=21 days -> 0.
  const avgDays = (input.shippingDaysMin + input.shippingDaysMax) / 2;
  const shippingScore = clamp01(1 - (avgDays - 4) / 17);

  const supplierScore = clamp01(input.supplierReliability);

  const stockScore =
    input.stockStatus === "IN_STOCK"
      ? 1
      : input.stockStatus === "LOW_STOCK"
        ? 0.6
        : input.stockStatus === "PREORDER"
          ? 0.4
          : 0;

  // Return risk: 0% -> full marks, >=15% -> 0.
  const returnScore = clamp01(1 - input.returnRiskRate / 0.15);

  const contentScore = computeContentRichness(input.content);

  const seoScore = clamp01(input.seoDemand ?? 0.5);
  const complianceScore = clamp01(1 - (input.complianceRisk ?? 0));

  const total =
    marginScore * WEIGHTS.margin +
    shippingScore * WEIGHTS.shipping +
    supplierScore * WEIGHTS.supplier +
    stockScore * WEIGHTS.stock +
    returnScore * WEIGHTS.returnRisk +
    contentScore * WEIGHTS.content +
    seoScore * WEIGHTS.seoDemand +
    complianceScore * WEIGHTS.compliance;

  return Math.round(total * 10) / 10;
}

function computeContentRichness(
  content: ProductScoreInput["content"]
): number {
  let points = 0;
  if (content.descriptionLength >= 300) points += 2;
  else if (content.descriptionLength >= 120) points += 1;
  if (content.prosCount >= 3) points += 1;
  if (content.consCount >= 2) points += 1; // honest cons are quality content
  if (content.specsCount >= 5) points += 2;
  else if (content.specsCount >= 3) points += 1;
  if (content.faqCount >= 2) points += 1;
  if (content.useCasesCount >= 2) points += 1;
  if (content.hasImageAlt) points += 1;
  return clamp01(points / 9);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
