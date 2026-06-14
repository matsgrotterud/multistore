import { getAdminProviderDashboard } from "@/lib/admin/commerce-dashboard";

export default async function AdminProvidersPage() {
  const providers = await getAdminProviderDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Supplier providers</h1>
        <p className="mt-1 text-sm text-slate-600">
          Health, credentials, capabilities and checkout support for each fulfillment source.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Capabilities</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Stores</th>
              <th className="px-4 py-3">Last sync</th>
              <th className="px-4 py-3">Order API</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.name}
                  <div className="text-xs font-normal text-slate-500">{row.key}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={row.health.status} />
                  <p className="mt-1 max-w-xs text-xs text-slate-500">{row.health.message}</p>
                  {row.health.missingEnv && row.health.missingEnv.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Missing: {row.health.missingEnv.join(", ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <CapabilityList capabilities={row.health.capabilities} />
                </td>
                <td className="px-4 py-3 text-xs">{row.health.defaultFulfillmentMode}</td>
                <td className="px-4 py-3">{row.enabledStores}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.lastSync ? new Date(row.lastSync).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs">{row.orderApiStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    OK: "bg-emerald-100 text-emerald-800",
    NOT_CONFIGURED: "bg-slate-100 text-slate-700",
    DEGRADED: "bg-amber-100 text-amber-800",
    ERROR: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[value] ?? colors.NOT_CONFIGURED}`}>
      {value}
    </span>
  );
}

function CapabilityList({
  capabilities,
}: {
  capabilities: {
    search: boolean;
    details: boolean;
    images: boolean;
    checkout: boolean;
    tracking: boolean;
  };
}) {
  const items = [
    capabilities.search && "search",
    capabilities.details && "details",
    capabilities.images && "images",
    capabilities.checkout && "checkout",
    capabilities.tracking && "tracking",
  ].filter(Boolean);
  return <span>{items.join(", ") || "none"}</span>;
}
