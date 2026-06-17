import { notFound, redirect } from "next/navigation";
import { getProductBySlug, requireStore } from "@/lib/stores/queries";
import { productHref } from "@/lib/stores/storefront-links";

interface LegacyProductPageProps {
  params: Promise<{ store: string; product: string }>;
}

/**
 * Legacy product URL `/s/[store]/p/[product]` (and the clean `/p/[product]` it
 * is rewritten from). Kept working for backwards compatibility, but redirected
 * to the canonical category-aware URL so there is only ever one indexable URL
 * per product. `productHref` keeps the `/s/[store]` prefix for preview stores
 * and emits a clean path for live stores.
 */
export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product || !product.isPublished) notFound();

  redirect(productHref(store, product.slug, product.category.slug));
}
