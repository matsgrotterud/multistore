import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getStoreFoundationStudioData } from "@/lib/admin/store-foundation";
import { StoreFoundationStudio } from "@/components/admin/StoreFoundationStudio";

export const dynamic = "force-dynamic";

export default async function StoreFoundationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const data = await getStoreFoundationStudioData(slug);
  if (!data) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">Stores</Link>{" "}
        / <Link href={`/admin/stores/${slug}/edit`} className="hover:underline">{data.store.name}</Link>{" "}
        / <span className="text-slate-900">Foundation</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Foundation · {data.store.name}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {data.store.launchStatus} · {data.store.isActive ? "active tenant" : "inactive tenant"} · admin-only preview
          </p>
        </div>
        <Link
          href={`/admin/stores/${slug}/edit`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Store settings
        </Link>
      </div>
      <StoreFoundationStudio data={data} />
    </div>
  );
}
