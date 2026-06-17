import type { ReactNode } from "react";
import Link from "next/link";
import { FAQAccordion } from "@/components/FAQAccordion";
import { GuideCard } from "@/components/GuideCard";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { ProductGrid } from "@/components/ProductGrid";
import { StructuredData } from "@/components/StructuredData";
import { TrustBar } from "@/components/TrustBar";
import { ClosingCta } from "@/components/storefront/ClosingCta";
import { FeaturedCategoryCard } from "@/components/storefront/FeaturedCategoryCard";
import { ShopByTheme } from "@/components/storefront/ShopByTheme";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { WhyThisStore } from "@/components/storefront/WhyThisStore";
import { faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildHomepageCopy } from "@/lib/storefront/homepage-content";
import {
  getCategoriesWithPreview,
  getDiscoveryThemes,
  getFeaturedProducts,
  getGuides,
  getHomepageFaq,
} from "@/lib/stores/queries";
import { categoryHref, storefrontHref } from "@/lib/stores/storefront-links";
import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";
import { parseFaq } from "@/lib/utils/json";

/**
 * Premium, generic storefront homepage, composed as a sequence of full-bleed
 * editorial "bands". Driven entirely by store/category/product data — nothing is
 * hardcoded. Sections self-hide when data is missing (no guides, no theme tags,
 * thin imagery), so any generated store renders cleanly.
 *
 * Copy lives in `buildHomepageCopy` and the data shape is plain, so an AI
 * composition step can later replace the copy/section model without touching UI.
 */
export async function StorefrontHomepage({ store }: { store: StoreWithTheme }) {
  const [categories, featuredProducts, themes, guides, faqPage] = await Promise.all([
    getCategoriesWithPreview(store.id),
    getFeaturedProducts(store.id, 8),
    getDiscoveryThemes(store.id),
    getGuides(store.id),
    getHomepageFaq(store.id),
  ]);

  const copy = buildHomepageCopy(store);
  const faq = faqPage ? parseFaq(faqPage.body) : [];

  const heroImages = featuredProducts
    .filter((product) => Boolean(product.imageUrl))
    .slice(0, 3)
    .map((product) => ({ url: product.imageUrl, alt: product.imageAlt || product.title }));

  const primaryCategory = categories.find((category) => category._count.products > 0);
  const shopHref = primaryCategory
    ? categoryHref(store, primaryCategory.slug)
    : storefrontHref(store, "/search");
  const quizHref = storefrontHref(store, "/quiz");
  const compareHref = storefrontHref(store, "/compare");

  return (
    <>
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, `${store.name} featured products`, featuredProducts),
          faqPageJsonLd(faq),
        ]}
      />

      <StorefrontHero
        store={store}
        copy={copy}
        images={heroImages}
        primaryCta={{ label: "Shop the collection", href: shopHref }}
        secondaryCta={{ label: "Take the 60-second quiz", href: quizHref }}
      />

      <TrustBar store={store} />

      {/* C. Featured categories */}
      {categories.length > 0 && (
        <Band tone="surface">
          <SectionHeading
            eyebrow="Collection"
            title={copy.categoriesTitle}
            subtitle={copy.categoriesSubtitle}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <FeaturedCategoryCard
                key={category.id}
                store={store}
                category={{
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  description: category.description,
                  productCount: category._count.products,
                  imageUrl: category.products[0]?.imageUrl ?? null,
                  imageAlt: category.products[0]?.imageAlt ?? null,
                }}
              />
            ))}
          </div>
        </Band>
      )}

      {/* D. Featured products */}
      {featuredProducts.length > 0 && (
        <Band tone="white">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="The edit"
              title={copy.featuredTitle}
              subtitle={copy.featuredSubtitle}
            />
            <Link
              href={compareHref}
              className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
            >
              Compare top picks <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-10">
            <ProductGrid
              products={featuredProducts}
              store={store}
              locale={store.locale}
              highlightFirst="Top pick"
            />
          </div>
        </Band>
      )}

      {/* E. Why this store */}
      <Band tone="surface">
        <WhyThisStore copy={copy} />
      </Band>

      {/* F. Discovery — shop by theme */}
      {themes.length > 0 && (
        <Band tone="white">
          <ShopByTheme store={store} copy={copy} themes={themes} />
        </Band>
      )}

      {/* G. Editorial — guides + decision tools */}
      <Band tone="surface">
        {guides.length > 0 && (
          <div className="mb-12">
            <SectionHeading
              eyebrow="Buying help"
              title="Read before you buy"
              subtitle="Direct answers first, real specs and honest trade-offs — never affiliate-driven rankings."
            />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {guides.slice(0, 3).map((guide) => (
                <GuideCard key={guide.id} guide={guide} store={store} />
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <DecisionPanel
            title="60-second product finder"
            body="Answer a few questions about how you'll actually use it and we'll rank the collection for your situation."
            ctaLabel="Take the quiz"
            href={quizHref}
            variant="primary"
          />
          <DecisionPanel
            title="Side-by-side comparison"
            body="Our top picks in one table: price, delivery time and the specs that actually differ."
            ctaLabel="Open the comparison"
            href={compareHref}
            variant="secondary"
          />
        </div>
      </Band>

      {/* Newsletter */}
      <Band tone="white">
        <NewsletterCapture storeSlug={store.slug} source="homepage" />
      </Band>

      {/* H. Final CTA + trust */}
      <Band tone="surface">
        <ClosingCta
          copy={copy}
          primaryCta={{
            label: primaryCategory ? `Shop ${primaryCategory.name}` : "Browse products",
            href: shopHref,
          }}
          secondaryCta={{ label: "Take the quiz", href: quizHref }}
          assurance={copy.heroAssurance}
        />
        {faq.length > 0 && (
          <div className="mx-auto mt-16 max-w-3xl">
            <FAQAccordion items={faq} />
          </div>
        )}
        <div className="mx-auto mt-12 max-w-3xl">
          <PolicyDisclosure store={store} />
        </div>
      </Band>
    </>
  );
}

function Band({
  tone,
  children,
}: {
  tone: "white" | "surface";
  children: ReactNode;
}) {
  const bg = tone === "white" ? "bg-white" : "bg-surface";
  return (
    <section className={`${bg} border-b border-ink/10`}>
      <div className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20">{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-[15px] leading-7 text-ink/55">{subtitle}</p>}
    </div>
  );
}

function DecisionPanel({
  title,
  body,
  ctaLabel,
  href,
  variant,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  variant: "primary" | "secondary";
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-theme-lg border border-ink/10 bg-white p-8">
      <h3 className="font-heading text-xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="text-sm leading-6 text-ink/55">{body}</p>
      <Link
        href={href}
        className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} mt-auto`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
