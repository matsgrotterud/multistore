"use client";

import { useCart } from "@/lib/cart/cart-context";
import { track } from "@/lib/analytics/track";
import type { ClientProduct } from "@/lib/types";

export function AddToCartButton({
  product,
  size = "md",
  fullWidth = false,
}: {
  product: ClientProduct;
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const cart = useCart();
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

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
    track(cart.storeSlug, "add_to_cart", {
      productId: product.id,
      slug: product.slug,
      price: product.price,
    });
  }

  return (
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
  );
}
