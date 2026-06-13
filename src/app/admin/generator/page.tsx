import { requireAdmin } from "@/lib/admin/auth";
import { GeneratorForms } from "@/components/admin/GeneratorForms";

export const dynamic = "force-dynamic";

export default async function AdminGeneratorPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Store &amp; content generator</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Generates a complete store blueprint or product copy using the
        deterministic mock AI provider (no API key needed). Output is checked
        by the content guardrails and returned as JSON you can copy — wiring
        it directly into the database is the next planned step, and the
        output shape already matches the seed format.
      </p>
      <div className="mt-8">
        <GeneratorForms />
      </div>
    </div>
  );
}
