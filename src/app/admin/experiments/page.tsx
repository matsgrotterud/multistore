import { requireAdmin } from "@/lib/admin/auth";
import { PortfolioGrowthControlTower } from "@/components/admin/PortfolioGrowthControlTower";
import { getPortfolioGrowthQueue } from "@/lib/admin/portfolio-growth";

export const dynamic = "force-dynamic";

export default async function AdminExperimentsPage() {
  await requireAdmin();
  const queue = await getPortfolioGrowthQueue();
  return <PortfolioGrowthControlTower queue={queue} />;
}
