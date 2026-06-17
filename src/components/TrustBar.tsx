import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";
import { buildValueStrip } from "@/lib/storefront/homepage-content";

/**
 * Minimal, hairline trust/value strip. Content is derived from the store record
 * (curation, shipping window, returns, support) so it never drifts from the
 * policy pages and never fabricates social proof.
 */
export function TrustBar({ store }: { store: StoreWithTheme }) {
  const items = buildValueStrip(store);

  return (
    <section aria-label="What to expect" className="border-y border-ink/10 bg-white">
      <div className="mx-auto grid max-w-site grid-cols-2 divide-ink/10 px-4 py-7 sm:grid-cols-4 sm:divide-x sm:px-6">
        {items.map((item) => (
          <div key={item.title} className="px-2 text-center sm:px-6">
            <p className="text-[13px] font-semibold tracking-tight text-ink">{item.title}</p>
            <p className="mt-1 truncate text-xs text-ink/50">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
