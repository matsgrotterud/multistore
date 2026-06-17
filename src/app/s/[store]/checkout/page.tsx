import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";
import { storefrontHref } from "@/lib/stores/storefront-links";

interface CheckoutPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Checkout | ${store.name}`,
    description: "Complete your order.",
    path: "/checkout",
    noindex: true,
  });
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const isMockCheckout = process.env.MOCK_CHECKOUT !== "false";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs
        items={[
          { name: "Home", href: storefrontHref(store, "/") },
          { name: "Cart", href: storefrontHref(store, "/cart") },
          { name: "Checkout" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">Checkout</h1>
      {isMockCheckout && (
        <p className="mt-2 inline-block rounded-theme bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900">
          Demo mode: checkout runs without payment. Orders are created and routed through mock
          suppliers.
        </p>
      )}
      <div className="mt-6">
        <CheckoutForm
          storeSlug={store.slug}
          locale={store.locale}
          mockCheckout={isMockCheckout}
        />
      </div>
    </div>
  );
}
