"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createFoundationStoreAction,
  type FoundationStoreActionState,
} from "@/lib/actions/admin-foundation-store";

const initialState: FoundationStoreActionState = { ok: false, error: null };

export function FoundationStoreGenerator({
  idempotencyKey,
}: {
  idempotencyKey: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createFoundationStoreAction,
    initialState
  );
  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            Start before catalog
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Create a Store Foundation only
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Creates an inactive DRAFT with brand identity, versioned visual direction,
            homepage principles and noindex SEO briefs. It resolves no supplier, writes
            no category or product, creates no public route and records no analytics.
          </p>
        </div>
        <span className="rounded-full bg-violet-700 px-3 py-1.5 font-mono text-[10px] text-white">
          foundation-store-plan.v1
        </span>
      </div>

      <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <label className="text-sm font-medium text-slate-700">
          Store idea / niche
          <input name="niche" required minLength={3} maxLength={160} placeholder="camera drones" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Brand name (optional)
          <input name="brandName" maxLength={80} placeholder="Aerial North" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Intended audience
          <input name="audience" required minLength={3} maxLength={240} placeholder="new creators learning aerial photography" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Brand voice
          <input name="brandVoice" required minLength={3} maxLength={240} defaultValue="clear, useful and honest" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Locale
          <input name="locale" required defaultValue="nb-NO" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Country
          <input name="country" required defaultValue="Norway" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Planned production hostname (optional intent only)
          <input name="plannedDomain" placeholder="aerialnorth.no" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono" />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            This does not create a Domain routing row, buy a domain or verify DNS/TLS.
          </span>
        </label>
        <div className="md:col-span-2">
          <button type="submit" disabled={isPending || Boolean(state.result)} className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
            {isPending ? "Creating inactive foundation…" : "Create inactive foundation DRAFT"}
          </button>
        </div>
      </form>

      {state.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{state.error}</p>}
      {state.result && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-bold">
            {state.result.storeName} foundation {state.result.replayed ? "recovered" : "created"}
          </p>
          <p className="mt-1 text-xs leading-5">
            {state.result.isActive ? "Active" : "Inactive"} {state.result.launchStatus} · foundation {state.result.foundationStatus} · no catalog,
            provider, domain mapping, checkout or storefront activation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/admin/stores/${state.result.storeSlug}/foundation`} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white">Open Foundation Studio</Link>
            <Link href="/admin/seo-audit" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-emerald-200">Readiness queue</Link>
          </div>
          <p className="mt-3 break-all font-mono text-[10px] text-emerald-800">{state.result.foundationDigest}</p>
        </div>
      )}
    </section>
  );
}
