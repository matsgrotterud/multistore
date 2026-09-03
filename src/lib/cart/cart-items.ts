export interface CartItem {
  lineId: string;
  productId: string;
  variantId?: string;
  slug: string;
  categorySlug?: string | null;
  title: string;
  variantTitle?: string;
  optionSummary?: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  quantity: number;
}

export type CartItemInput = Omit<CartItem, "lineId" | "quantity">;

export function lineIdFor(productId: string, variantId?: string): string {
  return `${productId}:${variantId ?? "default"}`;
}

/** Rebuild legacy localStorage data from a strict public-field whitelist. */
export function hydrateCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object"
    )
    .filter(
      (entry) =>
        typeof entry.productId === "string" && typeof entry.title === "string"
    )
    .map((entry) => {
      const productId = entry.productId as string;
      const title = entry.title as string;
      const variantId =
        typeof entry.variantId === "string" ? entry.variantId : undefined;
      return {
        lineId:
          typeof entry.lineId === "string"
            ? entry.lineId
            : lineIdFor(productId, variantId),
        productId,
        variantId,
        slug: typeof entry.slug === "string" ? entry.slug : "",
        categorySlug:
          typeof entry.categorySlug === "string" ? entry.categorySlug : null,
        title,
        variantTitle:
          typeof entry.variantTitle === "string" ? entry.variantTitle : undefined,
        optionSummary:
          typeof entry.optionSummary === "string" ? entry.optionSummary : undefined,
        price: typeof entry.price === "number" ? entry.price : 0,
        currency: typeof entry.currency === "string" ? entry.currency : "USD",
        imageUrl:
          typeof entry.imageUrl === "string"
            ? entry.imageUrl
            : "/api/placeholder?label=Product",
        imageAlt: typeof entry.imageAlt === "string" ? entry.imageAlt : title,
        shippingDaysMin:
          typeof entry.shippingDaysMin === "number" ? entry.shippingDaysMin : 7,
        shippingDaysMax:
          typeof entry.shippingDaysMax === "number" ? entry.shippingDaysMax : 18,
        quantity:
          typeof entry.quantity === "number" && Number.isFinite(entry.quantity)
            ? Math.max(1, Math.min(entry.quantity, 99))
            : 1,
      };
    });
}
