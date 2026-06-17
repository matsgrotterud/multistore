import Link from "next/link";
import type { Store } from "@prisma/client";
import { storefrontHref } from "@/lib/stores/storefront-links";

/**
 * Dropshipping transparency block shown near buying decisions: who fulfills,
 * realistic delivery, how returns work, and how to reach support. Required
 * on product pages and the homepage by the platform's compliance rules.
 */
export function PolicyDisclosure({ store }: { store: Store }) {
  return (
    <aside
      aria-label="Shipping and returns disclosure"
      className="rounded-theme-lg border border-ink/10 bg-primary-soft p-5 text-sm leading-6 text-ink/80"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
        Shipping &amp; returns, honestly
      </h3>
      <p className="mt-2">{store.shippingOriginDisclosure}</p>
      <p className="mt-2">
        Typical delivery: {store.defaultShippingDaysMin}–{store.defaultShippingDaysMax}{" "}
        business days. {store.returnPolicySummary}
      </p>
      <p className="mt-2 text-xs text-ink/60">
        Depending on your country, import taxes or duties may apply and are
        not included unless stated at checkout.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
        <Link className="text-primary underline" href={storefrontHref(store, "/policies/shipping")}>
          Shipping policy
        </Link>
        <Link className="text-primary underline" href={storefrontHref(store, "/policies/returns")}>
          Returns policy
        </Link>
        <a className="text-primary underline" href={`mailto:${store.supportEmail}`}>
          {store.supportEmail}
        </a>
      </p>
    </aside>
  );
}
