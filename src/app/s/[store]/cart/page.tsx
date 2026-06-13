import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CartPageContent } from "@/components/CartPageContent";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";

interface CartPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Your cart | ${store.name}`,
    description: "Review your cart before checkout.",
    path: "/cart",
    noindex: true,
  });
}

export default async function CartPage({ params }: CartPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cart" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink">Your cart</h1>
      <div className="mt-6">
        <CartPageContent
          locale={store.locale}
          shippingNote={store.shippingOriginDisclosure}
        />
      </div>
    </div>
  );
}
