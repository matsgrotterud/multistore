import { ProductCard } from "@/components/ProductCard";
import type { CatalogProduct } from "@/lib/stores/queries";
import type { LinkStore } from "@/lib/stores/storefront-links";

export function ProductGrid({
  products,
  store,
  locale = "en-US",
  emptyMessage = "No products match your filters yet. Try widening them.",
}: {
  products: CatalogProduct[];
  store: LinkStore;
  locale?: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-base font-medium text-ink">Nothing here yet</p>
        <p className="max-w-sm text-sm text-ink/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} store={store} locale={locale} />
      ))}
    </div>
  );
}
