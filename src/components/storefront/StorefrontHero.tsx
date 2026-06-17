import Link from "next/link";
import type { HomepageCopy } from "@/lib/storefront/homepage-content";
import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";

interface HeroImage {
  url: string;
  alt: string;
}

interface HeroCta {
  label: string;
  href: string;
}

/**
 * Editorial, light luxury hero. A restrained split layout: refined typography on
 * the left, a composed set of real product images on the right. Degrades to a
 * single image and then a branded panel when imagery is missing. No gradients,
 * no glows — whitespace and typography do the work.
 */
export function StorefrontHero({
  store,
  copy,
  images,
  primaryCta,
  secondaryCta,
}: {
  store: StoreWithTheme;
  copy: HomepageCopy;
  images: HeroImage[];
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
}) {
  const [main, second, third] = images;

  return (
    <section className="border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-site items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
        <div className="order-2 md:order-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
            {copy.heroEyebrow}
          </p>
          <h1 className="mt-5 font-heading text-[2.5rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
            {copy.heroHeadline}
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-ink/55">{copy.heroSubhead}</p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={primaryCta.href} className="btn-primary px-7 py-3.5">
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary"
              >
                {secondaryCta.label}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            )}
          </div>

          <p className="mt-10 border-t border-ink/10 pt-5 text-xs leading-5 text-ink/45">
            {copy.heroAssurance}
          </p>
        </div>

        <div className="order-1 md:order-2">
          {main ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="overflow-hidden rounded-theme-lg bg-surface ring-1 ring-ink/10 sm:col-span-2">
                <img
                  src={main.url}
                  alt={main.alt}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <div className="hidden flex-col gap-4 sm:flex">
                {second && (
                  <div className="overflow-hidden rounded-theme-lg bg-surface ring-1 ring-ink/10">
                    <img src={second.url} alt={second.alt} className="aspect-square w-full object-cover" />
                  </div>
                )}
                {third && (
                  <div className="overflow-hidden rounded-theme-lg bg-surface ring-1 ring-ink/10">
                    <img src={third.url} alt={third.alt} className="aspect-square w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-theme-lg bg-surface text-sm text-ink/40 ring-1 ring-ink/10">
              {store.logoText}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
