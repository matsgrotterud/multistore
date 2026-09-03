import Link from "next/link";
import type { Category, Store } from "@prisma/client";
import type { CatalogProduct } from "@/lib/stores/queries";
import {
  categoryHref,
  productHref,
  storefrontHref,
  type LinkStore,
} from "@/lib/stores/storefront-links";
import type { StorefrontPresentationV1 } from "@/lib/storefront/presentation";

type HeroCategory = Category & { _count: { products: number } };

function HeroProductImage({
  product,
  store,
  priority = false,
  className,
}: {
  product: CatalogProduct;
  store: LinkStore;
  priority?: boolean;
  className: string;
}) {
  return (
    <Link
      href={productHref(store, product.slug, product.category?.slug)}
      className={`group relative block overflow-hidden bg-white/10 ${className}`}
      aria-label={`View ${product.title}`}
    >
      <img
        src={product.imageUrl}
        alt={product.imageAlt || product.title}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-secondary/95 via-secondary/50 to-transparent px-4 pb-4 pt-14 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {product.title}
      </span>
    </Link>
  );
}

function HeroPrimaryAction({
  store,
  category,
  light = false,
}: {
  store: LinkStore;
  category?: HeroCategory;
  light?: boolean;
}) {
  const className = light
    ? "inline-flex min-h-12 items-center justify-center rounded-theme bg-primary px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
    : "inline-flex min-h-12 items-center justify-center rounded-theme bg-white px-6 py-3 text-sm font-bold text-secondary transition hover:bg-white/90";

  return category ? (
    <Link href={categoryHref(store, category.slug)} className={className}>
      Browse {category.name}
      <span aria-hidden="true" className="ml-2">
        →
      </span>
    </Link>
  ) : (
    <a href="#featured-products" className={className}>
      View catalog status
      <span aria-hidden="true" className="ml-2">
        ↓
      </span>
    </a>
  );
}

function StatementHero({
  store,
  category,
  product,
  productCount,
  isPreview,
}: {
  store: Store & LinkStore;
  category?: HeroCategory;
  product: CatalogProduct;
  productCount: number;
  isPreview: boolean;
}) {
  return (
    <section className="storefront-hero storefront-hero--statement relative isolate flex min-h-[36rem] items-end overflow-hidden bg-secondary text-white sm:min-h-[42rem]">
      <img
        src={product.imageUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20"
      />

      <div className="relative mx-auto w-full max-w-site px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
              {isPreview ? "Storefront preview" : "Selected for a reason"}
            </p>
            <span aria-hidden="true" className="h-px w-10 bg-white/30" />
            <p className="text-xs font-medium text-white/65">{store.niche}</p>
          </div>
          <h1 className="mt-6 text-balance font-heading text-5xl font-extrabold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            {store.valueProposition}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            {store.positioning}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <HeroPrimaryAction store={store} category={category} />
            <Link
              href={productHref(store, product.slug, product.category?.slug)}
              className="inline-flex min-h-12 items-center justify-center rounded-theme border border-white/30 bg-black/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-black/25"
            >
              View featured product
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/20 pt-5 text-xs text-white/65">
            <span>{productCount} catalog items visible</span>
            <span>Prices shown in {store.currency}</span>
            <span>
              Delivery estimate: {store.defaultShippingDaysMin}–
              {store.defaultShippingDaysMax} days
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StorefrontHero({
  store,
  categories,
  products,
  presentation,
}: {
  store: Store & LinkStore;
  categories: HeroCategory[];
  products: CatalogProduct[];
  presentation: StorefrontPresentationV1;
}) {
  const heroProducts = products.filter((product) => Boolean(product.imageUrl)).slice(0, 3);
  const firstCategory = categories.find((category) => category._count.products > 0);
  const isPreview = store.launchStatus !== "LIVE";

  if (presentation.hero === "statement" && heroProducts[0]) {
    return (
      <StatementHero
        store={store}
        category={firstCategory}
        product={heroProducts[0]}
        productCount={products.length}
        isPreview={isPreview}
      />
    );
  }

  const isLight =
    presentation.hero === "editorial-split" &&
    (presentation.archetype === "soft" ||
      presentation.archetype === "minimal" ||
      presentation.archetype === "editorial");
  const sectionTone = isLight ? "bg-surface text-ink" : "bg-secondary text-white";
  const eyebrowTone = isLight ? "text-primary" : "text-accent";
  const headingTone = isLight ? "text-ink" : "text-white";
  const bodyTone = isLight ? "text-ink/65" : "text-white/70";
  const secondaryActionTone = isLight
    ? "border border-ink/15 bg-white/70 text-ink hover:border-primary hover:text-primary"
    : "border border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10";
  const metadataTone = isLight
    ? "border-ink/10 text-ink/55"
    : "border-white/10 text-white/60";
  const useSingleImage = presentation.hero === "editorial-split";

  return (
    <section
      className={`storefront-hero storefront-hero--${presentation.hero} relative isolate overflow-hidden ${sectionTone}`}
    >
      <div
        aria-hidden="true"
        className="storefront-hero-orb storefront-hero-orb--primary absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="storefront-hero-orb storefront-hero-orb--accent absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20">
        <div className="lg:col-span-6 xl:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-xs font-bold uppercase tracking-[0.22em] ${eyebrowTone}`}>
              {isPreview ? "Storefront preview" : "Focused online store"}
            </p>
            <span
              aria-hidden="true"
              className={`h-px w-8 ${isLight ? "bg-ink/20" : "bg-white/25"}`}
            />
            <p className={`text-xs font-medium ${isLight ? "text-ink/55" : "text-white/60"}`}>
              {store.niche}
            </p>
          </div>

          <h1
            className={`mt-5 max-w-3xl text-balance font-heading text-4xl font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-5xl lg:text-6xl ${headingTone}`}
          >
            {store.valueProposition}
          </h1>
          <p className={`mt-5 max-w-2xl text-pretty text-base leading-7 sm:text-lg sm:leading-8 ${bodyTone}`}>
            {store.positioning}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <HeroPrimaryAction store={store} category={firstCategory} light={isLight} />
            {products.length > 1 && (
              <Link
                href={storefrontHref(store, "/quiz")}
                className={`inline-flex min-h-12 items-center justify-center rounded-theme px-6 py-3 text-sm font-semibold transition ${secondaryActionTone}`}
              >
                Explore the product finder
              </Link>
            )}
          </div>

          <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-xs ${metadataTone}`}>
            <span>
              {products.length} catalog {products.length === 1 ? "item" : "items"} visible
            </span>
            <span>Prices shown in {store.currency}</span>
            <span>
              Delivery estimate: {store.defaultShippingDaysMin}–
              {store.defaultShippingDaysMax} days
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-5">
          {heroProducts.length > 0 ? (
            <div
              className={
                useSingleImage
                  ? "storefront-hero-media h-[25rem] overflow-hidden rounded-theme-lg shadow-2xl sm:h-[32rem]"
                  : "storefront-hero-media grid h-[24rem] grid-cols-5 grid-rows-2 gap-3 sm:h-[30rem]"
              }
            >
              <HeroProductImage
                product={heroProducts[0]}
                store={store}
                priority
                className={
                  useSingleImage
                    ? "h-full w-full rounded-theme-lg"
                    : `row-span-2 rounded-theme-lg ${
                        heroProducts.length === 1 ? "col-span-5" : "col-span-3"
                      }`
                }
              />
              {!useSingleImage && heroProducts[1] && (
                <HeroProductImage
                  product={heroProducts[1]}
                  store={store}
                  className="col-span-2 rounded-theme-lg"
                />
              )}
              {!useSingleImage && heroProducts[2] ? (
                <HeroProductImage
                  product={heroProducts[2]}
                  store={store}
                  className="col-span-2 rounded-theme-lg"
                />
              ) : !useSingleImage && heroProducts[1] ? (
                <div
                  className={`col-span-2 flex items-end rounded-theme-lg border p-5 ${
                    isLight
                      ? "border-ink/10 bg-white/70"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className={`text-sm leading-6 ${bodyTone}`}>
                    A visual snapshot of the products currently visible in this catalog.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={`flex min-h-[22rem] flex-col justify-between rounded-theme-lg border p-7 backdrop-blur-sm ${
                isLight ? "border-ink/15 bg-white/75" : "border-white/20 bg-white/[0.06]"
              }`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.2em] ${eyebrowTone}`}>
                Catalog status
              </p>
              <div>
                <p className={`font-heading text-3xl font-bold ${headingTone}`}>
                  Products are being reviewed.
                </p>
                <p className={`mt-3 max-w-sm text-sm leading-6 ${bodyTone}`}>
                  This preview will show product imagery only after catalog items are
                  available for the storefront.
                </p>
              </div>
              <p className={`text-xs ${isLight ? "text-ink/50" : "text-white/50"}`}>
                {store.name} · {store.niche}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
