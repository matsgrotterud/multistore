import type { Store } from "@prisma/client";

/** Store-record facts only: no invented tracking, service or delivery claims. */
export function TrustBar({ store }: { store: Store }) {
  const items = [
    {
      label: "Delivery estimate",
      value: `${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} days`,
      detail: "See each item for its estimate",
    },
    {
      label: "Returns overview",
      value: "Policy available",
      detail: store.returnPolicySummary.split(".")[0] || "See the returns policy",
    },
    {
      label: "Support contact",
      value: "Email support",
      detail: store.supportEmail,
    },
    {
      label: "Fulfillment",
      value: "Origin disclosed",
      detail: store.shippingOriginDisclosure,
    },
  ];

  return (
    <section
      aria-label="Store information"
      className="border-y border-ink/10 bg-white/95"
    >
      <div className="mx-auto grid max-w-site grid-cols-2 divide-x divide-y divide-ink/10 px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-5 first:pl-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink/50">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
            <p className="mt-0.5 truncate text-xs text-ink/60" title={item.detail}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
