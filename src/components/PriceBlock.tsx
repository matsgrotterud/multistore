import { formatCurrency } from "@/lib/pricing/calculate-price";
import { honestCompareAtPrice } from "@/lib/pricing/calculate-price";

/**
 * Price display. The compare-at price is run through honestCompareAtPrice so
 * implausible anchor discounts are never rendered.
 */
export function PriceBlock({
  price,
  compareAtPrice,
  currency,
  locale = "en-US",
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  locale?: string;
  size?: "sm" | "md" | "lg";
}) {
  const compareAt = honestCompareAtPrice(price, compareAtPrice ?? null);
  const priceClass =
    size === "lg"
      ? "text-3xl font-bold"
      : size === "sm"
        ? "text-base font-semibold"
        : "text-xl font-bold";

  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className={`${priceClass} text-ink`}>
        {formatCurrency(price, currency, locale)}
      </span>
      {compareAt !== null && (
        <>
          <s className="text-sm text-ink/50">
            {formatCurrency(compareAt, currency, locale)}
          </s>
          <span className="sr-only">
            , reduced from {formatCurrency(compareAt, currency, locale)}
          </span>
        </>
      )}
    </p>
  );
}
