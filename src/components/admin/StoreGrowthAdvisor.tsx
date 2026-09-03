import type {
  StoreGrowthPlan,
  StoreGrowthRecommendation,
} from "@/lib/growth/types";

export function StoreGrowthAdvisor({
  plans,
}: {
  plans: readonly StoreGrowthPlan[];
}) {
  if (plans.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No stores are available for the read-only growth advisor.
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="store-growth-advisor-title">
      <div>
        <h2 id="store-growth-advisor-title" className="text-lg font-bold text-slate-950">
          Store growth advisor
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          Deterministic 28-day hypotheses from captured orders and consented funnel telemetry.
          This view is read-only: it never changes products, SEO, domains or marketing spend.
        </p>
      </div>

      <div className="space-y-5">
        {plans.map((plan) => (
          <article
            key={plan.store.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">{plan.store.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {plan.store.slug} · {plan.window.start.slice(0, 10)}–{plan.window.end.slice(0, 10)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={stageClass(plan.stage)}>{humanize(plan.stage)}</span>
                <span className={scaleClass(plan.scaleEligibility.eligible)}>
                  {plan.scaleEligibility.eligible ? "Scale review eligible" : "Scale blocked"}
                </span>
              </div>
            </header>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Metric label="Consented sessions" value={plan.telemetry.consentedSessions} advisory />
                <Metric label="Product views" value={plan.telemetry.productViews} advisory />
                <Metric label="Add to carts" value={plan.telemetry.addToCarts} advisory />
                <Metric label="Checkout starts" value={plan.telemetry.beginCheckouts} advisory />
                <Metric label="Captured orders" value={plan.commerce.capturedOrders} />
                <Metric
                  label="Captured revenue"
                  value={formatMoney(plan.commerce.capturedRevenue, plan.store.currency)}
                />
                <Metric
                  label="Contribution proxy"
                  value={
                    plan.commerce.contributionProxy === null
                      ? "Unknown"
                      : formatMoney(plan.commerce.contributionProxy, plan.store.currency)
                  }
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Fact label="Funnel diagnosis" value={humanize(plan.funnelDiagnosis)} />
                <Fact label="Catalog freshness" value={humanize(plan.catalogFreshness)} />
                <Fact
                  label="Client checkout success hints"
                  value={`${plan.telemetry.clientCheckoutSuccesses} · never counted as sales`}
                />
              </div>

              {plan.scaleEligibility.blockers.length > 0 ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                    Scale blockers
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {plan.scaleEligibility.blockers.map((blocker) => (
                      <li
                        key={blocker}
                        className="rounded bg-white px-2 py-1 font-mono text-[11px] text-amber-900 ring-1 ring-amber-200"
                      >
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-slate-900">Recommended next hypotheses</h4>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {plan.recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.code}
                      recommendation={recommendation}
                    />
                  ))}
                </div>
              </div>

              <details className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-800">
                  Evidence limits and trust boundary
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
                  {plan.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: StoreGrowthRecommendation;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
          {recommendation.priority}
        </span>
        <span className="font-mono text-[10px] text-slate-500">{recommendation.code}</span>
        {recommendation.marketingOrSpend ? (
          <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
            Human approval required
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-semibold text-slate-950">{recommendation.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{recommendation.hypothesis}</p>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <Fact label="Target" value={recommendation.targetMetric} compact />
        <Fact label="Minimum evidence" value={recommendation.minimumEvidence} compact />
      </dl>
    </div>
  );
}

function Metric({
  label,
  value,
  advisory = false,
}: {
  label: string;
  value: string | number;
  advisory?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        {label}{advisory ? " · advisory" : ""}
      </p>
    </div>
  );
}

function Fact({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div>
      <dt className={`${compact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wide text-slate-500`}>
        {label}
      </dt>
      <dd className={`${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"} leading-5 text-slate-800`}>
        {value}
      </dd>
    </div>
  );
}

function stageClass(stage: StoreGrowthPlan["stage"]): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (stage === "TRACTION") return `${base} bg-emerald-100 text-emerald-800`;
  if (stage === "ZERO_SALES") return `${base} bg-amber-100 text-amber-900`;
  if (stage === "INSUFFICIENT_EVIDENCE") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-slate-200 text-slate-700`;
}

function scaleClass(eligible: boolean): string {
  return eligible
    ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
    : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800";
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
