"use client";

import Link from "next/link";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import { productRelPath } from "@/lib/stores/storefront-links";

export function CartPageContent({
  locale,
  shippingNote,
}: {
  locale: string;
  shippingNote: string;
}) {
  const cart = useCart();

  if (!cart.isHydrated) {
    return (
      <div className="card animate-pulse space-y-4 p-6" aria-busy="true" aria-label="Loading cart">
        <div className="h-16 rounded-theme bg-ink/10" />
        <div className="h-16 rounded-theme bg-ink/10" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-lg font-semibold text-ink">Your cart is empty</p>
        <p className="max-w-sm text-sm text-ink/60">
          Not sure where to start? The quiz matches products to how you will
          actually use them.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href={cart.href("/")} className="btn-primary">
            Browse products
          </Link>
          <Link href={cart.href("/quiz")} className="btn-secondary">
            Take the quiz
          </Link>
        </div>
      </div>
    );
  }

  const shipping = estimateShippingCost(cart.subtotal);
  const maxDays = Math.max(...cart.items.map((item) => item.shippingDaysMax));
  const minDays = Math.max(...cart.items.map((item) => item.shippingDaysMin));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="card divide-y divide-ink/10">
        {cart.items.map((item) => (
          <li key={item.lineId} className="flex gap-4 p-5">
            <img
              src={item.imageUrl}
              alt={item.imageAlt}
              className="h-20 w-20 shrink-0 rounded-theme object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={cart.href(productRelPath(item.slug, item.categorySlug))}
                className="text-sm font-semibold text-ink hover:text-primary"
              >
                {item.title}
              </Link>
              {item.optionSummary && (
                <p className="mt-1 text-xs font-medium text-ink/70">{item.optionSummary}</p>
              )}
              <p className="mt-1 text-xs text-ink/60">
                Delivery in {item.shippingDaysMin}–{item.shippingDaysMax} business days
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center rounded-theme border border-ink/15">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm hover:bg-ink/5"
                    aria-label={`Decrease quantity of ${item.title}`}
                    onClick={() => cart.updateQuantity(item.lineId, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm hover:bg-ink/5"
                    aria-label={`Increase quantity of ${item.title}`}
                    onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-ink/50 underline hover:text-red-600"
                  onClick={() => cart.removeItem(item.lineId)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-ink">
              {formatCurrency(item.price * item.quantity, cart.currency, locale)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6" aria-label="Order summary">
        <h2 className="text-lg font-bold text-ink">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd className="font-semibold">
              {formatCurrency(cart.subtotal, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Shipping</dt>
            <dd className="font-semibold">
              {shipping === 0 ? "Free" : formatCurrency(shipping, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
            <dt className="font-bold text-ink">Total</dt>
            <dd className="font-bold text-ink">
              {formatCurrency(cart.subtotal + shipping, cart.currency, locale)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-ink/60">
          Estimated delivery: {minDays}–{maxDays} business days. {shippingNote}
        </p>
        <Link href={cart.href("/checkout")} className="btn-primary mt-5 w-full">
          Go to checkout
        </Link>
      </aside>
    </div>
  );
}
