import type { ProductSearchResult, ProviderKey } from "@/lib/suppliers/providers/types";

export const PROVIDER_SEARCH_POLICY_VERSION = "provider-search.v1";

export type ProviderAttemptStatus =
  | "SUCCESS"
  | "ZERO_RESULTS"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "AUTH_FAILED"
  | "INVALID_RESPONSE"
  | "FAILED";

export interface ProviderQueryAttempt {
  providerKey: string;
  query: string;
  attempt: number;
  status: ProviderAttemptStatus;
  startedAt: string;
  finishedAt: string;
  resultCount: number;
  errorCode?: string;
  errorMessage?: string;
}

export class ProviderSearchFailure extends Error {
  constructor(
    message: string,
    readonly providerKey: string,
    readonly attempts: ProviderQueryAttempt[]
  ) {
    super(message);
    this.name = "ProviderSearchFailure";
  }
}

export function classifyProviderSearchError(error: unknown): {
  status: Exclude<ProviderAttemptStatus, "SUCCESS" | "ZERO_RESULTS">;
  code: string;
  retryable: boolean;
} {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (/\b429\b|rate.?limit|too many requests|request frequency/.test(lower)) {
    return { status: "RATE_LIMITED", code: "PROVIDER_RATE_LIMIT", retryable: true };
  }
  if (/timeout|timed out|aborterror|etimedout/.test(lower)) {
    return { status: "TIMEOUT", code: "PROVIDER_TIMEOUT", retryable: true };
  }
  if (/401|403|auth|credential|access token|api[_ -]?key|not configured/.test(lower)) {
    return { status: "AUTH_FAILED", code: "PROVIDER_AUTH", retryable: false };
  }
  if (/invalid response|parse|schema|validation|unexpected token|invalid json/.test(lower)) {
    return {
      status: "INVALID_RESPONSE",
      code: "PROVIDER_INVALID_RESPONSE",
      retryable: false,
    };
  }
  return { status: "FAILED", code: "PROVIDER_REQUEST_FAILED", retryable: true };
}

interface ProviderSearchPolicyOptions {
  providerKey: ProviderKey | string;
  query?: string;
  search: () => Promise<ProductSearchResult[]>;
  maxAttempts?: number;
  timeoutMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
}

interface ProviderSearchPolicyResult {
  results: ProductSearchResult[];
  attempts: ProviderQueryAttempt[];
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Provider-specific pacing belongs at the provider transport boundary. This
 * layer adds bounded retries and attempt evidence without wrapping CJ a second
 * time. A provider failure is never collapsed into an empty result set.
 */
export async function runProviderSearchWithPolicy(
  options: ProviderSearchPolicyOptions
): Promise<ProviderSearchPolicyResult> {
  return runBoundedSearch(options);
}

async function runBoundedSearch(
  options: ProviderSearchPolicyOptions
): Promise<ProviderSearchPolicyResult> {
  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? 3, 4));
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const timeoutMs = boundedTimeoutMs(options.timeoutMs);
  const attempts: ProviderQueryAttempt[] = [];
  const isCj = options.providerKey.trim().toLowerCase() === "cj";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (!isCj && attempt > 1) {
      await sleep(Math.min(2_000, 250 * 2 ** (attempt - 2)));
    }

    const startedAt = new Date(now()).toISOString();
    try {
      // CJ owns its abortable timeout inside the same gate that paces every CJ
      // endpoint. Keeping a second caller-side timeout would release retries
      // before the transport has observed its abort. Other providers retain the
      // existing generic timeout behavior.
      const results = isCj
        ? await options.search()
        : await withProviderTimeout(options.search(), timeoutMs);
      const finishedAt = new Date(now()).toISOString();
      attempts.push({
        providerKey: options.providerKey,
        query: options.query ?? "(not recorded)",
        attempt,
        status: results.length === 0 ? "ZERO_RESULTS" : "SUCCESS",
        startedAt,
        finishedAt,
        resultCount: results.length,
      });
      return { results, attempts };
    } catch (error) {
      const classified = classifyProviderSearchError(error);
      const message = error instanceof Error ? error.message : String(error);
      attempts.push({
        providerKey: options.providerKey,
        query: options.query ?? "(not recorded)",
        attempt,
        status: classified.status,
        startedAt,
        finishedAt: new Date(now()).toISOString(),
        resultCount: 0,
        errorCode: classified.code,
        errorMessage: message,
      });

      if (!classified.retryable || attempt === maxAttempts) {
        throw new ProviderSearchFailure(message, options.providerKey, attempts);
      }
      if (isCj) {
        await sleep(Math.min(4_000, 1_100 * 2 ** (attempt - 1)));
      }
    }
  }

  throw new ProviderSearchFailure("Provider search exhausted retries.", options.providerKey, attempts);
}

function boundedTimeoutMs(value: number | undefined): number {
  const configured = value ?? Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS ?? 15_000);
  return Number.isFinite(configured) && configured >= 100 && configured <= 60_000
    ? Math.floor(configured)
    : 15_000;
}

async function withProviderTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Provider search timed out after ${timeoutMs}ms.`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
