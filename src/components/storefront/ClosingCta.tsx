import Link from "next/link";
import type { HomepageCopy } from "@/lib/storefront/homepage-content";

interface Cta {
  label: string;
  href: string;
}

/** Polished closing confidence section with a clear final CTA. */
export function ClosingCta({
  copy,
  primaryCta,
  secondaryCta,
  assurance,
}: {
  copy: HomepageCopy;
  primaryCta: Cta;
  secondaryCta?: Cta;
  assurance?: string;
}) {
  return (
    <section className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {copy.closingTitle}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink/55">{copy.closingBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
        <Link href={primaryCta.href} className="btn-primary px-8 py-3.5">
          {primaryCta.label}
        </Link>
        {secondaryCta && (
          <Link
            href={secondaryCta.href}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary"
          >
            {secondaryCta.label}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>
      {assurance && <p className="mt-8 text-xs text-ink/45">{assurance}</p>}
    </section>
  );
}
