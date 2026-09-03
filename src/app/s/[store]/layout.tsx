import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieConsent } from "@/components/CookieConsent";
import { StoreFooter } from "@/components/StoreFooter";
import { StoreHeader } from "@/components/StoreHeader";
import { StructuredData } from "@/components/StructuredData";
import { CartProvider } from "@/lib/cart/cart-context";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonld";
import { buildStoreMetadata } from "@/lib/seo/metadata";
import { getCategories, getStoreSettings, requireStore } from "@/lib/stores/queries";
import { storefrontBase } from "@/lib/stores/storefront-links";
import { resolveStorefrontPresentation } from "@/lib/storefront/presentation";
import { buildThemeStyle } from "@/lib/theme";

interface StoreLayoutProps {
  children: ReactNode;
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildStoreMetadata(store);
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const [categories, settings] = await Promise.all([
    getCategories(store.id),
    getStoreSettings(store.id),
  ]);
  const presentation = resolveStorefrontPresentation(
    settings.presentation,
    settings.homepage
  );

  return (
    <div
      style={buildThemeStyle(store.theme)}
      data-storefront-archetype={presentation.archetype}
      data-storefront-density={presentation.density}
      data-storefront-hero={presentation.hero}
      className="storefront-shell flex min-h-screen flex-col bg-surface font-body text-ink"
    >
      <StructuredData data={[organizationJsonLd(store), webSiteJsonLd(store)]} />
      <CartProvider
        storeSlug={store.slug}
        currency={store.currency}
        basePath={storefrontBase(store)}
      >
        <StoreHeader store={store} categories={categories} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} categories={categories} />
        <CartDrawer locale={store.locale} />
        <CookieConsent />
      </CartProvider>
    </div>
  );
}
