import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminSeoAuditPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="SEO audit"
      description="Per-store report of missing SEO fields, weak products and launch readiness."
      phase="Phase 2 · SEO audit + launch checklist"
    />
  );
}
