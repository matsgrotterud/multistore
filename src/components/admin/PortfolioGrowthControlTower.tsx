import Link from "next/link";
import type {
  PortfolioGrowthLane,
  PortfolioGrowthQueue,
  PortfolioGrowthQueueItem,
} from "@/lib/growth/types";

export function PortfolioGrowthControlTower({
  queue,
}: {
  queue: PortfolioGrowthQueue;
}) {
  const priorityItems = queue.items.filter((item) => item.lane !== "LAUNCH_BLOCKED");
  const launchBlockedItems = queue.items.filter(
    (item) => item.lane === "LAUNCH_BLOCKED"
  );
  const summary = [
    ["Incidents", queue.summary.incidents, "text-red-700"],
    ["Scale reviews", queue.summary.scaleReviews, "text-emerald-700"],
    ["Optimize", queue.summary.optimizationReviews, "text-amber-700"],
    ["Measure", queue.summary.measurementReviews, "text-blue-700"],
    ["Launch blocked", queue.summary.launchBlocked, "text-slate-700"],
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
            Growth Control Tower v1
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Portfolio operating queue
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            One deterministic queue for incidents, evidence-safe optimization and
            bounded scale review. It does not run experiments, change stores or
            spend money.
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1.5 font-mono text-xs text-white">
          {queue.version}
        </span>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Queue summary">
        {summary.map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {queue.items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No stores are available for prioritization.
        </p>
      ) : (
        <section className="mt-6 space-y-3" aria-label="Prioritized stores">
          {priorityItems.map((item) => (
            <QueueItem key={item.plan.store.id} item={item} />
          ))}
          {launchBlockedItems.length > 0 && (
            <details className="rounded-xl border border-slate-300 bg-white shadow-sm">
              <summary className="cursor-pointer p-5 font-semibold text-slate-900">
                Launch-blocked backlog ({launchBlockedItems.length})
                <span className="ml-2 text-xs font-normal text-slate-500">
                  Kept noindex; expand to review individual stores
                </span>
              </summary>
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
                {launchBlockedItems.map((item) => (
                  <QueueItem key={item.plan.store.id} item={item} />
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Evidence limits and why this is not an A/B winner board
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-6">
          {queue.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function QueueItem({ item }: { item: PortfolioGrowthQueueItem }) {
  const plan = item.plan;
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 p-5 lg:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
          {item.rank}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={laneClass(item.lane)}>{humanize(item.lane)}</span>
            <span className="font-mono text-[10px] text-slate-500">{item.reasonCode}</span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-slate-950">{plan.store.name}</h2>
          <p className="font-mono text-xs text-slate-500">
            {plan.store.slug} · {plan.store.launchStatus} · {plan.store.currency}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Fact label="Stage" value={humanize(plan.stage)} />
          <Fact label="Diagnosis" value={humanize(plan.funnelDiagnosis)} />
          <Fact label="Captured orders" value={String(plan.commerce.capturedOrders)} />
          <Fact label="Consented sessions" value={`${plan.telemetry.consentedSessions} · advisory`} />
          <Fact label="Margin" value={humanize(plan.commerce.marginStatus)} />
          <Fact label="Catalog evidence" value={humanize(plan.catalogFreshness)} />
        </dl>
        <div className="lg:text-right">
          <Link
            href={`/admin/stores/${plan.store.slug}/edit`}
            className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Review store
          </Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-red-700">
            Human review required
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Next bounded hypothesis
            </p>
            {item.nextRecommendation ? (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {item.nextRecommendation.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Target: {item.nextRecommendation.targetMetric}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">No safe recommendation is available.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Trust boundary
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.evidenceTrust.map((trust) => (
                <span
                  key={trust}
                  className={`rounded px-2 py-1 font-mono text-[10px] ${
                    trust === "VERIFIED_COMMERCE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {trust}
                </span>
              ))}
            </div>
            {plan.scaleEligibility.blockers.length > 0 && (
              <p className="mt-2 break-words font-mono text-[10px] text-amber-800">
                {plan.scaleEligibility.blockers.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-xs leading-5 text-slate-800">{value}</dd>
    </div>
  );
}

function laneClass(lane: PortfolioGrowthLane): string {
  const base = "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide";
  if (lane === "INCIDENT") return `${base} bg-red-100 text-red-800`;
  if (lane === "SCALE_REVIEW") return `${base} bg-emerald-100 text-emerald-800`;
  if (lane === "OPTIMIZE") return `${base} bg-amber-100 text-amber-900`;
  if (lane === "MEASURE") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-slate-200 text-slate-700`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
