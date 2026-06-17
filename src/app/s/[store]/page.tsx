import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { GuideCard } from "@/components/GuideCard";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { ProductGrid } from "@/components/ProductGrid";
import { StructuredData } from "@/components/StructuredData";
import { TrustBar } from "@/components/TrustBar";
import { faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import {
  getCategories,
  getFeaturedProducts,
  getGuides,
  getHomepageFaq,
  requireStore,
} from "@/lib/stores/queries";
import { categoryHref, storefrontHref } from "@/lib/stores/storefront-links";
import { parseFaq } from "@/lib/utils/json";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await requireStore(slug);

  const [categories, featuredProducts, guides, faqPage] = await Promise.all([
    getCategories(store.id),
    getFeaturedProducts(store.id, 8),
    getGuides(store.id),
    getHomepageFaq(store.id),
  ]);

  const faq = faqPage ? parseFaq(faqPage.body) : [];

  return (
    <>
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, `${store.name} featured products`, featuredProducts),
          faqPageJsonLd(faq),
        ]}
      />

      {/* Hero */}
      <section className="bg-secondary text-white">
        <div className="mx-auto grid max-w-site gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {store.niche}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight md:text-5xl">
              {store.valueProposition}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80">
              {store.positioning}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {categories[0] && (
                <Link href={categoryHref(store, categories[0].slug)} className="btn-primary">
                  Shop {categories[0].name}
                </Link>
              )}
              <Link
                href={storefrontHref(store, "/quiz")}
                className="inline-flex items-center justify-center gap-2 rounded-theme border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Find my match in 60 seconds
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/60">
              {store.defaultShippingDaysMin}–{store.defaultShippingDaysMax} day
              tracked delivery · transparent supplier fulfillment · human
              support at {store.supportEmail}
            </p>
          </div>
          <div className="hidden md:block">
            <img
              src={`/api/placeholder?label=${encodeURIComponent(store.logoText)}&seed=${store.slug}-hero`}
              alt={`${store.name} — ${store.niche}`}
              className="aspect-[4/3] w-full rounded-theme-lg object-cover"
            />
          </div>
        </div>
      </section>

      <TrustBar store={store} />

      <div className="mx-auto max-w-site space-y-16 px-4 py-12 sm:px-6">
        {/* Featured categories */}
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-2xl font-bold text-ink">
            Shop by category
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                store={store}
                productCount={category._count.products}
              />
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section aria-labelledby="featured-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-bold text-ink">
                Our current top picks
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Ranked by our internal product score: value, shipping speed and
                content quality — not by who pays most.
              </p>
            </div>
            <Link
              href={storefrontHref(store, "/compare")}
              className="hidden shrink-0 text-sm font-semibold text-primary underline sm:block"
            >
              Compare top picks →
            </Link>
          </div>
          <div className="mt-5">
            <ProductGrid products={featuredProducts} store={store} locale={store.locale} />
          </div>
        </section>

        {/* How to choose */}
        {guides.length > 0 && (
          <section
            aria-labelledby="choose-heading"
            className="rounded-theme-lg bg-primary-soft p-6 sm:p-10"
          >
            <h2 id="choose-heading" className="text-2xl font-bold text-ink">
              Not sure how to choose?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
              We write the guides we wish existed when we researched this
              niche: direct answers first, real specs, honest trade-offs, and
              no affiliate-driven rankings.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {guides.slice(0, 3).map((guide) => (
                <GuideCard key={guide.id} guide={guide} store={store} />
              ))}
            </div>
          </section>
        )}

        {/* Quiz + comparison CTAs */}
        <section className="grid gap-4 md:grid-cols-2" aria-label="Decision tools">
          <div className="card flex flex-col items-start gap-3 p-8">
            <h2 className="text-xl font-bold text-ink">60-second product finder</h2>
            <p className="text-sm leading-6 text-ink/70">
              Answer a few questions about how you will actually use it and we
              will rank the catalog for your situation.
            </p>
            <Link href={storefrontHref(store, "/quiz")} className="btn-primary mt-auto">
              Take the quiz
            </Link>
          </div>
          <div className="card flex flex-col items-start gap-3 p-8">
            <h2 className="text-xl font-bold text-ink">Side-by-side comparison</h2>
            <p className="text-sm leading-6 text-ink/70">
              Our top picks in one table: price, delivery time and the specs
              that actually differ.
            </p>
            <Link href={storefrontHref(store, "/compare")} className="btn-secondary mt-auto">
              Open the comparison
            </Link>
          </div>
        </section>

        <NewsletterCapture storeSlug={store.slug} source="homepage" />

        {/* FAQ */}
        {faq.length > 0 && <FAQAccordion items={faq} />}

        <PolicyDisclosure store={store} />
      </div>
    </>
  );
}
