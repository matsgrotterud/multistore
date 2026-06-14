import { requireAdmin } from "@/lib/admin/auth";
import { GeneratorForms } from "@/components/admin/GeneratorForms";

export const dynamic = "force-dynamic";

export default async function AdminGeneratorPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Store factory</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Describe a niche → generate a blueprint → create a preview store with categories, products,
        FAQ and a buying guide. No real domain required until you are ready to go Live and connect
        DNS.
      </p>
      <div className="mt-8">
        <GeneratorForms />
      </div>
    </div>
  );
}
