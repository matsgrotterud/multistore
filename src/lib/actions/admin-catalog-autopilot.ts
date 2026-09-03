"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  executeCatalogAutopilotManualJob,
  type CatalogAutopilotManualRunState,
} from "@/lib/admin/catalog-autopilot-manual-run";
import { parseExactCatalogJobId } from "@/lib/admin/manual-catalog-job";
import { prisma } from "@/lib/db";
import { enqueueCatalogJobOnce } from "@/lib/jobs/queue";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";

const BINDING_SEPARATOR = "\u001f";
const MANUAL_REFRESH_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export interface CatalogShadowRefreshRequest {
  storeId: string;
  providerKey: string;
  requestId: string;
  dedupeKey: string;
  payload: {
    limit: number;
    allowFixtureMode: boolean;
    force: true;
  };
}

/**
 * Parse the durable operation identity separately from the action's database
 * work. The request id is rendered once with the form and remains stable when
 * a browser or user repeats the same submission.
 *
 * This helper is async because every export in a `use server` module must be an
 * async server function. It has no side effects and exists so the action's
 * fail-closed input and idempotency rules can be tested directly.
 */
export async function prepareCatalogShadowRefreshRequest(
  formData: FormData
): Promise<CatalogShadowRefreshRequest> {
  const binding = String(formData.get("binding") ?? "").trim();
  const parts = binding.split(BINDING_SEPARATOR);
  if (parts.length !== 2) {
    throw new Error("Store and provider are required.");
  }

  const bindingStoreId = parts[0]?.trim() ?? "";
  const bindingProviderKey = parts[1]?.trim().toLowerCase() ?? "";
  const submittedStoreId = String(formData.get("storeId") ?? "").trim();
  const submittedProviderKey = String(formData.get("providerKey") ?? "")
    .trim()
    .toLowerCase();

  if (!bindingStoreId || !bindingProviderKey) {
    throw new Error("Store and provider are required.");
  }
  if (submittedStoreId && submittedStoreId !== bindingStoreId) {
    throw new Error("Store binding does not match the submitted store.");
  }
  if (submittedProviderKey && submittedProviderKey !== bindingProviderKey) {
    throw new Error("Provider binding does not match the submitted provider.");
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!MANUAL_REFRESH_REQUEST_ID.test(requestId)) {
    throw new Error("A valid stable refresh request id is required.");
  }

  const allowFixtureMode =
    bindingProviderKey === "mock" && formData.get("allowFixtureMode") === "on";

  return {
    storeId: bindingStoreId,
    providerKey: bindingProviderKey,
    requestId,
    dedupeKey: `admin-shadow-refresh.v1:${requestId}`,
    payload: {
      limit: 12,
      allowFixtureMode,
      force: true,
    },
  };
}

export async function runCatalogShadowRefreshAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const request = await prepareCatalogShadowRefreshRequest(formData);

  // Registry validation is local and must happen before the queue write. It
  // does not call supplier health, search or details APIs.
  getCommerceProvider(request.providerKey);

  const [store, boundProducts] = await Promise.all([
    prisma.store.findFirst({
      where: { id: request.storeId, isActive: true },
      select: { id: true },
    }),
    prisma.product.count({
      where: {
        storeId: request.storeId,
        providerKey: request.providerKey,
        externalId: { not: null },
      },
    }),
  ]);
  if (!store) throw new Error("Unknown or inactive store.");
  if (boundProducts === 0) {
    throw new Error("This store has no products bound to the selected provider.");
  }

  await enqueueCatalogJobOnce({
    storeId: request.storeId,
    providerKey: request.providerKey,
    jobType: "REFRESH_EXISTING",
    dedupeKey: request.dedupeKey,
    payload: request.payload,
  });

  revalidatePath("/admin/catalog-autopilot");
}

export async function prepareCatalogShadowRefreshJobRunRequest(
  formData: FormData
): Promise<{ jobId: string }> {
  return { jobId: parseExactCatalogJobId(formData.get("jobId")) };
}

export async function runCatalogShadowRefreshJobAction(
  _previousState: CatalogAutopilotManualRunState,
  formData: FormData
): Promise<CatalogAutopilotManualRunState> {
  await requireAdmin();
  const request = await prepareCatalogShadowRefreshJobRunRequest(formData);
  const state = await executeCatalogAutopilotManualJob(request.jobId);
  revalidatePath("/admin/catalog-autopilot");
  return state;
}
