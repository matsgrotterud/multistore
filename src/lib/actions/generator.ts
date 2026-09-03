"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  confirmPreparedProductClass,
  generateProductCopy,
  prepareStoreBlueprint,
  type ProductCopyResult,
  type StoreBlueprintPreparation,
} from "@/lib/ai/store-blueprint";
import { prisma } from "@/lib/db";
import {
  createStoreFromBlueprint,
  type CreateStoreFromBlueprintResult,
} from "@/lib/stores/create-from-blueprint";
import { getMediaStorageSafetyReport } from "@/lib/storage/media-storage-safety";
import {
  beginGenerationRun,
  completeGenerationRun,
  isTerminalGenerationStatus,
} from "@/lib/generator/generation-run";
import {
  executionRequestFingerprint,
  verifyApprovedStorePlanToken,
} from "@/lib/generator/store-plan";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import {
  canTransitionToLive,
  GO_LIVE_EVIDENCE_VERSION,
} from "@/lib/launch/go-live-gate-v3";
import { resolveGenerationProviderPlanV1 } from "@/lib/generator-v3";

export interface GeneratorActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function generateBlueprintAction(
  input: unknown
): Promise<GeneratorActionResult<StoreBlueprintPreparation>> {
  try {
    await requireAdmin();
    const data = await prepareStoreBlueprint(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("blueprint generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function confirmProductClassAction(input: {
  proposalToken: string;
  acknowledged: boolean;
}): Promise<GeneratorActionResult<StoreBlueprintPreparation>> {
  try {
    await requireAdmin();
    if (input.acknowledged !== true) {
      return {
        ok: false,
        error:
          "Confirm that the proposed class describes one physical product class and authorizes only an internal noindex preview.",
      };
    }
    const data = await confirmPreparedProductClass(input.proposalToken);
    if (data.status !== "READY") {
      return { ok: false, error: "Product class could not be confirmed." };
    }
    return { ok: true, data };
  } catch (error) {
    console.error("product class confirmation failed", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Product class confirmation failed.",
    };
  }
}

export async function generateProductCopyAction(
  input: unknown
): Promise<GeneratorActionResult<ProductCopyResult>> {
  try {
    await requireAdmin();
    const data = await generateProductCopy(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("product copy generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function createStoreFromBlueprintAction(options: {
  approvedPlanToken: string;
  importProducts?: boolean;
  autoPublishScored?: boolean;
  idempotencyKey?: string;
  useDemoCatalog?: boolean;
}): Promise<GeneratorActionResult<CreateStoreFromBlueprintResult>> {
  let generationRunId: string | null = null;
  try {
    await requireAdmin();

    // Verify the exact plan shown to the operator before creating a run or
    // performing any database, media, provider or payment-adjacent work.
    const approvedPlan = verifyApprovedStorePlanToken(options.approvedPlanToken);

    if (
      options.useDemoCatalog === true &&
      (process.env.NODE_ENV === "production" || process.env.MOCK_CHECKOUT !== "true")
    ) {
      return {
        ok: false,
        error:
          "Synthetic demo catalog is allowed only outside production with explicit MOCK_CHECKOUT=true.",
      };
    }

    // Preflight: block before creating ANY rows if media would be written
    // locally into a remote DB (prevents orphaned stores + broken live images).
    if ((options.importProducts ?? true) !== false) {
      const safety = getMediaStorageSafetyReport();
      if (safety.unsafe) {
        return { ok: false, error: safety.message };
      }
    }

    const importProducts = options.importProducts ?? true;
    const autoPublishScored = options.autoPublishScored ?? true;
    const providerPlan = resolveGenerationProviderPlanV1({
      importProducts,
      useDemoCatalog: options.useDemoCatalog,
      configuredCsv: process.env.CATALOG_IMPORT_PROVIDER_KEYS,
    });
    const providerKeys = providerPlan.providerKeys;
    const requestFingerprint = executionRequestFingerprint({
      planDigest: approvedPlan.planDigest,
      importProducts,
      autoPublishScored,
      providerMode: providerPlan.mode,
      providerKeys,
    });
    const run = await beginGenerationRun({
      idempotencyKey: options.idempotencyKey,
      originalInput: approvedPlan.input,
      requestFingerprint,
    });
    generationRunId = run.runId;
    if (run.isExisting) {
      if (isTerminalGenerationStatus(run.status) && isCreateStoreResult(run.summary.result)) {
        return { ok: true, data: run.summary.result };
      }
      return {
        ok: false,
        error: `Generation run ${run.runId} already exists with state ${run.status}. No duplicate store was created.`,
      };
    }

    const result = await createStoreFromBlueprint({
      blueprint: approvedPlan.blueprint,
      input: approvedPlan.input,
      preparedCatalogPlan: {
        classProfile: approvedPlan.classProfile,
        intent: approvedPlan.intent,
        queryPlan: approvedPlan.queryPlan,
        planDigest: approvedPlan.planDigest,
      },
      importProducts,
      autoPublishScored,
      generationRunId: run.runId,
      providerKeys,
    });

    revalidatePath("/admin/stores");
    revalidatePath("/admin/products");
    revalidatePath("/admin/generator");
    if (result.previewReady && result.storeSlug) {
      revalidatePath(`/s/${result.storeSlug}`, "layout");
    }

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("create store from blueprint failed", error);
    const message = error instanceof Error ? error.message : "Create failed.";
    if (generationRunId) {
      try {
        const existing = await prisma.catalogSyncRun.findUnique({ where: { id: generationRunId } });
        if (existing?.storeId) {
          await prisma.store.update({
            where: { id: existing.storeId },
            data: { isActive: false, launchStatus: "DRAFT" },
          });
        }
        if (existing && !isTerminalGenerationStatus(existing.status)) {
          await completeGenerationRun({
            runId: generationRunId,
            status: "VALIDATION_FAILED",
            result: { status: "VALIDATION_FAILED", runId: generationRunId },
            errorMessage: message,
            reasonCodes: ["UNHANDLED_GENERATION_ERROR"],
          });
        }
      } catch (auditError) {
        console.error("generation audit finalization failed", auditError);
      }
    }
    return { ok: false, error: message };
  }
}

function isCreateStoreResult(value: unknown): value is CreateStoreFromBlueprintResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CreateStoreFromBlueprintResult>;
  return typeof candidate.runId === "string" && typeof candidate.generationStatus === "string";
}

export async function markStoreLiveAction(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const store = await prisma.store.findUnique({
      where: { slug },
      include: { settings: true },
    });
    if (!store) return { ok: false, error: "Store not found." };
    if (store.launchStatus === "LIVE") return { ok: true };
    if (!store.plannedDomain && !store.primaryDomain.includes(".")) {
      return { ok: false, error: "Set a planned domain before going live." };
    }

    const generation = parseStoreSettings(store.settings?.settings).generation;
    const completedAt = generation?.completedAt ?? null;
    const previewReady =
      generation?.status === "READY_FOR_PREVIEW" ||
      generation?.status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW";
    const decision = canTransitionToLive({
      currentLaunchStatus: store.launchStatus,
      evidenceVersion: generation ? GO_LIVE_EVIDENCE_VERSION : null,
      generation: generation
        ? {
            contractVersion: generation.contractVersion,
            terminalState: generation.status,
            productClassProfileSource: generation.classProfile?.source ?? null,
            runId: generation.runId,
            generatorVersion: generation.generatorVersion,
            ontologyVersion: generation.ontologyVersion,
            evaluatorVersion: generation.evaluatorVersion,
            completedAt,
          }
        : null,
      manualReview: generation
        ? {
            required: generation.manualReviewRequired,
            status: generation.manualReviewStatus,
            reviewedBy: null,
            reviewedAt: null,
          }
        : null,
      humanApproval: generation
        ? {
            approved: generation.humanLaunchApproved,
            approvalKind: generation.humanLaunchApproved ? "HUMAN" : null,
            approvedBy: generation.humanLaunchApprovedBy,
            approvedAt: generation.humanLaunchApprovedAt,
          }
        : null,
      catalog: generation
        ? {
            status: previewReady ? "PASS" : "FAIL",
            evidenceRefs: [`generation:${generation.runId}`],
            verifiedBy: "generator-v3",
            verifiedAt: completedAt,
            minimumProductCount: generation.minimumProducts,
            previewVisibleProductCount: generation.previewVisibleProducts,
            previewComplete: previewReady,
          }
        : null,
      relevance: generation
        ? {
            status:
              generation.previewVisibleProducts >= generation.minimumProducts ? "PASS" : "FAIL",
            evidenceRefs: [`generation:${generation.runId}:relevance`],
            verifiedBy: "candidate-evaluator.v1",
            verifiedAt: completedAt,
            evaluatedVisibleProductCount: generation.previewVisibleProducts,
            failedVisibleProductCount: 0,
            unknownVisibleProductCount: 0,
          }
        : null,
      media: generation
        ? {
            status:
              generation.previewVisibleProducts >= generation.minimumProducts ? "PASS" : "FAIL",
            evidenceRefs: [`generation:${generation.runId}:media`],
            verifiedBy: "catalog-visibility.v3",
            verifiedAt: completedAt,
            usableVisibleProductCount: generation.previewVisibleProducts,
            failedVisibleProductCount: 0,
            unknownVisibleProductCount: 0,
          }
        : null,
      content: generation
        ? {
            status: previewReady ? "PASS" : "FAIL",
            evidenceRefs: [`generation:${generation.runId}:grounded-content`],
            verifiedBy: "generator-v3",
            verifiedAt: completedAt,
            grounded: previewReady,
            unverifiedClaimsPresent: null,
          }
        : null,
      compliance: generation
        ? {
            status: "REVIEW",
            evidenceRefs: [`store:${store.id}:policies`],
            verifiedBy: null,
            verifiedAt: null,
            policyPagesPresent: Boolean(store.privacyPolicy && store.termsOfSale),
            requiredDisclosuresPresent: Boolean(store.shippingOriginDisclosure),
            unresolvedFlagCount: null,
          }
        : null,
      // DNS/TLS/ownership and live commerce are intentionally not inferred from
      // a planned hostname or preview checkout. Until explicit evidence is
      // wired, new V3 stores fail closed here.
      domain: null,
      commerce: null,
    });
    if (!decision.allowed || !decision.shouldTransition) {
      const reasons = decision.reasons
        .slice(0, 8)
        .map((reason) => `${reason.code}: ${reason.message}`)
        .join(" ");
      return {
        ok: false,
        error: `Go-live blocked by ${decision.blockedGates.join(", ")}. ${reasons}`,
      };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        launchStatus: "LIVE",
        primaryDomain: store.plannedDomain ?? store.primaryDomain,
      },
    });

    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${slug}/edit`);
    revalidatePath(`/s/${slug}`, "layout");
    return { ok: true };
  } catch (error) {
    console.error("mark store live failed", error);
    return { ok: false, error: "Could not update launch status." };
  }
}
