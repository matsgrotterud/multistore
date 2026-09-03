"use client";

import { useState } from "react";
import { ResponsivePreviewCanvasV2 } from "@/components/admin/ResponsivePreviewCanvasV2";
import { buildReferenceStoreFactoryV2Action } from "@/lib/actions/admin-store-factory-v2";
import type {
  ReferenceStoreFactoryFixtureV2,
  ReferenceStoreRevisionV2,
} from "@/lib/reference-store-factory-v2";

export interface StoreFactorySchemaCapabilityViewV2 {
  check: "AVAILABLE" | "UNAVAILABLE";
  version: string;
  status: "ABSENT" | "PARTIAL" | "COMPLETE" | "UNAVAILABLE";
  expected: number;
  satisfied: number;
  missing: readonly string[];
  incompatible: readonly string[];
  persistenceEnabled: boolean;
}

export interface StoreFactoryActualStoreContextV2 {
  id: string;
  slug: string;
  name: string;
  niche: string;
  launchStatus: string;
  isActive: boolean;
}

export interface StoreFactoryV2CommandCenterProps {
  fixtures: readonly ReferenceStoreFactoryFixtureV2[];
  initialFixtureKey?: string | null;
  initialRevisionId?: string | null;
  schemaCapability: StoreFactorySchemaCapabilityViewV2;
  featureFlagEnabled: boolean;
  pilotEnabled?: boolean;
  actualStore?: StoreFactoryActualStoreContextV2 | null;
}

type PreviewViewportV2 = 375 | 768 | 1440;

function selectInitialFixture(
  fixtures: readonly ReferenceStoreFactoryFixtureV2[],
  key: string | null | undefined
): ReferenceStoreFactoryFixtureV2 {
  const fixture = fixtures.find((candidate) => candidate.key === key);
  return fixture ?? fixtures[0];
}

function selectRevision(
  fixture: ReferenceStoreFactoryFixtureV2,
  revisionId: string | null | undefined
): ReferenceStoreRevisionV2 {
  return (
    fixture.revisions.find((revision) => revision.id === revisionId) ??
    fixture.revisions.find(
      (revision) => revision.id === fixture.selectedRevisionId
    ) ??
    fixture.revisions[fixture.revisions.length - 1]
  );
}

function compactValue(value: unknown): string {
  if (value === undefined) return "—";
  const encoded = JSON.stringify(value);
  if (!encoded) return String(value);
  return encoded.length > 130 ? `${encoded.slice(0, 127)}…` : encoded;
}

function badgeClass(tone: "green" | "amber" | "slate" | "violet") {
  return {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    slate: "bg-slate-200 text-slate-700",
    violet: "bg-violet-100 text-violet-800",
  }[tone];
}

export function StoreFactoryV2CommandCenter({
  fixtures,
  initialFixtureKey,
  initialRevisionId,
  schemaCapability,
  featureFlagEnabled,
  pilotEnabled = false,
  actualStore = null,
}: StoreFactoryV2CommandCenterProps) {
  const initialFixture = selectInitialFixture(fixtures, initialFixtureKey);
  const [fixtureKey, setFixtureKey] = useState(initialFixture.key);
  const [revisionByFixture, setRevisionByFixture] = useState<
    Record<string, string>
  >({
    [initialFixture.key]: selectRevision(initialFixture, initialRevisionId).id,
  });
  const [viewport, setViewport] = useState<PreviewViewportV2>(1440);

  const fixture =
    fixtures.find((candidate) => candidate.key === fixtureKey) ?? fixtures[0];
  const revision = selectRevision(
    fixture,
    revisionByFixture[fixture.key] ?? fixture.selectedRevisionId
  );
  const selectedIsCurrent = revision.id === fixture.selectedRevisionId;
  const persistenceReady =
    featureFlagEnabled && schemaCapability.persistenceEnabled;
  const buildReady = Boolean(
    persistenceReady &&
      pilotEnabled &&
      actualStore?.launchStatus === "PREVIEW" &&
      actualStore.isActive
  );
  const controlsReason = !featureFlagEnabled
    ? "STOREFRONT_V2_ENABLED is off."
    : !schemaCapability.persistenceEnabled
      ? `Schema capability is ${schemaCapability.status.toLowerCase()}.`
      : !actualStore
        ? "Open Experience V2 from an exact store to create a persisted draft."
        : !pilotEnabled
          ? "Persisted actions require an active PREVIEW store in STOREFRONT_V2_PILOT_STORE_IDS."
        : "Create a draft below; review and CAS controls appear in its persisted workspace.";

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Universal Store Factory V2
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Reference Store Command Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                One provider-neutral catalog contract and one protected renderer,
                exercised across three structurally different synthetic stores.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass("violet")}`}>
                SYNTHETIC
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass("slate")}`}>
                PREVIEW ONLY
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass("slate")}`}>
                NOINDEX
              </span>
            </div>
          </div>
        </div>

        {actualStore ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-7">
            <p className="text-sm font-bold text-amber-950">
              Fixture overlay on real tenant: {actualStore.name} ({actualStore.slug})
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Read-only context: {actualStore.launchStatus} · {actualStore.isActive ? "active" : "inactive"}. The catalog, manifest and revisions below are synthetic and do not replace this store&apos;s data, routing or launch state.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7">
          {fixtures.map((candidate) => {
            const active = candidate.key === fixture.key;
            return (
              <button
                key={candidate.key}
                type="button"
                data-fixture-key={candidate.key}
                aria-pressed={active}
                onClick={() => {
                  setFixtureKey(candidate.key);
                  setRevisionByFixture((current) => ({
                    ...current,
                    [candidate.key]:
                      current[candidate.key] ?? candidate.selectedRevisionId,
                  }));
                }}
                className={`rounded-xl border p-4 text-left transition motion-reduce:transition-none ${
                  active
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  {candidate.catalog.products.length} products
                </span>
                <span className="mt-2 block text-lg font-bold text-slate-950">
                  {candidate.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {candidate.summary}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Current workspace
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {fixture.storeName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {fixture.niche} · {fixture.proposalId}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{fixture.catalog.products.length} projected products</p>
                <p>{fixture.catalog.categories.length} taxonomy nodes</p>
                <p>{revision.manifest.version}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {fixture.revisions.map((candidate) => {
                const active = candidate.id === revision.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    data-revision-id={candidate.id}
                    data-revision-number={candidate.revisionNumber}
                    aria-pressed={active}
                    onClick={() =>
                      setRevisionByFixture((current) => ({
                        ...current,
                        [fixture.key]: candidate.id,
                      }))
                    }
                    className={`rounded-xl border p-4 text-left ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        Revision {candidate.revisionNumber}
                      </span>
                      <span className="flex flex-wrap justify-end gap-1">
                        {candidate.id === fixture.activeReferenceRevisionId ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-cyan-400/20 text-cyan-100" : "bg-cyan-100 text-cyan-800"}`}
                          >
                            ACTIVE REFERENCE
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            active
                              ? "bg-white/15 text-white"
                              : candidate.status === "APPROVED"
                                ? badgeClass("green")
                                : badgeClass("amber")
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </span>
                    </span>
                    <span className={`mt-2 block text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                      {candidate.label}
                    </span>
                    <span className={`mt-1 block break-all font-mono text-[10px] ${active ? "text-slate-400" : "text-slate-400"}`}>
                      {candidate.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Responsive renderer preview</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Session-only shopper controls; no persistence, providers, analytics or checkout writes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Preview viewport">
                {([375, 768, 1440] as const).map((width) => (
                  <button
                    key={width}
                    type="button"
                    data-preview-width={width}
                    aria-pressed={viewport === width}
                    onClick={() => setViewport(width)}
                    className={`min-h-11 rounded-lg px-3 py-2 text-xs font-bold ${
                      viewport === width
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {width}px
                  </button>
                ))}
              </div>
            </div>

            <div
              className="mt-5 min-w-0 max-w-full"
              data-current-fixture={fixture.key}
              data-current-revision={revision.id}
            >
              <ResponsivePreviewCanvasV2
                viewport={viewport}
                previewTitle={`${fixture.storeName} revision ${revision.revisionNumber}`}
                previewUrl={`/admin-preview/store-factory-v2?fixture=${encodeURIComponent(fixture.key)}&revision=${encodeURIComponent(revision.id)}`}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Structural revision diff</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Baseline revision 1 → selected revision {revision.revisionNumber}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedIsCurrent ? badgeClass("amber") : badgeClass("green")}`}>
                {selectedIsCurrent
                  ? `${fixture.diff.totalChanges} changes`
                  : "No changes"}
              </span>
            </div>
            {selectedIsCurrent ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Path</th>
                      <th className="py-2 pr-4 font-semibold">Kind</th>
                      <th className="py-2 pr-4 font-semibold">Before</th>
                      <th className="py-2 font-semibold">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fixture.diff.entries.slice(0, 12).map((entry) => (
                      <tr key={`${entry.kind}:${entry.path}`}>
                        <td className="py-2 pr-4 font-mono text-slate-700">{entry.path}</td>
                        <td className="py-2 pr-4 font-bold text-violet-700">{entry.kind}</td>
                        <td className="max-w-[220px] break-all py-2 pr-4 font-mono text-slate-500">{compactValue(entry.before)}</td>
                        <td className="max-w-[220px] break-all py-2 font-mono text-slate-700">{compactValue(entry.after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                The approved baseline is selected, so the comparison is empty.
              </p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-slate-950">Persistence capability</h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${schemaCapability.persistenceEnabled ? badgeClass("green") : badgeClass("amber")}`}>
                {schemaCapability.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {schemaCapability.check === "UNAVAILABLE"
                ? "The read-only schema inspection could not complete. Persistence fails closed."
                : `${schemaCapability.satisfied} of ${schemaCapability.expected} required schema artifacts were verified.`}
            </p>
            <p className="mt-2 font-mono text-[10px] text-slate-400">
              {schemaCapability.version}
            </p>
            {!schemaCapability.persistenceEnabled ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-900">Manual schema checkpoint required</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  No migration is applied by this page. Reference previews remain in memory only.
                </p>
              </div>
            ) : null}
            {schemaCapability.missing.length > 0 ? (
              <details className="mt-3 text-xs text-slate-600">
                <summary className="cursor-pointer font-semibold">
                  Missing artifacts ({schemaCapability.missing.length})
                </summary>
                <ul className="mt-2 space-y-1 break-all font-mono text-[10px]">
                  {schemaCapability.missing.slice(0, 8).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Build timeline</h2>
            <ol className="mt-4 space-y-4">
              {fixture.buildTimeline.map((event) => (
                <li key={event.sequence} className="grid grid-cols-[24px_1fr] gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-extrabold text-emerald-800">
                    {event.sequence}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {event.phase.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">{event.contractVersion}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Promotion blockers</h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              <li className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-900">
                {featureFlagEnabled ? "FEATURE_FLAG_ON" : "FEATURE_FLAG_OFF"}
              </li>
              <li className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-900">
                {schemaCapability.persistenceEnabled
                  ? "SCHEMA_COMPLETE"
                  : "SCHEMA_NOT_READY"}
              </li>
              <li className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-900">
                SHARED_PASSWORD_HAS_NO_NAMED_REVIEWER
              </li>
              {fixture.guardrails.map((guardrail) => (
                <li key={guardrail} className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-[10px]">
                  {guardrail}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-slate-950">Revision controls</h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${buildReady ? badgeClass("green") : badgeClass("slate")}`}>
                {buildReady ? "BUILD READY" : "LOCKED"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{controlsReason}</p>
            {actualStore ? (
              <div className="mt-4 grid gap-2">
                {(["BASELINE", "REFINED"] as const).map((experienceVariant) => (
                  <form
                    key={experienceVariant}
                    action={buildReferenceStoreFactoryV2Action}
                  >
                    <input type="hidden" name="storeId" value={actualStore.id} />
                    <input type="hidden" name="storeSlug" value={actualStore.slug} />
                    <input type="hidden" name="fixtureKey" value={fixture.key} />
                    <input
                      type="hidden"
                      name="experienceVariant"
                      value={experienceVariant}
                    />
                    <button
                      type="submit"
                      disabled={!buildReady || experienceVariant === "REFINED"}
                      className="w-full rounded-lg bg-violet-700 px-3 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      Create {experienceVariant.toLowerCase()} draft
                    </button>
                  </form>
                ))}
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Start with BASELINE. REFINED becomes available in the persisted workspace only after the baseline is approved and promoted. The server binds actor, request key, digests and base revision.
                </p>
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["Approve", "Reject", "Promote preview", "Rollback"].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  title={controlsReason}
                  className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-400">
              Preview approval never grants LIVE, legal, domain or launch approval.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
