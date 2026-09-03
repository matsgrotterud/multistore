import { CATALOG_AUTOPILOT_MANUAL_JOB_TYPES } from "@/lib/admin/manual-catalog-job";
import {
  CatalogJobNotRunnableError,
  runCatalogJobById,
  type RunCatalogJobByIdOptions,
} from "@/lib/jobs/runner";

export interface CatalogAutopilotManualRunState {
  status: "idle" | "success" | "warning" | "not-runnable";
  message: string | null;
}

type ExactCatalogJobRunner = (
  options: RunCatalogJobByIdOptions
) => Promise<{
  succeeded: number;
  failed: number;
  executions: Array<{ outcome: string }>;
}>;

export async function executeCatalogAutopilotManualJob(
  jobId: string,
  runner: ExactCatalogJobRunner = runCatalogJobById
): Promise<CatalogAutopilotManualRunState> {
  try {
    const summary = await runner({
      jobId,
      allowedJobTypes: CATALOG_AUTOPILOT_MANUAL_JOB_TYPES,
      workerId: "admin-catalog-autopilot",
    });
    if (summary.failed > 0) {
      return {
        status: "warning",
        message: "The selected job settled without changing products. Review its refreshed status and evidence below.",
      };
    }
    return {
      status: "success",
      message: "The selected job finished. Queue status and observation history are refreshed.",
    };
  } catch (error) {
    if (error instanceof CatalogJobNotRunnableError) {
      return {
        status: "not-runnable",
        message: "This job is no longer eligible to run. It may already be claimed, completed, delayed, or replaced. No other queued job was touched.",
      };
    }
    throw error;
  }
}
