"use client";

import Link from "next/link";
import { useState } from "react";
import { ResponsivePreviewCanvasV2 } from "@/components/admin/ResponsivePreviewCanvasV2";
import {
  buildReferenceStoreFactoryV2Action,
  mutateStoreFactoryV2PreviewPointerAction,
  reviewStoreFactoryV2RevisionAction,
} from "@/lib/actions/admin-store-factory-v2";
import type { PersistedStoreFactoryWorkspaceV2 } from "@/lib/admin/store-factory-v2-runtime";

type Viewport = 375 | 768 | 1440;

export interface PersistedStoreFactoryV2CommandCenterProps {
  workspace: PersistedStoreFactoryWorkspaceV2;
  resultCode?: string | null;
}

function compact(value: unknown): string {
  if (value === undefined) return "—";
  const encoded = JSON.stringify(value);
  if (!encoded) return String(value);
  return encoded.length > 120 ? `${encoded.slice(0, 117)}…` : encoded;
}

function formatTimestamp(value: string): string {
  return value.replace("T", " ").replace(".000Z", " UTC");
}

function resultMessage(code: string | null | undefined): {
  tone: "success" | "error";
  text: string;
} | null {
  const successes: Record<string, string> = {
    BUILD: "Immutable synthetic reference draft created after deterministic QA.",
    BUILD_REPLAY: "Existing idempotent reference build replayed without duplicate history.",
    APPROVE: "Revision approved for internal preview only.",
    REJECT: "Revision rejected. Immutable history was retained.",
    PROMOTE: "Active preview pointer promoted with compare-and-swap.",
    ROLLBACK: "Active preview pointer rolled back with compare-and-swap.",
  };
  if (!code) return null;
  if (successes[code]) return { tone: "success", text: successes[code] };
  return {
    tone: "error",
    text: `Operation refused (${code}). Reloaded state is authoritative.`,
  };
}

export function PersistedStoreFactoryV2CommandCenter({
  workspace,
  resultCode,
}: PersistedStoreFactoryV2CommandCenterProps) {
  const [viewport, setViewport] = useState<Viewport>(1440);
  const [reason, setReason] = useState("");
  const selected = workspace.selectedRevision;
  const active = workspace.revisions.find((revision) => revision.activePreview);
  const canReview = selected.status === "DRAFT";
  const canPromote = Boolean(
    selected.status === "APPROVED" &&
      !selected.activePreview &&
      (!active || selected.revisionNumber > active.revisionNumber)
  );
  const canRollback = Boolean(
    selected.status === "APPROVED" &&
      active &&
      active.id !== selected.id &&
      selected.revisionNumber < active.revisionNumber
  );
  const hasReason = reason.trim().length >= 6;
  const notice = resultMessage(resultCode);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Persisted Store Factory V2
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                {workspace.storeName} · revision {selected.revisionNumber}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Tenant-scoped immutable catalog, content and experience artifacts rendered through the protected storefront runtime.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">SCHEMA COMPLETE</span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">PREVIEW ONLY</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">NOINDEX</span>
            </div>
          </div>
        </div>
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-xs leading-5 text-amber-900">
          Preview approval changes only the internal revision workflow or CAS pointer. It cannot change LIVE status, domains, checkout, legal approval or indexing.
        </div>
      </section>

      {notice ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Storefront renderer</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {workspace.catalog.products.length} products · {workspace.catalog.categories.length} taxonomy nodes · shopper state is memory-only
                </p>
              </div>
              <div className="flex gap-2" aria-label="Preview viewport">
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
            <div className="mt-5 min-w-0 max-w-full">
              <ResponsivePreviewCanvasV2
                viewport={viewport}
                previewTitle={`${workspace.storeName} revision ${selected.revisionNumber}`}
                previewUrl={`/admin-preview/store-factory-v2?mode=persisted&store=${encodeURIComponent(workspace.storeSlug)}&revision=${encodeURIComponent(selected.id)}`}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Immutable structural diff</h2>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {workspace.diffBaseRevisionId
                    ? `${workspace.diffBaseRevisionId} → ${selected.id}`
                    : `Initial revision ${selected.id}`}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                {workspace.diff.totalChanges} changes
              </span>
            </div>
            <div className="mt-4 max-h-96 overflow-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="sticky top-0 bg-white text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Path</th>
                    <th className="py-2 pr-4">Kind</th>
                    <th className="py-2 pr-4">Before</th>
                    <th className="py-2">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workspace.diff.entries.map((entry) => (
                    <tr key={`${entry.kind}:${entry.path}`}>
                      <td className="py-2 pr-4 font-mono text-slate-700">{entry.path}</td>
                      <td className="py-2 pr-4 font-bold text-violet-700">{entry.kind}</td>
                      <td className="max-w-[220px] break-all py-2 pr-4 font-mono text-slate-500">{compact(entry.before)}</td>
                      <td className="max-w-[220px] break-all py-2 font-mono text-slate-700">{compact(entry.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold">Build next immutable draft</h2>
              <div className="flex flex-wrap justify-end gap-1">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  SELECTED {workspace.build.experienceVariant}
                </span>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                  ACTIVE {workspace.build.activeExperienceVariant ?? "NONE"}
                </span>
              </div>
            </div>
            {workspace.build.fixtureKey ? (
              <div className="mt-4 grid gap-2">
                {(["BASELINE", "REFINED"] as const).map(
                  (experienceVariant) => {
                    const eligible =
                      experienceVariant === "BASELINE"
                        ? workspace.build.canCreateBaseline
                        : workspace.build.canCreateRefined;
                    return (
                      <form
                        key={experienceVariant}
                        action={buildReferenceStoreFactoryV2Action}
                      >
                        <input
                          type="hidden"
                          name="storeId"
                          value={workspace.storeId}
                        />
                        <input
                          type="hidden"
                          name="storeSlug"
                          value={workspace.storeSlug}
                        />
                        <input
                          type="hidden"
                          name="fixtureKey"
                          value={workspace.build.fixtureKey ?? ""}
                        />
                        <input
                          type="hidden"
                          name="experienceVariant"
                          value={experienceVariant}
                        />
                        <button
                          type="submit"
                          disabled={!eligible}
                          title={
                            experienceVariant === "REFINED" && !eligible
                              ? workspace.build.refinedEligibilityReason
                              : undefined
                          }
                          className="w-full rounded-lg bg-violet-700 px-3 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {experienceVariant === "BASELINE"
                            ? "Replay baseline input"
                            : "Create refined draft from active preview"}
                        </button>
                      </form>
                    );
                  }
                )}
                <p className="text-[10px] leading-4 text-slate-400">
                  Build identity and the refined base revision are resolved server-side. Replaying identical baseline input cannot duplicate history.
                </p>
                {!workspace.build.canCreateRefined ? (
                  <p className="text-[10px] leading-4 text-amber-700">
                    REFINED is locked by the server: {workspace.build.refinedEligibilityReason}.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-amber-800">
                This revision is not bound to an allowlisted reference fixture, so synthetic rebuild controls are hidden.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Revision history</h2>
            <div className="mt-4 space-y-2">
              {workspace.revisions.map((revision) => (
                <Link
                  key={revision.id}
                  href={`/admin/stores/${workspace.storeSlug}/experience?revision=${encodeURIComponent(revision.id)}`}
                  aria-current={revision.id === selected.id ? "page" : undefined}
                  className={`block rounded-xl border p-3 ${
                    revision.id === selected.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      Revision {revision.revisionNumber}
                    </span>
                    <span className="text-[10px] font-bold">{revision.status}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2 text-[10px] opacity-75">
                    {revision.activePreview ? <span>ACTIVE PREVIEW</span> : null}
                    <time dateTime={revision.createdAt}>
                      {formatTimestamp(revision.createdAt)}
                    </time>
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-slate-400">
              Showing up to 50 recent revisions.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Append-only timeline</h2>
            <ol className="mt-4 space-y-4">
              {workspace.events.map((event) => (
                <li key={event.id} className="grid grid-cols-[24px_1fr] gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    {event.sequence}
                  </span>
                  <div>
                    <p className="text-xs font-bold">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {event.detail}
                    </p>
                    {event.audit.previousRevisionId || event.audit.targetRevisionId ? (
                      <p className="mt-1 break-all font-mono text-[10px] text-slate-500">
                        {event.audit.previousRevisionId ?? "none"}
                        {" → "}
                        {event.audit.targetRevisionId ?? "none"}
                        {event.audit.previousPointerVersion !== null &&
                        event.audit.pointerVersion !== null
                          ? ` · CAS ${event.audit.previousPointerVersion} → ${event.audit.pointerVersion}`
                          : ""}
                      </p>
                    ) : null}
                    {event.audit.actor || event.audit.reason ? (
                      <p className="mt-1 text-[10px] leading-4 text-slate-400">
                        {[event.audit.actor, event.audit.reason]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-slate-400">
                      <span className="break-all font-mono">{event.buildRunId}</span>
                      {" · "}
                      <time dateTime={event.createdAt}>
                        {formatTimestamp(event.createdAt)}
                      </time>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold">Preview revision controls</h2>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                CAS v{workspace.pointer.version}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              The shared admin session is recorded honestly as shared-admin-session; it is not a named legal approver.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Audit reason
                <textarea
                  name="reason"
                  required
                  minLength={6}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
                  placeholder="Why should this preview state change?"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["APPROVE", "REJECT"] as const).map((intent) => (
                  <form key={intent} action={reviewStoreFactoryV2RevisionAction}>
                    <MutationBindingFields
                      workspace={workspace}
                      reason={reason}
                      includeOutputDigest
                    />
                    <button
                      type="submit"
                      name="intent"
                      value={intent}
                      disabled={!canReview || !hasReason}
                      className={`w-full rounded-lg px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${intent === "APPROVE" ? "bg-emerald-700" : "bg-rose-700"}`}
                    >
                      {intent === "APPROVE" ? "Approve" : "Reject"}
                    </button>
                  </form>
                ))}
                {(["PROMOTE", "ROLLBACK"] as const).map((intent) => (
                  <form
                    key={intent}
                    action={mutateStoreFactoryV2PreviewPointerAction}
                  >
                    <MutationBindingFields workspace={workspace} reason={reason} />
                    <input
                      type="hidden"
                      name="expectedPointerVersion"
                      value={workspace.pointer.version}
                    />
                    <button
                      type="submit"
                      name="intent"
                      value={intent}
                      disabled={
                        !(intent === "PROMOTE" ? canPromote : canRollback) ||
                        !hasReason
                      }
                      className={`w-full rounded-lg px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${intent === "PROMOTE" ? "bg-violet-700" : "bg-slate-800"}`}
                    >
                      {intent === "PROMOTE" ? "Promote preview" : "Roll back here"}
                    </button>
                  </form>
                ))}
              </div>
            </div>
            <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Revision</dt>
                <dd className="break-all font-mono">{selected.id}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-bold">{selected.status}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Scope</dt>
                <dd className="font-bold">{workspace.activation.scope}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Output digest</dt>
                <dd className="max-w-[190px] truncate font-mono">
                  {selected.outputDigest}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MutationBindingFields({
  workspace,
  reason,
  includeOutputDigest = false,
}: {
  workspace: PersistedStoreFactoryWorkspaceV2;
  reason: string;
  includeOutputDigest?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="storeId" value={workspace.storeId} />
      <input type="hidden" name="storeSlug" value={workspace.storeSlug} />
      <input type="hidden" name="revisionId" value={workspace.selectedRevision.id} />
      {includeOutputDigest ? (
        <input
          type="hidden"
          name="expectedOutputDigest"
          value={workspace.selectedRevision.outputDigest}
        />
      ) : null}
      <input type="hidden" name="reason" value={reason} />
    </>
  );
}
