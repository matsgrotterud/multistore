import type { Store } from "@prisma/client";

/**
 * Store-wide trust strip: real shipping window, returns summary and support
 * contact. Content comes straight from the store record so it can never
 * drift from the policies pages.
 */
export function TrustBar({ store }: { store: Store }) {
  const items = [
    {
      title: `${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} day delivery`,
      detail: "Realistic windows, tracked shipping",
    },
    {
      title: "Clear returns",
      detail: store.returnPolicySummary.split(".")[0],
    },
    {
      title: "Human support",
      detail: store.supportEmail,
    },
    {
      title: "Transparent fulfillment",
      detail: "We tell you exactly where orders ship from",
    },
  ];

  return (
    <section
      aria-label="Why shop with us"
      className="border-y border-ink/10 bg-white"
    >
      <div className="mx-auto grid max-w-site grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4 sm:px-6">
        {items.map((item) => (
          <div key={item.title} className="text-center sm:text-left">
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-0.5 truncate text-xs text-ink/60">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
