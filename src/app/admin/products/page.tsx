import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { suggestBundles } from "@/lib/monetization/bundles";
import { buildProductInsights } from "@/lib/monetization/recommendations";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { store: storeFilter } = await searchParams;

  const stores = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const activeStore =
    stores.find((store) => store.slug === storeFilter) ?? stores[0];

  if (!activeStore) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No stores seeded yet. Run <code>npm run db:seed</code> first.
        </p>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { storeId: activeStore.id },
    orderBy: { productScore: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      _count: { select: { images: true, variants: true } },
    },
  });

  const insights = buildProductInsights(activeStore, products);
  const insightById = new Map(insights.map((insight) => [insight.productId, insight]));
  const bundles = suggestBundles(products, 5);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Internal commercial view: product score, margins, SEO completeness
            and monetization recommendations.
          </p>
        </div>
        <nav aria-label="Filter by store" className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/admin/products?store=${store.slug}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                store.id === activeStore.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {store.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">SEO</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Media</th>
              <th className="px-4 py-3 font-medium">Monetization notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const margin = calculateGrossMargin(product);
              const insight = insightById.get(product.id);
              const missingSeo: string[] = [];
              if (!product.seoTitle) missingSeo.push("title");
              if (!product.seoDescription) missingSeo.push("description");
              if (!product.imageAlt) missingSeo.push("image alt");

              return (
                <tr key={product.id}>
                  <td className="max-w-64 px-4 py-3">
                    <Link
                      href={`/admin/stores/${activeStore.slug}/products/${product.slug}/edit`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {product.sku} ·{" "}
                      <Link
                        href={`/s/${activeStore.slug}/c/${product.category.slug}/p/${product.slug}`}
                        className="underline hover:text-slate-700"
                      >
                        view
                      </Link>
                    </p>
                  </td>
                  <td className="px-4 py-3">{product.category.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        product.productScore >= 70
                          ? "bg-emerald-100 text-emerald-800"
                          : product.productScore >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.productScore.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{margin.grossMarginPercent.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">{margin.health}</p>
                  </td>
                  <td className="px-4 py-3">
                    {missingSeo.length === 0 ? (
                      <span className="text-xs text-emerald-700">Complete</span>
                    ) : (
                      <span className="text-xs text-red-700">
                        Missing: {missingSeo.join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {!product.isPublished && (
                      <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5">unpublished</span>
                    )}
                    {product.noindex && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">noindex</span>
                    )}
                    {product.isPublished && !product.noindex && (
                      <span className="text-emerald-700">live + indexable</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{product.mediaStatus}</p>
                    <p className="text-slate-400">
                      {product._count.images} images · {product._count.variants} variants
                    </p>
                  </td>
                  <td className="max-w-64 px-4 py-3 text-xs text-slate-600">
                    {insight?.affiliateFallbackRecommended && (
                      <p className="text-red-700">
                        Margin too thin — consider affiliate fallback.
                      </p>
                    )}
                    {insight?.subscriptionSuitable && (
                      <p>{insight.subscriptionReason}</p>
                    )}
                    {insight && insight.upsellCandidates.length > 0 && (
                      <p>
                        Upsell: {insight.upsellCandidates[0].title}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Bundle suggestions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cross-category pairs with overlapping use cases that keep ≥20%
          margin after an 8% bundle discount.
        </p>
        {bundles.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No margin-safe bundles found for this store yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {bundles.map((bundle) => (
              <li
                key={`${bundle.anchorProductId}-${bundle.companionProductId}`}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
              >
                <p className="font-semibold">
                  {bundle.anchorTitle} + {bundle.companionTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bundle at {bundle.suggestedBundlePrice.toFixed(2)} (vs{" "}
                  {bundle.combinedPrice.toFixed(2)}) · margin{" "}
                  {bundle.combinedMarginPercent.toFixed(1)}% · shared:{" "}
                  {bundle.sharedUseCases.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
