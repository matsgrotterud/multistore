import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideCard } from "@/components/GuideCard";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { getGuides, requireStore } from "@/lib/stores/queries";

interface GuidesPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: GuidesPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Buying guides | ${store.name}`,
    description: `Practical, honest buying guides for ${store.niche}: direct answers, real specs and clear trade-offs.`,
    path: "/guides",
  });
}

export default async function GuidesPage({ params }: GuidesPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const guides = await getGuides(store.id);

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Guides" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        Buying guides
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">
        Written for people who want a direct answer first and the reasoning
        second. Every recommendation comes from our own catalog data — price,
        delivery time and specs — not sponsorships.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}
