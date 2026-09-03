import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { GuideCard } from "@/components/GuideCard";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { ProductGrid } from "@/components/ProductGrid";
import { StorefrontHero } from "@/components/StorefrontHero";
import { StorefrontReviewBanner } from "@/components/StorefrontReviewBanner";
import { StorefrontSections } from "@/components/storefront/StorefrontSections";
import { StructuredData } from "@/components/StructuredData";
import { TrustBar } from "@/components/TrustBar";
import { faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import {
  getCategories,
  getFeaturedProducts,
  getGuides,
  getHomepageFaq,
  getStoreSettings,
  requireStore,
} from "@/lib/stores/queries";
import { storefrontHref } from "@/lib/stores/storefront-links";
import { resolveStorefrontPresentation } from "@/lib/storefront/presentation";
import { parseFaq } from "@/lib/utils/json";
import { includeNoindexSingletonContent } from "@/lib/content/storefront-content-policy";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const settings = await getStoreSettings(store.id);
  const presentation = resolveStorefrontPresentation(
    settings.presentation,
    settings.homepage
  );

  const [categories, featuredProducts, guides, faqPage] = await Promise.all([
    getCategories(store.id),
    getFeaturedProducts(store.id, 8),
    getGuides(store.id),
    getHomepageFaq(
      store.id,
      includeNoindexSingletonContent(store.launchStatus)
    ),
  ]);

  const faq = faqPage ? parseFaq(faqPage.body) : [];
  const categorySection =
    categories.length > 0 ? (
      <section id="shop-categories" aria-labelledby="categories-heading">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Browse the catalog
            </p>
            <h2
              id="categories-heading"
              className="mt-3 max-w-xl font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
            >
              Start with what you are looking for.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-ink/60 lg:justify-self-end">
            Categories reflect the items currently visible in this {store.niche}
            catalog. Product counts may change while a preview is being reviewed.
          </p>
        </div>
        <div className="storefront-category-grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const categoryProduct =
              featuredProducts.find(
                (product) => product.category?.slug === category.slug
              ) ?? (categories.length === 1 ? featuredProducts[0] : undefined);
            return (
              <CategoryCard
                key={category.id}
                category={category}
                store={store}
                productCount={category._count.products}
                index={index}
                imageUrl={categoryProduct?.imageUrl}
                imageAlt={
                  categoryProduct
                    ? `${category.name}: ${categoryProduct.imageAlt || categoryProduct.title}`
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>
    ) : null;

  const featuredSection = (
    <section id="featured-products" aria-labelledby="featured-heading">
      <div className="flex flex-col gap-5 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Current selection
          </p>
          <h2
            id="featured-heading"
            className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
          >
            Explore visible products
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
            {store.launchStatus === "LIVE"
              ? `Items currently available in the ${store.name} catalog.`
              : "Preview items are shown for review and are not evidence that the catalog is launch-approved."}
          </p>
        </div>
        {featuredProducts.length > 1 && settings.homepage.showComparisonCta && (
          <Link
            href={storefrontHref(store, "/compare")}
            className="inline-flex shrink-0 items-center text-sm font-bold text-primary hover:underline"
          >
            Compare visible items <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        )}
      </div>
      <div className="mt-8">
        <ProductGrid
          products={featuredProducts}
          store={store}
          locale={store.locale}
          emptyMessage="No catalog items have cleared the storefront's current visibility checks yet."
        />
      </div>
    </section>
  );

  const guidesSection =
    guides.length > 0 ? (
      <section
        aria-labelledby="choose-heading"
        className="storefront-guides-panel relative overflow-hidden rounded-theme-lg bg-secondary p-7 text-white sm:p-10 lg:p-12"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Published guides
          </p>
          <h2
            id="choose-heading"
            className="mt-3 font-heading text-3xl font-extrabold tracking-tight"
          >
            A clearer way into the details.
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            Read the buying information currently published for this catalog,
            then verify product-specific details on each item page.
          </p>
        </div>
        <div className="relative mt-8 grid gap-4 md:grid-cols-3 [&_.card]:border-white/10 [&_.card]:shadow-none">
          {guides.slice(0, 3).map((guide) => (
            <GuideCard key={guide.id} guide={guide} store={store} />
          ))}
        </div>
      </section>
    ) : null;

  const showQuiz = settings.homepage.showQuizCta;
  const showComparison = settings.homepage.showComparisonCta;
  const decisionToolsSection =
    featuredProducts.length > 0 && (showQuiz || showComparison) ? (
      <section
        className={`storefront-decision-tools grid gap-4 ${
          showQuiz && showComparison ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
        aria-label="Catalog tools"
      >
        {showQuiz && (
          <div className="card flex min-h-64 flex-col items-start gap-3 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Product finder
            </p>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
              Narrow the visible catalog
            </h2>
            <p className="max-w-md text-sm leading-6 text-ink/60">
              Answer a few questions to sort currently visible products using the
              information recorded for them.
            </p>
            <Link href={storefrontHref(store, "/quiz")} className="btn-primary mt-auto">
              Open product finder
            </Link>
          </div>
        )}
        {showComparison && (
          <div className="card flex min-h-64 flex-col items-start gap-3 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Comparison
            </p>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
              Put product details side by side
            </h2>
            <p className="max-w-md text-sm leading-6 text-ink/60">
              Compare the prices, delivery estimates and recorded fields that differ
              across visible products.
            </p>
            <Link
              href={storefrontHref(store, "/compare")}
              className="btn-secondary mt-auto"
            >
              Open comparison
            </Link>
          </div>
        )}
      </section>
    ) : null;

  return (
    <>
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, `${store.name} featured products`, featuredProducts),
          faqPageJsonLd(faq),
        ]}
      />

      <StorefrontReviewBanner store={store} />
      <StorefrontHero
        store={store}
        categories={categories}
        products={featuredProducts}
        presentation={presentation}
      />
      <TrustBar store={store} />

      <StorefrontSections
        presentation={presentation}
        sections={{
          categories: categorySection,
          "featured-products": featuredSection,
          guides: guidesSection,
          "decision-tools": decisionToolsSection,
          newsletter: (
            <NewsletterCapture storeSlug={store.slug} source="homepage" />
          ),
          faq: faq.length > 0 ? <FAQAccordion items={faq} /> : null,
        }}
        footer={<PolicyDisclosure store={store} />}
      />
    </>
  );
}
