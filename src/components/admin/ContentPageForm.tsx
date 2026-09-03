"use client";

import { useActionState } from "react";
import {
  saveContentPageAction,
  type AdminContentActionState,
} from "@/lib/actions/admin-content";
import { CONTENT_PAGE_TYPES, type ContentPageType } from "@/lib/types";

const initialState: AdminContentActionState = { ok: false, error: null };

export interface AdminContentDraft {
  id?: string;
  slug: string;
  type: ContentPageType;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  heroImageUrl: string | null;
  isPublished: boolean;
  noindex: boolean;
}

export function ContentPageForm({
  store,
  content,
}: {
  store: { id: string; slug: string; name: string; launchStatus: string };
  content: AdminContentDraft;
}) {
  const [state, formAction, isPending] = useActionState(
    saveContentPageAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="storeId" value={store.id} />
      {content.id && <input type="hidden" name="contentId" value={content.id} />}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
              {content.id ? "Edit content" : "New content draft"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {content.id ? content.title : `Create for ${store.name}`}
            </h2>
          </div>
          <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">
            {store.launchStatus}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Type
            <select
              name="type"
              defaultValue={content.type}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            >
              {CONTENT_PAGE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              GUIDE, COMPARISON and FAQ have storefront consumers. LANDING and POLICY remain drafts.
            </span>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Slug
            <input
              name="slug"
              defaultValue={content.slug}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono"
              placeholder="practical-guide"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Title
          <input
            name="title"
            defaultValue={content.title}
            minLength={3}
            maxLength={120}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Excerpt / direct answer
          <textarea
            name="excerpt"
            defaultValue={content.excerpt}
            minLength={20}
            maxLength={360}
            rows={3}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Body
          <textarea
            name="body"
            defaultValue={content.body}
            minLength={20}
            maxLength={60000}
            rows={16}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm leading-6"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            GUIDE supports the reviewed Markdown subset. FAQ requires a JSON array of question/answer objects.
          </span>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Hero image URL (optional)
          <input
            name="heroImageUrl"
            type="url"
            defaultValue={content.heroImageUrl ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">SEO and publication</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              The server re-runs claim, thin-content and duplicate checks on every save.
              Non-LIVE stores are always noindex.
            </p>
          </div>
          {store.launchStatus !== "LIVE" && (
            <span className="rounded bg-amber-100 px-2 py-1 font-mono text-[10px] text-amber-800">
              FORCED NOINDEX
            </span>
          )}
        </div>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          SEO title
          <input
            name="seoTitle"
            defaultValue={content.seoTitle}
            minLength={10}
            maxLength={70}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          SEO description
          <textarea
            name="seoDescription"
            defaultValue={content.seoDescription}
            minLength={40}
            maxLength={170}
            rows={3}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={content.isPublished}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-semibold text-slate-800">Published</span>
              <span className="block text-xs text-slate-500">Only if route and guardrails permit it.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
            <input
              type="checkbox"
              name="noindex"
              defaultChecked={content.noindex || store.launchStatus !== "LIVE"}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-semibold text-slate-800">Noindex</span>
              <span className="block text-xs text-slate-500">Also forced for drafts, thin copy and non-LIVE stores.</span>
            </span>
          </label>
        </div>
      </section>

      <div className="sticky bottom-4 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"
        >
          {isPending ? "Checking and saving…" : "Check and save content"}
        </button>
        {state.error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{state.error}</p>}
        {state.ok && state.message && <p className="mt-3 text-sm font-medium text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
