"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { placeOrder, type CheckoutResult } from "@/lib/actions/checkout";
import { track } from "@/lib/analytics/track";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";

interface FormState {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  addressLine1: "",
  city: "",
  postalCode: "",
  country: "",
};

export function CheckoutForm({
  storeSlug,
  locale,
}: {
  storeSlug: string;
  locale: string;
}) {
  const cart = useCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cart.isHydrated && cart.items.length > 0) {
      track(storeSlug, "begin_checkout", {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
      });
    }
    // Fire once on mount after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.isHydrated]);

  function setField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await placeOrder({
        storeSlug,
        ...form,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      setResult(response);
      if (response.ok) {
        track(storeSlug, "checkout_success", {
          orderRef: response.orderRef,
          total: response.total,
        });
        cart.clearCart();
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700"
        >
          ✓
        </span>
        <h2 className="text-2xl font-bold text-ink">Thank you for your order!</h2>
        <p className="text-sm text-ink/70">
          Order reference: <strong>{result.orderRef}</strong>
        </p>
        {result.total !== undefined && result.currency && (
          <p className="text-sm text-ink/70">
            Total: {formatCurrency(result.total, result.currency, locale)}
          </p>
        )}
        <p className="max-w-md text-sm leading-6 text-ink/60">
          A confirmation with tracking details follows by email once the
          supplier hands your parcel to the carrier.
        </p>
        <Link href="/" className="btn-primary mt-3">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!cart.isHydrated) {
    return (
      <div className="card h-48 animate-pulse p-6" aria-busy="true" aria-label="Loading checkout" />
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-lg font-semibold text-ink">Your cart is empty</p>
        <Link href="/" className="btn-primary mt-2">
          Browse products
        </Link>
      </div>
    );
  }

  const shipping = estimateShippingCost(cart.subtotal);
  const fields: Array<{
    key: keyof FormState;
    label: string;
    autoComplete: string;
    type?: string;
  }> = [
    { key: "name", label: "Full name", autoComplete: "name" },
    { key: "email", label: "Email address", autoComplete: "email", type: "email" },
    { key: "addressLine1", label: "Street address", autoComplete: "address-line1" },
    { key: "city", label: "City", autoComplete: "address-level2" },
    { key: "postalCode", label: "Postal code", autoComplete: "postal-code" },
    { key: "country", label: "Country", autoComplete: "country-name" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
        <h2 className="text-lg font-bold text-ink">Delivery details</h2>
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`checkout-${field.key}`} className="label">
              {field.label}
            </label>
            <input
              id={`checkout-${field.key}`}
              type={field.type ?? "text"}
              required
              className="input"
              autoComplete={field.autoComplete}
              value={form[field.key]}
              onChange={(event) => setField(field.key, event.target.value)}
              aria-invalid={Boolean(result?.fieldErrors?.[field.key])}
              aria-describedby={
                result?.fieldErrors?.[field.key]
                  ? `checkout-${field.key}-error`
                  : undefined
              }
            />
            {result?.fieldErrors?.[field.key] && (
              <p
                id={`checkout-${field.key}-error`}
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {result.fieldErrors[field.key]}
              </p>
            )}
          </div>
        ))}

        {result && !result.ok && !result.fieldErrors && (
          <p role="alert" className="rounded-theme bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.message}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={isPending}>
          {isPending ? "Placing order…" : "Place order"}
        </button>
        <p className="text-xs leading-5 text-ink/50">
          By placing the order you accept the{" "}
          <Link href="/policies/terms" className="underline">
            terms of sale
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </form>

      <aside className="card h-fit p-6" aria-label="Order summary">
        <h2 className="text-lg font-bold text-ink">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 text-sm">
              <img
                src={item.imageUrl}
                alt={item.imageAlt}
                className="h-12 w-12 shrink-0 rounded-theme object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-ink/80">
                {item.quantity} × {item.title}
              </span>
              <span className="font-semibold">
                {formatCurrency(item.price * item.quantity, cart.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
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
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">
              {formatCurrency(cart.subtotal + shipping, cart.currency, locale)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
