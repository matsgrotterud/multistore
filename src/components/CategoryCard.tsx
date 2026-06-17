import Link from "next/link";
import type { Category } from "@prisma/client";
import { categoryHref, type LinkStore } from "@/lib/stores/storefront-links";

export function CategoryCard({
  category,
  store,
  productCount,
}: {
  category: Category;
  store: LinkStore;
  productCount: number;
}) {
  return (
    <Link
      href={categoryHref(store, category.slug)}
      className="card group flex flex-col justify-between gap-4 p-6 transition hover:border-primary"
    >
      <div>
        <h3 className="text-lg font-bold text-ink group-hover:text-primary">
          {category.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
          {category.description}
        </p>
      </div>
      <p className="text-sm font-medium text-primary">
        {productCount} {productCount === 1 ? "product" : "products"} →
      </p>
    </Link>
  );
}
