import { requireAdmin } from "@/lib/admin/auth";
import { StoreReadinessDashboard } from "@/components/admin/StoreReadinessDashboard";
import { getStoreReadinessPortfolioReport } from "@/lib/admin/store-operating-readiness";

export const dynamic = "force-dynamic";

export default async function AdminSeoAuditPage() {
  await requireAdmin();
  const report = await getStoreReadinessPortfolioReport();
  return <StoreReadinessDashboard report={report} />;
}
