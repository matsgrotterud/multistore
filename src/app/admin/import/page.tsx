import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Supplier import"
      description="Search a supplier, preview products and import them as unpublished drafts."
      phase="Phase 2 · supplier import UI"
    />
  );
}
