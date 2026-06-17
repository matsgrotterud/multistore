import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import type { CatalogProduct } from "@/lib/stores/queries";
import { productHref, type LinkStore } from "@/lib/stores/storefront-links";
import { parseSpecs } from "@/lib/utils/json";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

/**
 * Side-by-side product comparison built from real catalog data. Spec rows
 * are the union of all compared products' specs; missing values show an
 * honest em dash rather than being hidden.
 */
export function ComparisonTable({
  products,
  store,
  locale = "en-US",
}: {
  products: CatalogProduct[];
  store: LinkStore;
  locale?: string;
}) {
  if (products.length === 0) return null;

  const specRows: string[] = [];
  const specMap = new Map<string, Map<string, string>>();
  for (const product of products) {
    const specs = parseSpecs(product.specs);
    const productSpecs = new Map<string, string>();
    for (const spec of specs) {
      if (!specRows.includes(spec.label)) specRows.push(spec.label);
      productSpecs.set(spec.label, spec.value);
    }
    specMap.set(product.id, productSpecs);
  }

  return (
    <div className="overflow-x-auto rounded-theme-lg border border-ink/10 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Product comparison</caption>
        <thead>
          <tr className="border-b border-ink/10 bg-primary-soft">
            <th scope="col" className="px-4 py-3 font-semibold text-ink">
              Product
            </th>
            {products.map((product) => (
              <th key={product.id} scope="col" className="px-4 py-3 align-top">
                <Link
                  href={productHref(store, product.slug, product.category?.slug)}
                  className="font-semibold text-ink hover:text-primary"
                >
                  {product.title}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Price
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3 font-semibold text-ink">
                {formatCurrency(product.price, product.currency, locale)}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Delivery
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                {product.shippingDaysMin}–{product.shippingDaysMax} business days
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Availability
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                {isStockStatus(product.stockStatus)
                  ? STOCK_STATUS_LABELS[product.stockStatus]
                  : product.stockStatus}
              </td>
            ))}
          </tr>
          {specRows.map((label) => (
            <tr key={label}>
              <th scope="row" className="px-4 py-3 font-medium text-ink/70">
                {label}
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-3 text-ink/80">
                  {specMap.get(product.id)?.get(label) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              <span className="sr-only">Link</span>
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                <Link href={productHref(store, product.slug, product.category?.slug)} className="text-sm font-semibold text-primary underline">
                  View details
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
