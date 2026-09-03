import { isProductCheckoutAvailable } from "@/lib/stores/checkout-availability";
import type { ClientProduct } from "@/lib/types";
import { parseJsonObject, parseStringArray } from "@/lib/utils/json";

interface ClientVariantSource {
  id: string;
  title: string;
  optionSummary: string;
  optionsJson: string;
  sku?: string | null;
  externalVariantId?: string | null;
  price: number | null;
  compareAtPrice: number | null;
  stockStatus: string;
  imageUrl: string | null;
  isDefault: boolean;
}

export interface ClientProductSource {
  id: string;
  slug: string;
  category?: { slug: string } | null;
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
  countryOfOrigin: string | null;
  useCases: string;
  fulfillmentMode: string;
  affiliateUrl: string | null;
  providerKey?: string | null;
  externalId?: string | null;
  checkoutAvailable?: boolean;
  variants?: ClientVariantSource[];
  _count?: { variants: number };
}

function sensitiveVariantIdentifiers(variant: ClientVariantSource): Set<string> {
  return new Set(
    [variant.sku, variant.externalVariantId]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
  );
}

function publicVariantLabel(
  value: string,
  sensitiveIdentifiers: Set<string>,
  fallback: string
): string {
  const normalized = value.trim();
  if (!normalized || sensitiveIdentifiers.has(normalized)) return fallback;
  return redactSensitiveIdentifiers(normalized, sensitiveIdentifiers) || fallback;
}

function publicVariantOptions(
  raw: string,
  sensitiveIdentifiers: Set<string>
): Record<string, string> {
  const parsed = parseJsonObject(raw);
  return Object.fromEntries(
    Object.entries(parsed)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, value]) => [
        redactSensitiveIdentifiers(key.trim(), sensitiveIdentifiers),
        redactSensitiveIdentifiers(value.trim(), sensitiveIdentifiers),
      ] as const)
      .filter(
        ([key, value]) =>
          Boolean(key) &&
          Boolean(value) &&
          !sensitiveIdentifiers.has(key) &&
          !sensitiveIdentifiers.has(value)
      )
  );
}

function redactSensitiveIdentifiers(
  value: string,
  sensitiveIdentifiers: Set<string>
): string {
  let redacted = value;
  for (const identifier of sensitiveIdentifiers) {
    if (!identifier) continue;
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (identifier.length >= 4) {
      redacted = redacted.replace(new RegExp(escaped, "gi"), "");
    } else {
      redacted = redacted.replace(
        new RegExp(`(^|[\\s:/#_-])${escaped}(?=$|[\\s:/#_-])`, "gi"),
        "$1"
      );
    }
  }
  return redacted
    .replace(/\s*[-–—|:/#]+\s*$/g, "")
    .replace(/^\s*[-–—|:/#]+\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Explicit browser-safe product whitelist. Supplier routing identifiers and
 * internal ranking/economics stay server-side; checkout only needs the public
 * product ID and internal variant ID from this projection.
 */
export function toClientProduct(product: ClientProductSource): ClientProduct {
  const checkoutAvailable =
    typeof product.checkoutAvailable === "boolean"
      ? product.checkoutAvailable
      : isProductCheckoutAvailable({
          fulfillmentMode: product.fulfillmentMode,
          providerKey: product.providerKey ?? null,
          externalId: product.externalId ?? null,
        });

  return {
    id: product.id,
    slug: product.slug,
    categorySlug: product.category?.slug ?? null,
    title: product.title,
    subtitle: product.subtitle,
    brand: product.brand,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    stockStatus: product.stockStatus,
    shippingDaysMin: product.shippingDaysMin,
    shippingDaysMax: product.shippingDaysMax,
    countryOfOrigin: product.countryOfOrigin,
    useCases: parseStringArray(product.useCases),
    fulfillmentMode: product.fulfillmentMode,
    affiliateUrl: product.affiliateUrl,
    checkoutAvailable,
    hasVariants: (product.variants?.length ?? product._count?.variants ?? 0) > 0,
    variants: (product.variants ?? []).map((variant, index) => {
      const sensitiveIdentifiers = sensitiveVariantIdentifiers(variant);
      const fallback = `Option ${index + 1}`;
      return {
        id: variant.id,
        title: publicVariantLabel(variant.title, sensitiveIdentifiers, fallback),
        optionSummary: publicVariantLabel(
          variant.optionSummary,
          sensitiveIdentifiers,
          fallback
        ),
        options: publicVariantOptions(variant.optionsJson, sensitiveIdentifiers),
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stockStatus: variant.stockStatus,
        // Variant supplier URLs are not trusted as storefront dependencies.
        // Use the already-ingested primary product image until variant media
        // has its own stored-asset relation.
        imageUrl: product.imageUrl,
        isDefault: variant.isDefault,
      };
    }),
  };
}
