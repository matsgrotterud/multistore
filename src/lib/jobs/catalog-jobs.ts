import { importApprovedCandidates } from "@/lib/catalog/candidate-service";
import { markStaleSupplierProducts } from "@/lib/catalog/refresh-existing-products";
import { discoverProductsForStore } from "@/lib/suppliers/catalog/discover-products";
import { parseJsonObject } from "@/lib/utils/json";

export async function runCatalogJob(job: {
  storeId: string;
  providerKey: string;
  jobType: string;
  payloadJson: string;
}): Promise<Record<string, unknown>> {
  const payload = parseJsonObject(job.payloadJson);

  if (job.jobType === "DISCOVER") {
    const query = typeof payload.query === "string" ? payload.query : "";
    if (!query) throw new Error("DISCOVER job requires payload.query.");
    const result = await discoverProductsForStore({
      storeId: job.storeId,
      providerKey: job.providerKey,
      query,
      categoryId: typeof payload.categoryId === "string" ? payload.categoryId : undefined,
      limit: typeof payload.limit === "number" ? payload.limit : 12,
    });
    return { ...result };
  }

  if (job.jobType === "IMPORT_APPROVED") {
    return importApprovedCandidates(job.storeId, typeof payload.limit === "number" ? payload.limit : 20);
  }

  if (job.jobType === "REFRESH_EXISTING") {
    const stale = await markStaleSupplierProducts(job.storeId);
    return { stale };
  }

  return { skipped: true, reason: `No runner implemented for ${job.jobType}.` };
}
