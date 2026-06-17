import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { PageViewTracker } from "@/components/PageViewTracker";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getComparisonPage,
  getFeaturedProducts,
  getProductsByIds,
  requireStore,
} from "@/lib/stores/queries";
import { storefrontHref } from "@/lib/stores/storefront-links";
import { parseStringArray } from "@/lib/utils/json";

interface ComparePageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const comparison = await getComparisonPage(store.id);
  return buildMetadata({
    store,
    title: comparison?.seoTitle ?? `Compare top picks | ${store.name}`,
    description:
      comparison?.seoDescription ??
      `Our current top ${store.niche} picks side by side: price, delivery time and the specs that actually differ.`,
    path: "/compare",
  });
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const comparison = await getComparisonPage(store.id);

  const relatedIds = comparison
    ? parseStringArray(comparison.relatedProductIds)
    : [];
  const products =
    relatedIds.length > 0
      ? await getProductsByIds(store.id, relatedIds)
      : await getFeaturedProducts(store.id, 4);

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, comparison?.title ?? "Top picks compared", products),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ]}
      />

      <Breadcrumbs items={[{ name: "Home", href: storefrontHref(store, "/") }, { name: "Compare" }]} />

      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        {comparison?.title ?? "Our top picks, side by side"}
      </h1>
      {comparison ? (
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-7 text-ink/75">
          {comparison.body.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
          The table below compares our current best-scoring products on the
          numbers that actually differ. Prices and delivery windows update
          with the catalog.
        </p>
      )}

      <div className="mt-8">
        <ComparisonTable products={products} store={store} locale={store.locale} />
      </div>

      <p className="mt-8 text-sm text-ink/60">
        Still undecided? The{" "}
        <Link href={storefrontHref(store, "/quiz")} className="font-medium text-primary underline">
          60-second quiz
        </Link>{" "}
        narrows this down to your specific situation.
      </p>
    </div>
  );
}
