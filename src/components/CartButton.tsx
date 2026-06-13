"use client";

import { useCart } from "@/lib/cart/cart-context";

/** Header cart trigger; opens the drawer and announces the item count. */
export function CartButton() {
  const cart = useCart();
  return (
    <button
      type="button"
      onClick={cart.openDrawer}
      className="relative rounded-theme p-2 text-ink/70 transition hover:bg-primary-soft hover:text-primary"
      aria-label={`Open cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h2l2.5 12.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20.5" r="1.2" />
        <circle cx="17" cy="20.5" r="1.2" />
      </svg>
      {cart.isHydrated && cart.itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white"
        >
          {cart.itemCount}
        </span>
      )}
    </button>
  );
}
