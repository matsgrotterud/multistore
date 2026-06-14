import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminExperimentsPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Experiments"
      description="Create A/B tests with sticky cookie assignment and conversion tracking."
      phase="Phase 2 · A/B runtime"
    />
  );
}
