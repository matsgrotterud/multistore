import type { StoreFoundationV1 } from "@/lib/storefront/store-foundation-contract";

export function StoreFoundationPreview({
  foundation,
  heroTitle,
  heroBody,
}: {
  foundation: StoreFoundationV1;
  heroTitle: string;
  heroBody: string;
}) {
  const theme = foundation.themeSnapshot;
  return (
    <section
      aria-label="Admin-only store foundation preview"
      className="overflow-hidden rounded-2xl border border-slate-300 shadow-xl"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
    >
      <div className="bg-slate-950 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white">
        Foundation draft · no catalog approved · noindex
      </div>
      <header className="flex items-center justify-between border-b border-current/10 px-5 py-4">
        <span className="text-sm font-extrabold tracking-tight">
          {foundation.identity.logoText}
        </span>
        <span className="rounded-full border border-current/20 px-3 py-1 text-[10px] uppercase tracking-wide opacity-65">
          Admin preview
        </span>
      </header>
      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: theme.primaryColor }}
        >
          {foundation.identity.niche}
        </p>
        <h2 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {heroTitle}
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 opacity-75 sm:text-base">
          {heroBody}
        </p>
        <div className="mt-7 inline-flex cursor-not-allowed rounded-lg border border-current/20 px-4 py-2 text-xs font-semibold opacity-55">
          Catalog actions stay locked
        </div>
      </div>
      <div className="grid gap-px border-y border-current/10 bg-current/10 sm:grid-cols-3">
        {foundation.homepage.principles.map((principle) => (
          <article
            key={principle.id}
            className="p-5"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <h3 className="text-sm font-bold">{principle.title}</h3>
            <p className="mt-2 text-xs leading-5 opacity-70">{principle.body}</p>
          </article>
        ))}
      </div>
      <div className="p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-50">
          Store state
        </p>
        <h3 className="mt-2 text-xl font-bold">
          {foundation.homepage.catalogStatus.title}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">
          {foundation.homepage.catalogStatus.body}
        </p>
      </div>
    </section>
  );
}
