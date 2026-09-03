import { importApprovedCandidates } from "@/lib/catalog/candidate-service";
import { refreshExistingProductsShadow } from "@/lib/catalog/refresh-existing-products";
import { CatalogJobPermanentError } from "@/lib/jobs/errors";
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
    if (!query) {
      throw new CatalogJobPermanentError(
        "INVALID_JOB_PAYLOAD",
        "DISCOVER job requires payload.query."
      );
    }
    const result = await discoverProductsForStore({
      storeId: job.storeId,
      providerKey: job.providerKey,
      query,
      categoryId: typeof payload.categoryId === "string" ? payload.categoryId : undefined,
      limit: typeof payload.limit === "number" ? payload.limit : 12,
    });
    return {
      ...result,
      outcome: result.errors.length > 0 ? "PARTIAL" : "SUCCESS",
    };
  }

  if (job.jobType === "IMPORT_APPROVED") {
    const result = await importApprovedCandidates(
      job.storeId,
      typeof payload.limit === "number" ? payload.limit : 20
    );
    return {
      ...result,
      outcome: result.errors.length > 0 ? "PARTIAL" : "SUCCESS",
    };
  }

  if (job.jobType === "REFRESH_EXISTING") {
    const result = await refreshExistingProductsShadow({
      storeId: job.storeId,
      providerKey: job.providerKey,
      limit: typeof payload.limit === "number" ? payload.limit : undefined,
      maxAgeHours:
        typeof payload.maxAgeHours === "number" ? payload.maxAgeHours : undefined,
      allowFixtureMode: payload.allowFixtureMode === true,
      force: payload.force === true,
    });
    return { ...result };
  }

  if (job.jobType === "ROUTE_ORDER") {
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    if (!orderId) {
      throw new CatalogJobPermanentError(
        "INVALID_JOB_PAYLOAD",
        "ROUTE_ORDER job requires payload.orderId."
      );
    }
    // Dynamic import avoids a queue -> route -> queue initialization cycle.
    const { routeOrder } = await import("@/lib/orders/route-order");
    const result = await routeOrder(orderId);
    if (!result.ok) {
      throw new Error(
        `Order routing has not reached an accepted terminal state (${result.status}/${result.paymentStatus}/${result.fulfillmentStatus}).`
      );
    }
    return {
      orderId: result.orderId,
      status: result.status,
      paymentStatus: result.paymentStatus,
      fulfillmentStatus: result.fulfillmentStatus,
    };
  }

  if (job.jobType === "ENRICH" || job.jobType === "MEDIA_SYNC") {
    throw new CatalogJobPermanentError(
      "UNSUPPORTED_JOB_TYPE",
      `No runner is implemented for ${job.jobType}.`
    );
  }

  throw new CatalogJobPermanentError(
    "UNKNOWN_JOB_TYPE",
    `Unknown catalog job type: ${job.jobType}.`
  );
}
