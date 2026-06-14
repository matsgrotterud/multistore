import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { StoreEditForm } from "@/components/admin/StoreEditForm";

export const dynamic = "force-dynamic";

const DEFAULT_THEME = {
  primaryColor: "#1d4ed8",
  secondaryColor: "#1e293b",
  accentColor: "#f59e0b",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  borderRadius: "0.75rem",
  fontHeading: "system-ui",
  fontBody: "system-ui",
};

export default async function StoreEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { theme: true, domains: true, settings: true },
  });
  if (!store) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        / <span className="text-slate-900">{store.name}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Edit {store.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Brand, domains, theme and per-store settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/stores/${store.slug}/products`}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Products
          </Link>
          <Link
            href={`/s/${store.slug}`}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            View storefront
          </Link>
        </div>
      </div>

      <StoreEditForm
        slug={store.slug}
        store={{
          name: store.name,
          legalName: store.legalName,
          primaryDomain: store.primaryDomain,
          locale: store.locale,
          currency: store.currency,
          niche: store.niche,
          positioning: store.positioning,
          audience: store.audience,
          valueProposition: store.valueProposition,
          brandVoice: store.brandVoice,
          logoText: store.logoText,
          supportEmail: store.supportEmail,
          supportPhone: store.supportPhone,
          shippingOriginDisclosure: store.shippingOriginDisclosure,
          defaultShippingDaysMin: store.defaultShippingDaysMin,
          defaultShippingDaysMax: store.defaultShippingDaysMax,
          returnPolicySummary: store.returnPolicySummary,
          privacyPolicy: store.privacyPolicy,
          termsOfSale: store.termsOfSale,
          isActive: store.isActive,
        }}
        theme={store.theme ?? DEFAULT_THEME}
        domains={store.domains.map((domain) => domain.hostname)}
        settings={parseStoreSettings(store.settings?.settings)}
      />
    </div>
  );
}
