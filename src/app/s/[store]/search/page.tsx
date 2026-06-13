import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBox } from "@/components/SearchBox";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore, searchProducts } from "@/lib/stores/queries";

interface SearchPageProps {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Search | ${store.name}`,
    description: `Search the ${store.name} catalog.`,
    path: "/search",
    noindex: true,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { store: slug } = await params;
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const store = await requireStore(slug);
  const results = query ? await searchProducts(store.id, query) : [];

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Search" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink">
        {query ? `Results for “${query}”` : "Search the store"}
      </h1>
      <div className="mt-4 max-w-md">
        <SearchBox placeholder="Search by name, brand or feature…" />
      </div>

      <div className="mt-8">
        {query ? (
          <>
            <p className="mb-4 text-sm text-ink/60" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <ProductGrid
              products={results}
              locale={store.locale}
              emptyMessage={`Nothing matched “${query}”. Try a broader term, browse the categories, or take the product quiz.`}
            />
          </>
        ) : (
          <p className="text-sm text-ink/60">
            Type what you are looking for above — product names, brands or
            features all work.
          </p>
        )}
      </div>
    </div>
  );
}
