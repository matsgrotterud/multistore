import { requireAdmin } from "@/lib/admin/auth";
import {
  approveCandidateAction,
  importApprovedCandidatesAction,
  rejectCandidateAction,
  runDiscoveryAction,
} from "@/lib/actions/admin-import";
import { prisma } from "@/lib/db";
import { getProviderHealthReport } from "@/lib/suppliers/catalog/provider-health";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdmin();

  const [stores, providers, candidates, runs] = await Promise.all([
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    }),
    getProviderHealthReport(),
    prisma.productCandidate.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: { store: true, category: true, mediaAssets: true },
    }),
    prisma.catalogSyncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      include: { store: true },
    }),
  ]);

  const defaultStore = stores[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Supplier import</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Discover supplier candidates, review quality gates, approve safe products and import them as unpublished drafts.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Run discovery</h2>
        <form action={runDiscoveryAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr_auto]">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Store</span>
            <select name="storeId" className="input" defaultValue={defaultStore?.id}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Provider</span>
            <select name="providerKey" className="input" defaultValue="mock">
              {providers.map((provider) => (
                <option key={provider.key} value={provider.key}>
                  {provider.name} ({provider.status})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Query</span>
            <input name="query" className="input" defaultValue="ergonomic office" required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Category</span>
            <select name="categoryId" className="input">
              <option value="">Auto</option>
              {defaultStore?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary lg:col-start-4" type="submit">
            Run discovery now
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {providers.map((provider) => (
          <article key={provider.key} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{provider.name}</h2>
                <p className="text-xs uppercase tracking-wide text-slate-500">{provider.key}</p>
              </div>
              <span className={statusClass(provider.status)}>{provider.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{provider.message}</p>
            {provider.missingEnv?.length ? (
              <p className="mt-2 text-xs text-amber-700">Missing: {provider.missingEnv.join(", ")}</p>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              Mode: {provider.defaultFulfillmentMode} · Checkout: {provider.capabilities.checkout ? "yes" : "no"}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold">Candidates</h2>
            <p className="text-sm text-slate-500">Latest discovered products across all stores.</p>
          </div>
          {defaultStore && (
            <form action={importApprovedCandidatesAction}>
              <input type="hidden" name="storeId" value={defaultStore.id} />
              <button className="btn-secondary" type="submit">
                Import approved for {defaultStore.name}
              </button>
            </form>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium text-slate-900">{candidate.titleEnhanced ?? candidate.titleRaw}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{candidate.descriptionRaw}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.store.name}
                    {candidate.category ? <span className="block text-xs text-slate-400">{candidate.category.name}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.providerKey}</td>
                  <td className="px-4 py-3 font-semibold">{candidate.score.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.mediaAssets.filter((asset) => asset.ingestionStatus === "STORED").length}/
                    {countMediaJson(candidate.mediaJson)}
                    <span className="block text-xs text-slate-400">
                      {candidate.mediaAssets.length} attempts
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={candidateStatusClass(candidate.status)}>{candidate.status}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs leading-5 text-slate-500">
                    {candidate.rejectionReason || "Ready for review."}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {candidate.status !== "APPROVED" && candidate.status !== "IMPORTED" ? (
                        <form action={approveCandidateAction}>
                          <input type="hidden" name="candidateId" value={candidate.id} />
                          <button className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700" type="submit">
                            Approve
                          </button>
                        </form>
                      ) : null}
                      {candidate.status !== "REJECTED" && candidate.status !== "IMPORTED" ? (
                        <form action={rejectCandidateAction}>
                          <input type="hidden" name="candidateId" value={candidate.id} />
                          <input type="hidden" name="reason" value="Rejected by admin." />
                          <button className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700" type="submit">
                            Reject
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No candidates yet. Run discovery with the mock provider to test the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Last sync runs</h2>
        <div className="mt-4 grid gap-3">
          {runs.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm">
              <span className="font-medium">{run.store?.name ?? "All stores"} · {run.providerKey ?? "all providers"}</span>
              <span>{run.status}</span>
              <span className="text-slate-500">{run.startedAt.toLocaleString()}</span>
              {run.errorMessage ? <span className="text-xs text-red-600">{run.errorMessage}</span> : null}
            </div>
          ))}
          {runs.length === 0 ? <p className="text-sm text-slate-500">No catalog sync runs yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function countMediaJson(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function statusClass(status: string): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "OK") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "DEGRADED") return `${base} bg-amber-100 text-amber-800`;
  if (status === "ERROR") return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

function candidateStatusClass(status: string): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "APPROVED") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "IMPORTED") return `${base} bg-blue-100 text-blue-800`;
  if (status === "REJECTED" || status === "ERROR") return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}
