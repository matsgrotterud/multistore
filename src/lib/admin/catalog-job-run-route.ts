import { NextResponse } from "next/server";
import {
  AdminCatalogJobRunRequestError,
  CATALOG_AUTOPILOT_MANUAL_JOB_TYPES,
  parseAdminCatalogJobRunRequest,
} from "@/lib/admin/manual-catalog-job";
import {
  CatalogJobNotRunnableError,
  type RunCatalogJobByIdOptions,
} from "@/lib/jobs/runner";

interface AdminCatalogJobRunRouteDependencies {
  isAuthenticated(): Promise<boolean>;
  runExactJob(options: RunCatalogJobByIdOptions): Promise<unknown>;
}

export async function handleAdminCatalogJobRunRequest(
  request: Request,
  dependencies: AdminCatalogJobRunRouteDependencies
): Promise<Response> {
  if (!(await dependencies.isAuthenticated())) {
    return NextResponse.json(
      { ok: false, code: "ADMIN_AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  let parsed: { jobId: string };
  try {
    parsed = parseAdminCatalogJobRunRequest(await request.json());
  } catch (error) {
    if (error instanceof AdminCatalogJobRunRequestError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, code: "INVALID_ADMIN_CATALOG_JOB_RUN_REQUEST" },
        { status: 400 }
      );
    }
    throw error;
  }

  try {
    const summary = await dependencies.runExactJob({
      jobId: parsed.jobId,
      allowedJobTypes: CATALOG_AUTOPILOT_MANUAL_JOB_TYPES,
      workerId: "admin-catalog-autopilot",
    });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof CatalogJobNotRunnableError) {
      return NextResponse.json(
        { ok: false, code: error.code },
        { status: 409 }
      );
    }
    throw error;
  }
}
