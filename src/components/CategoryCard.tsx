import Link from "next/link";
import type { Category } from "@prisma/client";
import { categoryHref, type LinkStore } from "@/lib/stores/storefront-links";

export function CategoryCard({
  category,
  store,
  productCount,
  index = 0,
  imageUrl,
  imageAlt,
}: {
  category: Category;
  store: LinkStore;
  productCount: number;
  index?: number;
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  const hasImage = Boolean(imageUrl);

  return (
    <Link
      href={categoryHref(store, category.slug)}
      className={`storefront-category-card group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-theme-lg border border-ink/10 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg ${
        hasImage ? "bg-secondary p-0 text-white" : "bg-white p-6 text-ink"
      }`}
    >
      {hasImage ? (
        <>
          <img
            src={imageUrl ?? undefined}
            alt={imageAlt || ""}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/45 to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary-soft transition duration-500 group-hover:scale-125"
        />
      )}
      <div className={`relative ${hasImage ? "mt-auto p-6" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <span
            className={`font-heading text-sm font-extrabold ${
              hasImage ? "text-white/80" : "text-primary"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
              hasImage
                ? "border border-white/20 bg-black/20 text-white/80"
                : "border border-ink/10 bg-white/75 text-ink/60"
            }`}
          >
            {productCount} {productCount === 1 ? "item" : "items"}
          </span>
        </div>
        <h3
          className={`max-w-[18rem] font-heading text-2xl font-bold leading-tight transition ${
            hasImage ? "mt-20 text-white" : "mt-10 text-ink group-hover:text-primary"
          }`}
        >
          {category.name}
        </h3>
        <p
          className={`mt-3 line-clamp-3 max-w-sm text-sm leading-6 ${
            hasImage ? "text-white/75" : "text-ink/60"
          }`}
        >
          {category.description}
        </p>
        <p
          className={`mt-6 text-sm font-bold ${hasImage ? "text-white" : "text-primary"}`}
        >
          View category <span aria-hidden="true">→</span>
        </p>
      </div>
    </Link>
  );
}
