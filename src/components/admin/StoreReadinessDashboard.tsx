import Link from "next/link";
import type { StoreReadinessPortfolioReport } from "@/lib/admin/store-operating-readiness";
import type {
  StoreOperatingReadiness,
  StoreReadinessStatus,
} from "@/lib/readiness/store-operating-readiness";

export function StoreReadinessDashboard({
  report,
}: {
  report: StoreReadinessPortfolioReport;
}) {
  const summary = [
    ["Stores", report.summary.totalStores, "text-slate-950"],
    ["Foundation review ready", report.summary.readyForReview, "text-emerald-700"],
    ["Needs foundation work", report.summary.needsWork, "text-amber-700"],
    ["Launch authorized", report.summary.launchAuthorized, "text-red-700"],
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
            Provider-independent readiness
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Store operating readiness
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Brand, design, content, noindex SEO, legal drafts, consent, domain intent,
            measurement and experiment safety across the portfolio. This report can
            never authorize LIVE.
          </p>
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Readiness summary">
        {summary.map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {report.summary.activeUnattributableExperiments > 0 && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {report.summary.activeUnattributableExperiments} experiment(s) are marked active
          without assignment and verified order attribution. They are treated as blocked,
          not as evidence.
        </p>
      )}

      <section className="mt-6 space-y-4" aria-label="Store readiness reports">
        {report.stores.map((store) => (
          <StoreReadinessCard key={store.store.id} report={store} />
        ))}
      </section>
    </div>
  );
}

function StoreReadinessCard({ report }: { report: StoreOperatingReadiness }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none p-5 marker:hidden">
        <span className="flex flex-wrap items-start justify-between gap-4">
          <span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-950">{report.store.name}</span>
            <span className={decisionClass(report.preCatalogDecision)}>
              {humanize(report.preCatalogDecision)}
            </span>
            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
              LIVE NOT AUTHORIZED
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {report.store.slug} · {report.store.launchStatus} · {report.version}
          </p>
          </span>
          <span className="text-xs font-semibold text-slate-500 group-open:text-slate-900">
            {report.gates.length} gates · {report.actions.length} action(s) · expand
          </span>
        </span>
      </summary>

      <div className="border-t border-slate-200 p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/stores/${report.store.slug}/foundation`}
            className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800"
          >
            Foundation
          </Link>
          <Link
            href={`/admin/stores/${report.store.slug}/design`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Design
          </Link>
          <Link
            href={`/admin/stores/${report.store.slug}/edit`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Settings
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {report.gates.map((gate) => (
            <div key={gate.area} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {gate.area}
                </p>
                <span className={statusClass(gate.status)}>{gate.status}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-700">{gate.summary}</p>
              <p className="mt-2 break-words font-mono text-[9px] text-slate-400">
                {gate.reasonCode}
              </p>
            </div>
          ))}
        </div>

        {report.actions.length > 0 && (
          <details className="mt-4 rounded-lg bg-slate-50 p-4 text-sm" open={report.preCatalogDecision === "NEEDS_WORK"}>
            <summary className="cursor-pointer font-semibold text-slate-900">
              Prioritized work ({report.actions.length})
            </summary>
            <ol className="mt-3 space-y-2">
              {report.actions.slice(0, 6).map((action) => (
                <li key={`${action.area}-${action.code}`} className="flex gap-3 text-xs leading-5">
                  <span className={action.priority === "P0" ? "font-bold text-red-700" : action.priority === "P1" ? "font-bold text-amber-700" : "font-bold text-blue-700"}>
                    {action.priority}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="text-slate-600">{action.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        )}

        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium">Proof boundaries</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
            {report.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </details>
      </div>
    </details>
  );
}

function decisionClass(decision: StoreOperatingReadiness["preCatalogDecision"]): string {
  return decision === "READY_FOR_REVIEW"
    ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800"
    : "rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800";
}

function statusClass(status: StoreReadinessStatus): string {
  if (status === "PASS") return "rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800";
  if (status === "BLOCKED") return "rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800";
  if (status === "UNKNOWN") return "rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700";
  return "rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800";
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
