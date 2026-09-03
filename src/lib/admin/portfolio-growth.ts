import { prioritizePortfolioGrowth } from "@/lib/growth/portfolio-prioritizer";
import type { PortfolioGrowthQueue } from "@/lib/growth/types";
import { getStoreGrowthAdvisorPlans } from "@/lib/admin/store-growth-advisor";

/** Read-only composition layer for the admin portfolio queue. */
export async function getPortfolioGrowthQueue(options: {
  now?: Date;
} = {}): Promise<PortfolioGrowthQueue> {
  const plans = await getStoreGrowthAdvisorPlans({ now: options.now });
  return prioritizePortfolioGrowth(plans);
}
