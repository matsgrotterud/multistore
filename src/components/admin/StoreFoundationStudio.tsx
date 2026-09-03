"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  updateStoreFoundationAction,
  type StoreFoundationActionState,
} from "@/lib/actions/admin-store-foundation";
import type { StoreFoundationStudioData } from "@/lib/admin/store-foundation";
import { StoreFoundationPreview } from "./StoreFoundationPreview";

const initialState: StoreFoundationActionState = { ok: false, error: null };

export function StoreFoundationStudio({
  data,
}: {
  data: StoreFoundationStudioData;
}) {
  const [state, formAction, isPending] = useActionState(
    updateStoreFoundationAction,
    initialState
  );
  const [heroTitle, setHeroTitle] = useState(data.foundation.homepage.hero.title);
  const [heroBody, setHeroBody] = useState(data.foundation.homepage.hero.body);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
              Store Foundation V1
            </p>
            <h2 className="mt-2 text-xl font-bold">Pre-catalog creative system</h2>
            <p className="mt-1 max-w-3xl leading-6 text-violet-900/80">
              This studio changes only the versioned admin draft stored in settings.
              It never activates the tenant, publishes content, opens checkout,
              changes domains or produces analytics.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 font-mono text-[10px] ring-1 ring-violet-200">
            {data.persisted ? "SAVED DRAFT" : "UNSAVED PROPOSAL"}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="slug" value={data.store.slug} />
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">Foundation copy</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Merchant-brief copy only. Catalog-dependent claims are blocked on save.
            </p>
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Hero title
              <input
                name="heroTitle"
                value={heroTitle}
                onChange={(event) => setHeroTitle(event.target.value)}
                minLength={3}
                maxLength={90}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Hero body
              <textarea
                name="heroBody"
                value={heroBody}
                onChange={(event) => setHeroBody(event.target.value)}
                minLength={20}
                maxLength={420}
                rows={5}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">SEO draft</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Planning metadata only; status is always DRAFT_NOINDEX.
                </p>
              </div>
              <span className="rounded bg-amber-100 px-2 py-1 font-mono text-[10px] text-amber-800">
                DRAFT_NOINDEX
              </span>
            </div>
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Draft title
              <input
                name="seoTitle"
                defaultValue={data.foundation.seoDraft.title}
                minLength={10}
                maxLength={70}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Draft description
              <textarea
                name="seoDescription"
                defaultValue={data.foundation.seoDraft.description}
                minLength={40}
                maxLength={170}
                rows={4}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-950">Content briefs</h2>
            <ul className="mt-3 space-y-3">
              {data.foundation.seoDraft.topicBriefs.map((brief) => (
                <li key={brief.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{brief.title}</p>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[9px] ${
                        brief.state === "WAITING_FOR_CATALOG"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {brief.state}
                    </span>
                  </div>
                  <p className="mt-1.5 leading-5 text-slate-600">{brief.angle}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="sticky bottom-4 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {isPending ? "Auditing…" : "Audit and save foundation"}
              </button>
              <Link
                href={`/admin/stores/${data.store.slug}/design`}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Edit visual system
              </Link>
            </div>
            {state.error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{state.error}</p>}
            {state.ok && state.message && <p className="mt-3 text-sm font-medium text-emerald-700">{state.message}</p>}
          </div>
        </form>

        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <StoreFoundationPreview
            foundation={data.foundation}
            heroTitle={heroTitle}
            heroBody={heroBody}
          />
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-950">
                {data.persisted ? "Saved draft audit" : "Proposal audit"}
              </h2>
              <span className={data.currentAudit.status === "PASS" ? "rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800" : "rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"}>
                {data.currentAudit.status}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {data.currentAudit.checks.map((check) => (
                <li key={check.id} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                  <span className={check.status === "PASS" ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
                    {check.status}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] text-slate-500">{check.id}</p>
                    <p className="mt-1 leading-5 text-slate-700">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-900">Immutable draft identity</summary>
            <dl className="mt-3 grid gap-2">
              <div><dt className="text-slate-400">Input digest</dt><dd className="break-all font-mono">{data.foundation.inputDigest}</dd></div>
              <div><dt className="text-slate-400">Foundation digest</dt><dd className="break-all font-mono">{data.foundation.foundationDigest}</dd></div>
            </dl>
          </details>
        </div>
      </div>
    </div>
  );
}
