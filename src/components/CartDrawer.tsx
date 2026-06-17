"use client";

import Link from "next/link";
import { useEffect } from "react";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import { productRelPath } from "@/lib/stores/storefront-links";

export function CartDrawer({ locale }: { locale: string }) {
  const cart = useCart();

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    if (!cart.isDrawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") cart.closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart, cart.isDrawerOpen]);

  if (!cart.isDrawerOpen) return null;

  const shipping = estimateShippingCost(cart.subtotal);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={cart.closeDrawer}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">
            Your cart ({cart.itemCount})
          </h2>
          <button
            type="button"
            onClick={cart.closeDrawer}
            className="rounded-full p-2 text-ink/60 hover:bg-ink/5 hover:text-ink"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-base font-medium text-ink">Your cart is empty</p>
            <p className="text-sm text-ink/60">
              Browse the catalog or take the product quiz to find a good fit.
            </p>
            <Link href={cart.href("/quiz")} className="btn-secondary" onClick={cart.closeDrawer}>
              Take the quiz
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {cart.items.map((item) => (
                <li key={item.lineId} className="flex gap-4 py-4">
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    className="h-16 w-16 shrink-0 rounded-theme object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={cart.href(productRelPath(item.slug, item.categorySlug))}
                      onClick={cart.closeDrawer}
                      className="block truncate text-sm font-medium text-ink hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    {item.optionSummary && (
                      <p className="mt-0.5 text-xs font-medium text-ink/70">
                        {item.optionSummary}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-ink/60">
                      {item.shippingDaysMin}–{item.shippingDaysMax} business days
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-theme border border-ink/15">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-ink/5"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => cart.updateQuantity(item.lineId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-sm" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-ink/5"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(item.price * item.quantity, cart.currency, locale)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.lineId)}
                    className="self-start text-xs text-ink/50 underline hover:text-red-600"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/70">Subtotal</dt>
                  <dd className="font-semibold">
                    {formatCurrency(cart.subtotal, cart.currency, locale)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/70">Shipping estimate</dt>
                  <dd className="font-semibold">
                    {shipping === 0
                      ? "Free"
                      : formatCurrency(shipping, cart.currency, locale)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Link href={cart.href("/checkout")} className="btn-primary" onClick={cart.closeDrawer}>
                  Go to checkout
                </Link>
                <Link href={cart.href("/cart")} className="btn-secondary" onClick={cart.closeDrawer}>
                  View cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
