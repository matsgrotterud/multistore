"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { track } from "@/lib/analytics/track";
import { productRelPath } from "@/lib/stores/storefront-links";
import type { ClientProduct } from "@/lib/types";

export function ProductPurchaseActions({
  product,
  storeSlug,
  size = "md",
  fullWidth = false,
}: {
  product: ClientProduct;
  storeSlug: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const cart = useCart();
  const variants = product.variants ?? [];
  const initialVariantId = variants.length === 1 ? variants[0]?.id : "";
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId ?? "");
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedImageUrl = selectedVariant?.imageUrl ?? product.imageUrl;
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const variantRequired = variants.length > 0;
  const selectedVariantOutOfStock = selectedVariant?.stockStatus === "OUT_OF_STOCK";
  const canAdd =
    cart.isHydrated &&
    !outOfStock &&
    product.checkoutAvailable &&
    (!variantRequired || Boolean(selectedVariant)) &&
    !selectedVariantOutOfStock;
  const isAffiliate = product.fulfillmentMode === "AFFILIATE";

  const formattedSelectedPrice = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: product.currency,
      }).format(selectedPrice),
    [product.currency, selectedPrice]
  );

  if (isAffiliate) {
    if (!product.affiliateUrl) {
      return (
        <p className="text-sm text-ink/60">
          External purchase link pending supplier sync.
        </p>
      );
    }

    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`btn-primary inline-flex items-center justify-center ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
        onClick={() =>
          track(storeSlug, "affiliate_click", {
            productId: product.id,
            slug: product.slug,
            providerKey: product.providerKey,
          })
        }
      >
        View deal
      </a>
    );
  }

  if (!product.checkoutAvailable) {
    return (
      <p className="text-sm text-ink/60">
        This item is not sold through checkout. Contact support for availability.
      </p>
    );
  }

  function handleAdd() {
    if (!canAdd) return;
    cart.addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      slug: product.slug,
      categorySlug: product.categorySlug,
      title: product.title,
      variantTitle: selectedVariant?.title,
      optionSummary: selectedVariant?.optionSummary,
      sku: selectedVariant?.sku,
      externalVariantId: selectedVariant?.externalVariantId,
      price: selectedPrice,
      currency: product.currency,
      imageUrl: selectedImageUrl,
      imageAlt: product.imageAlt,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
    }, quantity);
    track(storeSlug, "add_to_cart", {
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariant?.id,
      optionSummary: selectedVariant?.optionSummary,
      price: selectedPrice,
      quantity,
    });
  }

  return (
    <div className={fullWidth ? "w-full space-y-3" : "space-y-3"}>
      {variants.length > 0 && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Options</span>
          <select
            className="input"
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            aria-label={`Choose options for ${product.title}`}
            required
          >
            {variants.length > 1 && <option value="">Select an option</option>}
            {variants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
                disabled={variant.stockStatus === "OUT_OF_STOCK"}
              >
                {variant.optionSummary}
                {variant.price != null ? ` - ${formatVariantPrice(variant.price, product.currency)}` : ""}
                {variant.stockStatus === "OUT_OF_STOCK" ? " - Out of stock" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Qty</span>
          <div className="flex h-11 items-center rounded-theme border border-ink/15 bg-white">
            <button
              type="button"
              className="h-full px-3 text-sm hover:bg-ink/5"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label={`Decrease quantity of ${product.title}`}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setQuantity(Number.isFinite(next) ? Math.max(1, Math.min(next, 99)) : 1);
              }}
              className="h-full w-12 border-x border-ink/10 text-center text-sm outline-none"
              aria-label={`Quantity for ${product.title}`}
            />
            <button
              type="button"
              className="h-full px-3 text-sm hover:bg-ink/5"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              aria-label={`Increase quantity of ${product.title}`}
            >
              +
            </button>
          </div>
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={`btn-primary flex-1 ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
          aria-label={
            outOfStock
              ? `${product.title} is out of stock`
              : variantRequired && !selectedVariant
                ? `Select options for ${product.title}`
                : `Add ${product.title} to cart`
          }
        >
          {outOfStock || selectedVariantOutOfStock
            ? "Out of stock"
            : !cart.isHydrated
              ? "Loading cart"
            : product.stockStatus === "PREORDER"
              ? "Pre-order"
              : variantRequired && !selectedVariant
                ? "Select option"
                : "Add to cart"}
        </button>
      </div>

      {selectedVariant && (
        <p className="text-xs text-ink/60">
          Selected: {selectedVariant.optionSummary} · {formattedSelectedPrice}
        </p>
      )}
      {!selectedVariant && variantRequired && (
        <p className="text-xs text-ink/60">Choose an available option before adding to cart.</p>
      )}
      <p className="text-xs text-ink/60">Secure checkout via Stripe.</p>
      {product.countryOfOrigin && (
        <p className="text-xs text-ink/50">
          Ships from partner supplier
          {product.countryOfOrigin ? ` (${product.countryOfOrigin})` : ""}. Typical delivery{" "}
          {product.shippingDaysMin}–{product.shippingDaysMax} business days.
        </p>
      )}
    </div>
  );
}

function formatVariantPrice(price: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
}

/** Compact card CTA — affiliate products link out; others add to cart. */
export function ProductCardActions({
  product,
  storeSlug,
}: {
  product: ClientProduct;
  storeSlug: string;
}) {
  const cart = useCart();

  if (product.fulfillmentMode === "AFFILIATE" && product.affiliateUrl) {
    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="btn-primary w-full px-4 py-2 text-xs"
      >
        View deal
      </a>
    );
  }

  if (!product.checkoutAvailable) {
    return <p className="text-xs text-ink/60">Contact support for availability.</p>;
  }

  if (product.variants.length > 0) {
    return (
      <Link
        href={cart.href(productRelPath(product.slug, product.categorySlug))}
        className="btn-primary w-full px-4 py-2 text-xs"
      >
        Choose options
      </Link>
    );
  }

  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  return (
    <button
      type="button"
      className="btn-primary w-full px-4 py-2 text-xs"
      disabled={outOfStock || !cart.isHydrated}
      onClick={() => {
        if (!cart.isHydrated) return;
        cart.addItem({
          productId: product.id,
          slug: product.slug,
          categorySlug: product.categorySlug,
          title: product.title,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          shippingDaysMin: product.shippingDaysMin,
          shippingDaysMax: product.shippingDaysMax,
        });
        track(storeSlug, "add_to_cart", {
          productId: product.id,
          slug: product.slug,
          price: product.price,
          quantity: 1,
        });
      }}
    >
      {outOfStock ? "Out of stock" : cart.isHydrated ? "Add to cart" : "Loading cart"}
    </button>
  );
}
