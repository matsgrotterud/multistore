"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  approveCandidate,
  discoverProductsForStore,
  importApprovedCandidates,
  rejectCandidate,
} from "@/lib/catalog/candidate-service";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";

export async function runDiscoveryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const storeId = String(formData.get("storeId") ?? "");
  const providerKey = String(formData.get("providerKey") ?? "mock");
  const query = String(formData.get("query") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "");

  if (!storeId || !query) return;

  const run = await prisma.catalogSyncRun.create({
    data: {
      storeId,
      providerKey,
      requestedBy: "admin",
      summaryJson: toJson({ query }),
    },
  });

  try {
    const summary = await discoverProductsForStore({
      storeId,
      providerKey,
      query,
      categoryId: categoryIdRaw || undefined,
      limit: 12,
    });
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: summary.errors.length > 0 ? "PARTIAL" : "SUCCESS",
        finishedAt: new Date(),
        summaryJson: toJson({ query, ...summary }),
        errorMessage: summary.errors.join(" "),
      },
    });
  } catch (error) {
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown discovery error",
      },
    });
  }

  revalidatePath("/admin/import");
}

export async function approveCandidateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const candidateId = String(formData.get("candidateId") ?? "");
  if (candidateId) await approveCandidate(candidateId);
  revalidatePath("/admin/import");
}

export async function rejectCandidateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const candidateId = String(formData.get("candidateId") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected by admin.");
  if (candidateId) await rejectCandidate(candidateId, reason);
  revalidatePath("/admin/import");
}

export async function importApprovedCandidatesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const storeId = String(formData.get("storeId") ?? "");
  if (storeId) {
    await importApprovedCandidates(storeId, 20);
  }
  revalidatePath("/admin/import");
}

