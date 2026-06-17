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
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
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

      <Breadcrumbs
        items={[
          { name: "Home", href: storefrontHref(store, "/") },
          { name: category.name },
        ]}
      />

      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          {category.heroTitle}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/70">
          {category.heroSubtitle}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/60">{category.description}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <FilterSidebar useCaseOptions={useCaseOptions} />
        </aside>

        <section aria-label={`${category.name} products`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60" aria-live="polite">
              {filtered.length} of {allProducts.length} products
            </p>
            <SortDropdown />
          </div>
          <ProductGrid products={filteredWithCategory} store={store} locale={store.locale} />
        </section>
      </div>

      {guides.length > 0 && (
        <section className="mt-16" aria-labelledby="category-guides">
          <h2 id="category-guides" className="text-2xl font-bold text-ink">
            Guides that help you choose
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} store={store} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16">
        <FAQAccordion items={categoryFaq} title={`${category.name}: common questions`} />
      </div>

      <p className="mt-10 text-sm text-ink/60">
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
  );
}
