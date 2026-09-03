import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { GeneratorForms } from "@/components/admin/GeneratorForms";
import { getMediaStorageSafetyReport } from "@/lib/storage/media-storage-safety";
import { FoundationStoreGenerator } from "@/components/admin/FoundationStoreGenerator";

export const dynamic = "force-dynamic";

export default async function AdminGeneratorPage() {
  await requireAdmin();
  const safety = getMediaStorageSafetyReport();

  return (
    <div>
      <h1 className="text-2xl font-bold">Store factory</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Build the provider-independent store foundation first. Catalog generation remains available
        below for later, but it is not required to establish brand, design, content briefs or
        portfolio readiness.
      </p>
      <div className="mt-8">
        <FoundationStoreGenerator idempotencyKey={`foundation-${randomUUID()}`} />
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer text-lg font-bold text-slate-900">
            Catalog workflow · keep for later
          </summary>
          <p className="mt-2 text-sm text-slate-500">
            This is the existing product-class and provider-backed path. Opening it does not run anything.
          </p>
          <div className="mt-6">
            <GeneratorForms
              mediaSafety={{
                dbIsRemote: safety.dbIsRemote,
                effectiveProvider: safety.effectiveProvider,
                unsafe: safety.unsafe,
                overrideEnabled: safety.overrideEnabled,
              }}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
