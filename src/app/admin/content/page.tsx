import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Content"
      description="Edit guides, comparisons, FAQ and landing pages per store."
      phase="Phase 2 · content CRUD"
    />
  );
}
