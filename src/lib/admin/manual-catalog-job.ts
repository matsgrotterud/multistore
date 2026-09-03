export const CATALOG_AUTOPILOT_MANUAL_JOB_TYPES = ["REFRESH_EXISTING"] as const;

const CATALOG_JOB_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{7,191}$/;

export class AdminCatalogJobRunRequestError extends Error {
  readonly code = "INVALID_ADMIN_CATALOG_JOB_RUN_REQUEST" as const;

  constructor(message = "An exact catalog job id is required.") {
    super(message);
    this.name = "AdminCatalogJobRunRequestError";
  }
}

export function parseExactCatalogJobId(value: unknown): string {
  if (typeof value !== "string") throw new AdminCatalogJobRunRequestError();
  const jobId = value.trim();
  if (!CATALOG_JOB_ID.test(jobId)) throw new AdminCatalogJobRunRequestError();
  return jobId;
}

/**
 * The generic admin endpoint accepts one operation identity and nothing else.
 * Job type is intentionally server-owned so callers cannot broaden the
 * Autopilot allowlist in their request body.
 */
export function parseAdminCatalogJobRunRequest(input: unknown): { jobId: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AdminCatalogJobRunRequestError();
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== "jobId") {
    throw new AdminCatalogJobRunRequestError(
      "The request must contain exactly one catalog job id."
    );
  }
  return { jobId: parseExactCatalogJobId(record.jobId) };
}
