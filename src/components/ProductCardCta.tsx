"use client";

import { ProductCardActions } from "@/components/ProductPurchaseActions";
import { useCart } from "@/lib/cart/cart-context";
import type { ClientProduct } from "@/lib/types";

export function ProductCardCta({ product }: { product: ClientProduct }) {
  const cart = useCart();
  return <ProductCardActions product={product} storeSlug={cart.storeSlug} />;
}
