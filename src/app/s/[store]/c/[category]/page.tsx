import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GuideCard } from "@/components/GuideCard";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { SortDropdown } from "@/components/SortDropdown";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildCategoryMetadata } from "@/lib/seo/metadata";
import {
  getCategoryWithProducts,
  getGuides,
  requireStore,
} from "@/lib/stores/queries";
import { storefrontHref } from "@/lib/stores/storefront-links";
import { parseStringArray } from "@/lib/utils/json";
import type { FaqItem } from "@/lib/types";
import type { Product } from "@prisma/client";

interface CategoryPageProps {
  params: Promise<{ store: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { store: storeSlug, category: categorySlug } = await params;
  const store = await requireStore(storeSlug);
  const category = await getCategoryWithProducts(store.id, categorySlug);
  if (!category) return {};
  return buildCategoryMetadata(store, category, category.products.length);
}

function applyFilters(
  products: Product[],
  filters: { maxPrice?: number; maxDays?: number; inStockOnly: boolean; useCase?: string }
): Product[] {
  return products.filter((product) => {
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    if (filters.maxDays !== undefined && product.shippingDaysMax > filters.maxDays) return false;
    if (filters.inStockOnly && product.stockStatus !== "IN_STOCK") return false;
    if (filters.useCase && !parseStringArray(product.useCases).includes(filters.useCase)) return false;
    return true;
  });
}

function applySort(products: Product[], sort: string): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "shipping":
      return sorted.sort((a, b) => a.shippingDaysMax - b.shippingDaysMax);
    default:
      return sorted.sort((a, b) => b.productScore - a.productScore);
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { store: storeSlug, category: categorySlug } = await params;
  const search = await searchParams;
  const store = await requireStore(storeSlug);
  const category = await getCategoryWithProducts(store.id, categorySlug);
  if (!category) notFound();

  const allProducts = category.products;
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const maxPriceRaw = Number(single(search.maxPrice));
  const maxDaysRaw = Number(single(search.maxDays));
  const filtered = applySort(
    applyFilters(allProducts, {
      maxPrice: Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined,
      maxDays: Number.isFinite(maxDaysRaw) && maxDaysRaw > 0 ? maxDaysRaw : undefined,
      inStockOnly: single(search.stock) === "in",
      useCase: single(search.useCase) || undefined,
    }),
    single(search.sort) ?? "score"
  );

  // Attach the category slug so product cards/JSON-LD can build category-aware
  // URLs (the products query is already scoped to this category).
  const filteredWithCategory = filtered.map((product) => ({
    ...product,
    category: { slug: category.slug },
  }));

  const useCaseOptions = Array.from(
    new Set(allProducts.flatMap((product) => parseStringArray(product.useCases)))
  ).sort();

  // Top-scored product image doubles as an editorial category cover.
  const coverImage = allProducts.find((product) => product.imageUrl)?.imageUrl ?? null;

  const guides = (await getGuides(store.id)).slice(0, 3);

  const categoryFaq: FaqItem[] = [
    {
      question: `How fast do ${category.name.toLowerCase()} ship?`,
      answer: `Items in this category typically arrive within ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days. Each product page shows its own exact window, and you receive tracking as soon as the parcel ships.`,
    },
    {
      question: "Can I return a product if it is not right?",
      answer: store.returnPolicySummary,
    },
    {
      question: "How do you rank these products?",
      answer:
        "Default sorting uses our internal product score: a blend of value for money, delivery speed, supplier reliability and how complete our information about the product is. No brand pays for placement.",
    },
  ];

  return (
    <div>
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, category.name, filteredWithCategory),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: category.name, path: `/c/${category.slug}` },
          ]),
          faqPageJsonLd(categoryFaq),
        ]}
      />

      {/* Editorial category hero */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-10">
          <Breadcrumbs
            items={[
              { name: "Home", href: storefrontHref(store, "/") },
              { name: category.name },
            ]}
          />
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_18rem] md:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                Collection
              </p>
              <h1 className="mt-3 font-heading text-3xl font-bold leading-[1.08] tracking-tight text-ink sm:text-4xl md:text-5xl">
                {category.heroTitle}
              </h1>
              <p className="mt-4 text-base leading-7 text-ink/55">{category.heroSubtitle}</p>
            </div>
            {coverImage && (
              <div className="hidden md:block">
                <div className="aspect-[4/3] overflow-hidden rounded-theme-lg bg-surface ring-1 ring-ink/10">
                  <img
                    src={coverImage}
                    alt={`${category.name} — ${store.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-site px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <FilterSidebar useCaseOptions={useCaseOptions} />
          </aside>

          <section aria-label={`${category.name} products`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <p className="text-sm text-ink/55" aria-live="polite">
                <span className="font-semibold text-ink">{filtered.length}</span> of{" "}
                {allProducts.length} products
              </p>
              <SortDropdown />
            </div>
            <ProductGrid
              products={filteredWithCategory}
              store={store}
              locale={store.locale}
              emptyMessage="No products match these filters. Try widening price or delivery time, or clear the filters."
            />
          </section>
        </div>

        {guides.length > 0 && (
          <section className="mt-20" aria-labelledby="category-guides">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
              Buying help
            </p>
            <h2
              id="category-guides"
              className="mt-3 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            >
              Guides that help you choose
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} store={store} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-20">
          <FAQAccordion items={categoryFaq} title={`${category.name}: common questions`} />
        </div>

        <p className="mt-12 text-sm text-ink/55">
          Looking for something else? Try the{" "}
          <Link href={storefrontHref(store, "/quiz")} className="font-medium text-primary underline">
            product finder quiz
          </Link>{" "}
          or{" "}
          <Link href={storefrontHref(store, "/search")} className="font-medium text-primary underline">
            search the whole store
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
