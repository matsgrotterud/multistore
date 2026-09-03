import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  ContentPageForm,
  type AdminContentDraft,
} from "@/components/admin/ContentPageForm";
import { publicContentPath } from "@/lib/content/admin-content-policy";
import { CONTENT_PAGE_TYPES, type ContentPageType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; edit?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const stores = await prisma.store.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      launchStatus: true,
      isActive: true,
    },
  });
  const activeStore =
    stores.find((store) => store.slug === filters.store) ?? stores[0];
  if (!activeStore) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Content Studio</h1>
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Create a store before authoring content.
        </p>
      </div>
    );
  }

  const pages = await prisma.contentPage.findMany({
    where: { storeId: activeStore.id },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
  const selected = pages.find((page) => page.id === filters.edit);
  const draft: AdminContentDraft = selected
    ? {
        id: selected.id,
        slug: selected.slug,
        type: isContentType(selected.type) ? selected.type : "GUIDE",
        title: selected.title,
        excerpt: selected.excerpt,
        body: selected.body,
        seoTitle: selected.seoTitle,
        seoDescription: selected.seoDescription,
        heroImageUrl: selected.heroImageUrl,
        isPublished: selected.isPublished,
        noindex: selected.noindex,
      }
    : {
        slug: "",
        type: "GUIDE",
        title: "",
        excerpt: "",
        body: "",
        seoTitle: "",
        seoDescription: "",
        heroImageUrl: null,
        isPublished: false,
        noindex: true,
      };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
            Content policy v1
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Content Studio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Draft and review editorial pages without touching products. Unsafe claims,
            thin copy, duplicate copy, unsupported routes and non-LIVE stores fail closed.
          </p>
        </div>
        <Link
          href={`/admin/stores/${activeStore.slug}/foundation`}
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Foundation briefs
        </Link>
      </div>

      <nav aria-label="Filter by store" className="mt-5 flex flex-wrap gap-2">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/admin/content?store=${store.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              store.id === activeStore.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {store.name} <span className="opacity-60">· {store.slug}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{activeStore.name} inventory</h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeStore.launchStatus} · {pages.length} page(s)
              </p>
            </div>
            <Link
              href={`/admin/content?store=${activeStore.slug}`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              New draft
            </Link>
          </div>

          {pages.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No persistent content pages yet. Foundation briefs remain drafts until you choose to author one here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pages.map((page) => {
                const type: ContentPageType = isContentType(page.type) ? page.type : "GUIDE";
                const path = publicContentPath({
                  storeSlug: activeStore.slug,
                  type,
                  slug: page.slug,
                });
                const wordCount = page.body.trim().split(/\s+/).filter(Boolean).length;
                return (
                  <article key={page.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">{type}</span>
                          <span className={page.isPublished ? "rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800" : "rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"}>
                            {page.isPublished ? "PUBLISHED" : "DRAFT"}
                          </span>
                          {page.noindex && <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">NOINDEX</span>}
                        </div>
                        <h3 className="mt-2 font-semibold text-slate-950">{page.title}</h3>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">{page.slug} · {wordCount} words</p>
                      </div>
                      <Link
                        href={`/admin/content?store=${activeStore.slug}&edit=${page.id}`}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{page.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
                      <span>SEO {page.seoTitle.length}/70</span>
                      <span>Description {page.seoDescription.length}/170</span>
                      {path && page.isPublished && activeStore.isActive ? (
                        <a href={path} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Open route</a>
                      ) : (
                        <span>{path ? "Route not publicly active" : "No storefront route"}</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <ContentPageForm store={activeStore} content={draft} />
      </div>
    </div>
  );
}

function isContentType(value: string): value is ContentPageType {
  return (CONTENT_PAGE_TYPES as readonly string[]).includes(value);
}
