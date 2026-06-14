import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        /{" "}
        <Link href={`/admin/stores/${store.slug}/edit`} className="hover:underline">
          {store.name}
        </Link>{" "}
        / <span className="text-slate-900">Products</span>
      </nav>
      <h1 className="text-2xl font-bold">{store.name} — Products</h1>
      <p className="mt-1 text-sm text-slate-500">{products.length} products. Click a title to edit.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="max-w-72 px-4 py-3">
                  <Link
                    href={`/admin/stores/${store.slug}/products/${product.slug}/edit`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="text-xs text-slate-500">{product.sku}</p>
                </td>
                <td className="px-4 py-3">{product.category.name}</td>
                <td className="px-4 py-3">
                  {product.price.toFixed(2)} {product.currency}
                </td>
                <td className="px-4 py-3">{product.marginPercent.toFixed(1)}%</td>
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
                <td className="px-4 py-3 text-xs">
                  {!product.isPublished && (
                    <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5">unpublished</span>
                  )}
                  {product.noindex && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">noindex</span>
                  )}
                  {product.isPublished && !product.noindex && (
                    <span className="text-emerald-700">live</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
