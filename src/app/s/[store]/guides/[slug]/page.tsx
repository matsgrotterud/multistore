import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { StructuredData } from "@/components/StructuredData";
import { MarkdownContent, extractToc } from "@/lib/content/markdown";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { buildGuideMetadata } from "@/lib/seo/metadata";
import {
  getCategories,
  getGuideBySlug,
  getProductsByIds,
  requireStore,
} from "@/lib/stores/queries";
import { categoryHref, storefrontHref } from "@/lib/stores/storefront-links";
import { parseStringArray } from "@/lib/utils/json";
import type { FaqItem } from "@/lib/types";

interface GuidePageProps {
  params: Promise<{ store: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { store: storeSlug, slug } = await params;
  const store = await requireStore(storeSlug);
  const guide = await getGuideBySlug(store.id, slug);
  if (!guide) return {};
  return buildGuideMetadata(store, guide);
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { store: storeSlug, slug } = await params;
  const store = await requireStore(storeSlug);
  const guide = await getGuideBySlug(store.id, slug);
  if (!guide || !guide.isPublished || guide.type !== "GUIDE") notFound();

  const [recommendedProducts, categories] = await Promise.all([
    getProductsByIds(store.id, parseStringArray(guide.relatedProductIds)),
    getCategories(store.id),
  ]);

  const toc = extractToc(guide.body);

  const guideFaq: FaqItem[] = [
    {
      question: "How are the recommendations in this guide chosen?",
      answer:
        "They come from our own catalog, ranked by an internal score that weighs value for money, delivery speed and how complete our data on the product is. No brand pays for placement in our guides.",
    },
    {
      question: "How long does delivery take?",
      answer: `Typically ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days. ${store.shippingOriginDisclosure}`,
    },
    {
      question: "What if I buy the wrong thing?",
      answer: store.returnPolicySummary,
    },
  ];

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker
        storeSlug={store.slug}
        extraEvent="guide_view"
        extraPayload={{ guideSlug: guide.slug }}
      />
      <StructuredData
        data={[
          articleJsonLd(store, guide),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          faqPageJsonLd(guideFaq),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Home", href: storefrontHref(store, "/") },
          { name: "Guides", href: storefrontHref(store, "/guides") },
          { name: guide.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_280px]">
        <article>
          <h1 className="text-3xl font-bold leading-tight text-ink md:text-4xl">
            {guide.title}
          </h1>

          {/* Direct answer block near the top — for humans and AI search. */}
          <div className="mt-6 rounded-theme-lg border-l-4 border-primary bg-primary-soft p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              The short answer
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-ink">
              {guide.excerpt}
            </p>
          </div>

          <div className="mt-8">
            <MarkdownContent markdown={guide.body} />
          </div>

          {recommendedProducts.length > 0 && (
            <>
              <section className="mt-12" aria-labelledby="guide-comparison">
                <h2 id="guide-comparison" className="text-2xl font-bold text-ink">
                  Side-by-side comparison
                </h2>
                <div className="mt-4">
                  <ComparisonTable
                    products={recommendedProducts.slice(0, 3)}
                    store={store}
                    locale={store.locale}
                  />
                </div>
              </section>

              <section className="mt-12" aria-labelledby="guide-products">
                <h2 id="guide-products" className="text-2xl font-bold text-ink">
                  Products mentioned in this guide
                </h2>
                <div className="mt-4">
                  <ProductGrid
                    products={recommendedProducts}
                    store={store}
                    locale={store.locale}
                  />
                </div>
              </section>
            </>
          )}

          <div className="mt-12">
            <FAQAccordion items={guideFaq} />
          </div>
        </article>

        <aside className="order-first lg:order-none">
          {toc.length > 0 && (
            <nav
              aria-label="Table of contents"
              className="card sticky top-24 p-5"
            >
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
                In this guide
              </h2>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className="text-ink/70 hover:text-primary hover:underline"
                    >
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-ink/10 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Browse categories
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={categoryHref(store, category.slug)}
                        className="text-primary hover:underline"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}
