import { randomUUID } from "node:crypto";
import Link from "next/link";
import { runCatalogShadowRefreshAction } from "@/lib/actions/admin-catalog-autopilot";
import { RunCatalogAutopilotJobForm } from "@/components/admin/RunCatalogAutopilotJobForm";
import {
  buildCatalogAutopilotHistoryHref,
  encodeCatalogHistoryCursor,
  parseCatalogHistoryCursor,
  parseDurableCatalogEvidence,
} from "@/lib/admin/catalog-autopilot";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const HISTORY_PAGE_SIZE = 25;
const DECISION_FILTERS = [
  "BASELINE_CAPTURED",
  "NO_CHANGE",
  "PROPOSED",
  "REVIEW_REQUIRED",
  "SOURCE_UNAVAILABLE",
] as const;
const SOURCE_FILTERS = ["AVAILABLE", "SOURCE_UNAVAILABLE"] as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogAutopilotPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const requestId = randomUUID();

  const [stores, bindings] = await Promise.all([
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, launchStatus: true },
    }),
    prisma.product.findMany({
      where: { providerKey: { not: null }, externalId: { not: null } },
      select: { storeId: true, providerKey: true },
      distinct: ["storeId", "providerKey"],
      orderBy: [{ storeId: "asc" }, { providerKey: "asc" }],
    }),
  ]);

  const storeById = new Map(stores.map((store) => [store.id, store]));
  const options = bindings
    .filter(
      (binding): binding is { storeId: string; providerKey: string } =>
        typeof binding.providerKey === "string" && storeById.has(binding.storeId)
    )
    .map((binding) => ({
      storeId: binding.storeId,
      providerKey: binding.providerKey,
      store: storeById.get(binding.storeId)!,
    }))
    .sort(
      (left, right) =>
        left.store.name.localeCompare(right.store.name) ||
        left.providerKey.localeCompare(right.providerKey)
    );

  const requestedStore = singleParam(params.store);
  const selectedStore = stores.find((store) => store.slug === requestedStore);
  const providerOptions = [
    ...new Set(
      options
        .filter((option) => !selectedStore || option.storeId === selectedStore.id)
        .map((option) => option.providerKey)
    ),
  ].sort();
  const requestedProvider = singleParam(params.provider)?.trim().toLowerCase();
  const providerFilter = providerOptions.includes(requestedProvider ?? "")
    ? requestedProvider
    : undefined;
  const requestedDecision = singleParam(params.decision);
  const decisionFilter = includes(DECISION_FILTERS, requestedDecision)
    ? requestedDecision
    : undefined;
  const requestedSource = singleParam(params.source);
  const sourceFilter = includes(SOURCE_FILTERS, requestedSource) ? requestedSource : undefined;
  const cursor = parseCatalogHistoryCursor(singleParam(params.cursor));

  const stateScope = {
    ...(selectedStore ? { storeId: selectedStore.id } : {}),
    ...(providerFilter ? { providerKey: providerFilter } : {}),
  };
  const observationScope = {
    ...stateScope,
    ...(sourceFilter ? { sourceStatus: sourceFilter } : {}),
    ...(decisionFilter ? { proposal: { is: { decision: decisionFilter } } } : {}),
    ...(cursor
      ? {
          OR: [
            { observedAt: { lt: cursor.observedAt } },
            { observedAt: cursor.observedAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  };

  const [
    stateTotal,
    decisionGroups,
    alignmentGroups,
    sourceGroups,
    workflowGroups,
    observationWindow,
    recentJobs,
  ] = await Promise.all([
    prisma.catalogProductState.count({ where: stateScope }),
    prisma.catalogProductState.groupBy({
      by: ["latestDecision"],
      where: stateScope,
      _count: { _all: true },
    }),
    prisma.catalogProductState.groupBy({
      by: ["latestAlignmentStatus"],
      where: stateScope,
      _count: { _all: true },
    }),
    prisma.catalogProductState.groupBy({
      by: ["latestSourceStatus"],
      where: stateScope,
      _count: { _all: true },
    }),
    prisma.catalogProductState.groupBy({
      by: ["openProposalStatus"],
      where: stateScope,
      _count: { _all: true },
    }),
    prisma.catalogSupplierObservation.findMany({
      where: observationScope,
      orderBy: [{ observedAt: "desc" }, { id: "desc" }],
      take: HISTORY_PAGE_SIZE + 1,
      select: {
        id: true,
        providerKey: true,
        externalId: true,
        sourceStatus: true,
        observedAt: true,
        snapshotVersion: true,
        snapshotFingerprint: true,
        snapshotJson: true,
        reasonCodesJson: true,
        store: { select: { name: true, slug: true } },
        product: { select: { title: true, slug: true } },
        execution: {
          select: {
            id: true,
            catalogJobAttempt: true,
            handlerOutcome: true,
            settlementStatus: true,
            settlementCode: true,
          },
        },
        proposal: {
          select: {
            contractVersion: true,
            proposalFingerprint: true,
            decision: true,
            alignmentStatus: true,
            workflowStatus: true,
            reasonCodesJson: true,
            changesJson: true,
            alignmentJson: true,
          },
        },
      },
    }),
    prisma.catalogJob.findMany({
      where: { jobType: "REFRESH_EXISTING", ...stateScope },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 12,
      select: {
        id: true,
        providerKey: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        runAfter: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        store: { select: { name: true } },
      },
    }),
  ]);

  const decisionTotals = new Map(
    decisionGroups.map((group) => [group.latestDecision, group._count._all])
  );
  const alignmentTotals = new Map(
    alignmentGroups.map((group) => [group.latestAlignmentStatus, group._count._all])
  );
  const sourceTotals = new Map(
    sourceGroups.map((group) => [group.latestSourceStatus, group._count._all])
  );
  const workflowTotals = new Map(
    workflowGroups.map((group) => [group.openProposalStatus, group._count._all])
  );
  const observations = observationWindow.slice(0, HISTORY_PAGE_SIZE);
  const hasNextPage = observationWindow.length > HISTORY_PAGE_SIZE;
  const lastObservation = observations.at(-1);
  const nextCursor =
    hasNextPage && lastObservation
      ? encodeCatalogHistoryCursor({
          observedAt: lastObservation.observedAt,
          id: lastObservation.id,
        })
      : undefined;
  const filterState = {
    store: selectedStore?.slug,
    provider: providerFilter,
    decision: decisionFilter,
    source: sourceFilter,
  };
  const manualRunNow = new Date();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Catalog Autopilot</h1>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
            V1 · shadow only
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Observes current supplier facts and records immutable change proposals. It never changes
          storefront price, stock, variants, media, publication status or live-commerce freshness.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Queue a verified shadow observation</h2>
        <p className="mt-1 text-sm text-slate-500">
          This queues background evidence collection; it never applies a product change. Use a
          preview pilot first. The first successful observation establishes a supplier baseline.
        </p>
        {options.length > 0 ? (
          <form action={runCatalogShadowRefreshAction} className="mt-4 flex flex-wrap items-end gap-4">
            <input type="hidden" name="requestId" value={requestId} />
            <label className="min-w-72 flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-700">Store and provider</span>
              <select name="binding" className="input" required defaultValue="">
                <option value="" disabled>
                  Select a supplier-bound catalog
                </option>
                {options.map((option) => (
                  <option
                    key={`${option.storeId}-${option.providerKey}`}
                    value={`${option.storeId}\u001f${option.providerKey}`}
                  >
                    {option.store.name} ({option.store.launchStatus}) · {option.providerKey}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs text-slate-600">
              <input name="allowFixtureMode" type="checkbox" />
              Allow explicit mock fixture observation
            </label>
            <button type="submit" className="btn-primary">
              Queue shadow observation
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No products currently have both provider and external product identity.
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Current catalog state</h2>
            <p className="mt-1 text-sm text-slate-500">
              One latest durable state per supplier-bound product in the selected scope.
            </p>
          </div>
          <ScopeLabel store={selectedStore?.name} provider={providerFilter} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Metric label="Tracked products" value={stateTotal} />
          <Metric label="Baselines latest" value={decisionTotals.get("BASELINE_CAPTURED") ?? 0} />
          <Metric label="Unchanged latest" value={decisionTotals.get("NO_CHANGE") ?? 0} />
          <Metric label="Open proposals" value={workflowTotals.get("OPEN") ?? 0} tone="amber" />
          <Metric
            label="Needs review"
            value={workflowTotals.get("NEEDS_REVIEW") ?? 0}
            tone="amber"
          />
          <Metric
            label="Source unavailable"
            value={sourceTotals.get("SOURCE_UNAVAILABLE") ?? 0}
            tone="red"
          />
          <Metric label="Catalog drift" value={alignmentTotals.get("DRIFT") ?? 0} tone="red" />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Recent refresh queue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Queued, running, retrying and terminal REFRESH_EXISTING jobs. A successful queue job
            records evidence only. Manual runs claim only the selected row and refresh this status
            and the observation history when settlement finishes.
          </p>
        </div>
        {recentJobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No refresh jobs in this scope yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Store / provider</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Attempt</th>
                  <th className="px-3 py-2 font-medium">Next eligible</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                      {job.updatedAt.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {job.store.name} · {job.providerKey}
                    </td>
                    <td className="px-3 py-3">
                      <span className={jobStatusClass(job.status)}>{job.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                      {job.status === "QUEUED" || job.status === "RETRY"
                        ? job.runAfter.toLocaleString()
                        : "—"}
                    </td>
                    <td className="max-w-96 px-3 py-3 text-slate-600">
                      {job.lastError ?? shortId(job.id)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <RunCatalogAutopilotJobForm
                        jobId={job.id}
                        runnable={
                          (job.status === "QUEUED" || job.status === "RETRY") &&
                          job.runAfter.getTime() <= manualRunNow.getTime() &&
                          job.attempts < job.maxAttempts
                        }
                        waiting={
                          (job.status === "QUEUED" || job.status === "RETRY") &&
                          job.runAfter.getTime() > manualRunNow.getTime()
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Immutable supplier observation history</h2>
          <p className="mt-1 text-sm text-slate-500">
            Newest first, 25 rows per page. JSON evidence is contract-validated before display;
            malformed historical rows are isolated and cannot crash this view.
          </p>
        </div>

        <form method="get" action="/admin/catalog-autopilot" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect name="store" label="Store" value={selectedStore?.slug}>
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.slug}>
                {store.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="provider" label="Provider" value={providerFilter}>
            <option value="">All providers</option>
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="decision" label="Decision" value={decisionFilter}>
            <option value="">All decisions</option>
            {DECISION_FILTERS.map((decision) => (
              <option key={decision} value={decision}>
                {decision}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="source" label="Source" value={sourceFilter}>
            <option value="">All source states</option>
            {SOURCE_FILTERS.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </FilterSelect>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary">
              Filter history
            </button>
            <Link href="/admin/catalog-autopilot" className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>

        {observations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No durable Catalog Autopilot observations match this scope. Queue one above to establish
            a supplier baseline.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1180px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Observed</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Store / provider</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Decision</th>
                  <th className="px-3 py-2 font-medium">Alignment</th>
                  <th className="px-3 py-2 font-medium">Settlement</th>
                  <th className="px-3 py-2 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {observations.map((observation) => {
                  const evidence = parseDurableCatalogEvidence({
                    providerKey: observation.providerKey,
                    externalId: observation.externalId,
                    sourceStatus: observation.sourceStatus,
                    observedAt: observation.observedAt,
                    snapshotVersion: observation.snapshotVersion,
                    snapshotFingerprint: observation.snapshotFingerprint,
                    snapshotJson: observation.snapshotJson,
                    observationReasonCodesJson: observation.reasonCodesJson,
                    proposal: observation.proposal,
                  });
                  return (
                    <tr key={observation.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {observation.observedAt.toLocaleString()}
                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                          {shortId(observation.id)}
                        </p>
                      </td>
                      <td className="max-w-64 px-3 py-3">
                        <Link
                          href={`/admin/stores/${observation.store.slug}/products/${observation.product.slug}/edit`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {observation.product.title}
                        </Link>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                          {observation.externalId}
                        </p>
                      </td>
                      <td className="max-w-56 px-3 py-3 text-slate-700">
                        <p className="font-medium">{observation.store.name}</p>
                        <p className="mt-1">{observation.providerKey}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={sourceClass(evidence.sourceStatus)}>
                          {evidence.sourceStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={decisionClass(evidence.decision)}>
                          {evidence.decision}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {evidence.workflowStatus}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={alignmentClass(evidence.alignment?.status)}>
                          {evidence.alignment?.status ?? "INVALID"}
                        </span>
                      </td>
                      <td className="max-w-48 px-3 py-3">
                        <span className={settlementClass(observation.execution.settlementStatus)}>
                          {observation.execution.settlementStatus}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {observation.execution.handlerOutcome} · attempt {observation.execution.catalogJobAttempt}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {observation.execution.settlementCode}
                        </p>
                      </td>
                      <td className="max-w-96 px-3 py-3 text-slate-600">
                        {!evidence.valid ? (
                          <div className="rounded border border-red-200 bg-red-50 p-2 text-red-900">
                            <p className="font-semibold">Malformed persisted evidence</p>
                            <p className="mt-1 text-[10px]">{evidence.issues.join(", ")}</p>
                          </div>
                        ) : (
                          <details>
                            <summary className="cursor-pointer font-medium text-slate-700">
                              {evidence.reasonCodes.length} reasons · {evidence.changes.length} changes
                            </summary>
                            <div className="mt-2 space-y-2 text-[10px] leading-4">
                              <p>{evidence.reasonCodes.join(", ") || "No reason codes"}</p>
                              {evidence.changes.length > 0 ? (
                                <ul className="list-disc space-y-1 pl-4">
                                  {evidence.changes.map((change, index) => (
                                    <li key={`${change.field}-${index}`}>
                                      {change.field}: {formatEvidenceValue(change.previous)} →{" "}
                                      {formatEvidenceValue(change.next)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {evidence.alignment?.reasonCodes.length ? (
                                <p>Alignment: {evidence.alignment.reasonCodes.join(", ")}</p>
                              ) : null}
                              {observation.snapshotFingerprint ? (
                                <p className="font-mono text-slate-400">
                                  Snapshot {observation.snapshotFingerprint.slice(0, 16)}…
                                </p>
                              ) : null}
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor ? (
          <div className="flex justify-end">
            <Link
              href={buildCatalogAutopilotHistoryHref({ ...filterState, cursor: nextCursor })}
              className="btn-secondary"
            >
              Older observations
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select name={name} className="input" defaultValue={value ?? ""}>
        {children}
      </select>
    </label>
  );
}

function ScopeLabel({ store, provider }: { store?: string; provider?: string }) {
  if (!store && !provider) return null;
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {[store, provider].filter(Boolean).join(" · ")}
    </span>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "red";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{label}</p>
    </div>
  );
}

function jobStatusClass(status: string): string {
  const base = "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (status === "SUCCESS") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "QUEUED") return `${base} bg-blue-100 text-blue-800`;
  if (status === "RUNNING") return `${base} bg-violet-100 text-violet-800`;
  if (status === "RETRY") return `${base} bg-amber-100 text-amber-900`;
  return `${base} bg-red-100 text-red-800`;
}

function sourceClass(status: string): string {
  const base = "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (status === "AVAILABLE") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "SOURCE_UNAVAILABLE") return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

function settlementClass(status: string): string {
  const base = "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (status === "SUCCESS") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "RETRY") return `${base} bg-amber-100 text-amber-900`;
  return `${base} bg-red-100 text-red-800`;
}

function decisionClass(decision: string): string {
  const base = "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (decision === "NO_CHANGE") return `${base} bg-emerald-100 text-emerald-800`;
  if (decision === "BASELINE_CAPTURED") return `${base} bg-blue-100 text-blue-800`;
  if (decision === "PROPOSED") return `${base} bg-violet-100 text-violet-800`;
  if (decision === "REVIEW_REQUIRED") return `${base} bg-amber-100 text-amber-900`;
  return `${base} bg-red-100 text-red-800`;
}

function alignmentClass(status: string | undefined): string {
  const base = "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (status === "ALIGNED") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "DRIFT") return `${base} bg-red-100 text-red-800`;
  if (status === "PARTIAL") return `${base} bg-amber-100 text-amber-900`;
  return `${base} bg-slate-100 text-slate-700`;
}

function formatEvidenceValue(value: string | number | boolean | null): string {
  if (value === null) return "null";
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 18)}…` : value;
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function includes<const T extends readonly string[]>(
  values: T,
  value: string | undefined
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}
