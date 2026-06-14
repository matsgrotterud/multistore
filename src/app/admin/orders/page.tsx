import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrders } from "@/lib/admin/commerce-dashboard";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAdminOrders(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Payment, fulfillment and supplier routing status across all stores.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Order status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No orders yet. Complete a mock or Stripe checkout to create one.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{order.orderNumber}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/stores/${order.store.slug}/edit`} className="text-primary hover:underline">
                    {order.store.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">
                  {order.customer?.name ?? "—"}
                  <div className="text-slate-500">{order.customer?.email ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {order.grandTotal.toFixed(2)} {order.currency}
                </td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">
                  <div>{order.paymentStatus}</div>
                  <div className="text-xs text-slate-500">{order.paymentProvider ?? "—"}</div>
                </td>
                <td className="px-4 py-3">{order.fulfillmentStatus}</td>
                <td className="px-4 py-3 text-xs">
                  {order.supplierOrders.length === 0
                    ? "—"
                    : order.supplierOrders
                        .map((supplierOrder) => `${supplierOrder.providerKey}:${supplierOrder.status}`)
                        .join(", ")}
                </td>
                <td className="px-4 py-3 text-xs text-red-700">{order.paymentError ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
