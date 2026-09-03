import type { StoreSettings } from "@/lib/settings/store-settings";
import type { AdminLiveBlocker } from "@/lib/admin/generator-observability";

type GenerationSettings = StoreSettings["generation"];

export function GenerationObservability({
  generation,
  launchStatus,
  liveBlockers,
}: {
  generation: GenerationSettings;
  launchStatus: string;
  liveBlockers: AdminLiveBlocker[];
}) {
  return (
    <section
      aria-labelledby="generation-observability-title"
      className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 id="generation-observability-title" className="text-base font-semibold text-slate-950">
            Generator V3 evidence
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Persisted intent, policy and catalog evidence. Missing evidence is never treated as a pass.
          </p>
        </div>
        <span className={generationStatusClass(generation?.status ?? "UNKNOWN")}>
          {humanize(generation?.status ?? "UNKNOWN")}
        </span>
      </div>

      {generation ? (
        <div className="p-5">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <EvidenceValue label="Run ID" value={generation.runId} mono />
            <EvidenceValue label="Product class" value={generation.productClass ?? "UNKNOWN"} mono />
            <EvidenceValue
              label="Intent confidence"
              value={`${Math.round(generation.intentConfidence * 100)}%`}
            />
            <EvidenceValue label="Policy" value={humanize(generation.policyDecision)} />
            <EvidenceValue
              label="Relevant products"
              value={`${generation.relevantProducts} / ${generation.minimumProducts} minimum`}
            />
            <EvidenceValue
              label="Preview-visible"
              value={`${generation.previewVisibleProducts} products`}
            />
            <EvidenceValue
              label="Imported / budget"
              value={`${generation.importedProducts} / ${generation.importBudget}`}
            />
            <EvidenceValue
              label="Manual review"
              value={generation.manualReviewRequired ? humanize(generation.manualReviewStatus) : "Not required"}
            />
            <EvidenceValue
              label="Human launch approval"
              value={generation.humanLaunchApproved ? "Approved" : "Missing"}
            />
            <EvidenceValue
              label="Live commerce policy"
              value={generation.liveCommerceAllowed ? "Allowed" : "Blocked"}
            />
            <EvidenceValue
              label="Autonomous launch"
              value={generation.autonomousLaunchAllowed ? "Allowed" : "Blocked"}
            />
            <EvidenceValue
              label="Completed"
              value={formatTimestamp(generation.completedAt)}
            />
          </dl>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason codes</p>
            {generation.reasonCodes.length ? (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Generation reason codes">
                {generation.reasonCodes.map((code, index) => (
                  <li
                    key={`${code}-${index}`}
                    className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
                  >
                    {code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No terminal reason codes were recorded.</p>
            )}
          </div>

          <details className="mt-4 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium text-slate-700">Contract versions</summary>
            <dl className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
              <EvidenceValue label="Run contract" value={generation.contractVersion} mono compact />
              <EvidenceValue label="Generator" value={generation.generatorVersion} mono compact />
              <EvidenceValue label="Intent / ontology" value={`${generation.intentVersion} / ${generation.ontologyVersion}`} mono compact />
              <EvidenceValue label="Evaluator" value={generation.evaluatorVersion} mono compact />
            </dl>
          </details>
        </div>
      ) : (
        <div className="px-5 py-4 text-sm text-slate-600">
          This store has no persisted Generator V3 snapshot. Legacy catalog data is not evidence of a
          successful V3 run.
        </div>
      )}

      <LiveBlock launchStatus={launchStatus} blockers={liveBlockers} />
    </section>
  );
}

function LiveBlock({
  launchStatus,
  blockers,
}: {
  launchStatus: string;
  blockers: AdminLiveBlocker[];
}) {
  if (launchStatus === "LIVE") {
    return (
      <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
        <p className="font-semibold">Live transition recorded</p>
        <p className="mt-1 text-xs leading-5">
          This status reflects the persisted store state. Keep external domain and commerce monitoring active.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-red-200 bg-red-50 px-5 py-4 text-red-950" role="status">
      <p className="text-sm font-semibold">
        {blockers.length ? "Go-live blocked by current evidence" : "Go-live is not cleared"}
      </p>
      {blockers.length ? (
        <ul className="mt-2 space-y-1.5 text-xs leading-5">
          {blockers.map((blocker) => (
            <li key={blocker.code}>
              <span className="font-mono font-semibold">{blocker.code}</span>
              {": "}
              {blocker.message}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-red-800">
        The server gate can add DNS/TLS, compliance and commerce blockers. A planned hostname or a
        working preview checkout is not production verification.
      </p>
    </div>
  );
}

function EvidenceValue({
  label,
  value,
  mono = false,
  compact = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <dt className={`${compact ? "text-[10px]" : "text-xs"} font-medium uppercase tracking-wide text-slate-500`}>
        {label}
      </dt>
      <dd
        className={`${compact ? "mt-0.5 text-[11px]" : "mt-1 text-sm"} break-words font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function generationStatusClass(status: string): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "READY_FOR_PREVIEW") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW") {
    return `${base} bg-amber-100 text-amber-900`;
  }
  if (status === "RUNNING") return `${base} bg-blue-100 text-blue-800`;
  if (status === "UNKNOWN") return `${base} bg-slate-100 text-slate-700`;
  return `${base} bg-red-100 text-red-800`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Not completed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
