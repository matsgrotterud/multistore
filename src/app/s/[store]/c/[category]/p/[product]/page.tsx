import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductView } from "@/components/product/ProductView";
import { buildProductMetadata } from "@/lib/seo/metadata";
import {
  getProductBySlug,
  getRelatedProducts,
  requireStore,
} from "@/lib/stores/queries";
import { productHref } from "@/lib/stores/storefront-links";

interface ProductPageProps {
  params: Promise<{ store: string; category: string; product: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product) return {};
  return buildProductMetadata(store, product, product.category.slug);
}

export default async function CategoryProductPage({ params }: ProductPageProps) {
  const { store: storeSlug, category: categorySlug, product: productSlug } =
    await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product || !product.isPublished) notFound();

  // Keep a single canonical category path per product: if the category in the
  // URL is wrong, redirect to the product's real category (no duplicate URLs).
  if (product.category.slug !== categorySlug) {
    redirect(productHref(store, product.slug, product.category.slug));
  }

  const related = await getRelatedProducts(
    store.id,
    product.categoryId,
    product.id
  );

  return <ProductView store={store} product={product} related={related} />;
}
