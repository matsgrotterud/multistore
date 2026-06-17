import Link from "next/link";
import { ProductCardCta } from "@/components/ProductCardCta";
import { PriceBlock } from "@/components/PriceBlock";
import { RatingDisplay } from "@/components/RatingDisplay";
import { toClientProduct, type CatalogProduct } from "@/lib/stores/queries";
import { productHref, type LinkStore } from "@/lib/stores/storefront-links";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

/** Resilient image source: real image, else a branded placeholder. */
function cardImage(product: CatalogProduct): string {
  const url = product.imageUrl?.trim();
  if (url) return url;
  return `/api/placeholder?label=${encodeURIComponent(product.title.slice(0, 24))}&seed=${product.slug}`;
}

/**
 * Premium, restrained product card. Used on the homepage, category, related and
 * search surfaces. Image-safe (handles Blob URLs, placeholders, missing images),
 * keeps store/category-aware links, and preserves the add-to-cart/variant CTA.
 */
export function ProductCard({
  product,
  store,
  locale = "en-US",
  badge,
}: {
  product: CatalogProduct;
  store: LinkStore;
  locale?: string;
  /** Honest label (e.g. "Top pick") from sorting/selection — never fake popularity. */
  badge?: string;
}) {
  const client = toClientProduct(product);
  const href = productHref(store, product.slug, product.category?.slug);
  const stockLabel = isStockStatus(product.stockStatus)
    ? STOCK_STATUS_LABELS[product.stockStatus]
    : product.stockStatus;
  const outOfStock = product.stockStatus !== "IN_STOCK";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-theme-lg border border-ink/10 bg-white transition-shadow duration-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-surface"
        aria-label={product.title}
      >
        <img
          src={cardImage(product)}
          alt={product.imageAlt || product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm ring-1 ring-ink/5">
            {badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-white">
            {stockLabel}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            {product.brand}
          </p>
          <h3 className="mt-1.5 text-sm font-medium leading-snug text-ink">
            <Link href={href} className="transition-colors hover:text-primary">
              {product.title}
            </Link>
          </h3>
          {product.subtitle && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/50">
              {product.subtitle}
            </p>
          )}
        </div>

        <RatingDisplay
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
        />

        <div className="flex items-baseline justify-between gap-2">
          <PriceBlock
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
            locale={locale}
            size="sm"
          />
          <span className="text-[11px] text-ink/45">
            {product.shippingDaysMin}–{product.shippingDaysMax} days
          </span>
        </div>

        <ProductCardCta product={client} />
      </div>
    </article>
  );
}
