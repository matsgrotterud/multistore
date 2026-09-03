"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type {
  StorefrontMediaV2,
  StorefrontProductV2,
  StorefrontVariantV2,
} from "@/lib/catalog-v2/contracts";
import {
  compareMerchandisingProductsV2,
  searchMerchandisingCatalogV2,
  type MerchandisingAttributeDefinitionV2,
  type MerchandisingAvailabilityV2,
  type MerchandisingProductV2,
  type MerchandisingSearchRequestV2,
} from "@/lib/merchandising-v2";
import type { StoreExperienceCatalogProjectionV2 } from "@/lib/storefront-v2/catalog-context";
import type { StoreExperienceManifestV2 } from "@/lib/storefront-v2/manifest";
import type { StoreExperienceRenderDocumentV2 } from "@/lib/storefront-v2/render-document";
import {
  StoreExperienceRendererV2,
  type ProtectedStorefrontRenderSlotsV2,
} from "./StoreExperienceRenderer";

export const REFERENCE_SHOPPER_PAGES_V2 = [
  "home",
  "plp",
  "search",
  "pdp",
  "compare",
  "cart",
  "checkout",
] as const;

export type ReferenceShopperPageV2 =
  (typeof REFERENCE_SHOPPER_PAGES_V2)[number];

export interface ReferenceShopperRuntimeCapabilitiesV2 {
  search: boolean;
  filters: boolean;
  variants: boolean;
  purchaseOptions: boolean;
  repeatPurchase: boolean;
  wishlist: boolean;
  compare: boolean;
  cart: boolean;
  checkoutPreview: boolean;
  quiz: boolean;
  recommendations: boolean;
}

export const DEFAULT_REFERENCE_SHOPPER_RUNTIME_CAPABILITIES_V2 = {
  search: true,
  filters: true,
  variants: true,
  purchaseOptions: true,
  repeatPurchase: true,
  wishlist: true,
  compare: true,
  cart: true,
  checkoutPreview: true,
  quiz: false,
  recommendations: true,
} as const satisfies ReferenceShopperRuntimeCapabilitiesV2;

export interface ReferenceShopperResolvedMediaV2 {
  /** Preview media is deliberately restricted to same-origin paths. */
  src: string;
  width: number;
  height: number;
  altText?: string;
  mediaId?: string;
  rights?: string;
  source?: string;
  variantIds?: readonly string[];
  focalPoint?: StorefrontMediaV2["focalPoint"];
}

export type ReferenceShopperMediaResolverV2 = (
  product: StorefrontProductV2,
  media: StorefrontMediaV2,
  variantId: string | null
) => ReferenceShopperResolvedMediaV2 | null;

export interface ReferenceShopperPreviewV2Props {
  /** Changing this key creates a fresh, empty shopper session. */
  revisionKey: string;
  catalog: StoreExperienceCatalogProjectionV2;
  manifest: StoreExperienceManifestV2;
  contentProposal?: StoreExperienceRenderDocumentV2["contentProposal"];
  runtimeCapabilities?: Partial<ReferenceShopperRuntimeCapabilitiesV2>;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  initialPage?: ReferenceShopperPageV2;
  initialProductId?: string;
}

export type ReferenceShopperEffectiveCapabilitiesV2 =
  ReferenceShopperRuntimeCapabilitiesV2;

interface ReferenceShopperCartItemV2 {
  identity: string;
  productId: string;
  variantId: string | null;
  purchaseOptionId: string | null;
  repeatDays: number | null;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
}

type StorefrontPurchaseOptionV2 =
  StorefrontProductV2["purchaseOptions"][number];

interface ShopperSelectionV2 {
  product: StorefrontProductV2;
  variant: StorefrontVariantV2 | null;
  purchaseOption: StorefrontPurchaseOptionV2 | null;
}

const touchControlClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const primaryControlClass = `${touchControlClass} border-[color:var(--storefront-color-primary,#0f172a)] bg-[color:var(--storefront-color-primary,#0f172a)] text-[color:var(--storefront-color-on-primary,#fff)] hover:brightness-95`;
const secondaryControlClass = `${touchControlClass} border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] text-[color:var(--storefront-color-text,#0f172a)] hover:brightness-95`;

function isImmediatelyAvailable(
  availability: StorefrontProductV2["availability"]
): boolean {
  return availability === "IN_STOCK" || availability === "LOW_STOCK";
}

function knownMoney(
  price:
    | StorefrontProductV2["price"]
    | StorefrontVariantV2["price"]
    | StorefrontPurchaseOptionV2["price"]
    | null
    | undefined
): { amountMinor: number; currency: string } | null {
  return price?.state === "KNOWN"
    ? {
        amountMinor: price.money.amountMinor,
        currency: price.money.currency,
      }
    : null;
}

function selectionMoney(selection: ShopperSelectionV2) {
  return (
    knownMoney(selection.purchaseOption?.price) ??
    knownMoney(selection.variant?.price) ??
    knownMoney(selection.product.price)
  );
}

/** A single fail-closed predicate shared by PDP and cart actions. */
export function isReferenceShopperSelectionPurchasableV2(
  selection: ShopperSelectionV2
): boolean {
  const { product, variant, purchaseOption } = selection;
  if (!product.purchasable || !isImmediatelyAvailable(product.availability)) {
    return false;
  }
  if (product.variants.length > 0) {
    if (!variant || !isImmediatelyAvailable(variant.availability)) return false;
    if (variant.price?.state === "UNKNOWN") return false;
  }
  if (product.purchaseOptions.length > 0) {
    if (
      !purchaseOption ||
      purchaseOption.kind === "UNKNOWN" ||
      !isImmediatelyAvailable(purchaseOption.availability) ||
      purchaseOption.price.state !== "KNOWN"
    ) {
      return false;
    }
    if (
      purchaseOption.variantId &&
      purchaseOption.variantId !== variant?.variantId
    ) {
      return false;
    }
  }
  return selectionMoney(selection) !== null;
}

export function referenceShopperWishlistIdentityV2(
  productId: string,
  variantId: string | null
): string {
  return `${productId}::${variantId ?? "default"}`;
}

export const REFERENCE_SHOPPER_SESSION_POLICY_V2 = {
  persistence: "MEMORY_ONLY",
  networkRequests: "DISABLED",
  analytics: "DISABLED",
  commerceWrites: "DISABLED",
} as const;

export interface ReferenceShopperPriceRangeV2 {
  key: string;
  label: string;
  currency: string;
  minMinor: number | null;
  maxMinor: number | null;
}

/**
 * Price bands exist only when all known prices share one currency. Unknown
 * prices never enter a range, and mixed currencies refuse the facet entirely.
 */
export function deriveReferenceShopperPriceRangesV2(
  products: readonly StorefrontProductV2[]
): ReferenceShopperPriceRangeV2[] {
  const known = products.flatMap((product) => {
    if (product.price.state !== "KNOWN") return [];
    const { amountMinor, currency } = product.price.money;
    return Number.isSafeInteger(amountMinor) && amountMinor >= 0 && currency
      ? [{ amountMinor, currency }]
      : [];
  });
  const currencies = new Set(known.map((entry) => entry.currency));
  if (known.length === 0 || currencies.size !== 1) return [];
  const currency = known[0].currency;
  const unique = [...new Set(known.map((entry) => entry.amountMinor))].sort(
    (left, right) => left - right
  );
  if (unique.length === 1) {
    const amount = unique[0];
    return [
      {
        key: `exact:${currency}:${amount}`,
        label: formatMoneyValue(amount, currency),
        currency,
        minMinor: amount,
        maxMinor: amount,
      },
    ];
  }
  const lowerIndex = Math.floor((unique.length - 1) / 2);
  const lowerMax = unique[lowerIndex];
  const upperMin = unique[lowerIndex + 1];
  return [
    {
      key: `up-to:${currency}:${lowerMax}`,
      label: `Up to ${formatMoneyValue(lowerMax, currency)}`,
      currency,
      minMinor: null,
      maxMinor: lowerMax,
    },
    {
      key: `from:${currency}:${upperMin}`,
      label: `${formatMoneyValue(upperMin, currency)} and above`,
      currency,
      minMinor: upperMin,
      maxMinor: null,
    },
  ];
}

export function isReferenceShopperProductInPriceRangeV2(
  product: StorefrontProductV2,
  range: ReferenceShopperPriceRangeV2
): boolean {
  if (product.price.state !== "KNOWN") return false;
  const { amountMinor, currency } = product.price.money;
  return (
    Number.isSafeInteger(amountMinor) &&
    amountMinor >= 0 &&
    currency === range.currency &&
    (range.minMinor === null || amountMinor >= range.minMinor) &&
    (range.maxMinor === null || amountMinor <= range.maxMinor)
  );
}

export function shouldManageReferenceShopperFocusV2(input: {
  mounted: boolean;
  userTransitionPending: boolean;
}): boolean {
  return input.mounted && input.userTransitionPending;
}

export function effectiveReferenceShopperCapabilitiesV2(input: {
  manifest: StoreExperienceManifestV2;
  runtime?: Partial<ReferenceShopperRuntimeCapabilitiesV2>;
}): ReferenceShopperEffectiveCapabilitiesV2 {
  const runtime = {
    ...DEFAULT_REFERENCE_SHOPPER_RUNTIME_CAPABILITIES_V2,
    ...input.runtime,
  };
  const cart = runtime.cart;
  return {
    ...runtime,
    search:
      runtime.search && input.manifest.chrome.header.search !== "hidden",
    wishlist: runtime.wishlist && input.manifest.features.wishlist,
    compare: runtime.compare && input.manifest.features.compare,
    cart,
    checkoutPreview: runtime.checkoutPreview && cart,
    // There is intentionally no quiz runtime in this vertical.
    quiz: false,
    recommendations:
      runtime.recommendations && input.manifest.features.recommendations,
  };
}

/** Removes feature blocks that the concrete preview runtime cannot execute. */
export function buildEffectiveReferenceShopperManifestV2(input: {
  manifest: StoreExperienceManifestV2;
  capabilities: ReferenceShopperEffectiveCapabilitiesV2;
}): StoreExperienceManifestV2 {
  const manifest = structuredClone(input.manifest);
  manifest.features.quiz = false;
  manifest.features.wishlist = input.capabilities.wishlist;
  manifest.features.compare = input.capabilities.compare;
  manifest.features.recommendations = input.capabilities.recommendations;

  manifest.pages.home.blocks = manifest.pages.home.blocks.filter(
    (block) =>
      block.type !== "quiz-callout" &&
      (input.capabilities.recommendations ||
        block.type !== "recommendation-grid")
  );
  manifest.pages.plp.blocks = manifest.pages.plp.blocks.filter(
    (block) =>
      (input.capabilities.compare || block.type !== "comparison-callout") &&
      (input.capabilities.recommendations ||
        block.type !== "recommendation-grid")
  );
  manifest.pages.pdp.blocks = manifest.pages.pdp.blocks.filter(
    (block) =>
      (input.capabilities.wishlist || block.type !== "wishlist-control") &&
      (input.capabilities.recommendations ||
        (block.type !== "recommendation-grid" &&
          block.type !== "related-products"))
  );
  return manifest;
}

function normalizedAttributeValues(
  value: StorefrontProductV2["attributes"][number]["value"]
): string[] {
  return (Array.isArray(value) ? value : [value])
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

/** Bridges the public storefront projection without admitting supplier data. */
export function buildReferenceShopperMerchandisingCatalogV2(
  catalog: StoreExperienceCatalogProjectionV2
): {
  products: MerchandisingProductV2[];
  attributeDefinitions: MerchandisingAttributeDefinitionV2[];
} {
  const categories = new Map(
    catalog.categories.map((category) => [category.categoryId, category])
  );
  const products = catalog.products.map((product): MerchandisingProductV2 => {
    const taxonomyNodeIds = new Set<string>();
    for (const categoryId of product.taxonomyNodeIds) {
      let cursor = categories.get(categoryId);
      while (cursor && !taxonomyNodeIds.has(cursor.categoryId)) {
        taxonomyNodeIds.add(cursor.categoryId);
        cursor = cursor.parentCategoryId
          ? categories.get(cursor.parentCategoryId)
          : undefined;
      }
    }

    const values = new Map<
      string,
      { label: string; unitCode: string | null; values: Set<string> }
    >();
    const collect = (attribute: StorefrontProductV2["attributes"][number]) => {
      const current = values.get(attribute.key) ?? {
        label: attribute.label,
        unitCode: attribute.unitCode,
        values: new Set<string>(),
      };
      normalizedAttributeValues(attribute.value).forEach((entry) =>
        current.values.add(entry)
      );
      values.set(attribute.key, current);
    };
    product.attributes.forEach(collect);
    product.variants.forEach((variant) => variant.attributes.forEach(collect));

    return {
      productId: product.productId,
      title: product.title,
      description: product.description,
      taxonomyNodeIds: [...taxonomyNodeIds].sort(),
      attributes: [...values.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, attribute]) => ({
          key,
          label: attribute.label,
          unitCode: attribute.unitCode,
          values: [...attribute.values].sort(),
        })),
      priceMinor:
        product.price.state === "KNOWN"
          ? product.price.money.amountMinor
          : null,
      currency:
        product.price.state === "KNOWN"
          ? product.price.money.currency
          : null,
      availability: product.availability,
      purchasable: product.purchasable,
    };
  });

  return {
    products,
    attributeDefinitions: catalog.attributeDefinitions.map((definition) => ({
      key: definition.key,
      label: definition.label,
      kind: definition.dataType,
      facetable: definition.facetable,
      comparable: definition.comparable,
      unitCode: definition.unitCode,
      sortOrder: definition.position,
    })),
  };
}

function formatMoneyValue(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`;
  }
}

function formatProductPrice(product: StorefrontProductV2): string {
  const money = knownMoney(product.price);
  return money
    ? formatMoneyValue(money.amountMinor, money.currency)
    : "Price not stated";
}

function formatAvailability(
  availability: StorefrontProductV2["availability"]
): string {
  return {
    IN_STOCK: "In stock",
    LOW_STOCK: "Low stock",
    OUT_OF_STOCK: "Out of stock",
    UNKNOWN: "Availability not stated",
  }[availability];
}

export function formatReferenceShopperPublicValueV2(
  value: string,
  kind?: string
): string {
  if (kind === "BOOLEAN" || value === "true" || value === "false") {
    return value === "true" ? "Yes" : value === "false" ? "No" : "Not stated";
  }
  return value.trim() || "Not stated";
}

export function isReferenceShopperPreviewMediaSourceV2(src: string): boolean {
  return /^\/reference-store-factory-v2\/(?:drones|apparel|consumables)\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(
    src
  );
}

export function selectReferenceShopperMediaContractV2(
  product: StorefrontProductV2,
  variantId: string | null
): StorefrontMediaV2 | null {
  const variant = variantId
    ? product.variants.find((candidate) => candidate.variantId === variantId)
    : null;
  if (variantId && !variant) return null;
  const variantMediaId = variant?.mediaIds[0];
  if (variantMediaId) {
    return (
      product.media.find((media) => media.mediaId === variantMediaId) ?? null
    );
  }
  return (
    product.media.find((media) => media.role === "PRIMARY") ??
    product.media[0] ??
    null
  );
}

function ProductMedia({
  product,
  variantId,
  resolveMedia,
  eager = false,
  mediaId,
  compact = false,
}: {
  product: StorefrontProductV2;
  variantId: string | null;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  eager?: boolean;
  mediaId?: string;
  compact?: boolean;
}) {
  const media = mediaId
    ? product.media.find((candidate) => candidate.mediaId === mediaId) ?? null
    : selectReferenceShopperMediaContractV2(product, variantId);
  const resolved =
    media && resolveMedia
      ? resolveMedia(product, media, variantId)
      : null;
  if (
    !media ||
    !resolved ||
    !isReferenceShopperPreviewMediaSourceV2(resolved.src) ||
    !Number.isInteger(resolved.width) ||
    resolved.width <= 0 ||
    !Number.isInteger(resolved.height) ||
    resolved.height <= 0
  ) {
    return (
      <div
        role="img"
        aria-label={media?.altText || `${product.title} image not available`}
        data-preview-media="unresolved"
        className={`flex aspect-[var(--storefront-product-ratio,1/1)] items-center justify-center rounded-[var(--storefront-radius,0.75rem)] bg-[color:var(--storefront-color-surface,#f1f5f9)] text-center text-xs font-semibold text-[color:var(--storefront-color-muted-text,#64748b)] ${
          compact ? "h-16 w-16 p-1" : "min-h-40 p-5"
        }`}
      >
        Local preview image unavailable
      </div>
    );
  }
  const reviewedFocalPoint = resolved.focalPoint ?? media.focalPoint;
  const focalPoint = reviewedFocalPoint
    ? `${Math.round(reviewedFocalPoint.x * 100)}% ${Math.round(reviewedFocalPoint.y * 100)}%`
    : "50% 50%";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- generated local preview assets carry explicit intrinsic dimensions.
    <img
      key={`${media.mediaId}:${resolved.src}`}
      src={resolved.src}
      width={resolved.width}
      height={resolved.height}
      alt={resolved.altText?.trim() || media.altText || product.title}
      loading={eager ? "eager" : "lazy"}
      data-media-id={resolved.mediaId ?? media.mediaId}
      data-media-rights={resolved.rights ?? "reviewed-local"}
      data-media-source={resolved.source ?? "reference-preview-resolver"}
      data-media-variant-binding={
        (resolved.variantIds ?? media.variantIds).join(",") || "product"
      }
      className={`rounded-[var(--storefront-radius,0.75rem)] bg-[color:var(--storefront-color-surface,#f1f5f9)] [object-fit:var(--storefront-product-fit,cover)] ${
        compact
          ? "h-16 w-16"
          : "aspect-[var(--storefront-product-ratio,1/1)] h-auto w-full"
      }`}
      style={{ objectPosition: focalPoint }}
    />
  );
}

function ReferenceProductGalleryV2({
  product,
  variantId,
  resolveMedia,
  selectedMediaId,
  showThumbnails,
  layout,
  onSelectMedia,
}: {
  product: StorefrontProductV2;
  variantId: string | null;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  selectedMediaId: string | undefined;
  showThumbnails: boolean;
  layout: "grid" | "carousel";
  onSelectMedia: (mediaId: string) => void;
}) {
  const orderedIds = orderedReferenceShopperMediaIdsV2(product, variantId);
  const seenIds = new Set<string>();
  const seenSources = new Set<string>();
  const reviewedMedia = orderedIds.flatMap((candidateId) => {
    if (seenIds.has(candidateId)) return [];
    seenIds.add(candidateId);
    const media = product.media.find(
      (candidate) => candidate.mediaId === candidateId
    );
    if (!media || media.kind !== "IMAGE" || !resolveMedia) return [];
    const resolved = resolveMedia(product, media, variantId);
    if (
      !resolved ||
      !isReferenceShopperPreviewMediaSourceV2(resolved.src) ||
      seenSources.has(resolved.src)
    ) {
      return [];
    }
    seenSources.add(resolved.src);
    return [media];
  });
  const fallback = selectReferenceShopperMediaContractV2(product, variantId);
  const candidates =
    reviewedMedia.length > 0 ? reviewedMedia : fallback ? [fallback] : [];
  const selected =
    candidates.find((media) => media.mediaId === selectedMediaId) ??
    candidates[0] ??
    null;

  return (
    <div
      data-reference-product-gallery="v2"
      data-gallery-layout={layout}
      data-gallery-media-count={candidates.length}
      className="min-w-0"
    >
      <ProductMedia
        product={product}
        variantId={variantId}
        resolveMedia={resolveMedia}
        mediaId={selected?.mediaId}
        eager
      />
      {showThumbnails && candidates.length > 1 ? (
        <div
          role="group"
          aria-label={`${product.title} gallery thumbnails`}
          className="mt-3 flex min-w-0 flex-wrap gap-2"
        >
          {candidates.map((media) => (
            <button
              key={media.mediaId}
              type="button"
              aria-label={`Show ${media.altText || product.title}`}
              aria-pressed={selected?.mediaId === media.mediaId}
              onClick={() => onSelectMedia(media.mediaId)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--storefront-radius)] border p-1 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-color-primary)] focus-visible:ring-offset-2 ${
                selected?.mediaId === media.mediaId
                  ? "border-[color:var(--storefront-color-primary)]"
                  : "border-[color:var(--storefront-color-border)]"
              }`}
            >
              <ProductMedia
                product={product}
                variantId={variantId}
                resolveMedia={resolveMedia}
                mediaId={media.mediaId}
                compact
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Variant-bound media always leads; product media keeps its declared order. */
export function orderedReferenceShopperMediaIdsV2(
  product: StorefrontProductV2,
  variantId: string | null
): string[] {
  const variant = variantId
    ? product.variants.find((candidate) => candidate.variantId === variantId)
    : null;
  return [
    ...(variant?.mediaIds ?? []),
    ...product.media
      .filter((media) => media.role === "PRIMARY")
      .map((media) => media.mediaId),
    ...product.media.map((media) => media.mediaId),
  ].filter((mediaId, index, mediaIds) => mediaIds.indexOf(mediaId) === index);
}

export function resetReferenceShopperGallerySelectionV2(
  current: Readonly<Record<string, string>>,
  productId: string
): Record<string, string> {
  const next = { ...current };
  delete next[productId];
  return next;
}

function productCopy(
  product: StorefrontProductV2,
  contentProposal?: StoreExperienceRenderDocumentV2["contentProposal"]
) {
  const content = contentProposal?.products.find(
    (candidate) => candidate.productId === product.productId
  );
  return {
    title: content?.headline ?? product.title,
    summary: content?.summary ?? product.subtitle ?? product.description,
  };
}

function ProductCard({
  product,
  selectedVariantId,
  resolveMedia,
  contentProposal,
  capabilities,
  wishlist,
  compare,
  onOpen,
  onToggleWishlist,
  onToggleCompare,
  onQuickAdd,
}: {
  product: StorefrontProductV2;
  selectedVariantId: string | null;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  contentProposal?: StoreExperienceRenderDocumentV2["contentProposal"];
  capabilities: ReferenceShopperEffectiveCapabilitiesV2;
  wishlist: ReadonlySet<string>;
  compare: ReadonlySet<string>;
  onOpen: () => void;
  onToggleWishlist: () => void;
  onToggleCompare: () => void;
  onQuickAdd: () => void;
}) {
  const copy = productCopy(product, contentProposal);
  const identity = referenceShopperWishlistIdentityV2(
    product.productId,
    selectedVariantId
  );
  const directSelection = {
    product,
    variant: null,
    purchaseOption: null,
  };
  const canQuickAdd =
    product.variants.length === 0 &&
    product.purchaseOptions.length === 0 &&
    isReferenceShopperSelectionPurchasableV2(directSelection);

  return (
    <article
      data-product-ref={product.productId}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--storefront-radius,0.75rem)] border-[length:var(--storefront-card-border-width,1px)] border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-3 shadow-[var(--storefront-shadow,0_1px_3px_rgb(15_23_42_/_0.12))]"
    >
      <ProductMedia
        product={product}
        variantId={selectedVariantId}
        resolveMedia={resolveMedia}
      />
      <div className="flex flex-1 flex-col p-1 pt-4">
        {product.brand ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {product.brand}
          </p>
        ) : null}
        <h3 className="mt-1 break-words text-base font-bold leading-snug">
          {copy.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--storefront-color-muted-text,#475569)]">
          {copy.summary}
        </p>
        <p className="mt-3 text-sm font-extrabold">{formatProductPrice(product)}</p>
        <p className="mt-1 text-xs text-slate-500">
          {formatAvailability(product.availability)}
        </p>
        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <button type="button" onClick={onOpen} className={secondaryControlClass}>
            View details
          </button>
          {capabilities.cart ? (
            canQuickAdd ? (
              <button type="button" onClick={onQuickAdd} className={primaryControlClass}>
                Add to cart
              </button>
            ) : (
              <button type="button" onClick={onOpen} className={primaryControlClass}>
                {product.purchasable ? "Choose options" : "View availability"}
              </button>
            )
          ) : null}
        </div>
        {capabilities.wishlist || capabilities.compare ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {capabilities.wishlist ? (
              <button
                type="button"
                aria-pressed={wishlist.has(identity)}
                onClick={onToggleWishlist}
                className={secondaryControlClass}
              >
                {wishlist.has(identity) ? "Wishlisted" : "Wishlist"}
              </button>
            ) : null}
            {capabilities.compare ? (
              <button
                type="button"
                aria-pressed={compare.has(product.productId)}
                onClick={onToggleCompare}
                disabled={!compare.has(product.productId) && compare.size >= 4}
                className={secondaryControlClass}
              >
                {compare.has(product.productId) ? "Comparing" : "Compare"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function chooseDefaultVariant(product: StorefrontProductV2) {
  return (
    product.variants.find(
      (variant) =>
        isImmediatelyAvailable(variant.availability) &&
        variant.price?.state !== "UNKNOWN"
    ) ??
    product.variants[0] ??
    null
  );
}

function compatiblePurchaseOptions(
  product: StorefrontProductV2,
  variantId: string | null
) {
  return product.purchaseOptions.filter(
    (option) => !option.variantId || option.variantId === variantId
  );
}

function choosePurchaseOption(
  product: StorefrontProductV2,
  variantId: string | null,
  requestedId: string | undefined
): StorefrontPurchaseOptionV2 | null {
  const candidates = compatiblePurchaseOptions(product, variantId);
  return (
    candidates.find((option) => option.purchaseOptionId === requestedId) ??
    candidates.find(
      (option) =>
        option.kind !== "UNKNOWN" &&
        option.price.state === "KNOWN" &&
        isImmediatelyAvailable(option.availability)
    ) ??
    candidates[0] ??
    null
  );
}

function selectionBlockedReason(selection: ShopperSelectionV2): string | null {
  if (!selection.product.purchasable) return "This product is not purchasable.";
  if (!isImmediatelyAvailable(selection.product.availability)) {
    return selection.product.availability === "UNKNOWN"
      ? "Product availability is not stated."
      : "This product is out of stock.";
  }
  if (selection.product.variants.length > 0 && !selection.variant) {
    return "Choose an available variant.";
  }
  if (selection.variant && !isImmediatelyAvailable(selection.variant.availability)) {
    return selection.variant.availability === "UNKNOWN"
      ? "Variant availability is not stated."
      : "This variant is out of stock.";
  }
  if (selection.variant?.price?.state === "UNKNOWN") {
    return "Variant price is not stated.";
  }
  if (selection.product.purchaseOptions.length > 0 && !selection.purchaseOption) {
    return "Choose an available purchase option.";
  }
  if (
    selection.purchaseOption &&
    (!isImmediatelyAvailable(selection.purchaseOption.availability) ||
      selection.purchaseOption.price.state !== "KNOWN" ||
      selection.purchaseOption.kind === "UNKNOWN")
  ) {
    return "This purchase option is unavailable.";
  }
  if (!selectionMoney(selection)) return "Price is not stated.";
  return null;
}

function PreviewSessionNavigation({
  page,
  capabilities,
  cartCount,
  compareCount,
  wishlistCount,
  onNavigate,
}: {
  page: ReferenceShopperPageV2;
  capabilities: ReferenceShopperEffectiveCapabilitiesV2;
  cartCount: number;
  compareCount: number;
  wishlistCount: number;
  onNavigate: (page: ReferenceShopperPageV2) => void;
}) {
  const items: Array<{ page: ReferenceShopperPageV2; label: string }> = [
    { page: "home", label: "Home" },
    { page: "plp", label: "Products" },
    ...(capabilities.search
      ? ([{ page: "search", label: "Search" }] as const)
      : []),
    { page: "pdp", label: "Product" },
    ...(capabilities.compare
      ? ([{ page: "compare", label: `Compare (${compareCount})` }] as const)
      : []),
    ...(capabilities.cart
      ? ([{ page: "cart", label: `Cart (${cartCount})` }] as const)
      : []),
    ...(capabilities.checkoutPreview
      ? ([{ page: "checkout", label: "Checkout" }] as const)
      : []),
  ];

  return (
    <div className="min-w-0 border-b border-slate-700 bg-slate-950 px-3 py-3 text-white">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="mr-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-300">
          Shopper session · preview only
        </p>
        <nav aria-label="Reference shopper preview pages" className="flex min-w-0 flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.page}
              type="button"
              data-shopper-page={item.page}
              aria-current={page === item.page ? "page" : undefined}
              onClick={() => onNavigate(item.page)}
              className={`${touchControlClass} border-slate-600 px-3 text-xs ${
                page === item.page
                  ? "bg-white text-slate-950"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {capabilities.wishlist ? (
          <span className="ml-auto text-xs text-slate-300">
            Wishlist {wishlistCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function referenceShopperThemeStyleV2(
  manifest: StoreExperienceManifestV2
): CSSProperties {
  const { palette, typography, spacing, imagery, shape } =
    manifest.designTokens;
  const radius = { none: "0px", soft: "0.75rem", rounded: "1.5rem" }[
    shape.radius
  ];
  const shadow = {
    none: "none",
    soft: "0 1px 3px rgb(15 23 42 / 0.12)",
    strong: "0 18px 45px rgb(15 23 42 / 0.18)",
  }[shape.shadow];
  const ratio = { square: "1 / 1", portrait: "4 / 5", landscape: "4 / 3" }[
    imagery.productRatio
  ];
  const bodyFont =
    typography.bodyFamily === "system-serif"
      ? "ui-serif, Georgia, Cambria, serif"
      : "ui-sans-serif, system-ui, sans-serif";
  const headingFont =
    typography.headingFamily === "system-serif"
      ? "ui-serif, Georgia, Cambria, serif"
      : "ui-sans-serif, system-ui, sans-serif";
  const headingSize = {
    compact: "2.25rem",
    standard: "3rem",
    display: "3.75rem",
  }[typography.scale];
  const densitySpace = {
    compact: "2rem",
    comfortable: "3rem",
    airy: "4rem",
  }[spacing.density];
  const sectionGap = {
    small: "2rem",
    medium: "3rem",
    large: "4rem",
  }[spacing.sectionGap];
  const contentWidth = {
    narrow: "64rem",
    standard: "80rem",
    wide: "90rem",
  }[spacing.contentWidth];
  return {
    "--storefront-color-background": palette.background,
    "--storefront-color-surface": palette.surface,
    "--storefront-color-text": palette.text,
    "--storefront-color-muted-text": palette.mutedText,
    "--storefront-color-primary": palette.primary,
    "--storefront-color-on-primary": palette.onPrimary,
    "--storefront-color-border": palette.border,
    "--storefront-radius": radius,
    "--storefront-shadow": shadow,
    "--storefront-card-border-width":
      shape.cardStyle === "flat" ? "0px" : "1px",
    "--storefront-font-body": bodyFont,
    "--storefront-font-heading": headingFont,
    "--storefront-heading-size": headingSize,
    "--storefront-density-space": densitySpace,
    "--storefront-section-gap": sectionGap,
    "--storefront-content-width": contentWidth,
    "--storefront-product-fit": imagery.productFit,
    "--storefront-product-ratio": ratio,
    backgroundColor: palette.background,
    color: palette.text,
    fontFamily: "var(--storefront-font-body)",
  } as CSSProperties;
}

function PageFrame({
  manifest,
  title,
  description,
  alignment = "left",
  children,
}: {
  manifest: StoreExperienceManifestV2;
  title?: string;
  description?: string;
  alignment?: "left" | "center";
  children: ReactNode;
}) {
  return (
    <div
      data-storefront-token-scope="v2-shopper-runtime"
      data-token-typography-scale={manifest.designTokens.typography.scale}
      data-token-spacing-density={manifest.designTokens.spacing.density}
      data-token-section-gap={manifest.designTokens.spacing.sectionGap}
      data-token-content-width={manifest.designTokens.spacing.contentWidth}
      data-token-card-style={manifest.designTokens.shape.cardStyle}
      className="min-w-0 overflow-x-clip px-4 py-[var(--storefront-density-space)] sm:px-6"
      style={referenceShopperThemeStyleV2(manifest)}
    >
      <div className="mx-auto w-full max-w-[var(--storefront-content-width)] min-w-0">
        {title ? <header className={`mb-[var(--storefront-section-gap)] min-w-0 ${
          alignment === "center" ? "mx-auto max-w-4xl text-center" : ""
        }`}>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[color:var(--storefront-color-primary)]">
            {manifest.chrome.header.brandLabel}
          </p>
          <h1
            className="mt-2 break-words text-[length:clamp(2rem,var(--storefront-heading-size),3.75rem)] font-extrabold leading-[1.08] tracking-tight"
            style={{ fontFamily: "var(--storefront-font-heading)" }}
          >
            {title}
          </h1>
          {description ? (
            <p className={`mt-3 text-sm leading-6 text-[color:var(--storefront-color-muted-text)] sm:text-base ${
              alignment === "center" ? "mx-auto max-w-3xl" : "max-w-3xl"
            }`}>
              {description}
            </p>
          ) : null}
        </header> : null}
        {children}
      </div>
    </div>
  );
}

function CatalogResultsPage({
  mode,
  manifest,
  catalog,
  merchandising,
  capabilities,
  query,
  categoryId,
  filters,
  availabilityFilters,
  brandFilters,
  priceRangeKey,
  sort,
  page,
  productState,
  resolveMedia,
  contentProposal,
  wishlist,
  compare,
  onQuery,
  onCategory,
  onFilter,
  onAvailabilityFilter,
  onBrandFilter,
  onPriceRange,
  onSort,
  onPage,
  onClear,
  onOpen,
  onToggleWishlist,
  onToggleCompare,
  onOpenCompare,
  onQuickAdd,
}: {
  mode: "plp" | "search";
  manifest: StoreExperienceManifestV2;
  catalog: StoreExperienceCatalogProjectionV2;
  merchandising: ReturnType<typeof buildReferenceShopperMerchandisingCatalogV2>;
  capabilities: ReferenceShopperEffectiveCapabilitiesV2;
  query: string;
  categoryId: string | null;
  filters: Readonly<Record<string, readonly string[]>>;
  availabilityFilters: readonly MerchandisingAvailabilityV2[];
  brandFilters: readonly string[];
  priceRangeKey: string | null;
  sort: NonNullable<MerchandisingSearchRequestV2["sort"]>;
  page: number;
  productState: (product: StorefrontProductV2) => string | null;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  contentProposal?: StoreExperienceRenderDocumentV2["contentProposal"];
  wishlist: ReadonlySet<string>;
  compare: ReadonlySet<string>;
  onQuery: (value: string) => void;
  onCategory: (value: string | null) => void;
  onFilter: (key: string, value: string) => void;
  onAvailabilityFilter: (value: MerchandisingAvailabilityV2) => void;
  onBrandFilter: (value: string) => void;
  onPriceRange: (value: string | null) => void;
  onSort: (value: NonNullable<MerchandisingSearchRequestV2["sort"]>) => void;
  onPage: (value: number) => void;
  onClear: () => void;
  onOpen: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  onOpenCompare: () => void;
  onQuickAdd: (productId: string) => void;
}) {
  const searchQuery = mode === "search" ? query : "";
  const productByRef = new Map(
    catalog.products.map((product) => [product.productId, product])
  );
  const priceRanges = deriveReferenceShopperPriceRangesV2(catalog.products);
  const selectedPriceRange =
    priceRanges.find((range) => range.key === priceRangeKey) ?? null;
  const selectedBrands = new Set(brandFilters);
  const scopedMerchandising = {
    ...merchandising,
    products: merchandising.products.filter((product) => {
      const source = productByRef.get(product.productId);
      if (!source) return false;
      if (
        selectedBrands.size > 0 &&
        (!source.brand || !selectedBrands.has(source.brand))
      ) {
        return false;
      }
      if (
        selectedPriceRange &&
        !isReferenceShopperProductInPriceRangeV2(source, selectedPriceRange)
      ) {
        return false;
      }
      return true;
    }),
  };
  const baseRequest = {
    query: searchQuery,
    taxonomyNodeIds: categoryId ? [categoryId] : [],
    availability: availabilityFilters,
    sort,
    pageSize: 6,
  } satisfies MerchandisingSearchRequestV2;
  const facetSource = searchMerchandisingCatalogV2({
    ...scopedMerchandising,
    request: { ...baseRequest, page: 1 },
  });
  const result = searchMerchandisingCatalogV2({
    ...scopedMerchandising,
    request: {
      ...baseRequest,
      attributeFilters: filters,
      page,
    },
  });
  const products = result.products.flatMap((candidate) => {
    const product = catalog.products.find(
      (entry) => entry.productId === candidate.productId
    );
    return product ? [product] : [];
  });
  const definitionByKey = new Map(
    merchandising.attributeDefinitions.map((definition) => [
      definition.key,
      definition,
    ])
  );
  const hasFilters =
    Boolean(categoryId) ||
    Object.values(filters).some((values) => values.length > 0) ||
    availabilityFilters.length > 0 ||
    brandFilters.length > 0 ||
    Boolean(selectedPriceRange) ||
    (mode === "search" && query.trim().length > 0);
  const selectedCategory = categoryId
    ? catalog.categories.find((category) => category.categoryId === categoryId)
    : null;
  const catalogTitle = selectedCategory?.title ?? "Shop all products";
  const catalogDescription =
    selectedCategory?.description ??
    "Browse normalized categories and filter on public product facts.";

  const renderSort = (showResultCount: boolean) => (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showResultCount ? (
        <p aria-live="polite" className="text-sm font-bold">
          {result.total} {result.total === 1 ? "result" : "results"}
          {searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ""}
        </p>
      ) : (
        <span aria-live="polite" className="sr-only">
          {result.total} {result.total === 1 ? "result" : "results"}
        </span>
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        Sort
        <select
          value={sort}
          onChange={(event) =>
            onSort(
              event.currentTarget.value as NonNullable<
                MerchandisingSearchRequestV2["sort"]
              >
            )
          }
          className="min-h-11 rounded-lg border border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] px-3 text-[color:var(--storefront-color-text,#0f172a)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-color-primary)]"
        >
          <option value="RELEVANCE">Relevance</option>
          <option value="PRICE_ASC">Price: low to high</option>
          <option value="PRICE_DESC">Price: high to low</option>
          <option value="TITLE_ASC">Title: A–Z</option>
        </select>
      </label>
    </div>
  );

  const renderCategoryChoices = (layout: "sidebar" | "toolbar") =>
    layout === "toolbar" ? (
      <label className="grid min-w-0 gap-2 text-sm font-bold">
        Category
        <select
          value={categoryId ?? ""}
          onChange={(event) => onCategory(event.currentTarget.value || null)}
          className="min-h-11 min-w-0 rounded-lg border border-[color:var(--storefront-color-border)] bg-[color:var(--storefront-color-surface)] px-3 font-normal text-[color:var(--storefront-color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-color-primary)]"
        >
          <option value="">All categories</option>
          {catalog.categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {`${"— ".repeat(Math.min(category.depth, 3))}${category.title}`}
            </option>
          ))}
        </select>
      </label>
    ) : (
      <fieldset>
        <legend className="text-sm font-bold">Category</legend>
        <div className="mt-2 grid gap-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:brightness-95">
            <input
              type="radio"
              name={`${mode}-category`}
              checked={categoryId === null}
              onChange={() => onCategory(null)}
              className="h-5 w-5"
            />
            All categories
          </label>
          {catalog.categories.map((category) => (
            <label
              key={category.categoryId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:brightness-95"
              style={{
                paddingLeft: `${0.5 + Math.min(category.depth, 3) * 0.65}rem`,
              }}
            >
              <input
                type="radio"
                name={`${mode}-category`}
                checked={categoryId === category.categoryId}
                onChange={() => onCategory(category.categoryId)}
                className="h-5 w-5 shrink-0"
              />
              <span className="break-words">{category.title}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );

  const renderAttributeFacets = (layout: "sidebar" | "toolbar") =>
    facetSource.facets.map((facet) => {
      const definition = definitionByKey.get(facet.key);
      return (
        <fieldset
          key={facet.key}
          className={
            layout === "sidebar"
              ? "border-t border-[color:var(--storefront-color-border)] pt-5"
              : "min-w-0 rounded-[var(--storefront-radius)] border border-[color:var(--storefront-color-border)] p-3"
          }
        >
          <legend className="px-1 text-sm font-bold">
            {facet.label}
            {facet.unitCode ? ` (${facet.unitCode})` : ""}
          </legend>
          <div
            className={
              layout === "sidebar"
                ? "mt-2 grid gap-1"
                : "mt-2 flex min-w-0 flex-wrap gap-1"
            }
          >
            {facet.values.map((entry) => {
              const checked = filters[facet.key]?.includes(entry.value) ?? false;
              return (
                <label
                  key={entry.value}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:brightness-95"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onFilter(facet.key, entry.value)}
                    className="h-5 w-5 shrink-0"
                  />
                  <span className="min-w-0 break-words">
                    {formatReferenceShopperPublicValueV2(
                      entry.value,
                      definition?.kind
                    )}
                  </span>
                  <span className="text-xs text-[color:var(--storefront-color-muted-text)]">
                    {entry.count}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    });

  const genericFacetClass = (layout: "sidebar" | "toolbar") =>
    layout === "sidebar"
      ? "border-t border-[color:var(--storefront-color-border)] pt-5"
      : "min-w-0 rounded-[var(--storefront-radius)] border border-[color:var(--storefront-color-border)] p-3";
  const genericChoicesClass = (layout: "sidebar" | "toolbar") =>
    layout === "sidebar"
      ? "mt-2 grid gap-1"
      : "mt-2 flex min-w-0 flex-wrap gap-1";
  const availabilityOrder: readonly MerchandisingAvailabilityV2[] = [
    "IN_STOCK",
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "UNKNOWN",
  ];
  const availabilityOptions = availabilityOrder.flatMap((availability) => {
    const count = catalog.products.filter(
      (product) => product.availability === availability
    ).length;
    return count > 0 ? [{ availability, count }] : [];
  });
  const brandOptions = [...new Set(
    catalog.products.flatMap((product) =>
      product.brand?.trim() ? [product.brand.trim()] : []
    )
  )]
    .sort((left, right) => left.localeCompare(right))
    .map((brand) => ({
      brand,
      count: catalog.products.filter((product) => product.brand === brand).length,
    }));

  const renderAvailabilityFacet = (layout: "sidebar" | "toolbar") => (
    <fieldset className={genericFacetClass(layout)}>
      <legend className="px-1 text-sm font-bold">Availability</legend>
      <div className={genericChoicesClass(layout)}>
        {availabilityOptions.map(({ availability, count }) => (
          <label
            key={availability}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:brightness-95"
          >
            <input
              type="checkbox"
              checked={availabilityFilters.includes(availability)}
              onChange={() => onAvailabilityFilter(availability)}
              className="h-5 w-5 shrink-0"
            />
            <span>{formatAvailability(availability)}</span>
            <span className="text-xs text-[color:var(--storefront-color-muted-text)]">
              {count}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const renderBrandFacet = (layout: "sidebar" | "toolbar") => (
    <fieldset className={genericFacetClass(layout)}>
      <legend className="px-1 text-sm font-bold">Brand</legend>
      {brandOptions.length > 0 ? (
        <div className={genericChoicesClass(layout)}>
          {brandOptions.map(({ brand, count }) => (
            <label
              key={brand}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:brightness-95"
            >
              <input
                type="checkbox"
                checked={brandFilters.includes(brand)}
                onChange={() => onBrandFilter(brand)}
                className="h-5 w-5 shrink-0"
              />
              <span className="min-w-0 break-words">{brand}</span>
              <span className="text-xs text-[color:var(--storefront-color-muted-text)]">
                {count}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--storefront-color-muted-text)]">
          No stated brands in this catalog.
        </p>
      )}
    </fieldset>
  );

  const renderPriceFacet = (layout: "sidebar" | "toolbar") => (
    <fieldset className={genericFacetClass(layout)}>
      <legend className="px-1 text-sm font-bold">Price</legend>
      {priceRanges.length > 0 ? (
        <div className={genericChoicesClass(layout)}>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:brightness-95">
            <input
              type="radio"
              name={`${mode}-price-range`}
              checked={selectedPriceRange === null}
              onChange={() => onPriceRange(null)}
              className="h-5 w-5 shrink-0"
            />
            All stated and unstated prices
          </label>
          {priceRanges.map((range) => {
            const count = catalog.products.filter((product) =>
              isReferenceShopperProductInPriceRangeV2(product, range)
            ).length;
            return (
              <label
                key={range.key}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:brightness-95"
              >
                <input
                  type="radio"
                  name={`${mode}-price-range`}
                  checked={selectedPriceRange?.key === range.key}
                  onChange={() => onPriceRange(range.key)}
                  className="h-5 w-5 shrink-0"
                />
                <span>{range.label}</span>
                <span className="text-xs text-[color:var(--storefront-color-muted-text)]">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p
          data-price-facet="unavailable"
          className="mt-2 text-xs leading-5 text-[color:var(--storefront-color-muted-text)]"
        >
          Comparable price ranges require known prices in one shared currency.
        </p>
      )}
    </fieldset>
  );

  const renderFilters = (
    block: Extract<
      StoreExperienceManifestV2["pages"]["plp"]["blocks"][number],
      { type: "filter-bar" }
    >,
    forcedLayout?: "sidebar" | "toolbar"
  ) => {
    if (!capabilities.filters) return null;
    const layout = forcedLayout ?? block.layout ?? "toolbar";
    const Wrapper = layout === "sidebar" ? "aside" : "section";
    const showCategory = block.facets?.includes("category") ?? false;
    const showPrice = block.facets?.includes("price") ?? false;
    const showAvailability =
      block.facets?.includes("availability") ?? false;
    const showBrand = block.facets?.includes("brand") ?? false;
    const showTaxonomyAttributes = block.source === "taxonomy-attributes";
    return (
      <Wrapper
        data-manifest-plp-block={block.type}
        data-experience-filter-layout={layout}
        className={`min-w-0 rounded-[var(--storefront-radius)] border-[length:var(--storefront-card-border-width)] border-[color:var(--storefront-color-border)] bg-[color:var(--storefront-color-surface)] p-4 shadow-[var(--storefront-shadow)] ${
          layout === "sidebar" ? "lg:sticky lg:top-4" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold">Filters</h2>
          {hasFilters ? (
            <button type="button" onClick={onClear} className={secondaryControlClass}>
              Clear all
            </button>
          ) : null}
        </div>
        <div
          className={
            layout === "sidebar"
              ? "mt-5 grid gap-5"
              : "mt-4 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          }
        >
          {showCategory ? renderCategoryChoices(layout) : null}
          {showPrice ? renderPriceFacet(layout) : null}
          {showAvailability ? renderAvailabilityFacet(layout) : null}
          {showBrand ? renderBrandFacet(layout) : null}
          {showTaxonomyAttributes ? renderAttributeFacets(layout) : null}
        </div>
        <div className="mt-4 border-t border-[color:var(--storefront-color-border)] pt-3">
          {renderSort(block.showResultCount !== false)}
        </div>
      </Wrapper>
    );
  };

  const renderProductGrid = (
    columns: "two" | "three" | "four",
    title?: string,
    emptyState = "No products found"
  ) => {
    const columnsClass = {
      two: "sm:grid-cols-2",
      three: "sm:grid-cols-2 xl:grid-cols-3",
      four: "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
    }[columns];
    return (
      <section
        className="min-w-0"
        aria-label="Product results"
        data-manifest-plp-block="product-grid"
        data-product-grid-columns={columns}
      >
        {title ? (
          <h2
            className="mb-5 text-2xl font-extrabold"
            style={{ fontFamily: "var(--storefront-font-heading)" }}
          >
            {title}
          </h2>
        ) : null}
        {products.length > 0 ? (
          <div className={`grid min-w-0 gap-5 ${columnsClass}`}>
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                selectedVariantId={productState(product)}
                resolveMedia={resolveMedia}
                contentProposal={contentProposal}
                capabilities={capabilities}
                wishlist={wishlist}
                compare={compare}
                onOpen={() => onOpen(product.productId)}
                onToggleWishlist={() => onToggleWishlist(product.productId)}
                onToggleCompare={() => onToggleCompare(product.productId)}
                onQuickAdd={() => onQuickAdd(product.productId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--storefront-radius)] border border-dashed border-[color:var(--storefront-color-border)] bg-[color:var(--storefront-color-surface)] p-8 text-center text-[color:var(--storefront-color-text)]">
            <h2 className="text-xl font-extrabold">{emptyState}</h2>
            <p className="mt-2 text-sm text-[color:var(--storefront-color-muted-text)]">
              Clear the query or filters to see the complete catalog.
            </p>
            {hasFilters ? (
              <button type="button" onClick={onClear} className={`${primaryControlClass} mt-5`}>
                Clear search and filters
              </button>
            ) : null}
          </div>
        )}
        {result.pageCount > 1 ? (
          <nav
            aria-label="Product result pages"
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              disabled={result.page <= 1}
              onClick={() => onPage(result.page - 1)}
              className={secondaryControlClass}
            >
              Previous
            </button>
            <span className="px-2 text-sm font-semibold">
              Page {result.page} of {result.pageCount}
            </span>
            <button
              type="button"
              disabled={result.page >= result.pageCount}
              onClick={() => onPage(result.page + 1)}
              className={secondaryControlClass}
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    );
  };

  const renderReferenceProducts = (
    refs: readonly string[],
    title: string
  ) => {
    const referenced = refs.flatMap((reference) => {
      const product = productByRef.get(reference);
      return product ? [product] : [];
    });
    if (referenced.length === 0) return null;
    return (
      <section data-manifest-plp-block="recommendation-grid" className="min-w-0">
        <h2
          className="mb-5 text-2xl font-extrabold"
          style={{ fontFamily: "var(--storefront-font-heading)" }}
        >
          {title}
        </h2>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {referenced.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              selectedVariantId={productState(product)}
              resolveMedia={resolveMedia}
              contentProposal={contentProposal}
              capabilities={capabilities}
              wishlist={wishlist}
              compare={compare}
              onOpen={() => onOpen(product.productId)}
              onToggleWishlist={() => onToggleWishlist(product.productId)}
              onToggleCompare={() => onToggleCompare(product.productId)}
              onQuickAdd={() => onQuickAdd(product.productId)}
            />
          ))}
        </div>
      </section>
    );
  };

  const renderPlpBlock = (
    block: StoreExperienceManifestV2["pages"]["plp"]["blocks"][number]
  ): ReactNode => {
    switch (block.type) {
      case "category-header":
        return (
          <header
            key={block.id}
            data-manifest-plp-block={block.type}
            data-header-alignment={block.alignment}
            className={`min-w-0 ${block.alignment === "center" ? "mx-auto max-w-4xl text-center" : ""}`}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[color:var(--storefront-color-primary)]">
              {manifest.chrome.header.brandLabel}
            </p>
            <h1
              className="mt-2 break-words text-[length:clamp(2rem,var(--storefront-heading-size),3.75rem)] font-extrabold leading-[1.08] tracking-tight"
              style={{ fontFamily: "var(--storefront-font-heading)" }}
            >
              {catalogTitle}
            </h1>
            {block.showDescription ? (
              <p className={`mt-3 text-sm leading-6 text-[color:var(--storefront-color-muted-text)] sm:text-base ${
                block.alignment === "center" ? "mx-auto max-w-3xl" : "max-w-3xl"
              }`}>
                {catalogDescription}
              </p>
            ) : null}
          </header>
        );
      case "filter-bar":
        return <React.Fragment key={block.id}>{renderFilters(block)}</React.Fragment>;
      case "product-grid":
        return (
          <React.Fragment key={block.id}>
            {renderProductGrid(
              block.columns,
              block.title,
              block.emptyState ?? "No products found"
            )}
          </React.Fragment>
        );
      case "category-navigation":
        return (
          <section key={block.id} data-manifest-plp-block={block.type}>
            <h2
              className="text-xl font-extrabold"
              style={{ fontFamily: "var(--storefront-font-heading)" }}
            >
              {block.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {block.categoryRefs.map((reference) => {
                const category = catalog.categories.find(
                  (candidate) => candidate.categoryId === reference
                );
                return category ? (
                  <button
                    key={reference}
                    type="button"
                    aria-pressed={categoryId === reference}
                    onClick={() => onCategory(reference)}
                    className={secondaryControlClass}
                  >
                    {category.title}
                  </button>
                ) : null;
              })}
            </div>
          </section>
        );
      case "comparison-callout":
        return capabilities.compare ? (
          <section key={block.id} data-manifest-plp-block={block.type}>
            <button
              type="button"
              onClick={onOpenCompare}
              className={primaryControlClass}
            >
              {block.label} ({compare.size})
            </button>
          </section>
        ) : null;
      case "recommendation-grid":
        return (
          <React.Fragment key={block.id}>
            {renderReferenceProducts(block.productRefs, block.title)}
          </React.Fragment>
        );
    }
  };

  if (mode === "search") {
    const searchFilterBlock: Extract<
      StoreExperienceManifestV2["pages"]["plp"]["blocks"][number],
      { type: "filter-bar" }
    > = {
      id: "search.filters",
      type: "filter-bar",
      layout: "toolbar",
      source: "taxonomy-attributes",
      showResultCount: true,
      facets: ["category"],
    };
    return (
      <PageFrame
        manifest={manifest}
        title="Search the catalog"
        description="Search product titles, descriptions and public catalog attributes."
      >
        <section
          data-reference-search-shell="protected"
          className="space-y-[var(--storefront-section-gap)]"
        >
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search products</span>
              <input
                type="search"
                value={query}
                onChange={(event) => onQuery(event.currentTarget.value)}
                placeholder="Search products and specifications"
                className="min-h-11 w-full min-w-0 rounded-lg border border-[color:var(--storefront-color-border)] bg-[color:var(--storefront-color-surface)] px-4 py-2 text-base text-[color:var(--storefront-color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-color-primary)]"
              />
            </label>
            {query ? (
              <button type="button" onClick={() => onQuery("")} className={secondaryControlClass}>
                Clear query
              </button>
            ) : null}
          </div>
          {renderFilters(searchFilterBlock, "toolbar")}
          {renderProductGrid("three")}
        </section>
      </PageFrame>
    );
  }

  const plpBlocks = manifest.pages.plp.blocks;
  const sidebarIndex = plpBlocks.findIndex(
    (block) => block.type === "filter-bar" && block.layout === "sidebar"
  );
  return (
    <PageFrame manifest={manifest}>
      <div
        data-reference-plp-composition={
          sidebarIndex >= 0 ? "manifest-sidebar" : "manifest-flow"
        }
        className="min-w-0 space-y-[var(--storefront-section-gap)]"
      >
        {sidebarIndex < 0 ? (
          plpBlocks.map(renderPlpBlock)
        ) : (
          <>
            {plpBlocks.slice(0, sidebarIndex).map(renderPlpBlock)}
            <div className="grid min-w-0 gap-[var(--storefront-section-gap)] lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)] lg:items-start">
              {renderPlpBlock(plpBlocks[sidebarIndex])}
              <div className="min-w-0 space-y-[var(--storefront-section-gap)]">
                {plpBlocks.slice(sidebarIndex + 1).map(renderPlpBlock)}
              </div>
            </div>
          </>
        )}
      </div>
    </PageFrame>
  );
}

function ComparePage({
  manifest,
  catalog,
  merchandising,
  compareIds,
  resolveMedia,
  onRemove,
  onBrowse,
}: {
  manifest: StoreExperienceManifestV2;
  catalog: StoreExperienceCatalogProjectionV2;
  merchandising: ReturnType<typeof buildReferenceShopperMerchandisingCatalogV2>;
  compareIds: ReadonlySet<string>;
  resolveMedia?: ReferenceShopperMediaResolverV2;
  onRemove: (productId: string) => void;
  onBrowse: () => void;
}) {
  const products = [...compareIds].flatMap((productId) => {
    const product = merchandising.products.find(
      (candidate) => candidate.productId === productId
    );
    return product ? [product] : [];
  });
  const sourceProducts = products.flatMap((product) => {
    const source = catalog.products.find(
      (candidate) => candidate.productId === product.productId
    );
    return source ? [source] : [];
  });
  const rows = compareMerchandisingProductsV2({
    products,
    attributeDefinitions: merchandising.attributeDefinitions,
    maxProducts: 4,
  });

  return (
    <PageFrame
      manifest={manifest}
      title="Compare products"
      description="Only public catalog facts marked comparable by the taxonomy contract are shown."
    >
      {sourceProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-8 text-center text-[color:var(--storefront-color-text,#1e293b)]">
          <p className="font-bold">No products selected for comparison.</p>
          <button type="button" onClick={onBrowse} className={`${primaryControlClass} mt-4`}>
            Browse products
          </button>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-xl border border-[color:var(--storefront-color-border)] bg-[color:var(--storefront-color-surface)]">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <caption className="sr-only">Public product comparison</caption>
            <thead>
              <tr>
                <th scope="col" className="w-44 border-b border-slate-200 p-4">
                  Public fact
                </th>
                {sourceProducts.map((product) => (
                  <th key={product.productId} scope="col" className="min-w-48 border-b border-slate-200 p-4 align-top">
                    <ProductMedia
                      product={product}
                      variantId={chooseDefaultVariant(product)?.variantId ?? null}
                      resolveMedia={resolveMedia}
                    />
                    <p className="mt-3 font-extrabold">{product.title}</p>
                    <button
                      type="button"
                      onClick={() => onRemove(product.productId)}
                      className={`${secondaryControlClass} mt-3`}
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="border-b border-slate-200 p-4 font-bold">Price</th>
                {sourceProducts.map((product) => (
                  <td key={product.productId} className="border-b border-slate-200 p-4">
                    {formatProductPrice(product)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="border-b border-slate-200 p-4 font-bold">Availability</th>
                {sourceProducts.map((product) => (
                  <td key={product.productId} className="border-b border-slate-200 p-4">
                    {formatAvailability(product.availability)}
                  </td>
                ))}
              </tr>
              {rows.map((row) => {
                const definition = merchandising.attributeDefinitions.find(
                  (candidate) => candidate.key === row.key
                );
                return (
                  <tr key={row.key}>
                    <th scope="row" className="border-b border-slate-200 p-4 font-bold">
                      {row.label}{row.unitCode ? ` (${row.unitCode})` : ""}
                    </th>
                    {sourceProducts.map((product) => {
                      const value = row.values.find(
                        (entry) => entry.productId === product.productId
                      )?.value;
                      return (
                        <td key={product.productId} className="border-b border-slate-200 p-4">
                          {value
                            ? value
                                .split(", ")
                                .map((entry) =>
                                  formatReferenceShopperPublicValueV2(
                                    entry,
                                    definition?.kind
                                  )
                                )
                                .join(", ")
                            : "Not stated"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  );
}

function CartPage({
  manifest,
  catalog,
  items,
  capabilities,
  onQuantity,
  onRemove,
  onCheckout,
}: {
  manifest: StoreExperienceManifestV2;
  catalog: StoreExperienceCatalogProjectionV2;
  items: readonly ReferenceShopperCartItemV2[];
  capabilities: ReferenceShopperEffectiveCapabilitiesV2;
  onQuantity: (identity: string, delta: number) => void;
  onRemove: (identity: string) => void;
  onCheckout: () => void;
}) {
  const currencies = new Set(items.map((item) => item.currency));
  const totalMinor = items.reduce(
    (sum, item) => sum + item.unitPriceMinor * item.quantity,
    0
  );
  return (
    <PageFrame
      manifest={manifest}
      title="Preview cart"
      description="This cart exists only in memory for the current revision preview."
    >
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-8 text-center text-[color:var(--storefront-color-text,#1e293b)]">
          Your preview cart is empty.
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
          <ul className="min-w-0 space-y-3">
            {items.map((item) => {
              const product = catalog.products.find(
                (candidate) => candidate.productId === item.productId
              );
              const variant = product?.variants.find(
                (candidate) => candidate.variantId === item.variantId
              );
              const option = product?.purchaseOptions.find(
                (candidate) => candidate.purchaseOptionId === item.purchaseOptionId
              );
              return (
                <li key={item.identity} className="min-w-0 rounded-xl border border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-4 text-[color:var(--storefront-color-text,#0f172a)]">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-extrabold">{product?.title ?? "Unknown product"}</p>
                      {variant ? <p className="mt-1 text-sm text-[color:var(--storefront-color-muted-text,#475569)]">{variant.label}</p> : null}
                      {option ? <p className="mt-1 text-sm text-[color:var(--storefront-color-muted-text,#475569)]">{option.label}</p> : null}
                      {item.repeatDays ? (
                        <p className="mt-1 text-sm text-[color:var(--storefront-color-muted-text,#475569)]">Repeat every {item.repeatDays} days</p>
                      ) : null}
                      <p className="mt-2 text-sm font-bold">
                        {formatMoneyValue(item.unitPriceMinor, item.currency)} each
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${product?.title ?? "product"} quantity`}
                        onClick={() => onQuantity(item.identity, -1)}
                        className={secondaryControlClass}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center font-bold" aria-label={`Quantity ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${product?.title ?? "product"} quantity`}
                        onClick={() => onQuantity(item.identity, 1)}
                        className={secondaryControlClass}
                      >
                        +
                      </button>
                      <button type="button" onClick={() => onRemove(item.identity)} className={secondaryControlClass}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="rounded-xl border border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-5 text-[color:var(--storefront-color-text,#0f172a)] lg:sticky lg:top-4">
            <h2 className="text-lg font-extrabold">Summary</h2>
            <p className="mt-4 flex justify-between gap-4 font-bold">
              <span>Subtotal</span>
              <span>
                {currencies.size === 1
                  ? formatMoneyValue(totalMinor, [...currencies][0])
                  : "Not stated"}
              </span>
            </p>
            <p className="mt-3 text-xs leading-5 text-[color:var(--storefront-color-muted-text,#475569)]">
              Shipping and payment are intentionally not calculated in this preview.
            </p>
            {capabilities.checkoutPreview ? (
              <button type="button" onClick={onCheckout} className={`${primaryControlClass} mt-5 w-full`}>
                Review checkout preview
              </button>
            ) : null}
          </aside>
        </div>
      )}
    </PageFrame>
  );
}

function CheckoutPage({
  manifest,
  items,
  onCart,
}: {
  manifest: StoreExperienceManifestV2;
  items: readonly ReferenceShopperCartItemV2[];
  onCart: () => void;
}) {
  return (
    <PageFrame
      manifest={manifest}
      title="Checkout preview"
      description="Protected structure only. No order, customer, payment or analytics event can be created here."
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-6 text-[color:var(--storefront-color-text,#0f172a)]">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-amber-700">
          Preview only
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">Payment intentionally disabled</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--storefront-color-muted-text,#475569)]">
          {items.length > 0
            ? `${items.length} cart line${items.length === 1 ? "" : "s"} remain in this in-memory preview session.`
            : "The cart is empty, so there is nothing to review."}
        </p>
        <button type="button" onClick={onCart} className={`${secondaryControlClass} mt-5`}>
          Back to cart
        </button>
      </div>
    </PageFrame>
  );
}

function ReferenceShopperPreviewSessionV2({
  revisionKey,
  catalog,
  manifest,
  contentProposal,
  runtimeCapabilities,
  resolveMedia,
  initialPage = "home",
  initialProductId,
}: ReferenceShopperPreviewV2Props) {
  const capabilities = useMemo(
    () =>
      effectiveReferenceShopperCapabilitiesV2({
        manifest,
        runtime: runtimeCapabilities,
      }),
    [manifest, runtimeCapabilities]
  );
  const normalizedInitialPage =
    (initialPage === "search" && !capabilities.search) ||
    (initialPage === "compare" && !capabilities.compare) ||
    (initialPage === "cart" && !capabilities.cart) ||
    (initialPage === "checkout" && !capabilities.checkoutPreview)
      ? "home"
      : initialPage;
  const effectiveManifest = useMemo(
    () =>
      buildEffectiveReferenceShopperManifestV2({
        manifest,
        capabilities,
      }),
    [manifest, capabilities]
  );
  const initialProduct =
    catalog.products.find((product) => product.productId === initialProductId) ??
    catalog.products[0];
  const merchandising = useMemo(
    () => buildReferenceShopperMerchandisingCatalogV2(catalog),
    [catalog]
  );
  const [page, setPage] = useState<ReferenceShopperPageV2>(normalizedInitialPage);
  const [activeProductId, setActiveProductId] = useState(
    initialProduct?.productId ?? ""
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      catalog.products.flatMap((product) => {
        const variant = chooseDefaultVariant(product);
        return variant ? [[product.productId, variant.variantId]] : [];
      })
    )
  );
  const [selectedPurchaseOptionIds, setSelectedPurchaseOptionIds] = useState<
    Record<string, string>
  >({});
  const [selectedGalleryMediaIds, setSelectedGalleryMediaIds] = useState<
    Record<string, string>
  >({});
  const [repeatDays, setRepeatDays] = useState<Record<string, number | null>>({});
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());
  const [compare, setCompare] = useState<Set<string>>(() => new Set());
  const [cart, setCart] = useState<ReferenceShopperCartItemV2[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [availabilityFilters, setAvailabilityFilters] = useState<
    MerchandisingAvailabilityV2[]
  >([]);
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [priceRangeKey, setPriceRangeKey] = useState<string | null>(null);
  const [sort, setSort] = useState<
    NonNullable<MerchandisingSearchRequestV2["sort"]>
  >("RELEVANCE");
  const [resultPage, setResultPage] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");
  const pageFocusTargetRef = useRef<HTMLDivElement>(null);
  const focusLifecycleMountedRef = useRef(false);
  const userFocusTransitionPendingRef = useRef(false);

  useEffect(() => {
    const shouldFocus = shouldManageReferenceShopperFocusV2({
      mounted: focusLifecycleMountedRef.current,
      userTransitionPending: userFocusTransitionPendingRef.current,
    });
    if (!focusLifecycleMountedRef.current) {
      focusLifecycleMountedRef.current = true;
      return;
    }
    if (!shouldFocus) return;
    userFocusTransitionPendingRef.current = false;
    pageFocusTargetRef.current?.focus({ preventScroll: true });
  }, [page, activeProductId]);

  const productById = (productId: string) =>
    catalog.products.find((product) => product.productId === productId);
  const selectedVariantFor = (product: StorefrontProductV2) =>
    product.variants.find(
      (variant) => variant.variantId === selectedVariantIds[product.productId]
    ) ?? chooseDefaultVariant(product);
  const selectionFor = (product: StorefrontProductV2): ShopperSelectionV2 => {
    const variant = capabilities.variants ? selectedVariantFor(product) : null;
    const purchaseOption = capabilities.purchaseOptions
      ? choosePurchaseOption(
          product,
          variant?.variantId ?? null,
          selectedPurchaseOptionIds[product.productId]
        )
      : null;
    return { product, variant, purchaseOption };
  };
  const navigate = (nextPage: ReferenceShopperPageV2) => {
    if (
      (nextPage === "search" && !capabilities.search) ||
      (nextPage === "compare" && !capabilities.compare) ||
      (nextPage === "cart" && !capabilities.cart) ||
      (nextPage === "checkout" && !capabilities.checkoutPreview)
    ) {
      return;
    }
    userFocusTransitionPendingRef.current = true;
    setPage(nextPage);
  };
  const openProduct = (productId: string) => {
    if (!productById(productId)) return;
    userFocusTransitionPendingRef.current = true;
    setActiveProductId(productId);
    setPage("pdp");
  };
  const toggleWishlist = (productId: string) => {
    if (!capabilities.wishlist) return;
    const product = productById(productId);
    if (!product) return;
    const variantId = selectedVariantFor(product)?.variantId ?? null;
    const identity = referenceShopperWishlistIdentityV2(productId, variantId);
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(identity)) next.delete(identity);
      else next.add(identity);
      return next;
    });
  };
  const toggleCompare = (productId: string) => {
    if (!capabilities.compare || !productById(productId)) return;
    setCompare((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else if (next.size < 4) next.add(productId);
      return next;
    });
  };
  const addSelectionToCart = (selection: ShopperSelectionV2) => {
    if (!capabilities.cart || !isReferenceShopperSelectionPurchasableV2(selection)) {
      setStatusMessage(selectionBlockedReason(selection) ?? "Selection unavailable.");
      return;
    }
    const money = selectionMoney(selection);
    if (!money) return;
    const repeatKey = `${selection.product.productId}::${selection.purchaseOption?.purchaseOptionId ?? "standard"}`;
    const selectedRepeatDays =
      capabilities.repeatPurchase &&
      selection.purchaseOption?.repeatPurchase.state === "ELIGIBLE"
        ? repeatDays[repeatKey] ?? null
        : null;
    const identity = [
      selection.product.productId,
      selection.variant?.variantId ?? "default",
      selection.purchaseOption?.purchaseOptionId ?? "standard",
      selectedRepeatDays ?? "one-time",
    ].join("::");
    setCart((current) => {
      const existing = current.find((item) => item.identity === identity);
      if (existing) {
        return current.map((item) =>
          item.identity === identity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...current,
        {
          identity,
          productId: selection.product.productId,
          variantId: selection.variant?.variantId ?? null,
          purchaseOptionId:
            selection.purchaseOption?.purchaseOptionId ?? null,
          repeatDays: selectedRepeatDays,
          quantity: 1,
          unitPriceMinor: money.amountMinor,
          currency: money.currency,
        },
      ];
    });
    setStatusMessage(`${selection.product.title} added to the preview cart.`);
  };
  const quickAdd = (productId: string) => {
    const product = productById(productId);
    if (product) addSelectionToCart(selectionFor(product));
  };
  const setSelectedVariant = (
    product: StorefrontProductV2,
    variantId: string
  ) => {
    if (!capabilities.variants) return;
    const variant = product.variants.find(
      (candidate) => candidate.variantId === variantId
    );
    if (
      !variant ||
      !isImmediatelyAvailable(variant.availability) ||
      variant.price?.state === "UNKNOWN"
    ) {
      return;
    }
    setSelectedVariantIds((current) => ({
      ...current,
      [product.productId]: variantId,
    }));
    setSelectedPurchaseOptionIds((current) => {
      const next = { ...current };
      delete next[product.productId];
      return next;
    });
    setSelectedGalleryMediaIds((current) =>
      resetReferenceShopperGallerySelectionV2(current, product.productId)
    );
  };
  const toggleFilter = (key: string, value: string) => {
    setFilters((current) => {
      const currentValues = current[key] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value];
      const next = { ...current };
      if (nextValues.length > 0) next[key] = nextValues;
      else delete next[key];
      return next;
    });
    setResultPage(1);
  };
  const toggleAvailabilityFilter = (value: MerchandisingAvailabilityV2) => {
    setAvailabilityFilters((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
    setResultPage(1);
  };
  const toggleBrandFilter = (value: string) => {
    setBrandFilters((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
    setResultPage(1);
  };
  const clearDiscovery = () => {
    setQuery("");
    setCategoryId(null);
    setFilters({});
    setAvailabilityFilters([]);
    setBrandFilters([]);
    setPriceRangeKey(null);
    setResultPage(1);
  };
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeProduct = productById(activeProductId) ?? catalog.products[0];

  const slots: ProtectedStorefrontRenderSlotsV2 = {
    commerce: {
      cart: capabilities.cart ? (
        <button type="button" onClick={() => navigate("cart")} className={secondaryControlClass}>
          Cart ({cartCount})
        </button>
      ) : null,
      cartPage: null,
      checkoutPage: null,
      productCard: (product) => (
        <ProductCard
          product={product}
          selectedVariantId={selectedVariantFor(product)?.variantId ?? null}
          resolveMedia={resolveMedia}
          contentProposal={contentProposal}
          capabilities={capabilities}
          wishlist={wishlist}
          compare={compare}
          onOpen={() => openProduct(product.productId)}
          onToggleWishlist={() => toggleWishlist(product.productId)}
          onToggleCompare={() => toggleCompare(product.productId)}
          onQuickAdd={() => quickAdd(product.productId)}
        />
      ),
      productGallery: (product) => {
        const galleryBlock = effectiveManifest.pages.pdp.blocks.find(
          (block) => block.type === "product-gallery"
        );
        return (
          <ReferenceProductGalleryV2
            product={product}
            variantId={selectedVariantFor(product)?.variantId ?? null}
            resolveMedia={resolveMedia}
            selectedMediaId={selectedGalleryMediaIds[product.productId]}
            showThumbnails={galleryBlock?.showThumbnails ?? false}
            layout={galleryBlock?.layout ?? "carousel"}
            onSelectMedia={(mediaId) =>
              setSelectedGalleryMediaIds((current) => ({
                ...current,
                [product.productId]: mediaId,
              }))
            }
          />
        );
      },
      purchasePanel: (product) => {
        const selection = selectionFor(product);
        const variant = selection.variant;
        const options = capabilities.purchaseOptions
          ? compatiblePurchaseOptions(product, variant?.variantId ?? null)
          : [];
        const option = selection.purchaseOption;
        const money = selectionMoney(selection);
        const blockedReason = selectionBlockedReason(selection);
        const repeatKey = `${product.productId}::${option?.purchaseOptionId ?? "standard"}`;
        const selectedRepeat = repeatDays[repeatKey] ?? null;
        return (
          <div className="min-w-0 rounded-[var(--storefront-radius,0.75rem)] border border-[color:var(--storefront-color-border,#cbd5e1)] bg-[color:var(--storefront-color-surface,#fff)] p-5 text-[color:var(--storefront-color-text,#0f172a)] shadow-[var(--storefront-shadow,0_1px_3px_rgb(15_23_42_/_0.12))]">
            <p className="text-2xl font-extrabold">
              {money
                ? formatMoneyValue(money.amountMinor, money.currency)
                : "Price not stated"}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {formatAvailability(variant?.availability ?? product.availability)}
            </p>
            {capabilities.variants && product.variants.length > 0 ? (
              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold">Choose variant</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {product.variants.map((candidate) => {
                    const available =
                      isImmediatelyAvailable(candidate.availability) &&
                      candidate.price?.state !== "UNKNOWN";
                    return (
                      <label
                        key={candidate.variantId}
                        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                          available
                            ? "cursor-pointer border-[color:var(--storefront-color-border,#cbd5e1)] hover:brightness-95"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`variant-${product.productId}`}
                          checked={variant?.variantId === candidate.variantId}
                          disabled={!available}
                          onChange={() => setSelectedVariant(product, candidate.variantId)}
                          className="h-5 w-5 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block break-words font-bold">{candidate.label}</span>
                          <span className="block text-xs">
                            {formatAvailability(candidate.availability)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            {capabilities.purchaseOptions && options.length > 0 ? (
              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold">Purchase option</legend>
                <div className="mt-2 grid gap-2">
                  {options.map((candidate) => {
                    const available =
                      candidate.kind !== "UNKNOWN" &&
                      candidate.price.state === "KNOWN" &&
                      isImmediatelyAvailable(candidate.availability);
                    return (
                      <label
                        key={candidate.purchaseOptionId}
                        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                          available
                            ? "cursor-pointer border-[color:var(--storefront-color-border,#cbd5e1)] hover:brightness-95"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`option-${product.productId}`}
                          checked={option?.purchaseOptionId === candidate.purchaseOptionId}
                          disabled={!available}
                          onChange={() =>
                            setSelectedPurchaseOptionIds((current) => ({
                              ...current,
                              [product.productId]: candidate.purchaseOptionId,
                            }))
                          }
                          className="h-5 w-5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words font-bold">{candidate.label}</span>
                          <span className="block text-xs text-slate-500">
                            {candidate.price.state === "KNOWN"
                              ? formatMoneyValue(
                                  candidate.price.money.amountMinor,
                                  candidate.price.money.currency
                                )
                              : "Price not stated"}
                            {` · ${formatAvailability(candidate.availability)}`}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            {capabilities.repeatPurchase &&
            option?.repeatPurchase.state === "ELIGIBLE" ? (
              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold">Delivery schedule</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[null, ...option.repeatPurchase.intervalDays].map((days) => (
                    <label
                      key={days ?? "one-time"}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--storefront-color-border,#cbd5e1)] px-3 py-2 text-sm hover:brightness-95"
                    >
                      <input
                        type="radio"
                        name={`repeat-${repeatKey}`}
                        checked={selectedRepeat === days}
                        onChange={() =>
                          setRepeatDays((current) => ({
                            ...current,
                            [repeatKey]: days,
                          }))
                        }
                        className="h-5 w-5"
                      />
                      {days ? `Every ${days} days` : "One-time"}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {blockedReason ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                {blockedReason}
              </p>
            ) : null}
            {capabilities.cart ? (
              <button
                type="button"
                disabled={!isReferenceShopperSelectionPurchasableV2(selection)}
                onClick={() => addSelectionToCart(selection)}
                className={`${primaryControlClass} mt-5 w-full`}
              >
                Add to preview cart
              </button>
            ) : null}
          </div>
        );
      },
      filterBar: () => null,
      wishlistControl: (product, label) => {
        if (!capabilities.wishlist) return null;
        const variantId = selectedVariantFor(product)?.variantId ?? null;
        const identity = referenceShopperWishlistIdentityV2(
          product.productId,
          variantId
        );
        return (
          <button
            type="button"
            aria-pressed={wishlist.has(identity)}
            onClick={() => toggleWishlist(product.productId)}
            className={secondaryControlClass}
          >
            {wishlist.has(identity) ? "Remove from wishlist" : label}
          </button>
        );
      },
      newsletterSignup: ({ title, body, consentLabel }) => (
        <div>
          <h3 className="text-xl font-extrabold">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6">{body}</p>
          <p className="mt-3 text-xs">{consentLabel}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide">
            Signup is not enabled in this preview.
          </p>
        </div>
      ),
    },
    policy: {
      merchantIdentity: <p className="text-xs">Preview merchant identity</p>,
      links: <p className="text-xs">Preview policy links</p>,
      page: <p>Policy preview is not part of this shopper session.</p>,
    },
    content: {
      article: <p>Article preview is not part of this shopper session.</p>,
      faq: <p>FAQ preview is not part of this shopper session.</p>,
    },
  };

  let body: ReactNode;
  if (page === "home") {
    body = (
      <StoreExperienceRendererV2
        manifest={effectiveManifest}
        catalog={catalog}
        page={{ kind: "home" }}
        slots={slots}
        preview
      />
    );
  } else if (page === "plp" || page === "search") {
    body = (
      <CatalogResultsPage
        mode={page}
        manifest={effectiveManifest}
        catalog={catalog}
        merchandising={merchandising}
        capabilities={capabilities}
        query={query}
        categoryId={categoryId}
        filters={filters}
        availabilityFilters={availabilityFilters}
        brandFilters={brandFilters}
        priceRangeKey={priceRangeKey}
        sort={sort}
        page={resultPage}
        productState={(product) => selectedVariantFor(product)?.variantId ?? null}
        resolveMedia={resolveMedia}
        contentProposal={contentProposal}
        wishlist={wishlist}
        compare={compare}
        onQuery={(value) => {
          setQuery(value);
          setResultPage(1);
        }}
        onCategory={(value) => {
          setCategoryId(value);
          setResultPage(1);
        }}
        onFilter={toggleFilter}
        onAvailabilityFilter={toggleAvailabilityFilter}
        onBrandFilter={toggleBrandFilter}
        onPriceRange={(value) => {
          setPriceRangeKey(value);
          setResultPage(1);
        }}
        onSort={(value) => {
          setSort(value);
          setResultPage(1);
        }}
        onPage={setResultPage}
        onClear={clearDiscovery}
        onOpen={openProduct}
        onToggleWishlist={toggleWishlist}
        onToggleCompare={toggleCompare}
        onOpenCompare={() => navigate("compare")}
        onQuickAdd={quickAdd}
      />
    );
  } else if (page === "pdp" && activeProduct) {
    body = (
      <StoreExperienceRendererV2
        manifest={effectiveManifest}
        catalog={catalog}
        page={{ kind: "pdp", productRef: activeProduct.productId }}
        slots={slots}
        preview
      />
    );
  } else if (page === "compare" && capabilities.compare) {
    body = (
      <ComparePage
        manifest={effectiveManifest}
        catalog={catalog}
        merchandising={merchandising}
        compareIds={compare}
        resolveMedia={resolveMedia}
        onRemove={toggleCompare}
        onBrowse={() => navigate("plp")}
      />
    );
  } else if (page === "cart" && capabilities.cart) {
    body = (
      <CartPage
        manifest={effectiveManifest}
        catalog={catalog}
        items={cart}
        capabilities={capabilities}
        onQuantity={(identity, delta) =>
          setCart((current) =>
            current.flatMap((item) =>
              item.identity !== identity
                ? [item]
                : item.quantity + delta > 0
                  ? [{ ...item, quantity: item.quantity + delta }]
                  : []
            )
          )
        }
        onRemove={(identity) =>
          setCart((current) =>
            current.filter((item) => item.identity !== identity)
          )
        }
        onCheckout={() => navigate("checkout")}
      />
    );
  } else if (page === "checkout" && capabilities.checkoutPreview) {
    body = (
      <CheckoutPage
        manifest={effectiveManifest}
        items={cart}
        onCart={() => navigate("cart")}
      />
    );
  } else {
    body = (
      <StoreExperienceRendererV2
        manifest={effectiveManifest}
        catalog={catalog}
        page={{ kind: "home" }}
        slots={slots}
        preview
      />
    );
  }

  return (
    <section
      aria-label="Reference Shopper Preview V2"
      data-reference-shopper-preview="v2"
      data-reference-revision-key={revisionKey}
      data-active-shopper-page={page}
      data-session-persistence="memory-only"
      data-provider-requests="disabled"
      data-analytics="disabled"
      data-capability-search={capabilities.search ? "enabled" : "hidden"}
      data-capability-filters={capabilities.filters ? "enabled" : "hidden"}
      data-capability-variants={capabilities.variants ? "enabled" : "hidden"}
      data-capability-purchase-options={
        capabilities.purchaseOptions ? "enabled" : "hidden"
      }
      data-capability-repeat-purchase={
        capabilities.repeatPurchase ? "enabled" : "hidden"
      }
      data-capability-wishlist={capabilities.wishlist ? "enabled" : "hidden"}
      data-capability-compare={capabilities.compare ? "enabled" : "hidden"}
      data-capability-cart={capabilities.cart ? "enabled" : "hidden"}
      data-capability-checkout-preview={
        capabilities.checkoutPreview ? "enabled" : "hidden"
      }
      data-capability-quiz="hidden"
      data-capability-recommendations={
        capabilities.recommendations ? "enabled" : "hidden"
      }
      className="w-full min-w-0 max-w-full overflow-hidden bg-white"
    >
      <PreviewSessionNavigation
        page={page}
        capabilities={capabilities}
        cartCount={cartCount}
        compareCount={compare.size}
        wishlistCount={wishlist.size}
        onNavigate={navigate}
      />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
      <div
        ref={pageFocusTargetRef}
        tabIndex={-1}
        aria-label={`Preview page content: ${page}`}
        data-managed-focus-target="shopper-page-content"
        className="min-w-0 max-w-full overflow-x-clip outline-none focus:ring-4 focus:ring-inset focus:ring-sky-500"
      >
        {body}
      </div>
    </section>
  );
}

/**
 * An intentionally ephemeral shopper runtime. The keyed child guarantees that
 * a revision change drops search, filters, variants, wishlist, compare and cart
 * state without storage, network calls or analytics.
 */
export function ReferenceShopperPreviewV2({
  revisionKey,
  ...props
}: ReferenceShopperPreviewV2Props) {
  return (
    <ReferenceShopperPreviewSessionV2
      key={revisionKey}
      revisionKey={revisionKey}
      {...props}
    />
  );
}
