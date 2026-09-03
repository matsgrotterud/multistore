import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontDesignForm } from "@/components/admin/StorefrontDesignForm";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import {
  normalizeStorefrontPresentation,
  recommendStorefrontPresentation,
} from "@/lib/storefront/presentation";

export const dynamic = "force-dynamic";

export default async function StoreDesignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { settings: true },
  });
  if (!store) notFound();

  const settings = parseStoreSettings(store.settings?.settings);
  const current = normalizeStorefrontPresentation(settings.presentation);
  const recommended = recommendStorefrontPresentation({
    niche: store.niche,
    positioning: store.positioning,
    brandVoice: store.brandVoice,
  });

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">Stores</Link>{" "}
        / <Link href={`/admin/stores/${store.slug}/edit`} className="hover:underline">{store.name}</Link>{" "}
        / <span className="text-slate-900">Design</span>
      </nav>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Presentation engine</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Design {store.name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Select a versioned art direction, composition and homepage order without changing catalog truth or launch status.
        </p>
      </div>

      <StorefrontDesignForm
        slug={store.slug}
        storeName={store.name}
        current={current}
        recommended={recommended}
        isExplicit={Boolean(settings.presentation)}
      />
    </div>
  );
}

