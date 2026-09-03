import { isAdminAuthenticated } from "@/lib/admin/auth";
import { handleAdminCatalogJobRunRequest } from "@/lib/admin/catalog-job-run-route";
import { runCatalogJobById } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleAdminCatalogJobRunRequest(request, {
    isAuthenticated: isAdminAuthenticated,
    runExactJob: runCatalogJobById,
  });
}
