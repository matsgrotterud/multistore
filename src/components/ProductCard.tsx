import Link from "next/link";
import type { Product } from "@prisma/client";
import { ProductCardCta } from "@/components/ProductCardCta";
import { PriceBlock } from "@/components/PriceBlock";
import { RatingDisplay } from "@/components/RatingDisplay";
import { toClientProduct } from "@/lib/stores/queries";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

export function ProductCard({
  product,
  locale = "en-US",
}: {
  product: Product;
  locale?: string;
}) {
  const client = toClientProduct(product);
  const stockLabel = isStockStatus(product.stockStatus)
    ? STOCK_STATUS_LABELS[product.stockStatus]
    : product.stockStatus;

  return (
    <article className="card group flex h-full flex-col overflow-hidden">
      <Link href={`/p/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink/5">
        <img
          src={product.imageUrl}
          alt={product.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {product.stockStatus !== "IN_STOCK" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
            {stockLabel}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
            {product.brand}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">
            <Link href={`/p/${product.slug}`} className="hover:text-primary">
              {product.title}
            </Link>
          </h3>
          {product.subtitle && (
            <p className="mt-1 line-clamp-2 text-xs text-ink/60">{product.subtitle}</p>
          )}
        </div>
        <RatingDisplay
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
        />
        <PriceBlock
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          currency={product.currency}
          locale={locale}
          size="sm"
        />
        <p className="text-xs text-ink/60">
          Ships in {product.shippingDaysMin}–{product.shippingDaysMax} business days
        </p>
        <ProductCardCta product={client} />
      </div>
    </article>
  );
}
