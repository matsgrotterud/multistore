"use client";

import { useCart } from "@/lib/cart/cart-context";
import { track } from "@/lib/analytics/track";
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
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const isAffiliate = product.fulfillmentMode === "AFFILIATE";

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
    cart.addItem({
      productId: product.id,
      slug: product.slug,
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
    });
  }

  return (
    <div className={fullWidth ? "w-full space-y-2" : "space-y-2"}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className={`btn-primary ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
        aria-label={
          outOfStock
            ? `${product.title} is out of stock`
            : `Add ${product.title} to cart`
        }
      >
        {outOfStock
          ? "Out of stock"
          : product.stockStatus === "PREORDER"
            ? "Pre-order"
            : "Add to cart"}
      </button>
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

/** Compact card CTA — affiliate products link out; others add to cart. */
export function ProductCardActions({
  product,
  storeSlug,
}: {
  product: ClientProduct;
  storeSlug: string;
}) {
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

  return <ProductPurchaseActions product={product} storeSlug={storeSlug} size="sm" fullWidth />;
}
