import Link from "next/link";
import type { HomepageCopy } from "@/lib/storefront/homepage-content";
import type { DiscoveryTheme } from "@/lib/stores/queries";
import { storefrontHref, type LinkStore } from "@/lib/stores/storefront-links";

/**
 * "Shop by theme" discovery rail built from real product `useCases` tags. Each
 * theme deep-links into the category that holds the most matching products with
 * the tag pre-applied, so results are never empty. Renders nothing when there
 * are no usable tags (categories already cover discovery).
 */
export function ShopByTheme({
  store,
  copy,
  themes,
}: {
  store: LinkStore;
  copy: HomepageCopy;
  themes: DiscoveryTheme[];
}) {
  if (themes.length === 0) return null;

  return (
    <section aria-labelledby="themes-heading">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Discover
        </p>
        <h2 id="themes-heading" className="font-heading text-3xl font-bold tracking-tight text-ink">
          {copy.themesTitle}
        </h2>
        <p className="text-sm text-ink/55">{copy.themesSubtitle}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {themes.map((theme) => (
          <Link
            key={`${theme.useCase}-${theme.categorySlug}`}
            href={storefrontHref(
              store,
              `/c/${theme.categorySlug}?useCase=${encodeURIComponent(theme.useCase)}`
            )}
            className="group inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {theme.label}
            <span aria-hidden="true" className="text-ink/30 transition-colors group-hover:text-primary">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
