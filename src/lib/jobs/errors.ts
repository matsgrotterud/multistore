export class CatalogJobPermanentError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CatalogJobPermanentError";
    this.code = code;
  }
}

export function catalogJobErrorCode(error: unknown): string {
  if (error instanceof CatalogJobPermanentError) return error.code;
  if (error instanceof Error && /timeout/i.test(error.message)) return "TRANSIENT_TIMEOUT";
  return "TRANSIENT_HANDLER_FAILURE";
}

export function isPermanentCatalogJobError(error: unknown): boolean {
  return error instanceof CatalogJobPermanentError;
}
