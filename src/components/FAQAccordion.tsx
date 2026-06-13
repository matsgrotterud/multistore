import type { FaqItem } from "@/lib/types";

/**
 * Accessible FAQ using native <details>/<summary> — keyboard and screen
 * reader friendly without any JavaScript. Pages that render this can safely
 * emit FAQPage JSON-LD for the same items.
 */
export function FAQAccordion({
  items,
  title = "Frequently asked questions",
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-ink/10 rounded-theme-lg border border-ink/10 bg-white">
        {items.map((item, index) => (
          <details key={index} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="text-xl text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink/75">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
