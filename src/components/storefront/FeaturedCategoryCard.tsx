import Link from "next/link";
import { categoryHref, type LinkStore } from "@/lib/stores/storefront-links";

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  imageUrl: string | null;
  imageAlt: string | null;
}

/**
 * Editorial, image-led category tile. Uses the top product image as a cover and
 * keeps a clean text caption below it. Falls back gracefully when no image.
 */
export function FeaturedCategoryCard({
  category,
  store,
}: {
  category: FeaturedCategory;
  store: LinkStore;
}) {
  return (
    <Link
      href={categoryHref(store, category.slug)}
      className="group flex flex-col overflow-hidden rounded-theme-lg border border-ink/10 bg-white transition-shadow duration-300 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.22)]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-surface">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.imageAlt || category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-heading text-lg text-ink/30">
            {category.name}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-ink">
            {category.name}
          </h3>
          <span className="shrink-0 text-xs text-ink/40">
            {category.productCount} {category.productCount === 1 ? "item" : "items"}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-ink/55">{category.description}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Shop {category.name}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}
