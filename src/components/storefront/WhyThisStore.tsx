import type { HomepageCopy } from "@/lib/storefront/homepage-content";

/**
 * Editorial "why this store" section — a large honest statement followed by
 * hairline-separated value columns. Honest brand reasons (curation,
 * transparency, intent) derived from the store record; no fabricated proof.
 */
export function WhyThisStore({ copy }: { copy: HomepageCopy }) {
  return (
    <section aria-labelledby="why-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Our promise
        </p>
        <h2
          id="why-heading"
          className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl"
        >
          {copy.whyTitle}
        </h2>
        <p className="mt-5 text-lg leading-8 text-ink/55">{copy.whyBody}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-px overflow-hidden rounded-theme-lg border border-ink/10 bg-ink/10 sm:grid-cols-3">
        {copy.whyPillars.map((pillar) => (
          <div key={pillar.title} className="bg-white p-8">
            <h3 className="font-heading text-lg font-semibold tracking-tight text-ink">
              {pillar.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink/55">{pillar.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
