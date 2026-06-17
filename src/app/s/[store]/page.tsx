import { StorefrontHomepage } from "@/components/storefront/StorefrontHomepage";
import { requireStore } from "@/lib/stores/queries";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await requireStore(slug);

  return <StorefrontHomepage store={store} />;
}
