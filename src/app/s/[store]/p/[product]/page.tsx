import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { PriceBlock } from "@/components/PriceBlock";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductGrid";
import { RatingDisplay } from "@/components/RatingDisplay";
import { ShippingEstimate } from "@/components/ShippingEstimate";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, faqPageJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { buildProductMetadata } from "@/lib/seo/metadata";
import {
  getProductBySlug,
  getRelatedProducts,
  requireStore,
  toClientProduct,
} from "@/lib/stores/queries";
import { parseFaq, parseSpecs, parseStringArray } from "@/lib/utils/json";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

interface ProductPageProps {
  params: Promise<{ store: string; product: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product) return {};
  return buildProductMetadata(store, product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product || !product.isPublished) notFound();

  const related = await getRelatedProducts(
    store.id,
    product.categoryId,
    product.id
  );

  const pros = parseStringArray(product.pros);
  const cons = parseStringArray(product.cons);
  const specs = parseSpecs(product.specs);
  const useCases = parseStringArray(product.useCases);
  const faq = parseFaq(product.faq);
  const clientProduct = toClientProduct(product);
  const stockLabel = isStockStatus(product.stockStatus)
    ? STOCK_STATUS_LABELS[product.stockStatus]
    : product.stockStatus;

  return (
    <div className="mx-auto max-w-site px-4 py-8 pb-24 sm:px-6 md:pb-8">
      <PageViewTracker
        storeSlug={store.slug}
        extraEvent="product_view"
        extraPayload={{ productId: product.id, slug: product.slug }}
      />
      <StructuredData
        data={[
          productJsonLd(store, product),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: product.category.name, path: `/c/${product.category.slug}` },
            { name: product.title, path: `/p/${product.slug}` },
          ]),
          faqPageJsonLd(faq),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: product.category.name, href: `/c/${product.category.slug}` },
          { name: product.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={
            product.images.length > 0
              ? product.images.map((image) => image.url)
              : [product.imageUrl]
          }
          alt={product.imageAlt}
        />

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-ink/50">
            {product.brand}
          </p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-ink">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-2 text-base text-ink/70">{product.subtitle}</p>
          )}

          <div className="mt-4">
            <RatingDisplay
              ratingAverage={product.ratingAverage}
              ratingCount={product.ratingCount}
              showEmptyState
            />
          </div>

          <div className="mt-5">
            <PriceBlock
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              currency={product.currency}
              locale={store.locale}
              size="lg"
            />
          </div>

          <dl className="mt-5 space-y-2 text-sm text-ink/80">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Availability</dt>
              <dd
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  product.stockStatus === "IN_STOCK"
                    ? "bg-emerald-100 text-emerald-900"
                    : product.stockStatus === "OUT_OF_STOCK"
                      ? "bg-red-100 text-red-900"
                      : "bg-amber-100 text-amber-900"
                }`}
              >
                {stockLabel}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Shipping estimate</dt>
              <dd>
                <ShippingEstimate
                  daysMin={product.shippingDaysMin}
                  daysMax={product.shippingDaysMax}
                  originNote={store.shippingOriginDisclosure}
                />
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-ink">Returns:</dt>
              <dd>
                {product.returnable
                  ? "Returnable per our returns policy"
                  : "Final sale — not returnable"}
              </dd>
            </div>
            {product.countryOfOrigin && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Ships from:</dt>
                <dd>{product.countryOfOrigin}</dd>
              </div>
            )}
            {product.warranty && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Warranty:</dt>
                <dd>{product.warranty}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 hidden md:block">
            <AddToCartButton product={clientProduct} fullWidth />
          </div>

          <p className="mt-4 text-sm leading-6 text-ink/75">
            {product.shortDescription}
          </p>
        </div>
      </div>

      {/* Pros & cons */}
      <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label="Pros and cons">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink">What it does well</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {pros.map((pro) => (
              <li key={pro} className="flex gap-2">
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink">Honest trade-offs</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {cons.map((con) => (
              <li key={con} className="flex gap-2">
                <span aria-hidden="true" className="text-amber-600">✕</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Description */}
      <section className="mt-12 max-w-3xl" aria-labelledby="description-heading">
        <h2 id="description-heading" className="text-2xl font-bold text-ink">
          About this product
        </h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-ink/80">
          {product.description.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Specs */}
      {specs.length > 0 && (
        <section className="mt-12" aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="text-2xl font-bold text-ink">
            Specifications
          </h2>
          <div className="mt-4 overflow-hidden rounded-theme-lg border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-ink/10">
                {specs.map((spec) => (
                  <tr key={spec.label}>
                    <th
                      scope="row"
                      className="w-1/3 bg-primary-soft px-4 py-3 font-medium text-ink"
                    >
                      {spec.label}
                    </th>
                    <td className="px-4 py-3 text-ink/80">{spec.value}</td>
                  </tr>
                ))}
                {product.materials && (
                  <tr>
                    <th scope="row" className="w-1/3 bg-primary-soft px-4 py-3 font-medium text-ink">
                      Materials
                    </th>
                    <td className="px-4 py-3 text-ink/80">{product.materials}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Use cases */}
      {useCases.length > 0 && (
        <section className="mt-12" aria-labelledby="usecases-heading">
          <h2 id="usecases-heading" className="text-2xl font-bold text-ink">
            Best suited for
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded-theme bg-primary-soft px-4 py-2 text-sm font-medium capitalize text-ink"
              >
                {useCase.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <div className="mt-12 max-w-3xl">
          <FAQAccordion items={faq} title="Questions about this product" />
        </div>
      )}

      {/* Trust & policy */}
      <div className="mt-12 max-w-3xl">
        <PolicyDisclosure store={store} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-bold text-ink">
            You might also consider
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            From the same category — or see the{" "}
            <Link href="/compare" className="text-primary underline">
              full comparison
            </Link>
            .
          </p>
          <div className="mt-5">
            <ProductGrid products={related} locale={store.locale} />
          </div>
        </section>
      )}

      <StickyMobileCTA product={clientProduct} locale={store.locale} />
    </div>
  );
}
