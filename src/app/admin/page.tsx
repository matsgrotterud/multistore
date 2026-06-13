import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [storeCount, productCount, publishedCount, subscriberCount, eventGroups] =
    await Promise.all([
      prisma.store.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.newsletterSubscriber.count(),
      prisma.cartEvent.groupBy({
        by: ["eventName"],
        _count: { eventName: true },
        orderBy: { _count: { eventName: "desc" } },
        take: 10,
      }),
    ]);

  const missingSeo = await prisma.product.count({
    where: { OR: [{ seoTitle: "" }, { seoDescription: "" }] },
  });

  const stats = [
    { label: "Stores", value: storeCount, href: "/admin/stores" },
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Published products", value: publishedCount, href: "/admin/products" },
    { label: "Products missing SEO", value: missingSeo, href: "/admin/products" },
    { label: "Newsletter subscribers", value: subscriberCount, href: "/admin" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Platform-wide overview. Margin and monetization insights are internal
        and never shown on storefronts.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Analytics events</h2>
        <p className="mt-1 text-sm text-slate-500">
          First-party events recorded in the CartEvent table.
        </p>
        {eventGroups.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No events yet. Browse a storefront (and accept analytics cookies)
            to start collecting.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventGroups.map((group) => (
                  <tr key={group.eventName}>
                    <td className="px-4 py-2.5 font-mono text-xs">{group.eventName}</td>
                    <td className="px-4 py-2.5">{group._count.eventName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
