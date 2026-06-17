"use client";

import { formatCurrency } from "@/lib/pricing/calculate-price";
import type { ClientProduct } from "@/lib/types";

/**
 * Mobile-only sticky add-to-cart bar for product pages: price + CTA stay
 * reachable while the shopper reads specs and FAQ.
 */
export function StickyMobileCTA({
  product,
  locale,
}: {
  product: ClientProduct;
  locale: string;
}) {
  const isAffiliate = product.fulfillmentMode === "AFFILIATE";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-ink/60">{product.title}</p>
          <p className="text-base font-bold text-ink">
            {formatCurrency(product.price, product.currency, locale)}
          </p>
        </div>
        {!isAffiliate && product.checkoutAvailable && (
          <a href="#purchase-options" className="btn-primary shrink-0 px-4 py-2 text-xs">
            {product.variants.length > 0 ? "Choose options" : "Add to cart"}
          </a>
        )}
        {isAffiliate && product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="btn-primary shrink-0 px-4 py-2 text-xs"
          >
            View deal
          </a>
        )}
      </div>
    </div>
  );
}
