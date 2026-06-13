import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  await requireAdmin();

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    include: {
      domains: true,
      _count: {
        select: {
          products: true,
          categories: true,
          contentPages: true,
          newsletterSubscribers: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Stores</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every tenant served by this deployment. Open a storefront locally with{" "}
        <code className="rounded bg-slate-200 px-1">/?store=&lt;slug&gt;</code>.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Primary domain</th>
              <th className="px-4 py-3 font-medium">Niche</th>
              <th className="px-4 py-3 font-medium">Categories</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Content pages</th>
              <th className="px-4 py-3 font-medium">Subscribers</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((store) => (
              <tr key={store.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-slate-500">{store.slug}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{store.primaryDomain}</td>
                <td className="px-4 py-3">{store.niche}</td>
                <td className="px-4 py-3">{store._count.categories}</td>
                <td className="px-4 py-3">{store._count.products}</td>
                <td className="px-4 py-3">{store._count.contentPages}</td>
                <td className="px-4 py-3">{store._count.newsletterSubscribers}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      store.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {store.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/s/${store.slug}`}
                    className="text-sm font-medium text-blue-700 underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
