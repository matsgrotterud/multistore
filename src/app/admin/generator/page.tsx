import { requireAdmin } from "@/lib/admin/auth";
import { GeneratorForms } from "@/components/admin/GeneratorForms";
import { getMediaStorageSafetyReport } from "@/lib/storage/media-storage-safety";

export const dynamic = "force-dynamic";

export default async function AdminGeneratorPage() {
  await requireAdmin();
  const safety = getMediaStorageSafetyReport();

  return (
    <div>
      <h1 className="text-2xl font-bold">Store factory</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Describe a niche → generate a blueprint → create a preview store with categories, products,
        FAQ and a buying guide. No real domain required until you are ready to go Live and connect
        DNS.
      </p>
      <div className="mt-8">
        <GeneratorForms
          mediaSafety={{
            dbIsRemote: safety.dbIsRemote,
            effectiveProvider: safety.effectiveProvider,
            unsafe: safety.unsafe,
            overrideEnabled: safety.overrideEnabled,
          }}
        />
      </div>
    </div>
  );
}
