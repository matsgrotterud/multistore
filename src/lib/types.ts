/**
 * Domain-level types shared across the app. SQLite cannot store native enums
 * or JSON, so these constants + types are the single source of truth for the
 * string values persisted in the database.
 */

export const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "PREORDER",
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const CONTENT_PAGE_TYPES = [
  "GUIDE",
  "COMPARISON",
  "FAQ",
  "LANDING",
  "POLICY",
] as const;
export type ContentPageType = (typeof CONTENT_PAGE_TYPES)[number];

export interface SpecItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  PREORDER: "Pre-order",
};

export function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value);
}

/** Minimal product shape that is safe to serialize to client components. */
export interface ClientProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  brand: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockStatus: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  useCases: string[];
  productScore: number;
}
