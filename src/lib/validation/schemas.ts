import { z } from "zod";
import { CONTENT_PAGE_TYPES, STOCK_STATUSES } from "@/lib/types";

/** Shared Zod schemas for forms, server actions and seed data. */

export const stockStatusSchema = z.enum(STOCK_STATUSES);
export const contentPageTypeSchema = z.enum(CONTENT_PAGE_TYPES);

export const newsletterSchema = z.object({
  storeSlug: z.string().min(1),
  email: z.string().email("Enter a valid email address"),
  source: z.string().min(1).max(60).default("homepage"),
  preferences: z.record(z.unknown()).optional(),
});

export const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  name: z.string().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email address"),
  addressLine1: z.string().min(4, "Enter your street address").max(200),
  city: z.string().min(1, "Enter your city").max(100),
  postalCode: z.string().min(2, "Enter your postal code").max(20),
  country: z.string().min(2, "Enter your country").max(60),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackEventSchema = z.object({
  storeSlug: z.string().min(1),
  eventName: z.string().min(1),
  sessionId: z.string().min(1).max(80),
  payload: z.record(z.unknown()).default({}),
});

/** Seed-time product validation: catches typos in the big seed data files. */
export const seedProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subtitle: z.string(),
  description: z.string().min(80),
  shortDescription: z.string().min(20).max(300),
  brand: z.string().min(1),
  sku: z.string().min(3),
  gtin: z.string().nullable().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  cost: z.number().positive(),
  shippingCost: z.number().min(0),
  stockStatus: stockStatusSchema,
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  supplierSource: z
    .enum(["aliexpress", "temu", "ebay", "wish", "alibaba"])
    .optional(),
  supplierUrl: z.string().url().optional(),
  supplierSearchQuery: z.string().min(3).optional(),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  countryOfOrigin: z.string().nullable().optional(),
  materials: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(),
  returnable: z.boolean(),
  pros: z.array(z.string()).min(2),
  cons: z.array(z.string()).min(1),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).min(3),
  useCases: z.array(z.string()).min(1),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  seoTitle: z.string().min(10),
  seoDescription: z.string().min(40),
});

export type SeedProduct = z.infer<typeof seedProductSchema>;
