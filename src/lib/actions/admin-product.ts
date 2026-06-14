"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { computeProductScore } from "@/lib/products/product-score";
import { stockStatusSchema } from "@/lib/validation/schemas";
import { isStockStatus } from "@/lib/types";
import { toJson } from "@/lib/utils/json";
import {
  getBoolean,
  getFaqPairs,
  getLines,
  getNumber,
  getOptionalString,
  getPipePairs,
  getString,
} from "@/lib/actions/form";
import type { AdminActionState } from "@/lib/actions/admin-store";

const productUpdateSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(3, "Title is required"),
  subtitle: z.string(),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1).max(300),
  brand: z.string().min(1),
  sku: z.string().min(1),
  gtin: z.string().nullable(),
  imageUrl: z.string().min(1, "Image URL is required"),
  imageAlt: z.string(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().nullable(),
  cost: z.number().positive("Cost must be positive"),
  shippingCost: z.number().min(0),
  stockStatus: stockStatusSchema,
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  countryOfOrigin: z.string().nullable(),
  materials: z.string().nullable(),
  warranty: z.string().nullable(),
  returnable: z.boolean(),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  canonicalUrl: z.string().nullable(),
  isPublished: z.boolean(),
  noindex: z.boolean(),
});

export async function updateProductAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const productId = getString(formData, "productId");
  const storeSlug = getString(formData, "storeSlug");
  if (!productId || !storeSlug) {
    return { ok: false, error: "Missing product identifier." };
  }

  const rawStock = getString(formData, "stockStatus");
  const parsed = productUpdateSchema.safeParse({
    categoryId: getString(formData, "categoryId"),
    title: getString(formData, "title"),
    subtitle: getString(formData, "subtitle"),
    description: getString(formData, "description"),
    shortDescription: getString(formData, "shortDescription"),
    brand: getString(formData, "brand"),
    sku: getString(formData, "sku"),
    gtin: getOptionalString(formData, "gtin"),
    imageUrl: getString(formData, "imageUrl"),
    imageAlt: getString(formData, "imageAlt"),
    price: getNumber(formData, "price"),
    compareAtPrice: formData.get("compareAtPrice")
      ? getNumber(formData, "compareAtPrice")
      : null,
    cost: getNumber(formData, "cost"),
    shippingCost: getNumber(formData, "shippingCost"),
    stockStatus: isStockStatus(rawStock) ? rawStock : "IN_STOCK",
    supplierName: getString(formData, "supplierName"),
    supplierProductId: getString(formData, "supplierProductId"),
    shippingDaysMin: getNumber(formData, "shippingDaysMin", 5),
    shippingDaysMax: getNumber(formData, "shippingDaysMax", 12),
    countryOfOrigin: getOptionalString(formData, "countryOfOrigin"),
    materials: getOptionalString(formData, "materials"),
    warranty: getOptionalString(formData, "warranty"),
    returnable: getBoolean(formData, "returnable"),
    seoTitle: getString(formData, "seoTitle"),
    seoDescription: getString(formData, "seoDescription"),
    canonicalUrl: getOptionalString(formData, "canonicalUrl"),
    isPublished: getBoolean(formData, "isPublished"),
    noindex: getBoolean(formData, "noindex"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }
  const data = parsed.data;

  if (data.shippingDaysMax < data.shippingDaysMin) {
    return { ok: false, error: "Shipping days max must be ≥ shipping days min." };
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    return { ok: false, error: "Product not found." };
  }

  // Ensure the supplied category belongs to the same store (no cross-tenant leak).
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, storeId: existing.storeId },
  });
  if (!category) {
    return { ok: false, error: "Selected category does not belong to this store." };
  }

  // Structured content fields (line / pipe editors).
  const pros = getLines(formData, "pros");
  const cons = getLines(formData, "cons");
  const useCases = getLines(formData, "useCases");
  const specs = getPipePairs(formData, "specs");
  const faq = getFaqPairs(formData, "faq");

  // Recompute margin + score with the same libraries the seed uses.
  const margin = calculateGrossMargin({
    price: data.price,
    cost: data.cost,
    shippingCost: data.shippingCost,
  });

  const supplier = await prisma.supplier.findUnique({
    where: { name: data.supplierName },
  });
  const supplierReliability = supplier?.reliabilityScore ?? 0.8;

  const productScore = computeProductScore({
    marginPercent: margin.grossMarginPercent,
    shippingDaysMin: data.shippingDaysMin,
    shippingDaysMax: data.shippingDaysMax,
    supplierReliability,
    stockStatus: data.stockStatus,
    returnRiskRate: data.returnable ? 0.04 : 0.01,
    content: {
      descriptionLength: data.description.length,
      prosCount: pros.length,
      consCount: cons.length,
      specsCount: specs.length,
      faqCount: faq.length,
      useCasesCount: useCases.length,
      hasImageAlt: data.imageAlt.trim().length > 0,
    },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      currency: existing.currency,
      marginPercent: margin.grossMarginPercent,
      productScore,
      pros: toJson(pros),
      cons: toJson(cons),
      specs: toJson(specs),
      useCases: toJson(useCases),
      faq: toJson(faq),
    },
  });

  revalidatePath(`/s/${storeSlug}`, "layout");
  revalidatePath(`/admin/stores/${storeSlug}/products`);
  revalidatePath("/admin/products");

  return {
    ok: true,
    error: null,
    message: `Saved. Margin ${margin.grossMarginPercent.toFixed(1)}% · score ${productScore.toFixed(0)}.`,
  };
}
