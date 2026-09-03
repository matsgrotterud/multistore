export const CJ_MINIMUM_REQUEST_INTERVAL_MS = 1_100;
const DEFAULT_CJ_CATALOG_TIMEOUT_MS = 15_000;

type Sleep = (milliseconds: number) => Promise<void>;

export type CjRequestGate = <T>(
  request: () => Promise<T>,
  signal?: AbortSignal
) => Promise<T>;

export type CjTransportFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface CjCatalogRequestOptions<T> {
  request: (signal: AbortSignal) => Promise<T>;
  timeoutMs?: number;
}

export type CjCatalogRequestRunner = <T>(
  options: CjCatalogRequestOptions<T>
) => Promise<T>;

export class CjCatalogTimeoutError extends Error {
  readonly code = "CJ_CATALOG_TIMEOUT";

  constructor(readonly timeoutMs: number) {
    super(`CJ catalog request timed out after ${timeoutMs}ms.`);
    this.name = "CjCatalogTimeoutError";
  }
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Process-local CJ transport gate. It serializes each actual HTTP request and
 * keeps HTTP starts at least 1.1 seconds apart. This deliberately does not
 * claim to coordinate separate Node/serverless instances that share a CJ key.
 */
export function createCjRequestGate(options: {
  minimumIntervalMs?: number;
  sleep?: Sleep;
  now?: () => number;
} = {}): CjRequestGate {
  const minimumIntervalMs = boundedInterval(options.minimumIntervalMs);
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  let serial: Promise<void> = Promise.resolve();
  let lastRequestStartedAt: number | null = null;

  return async function runWithCjPacing<T>(
    request: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    const execute = async (): Promise<T> => {
      throwIfAborted(signal);
      if (lastRequestStartedAt !== null) {
        const waitForSlot = Math.max(
          0,
          minimumIntervalMs - (now() - lastRequestStartedAt)
        );
        if (waitForSlot > 0) await sleep(waitForSlot);
      }
      throwIfAborted(signal);
      lastRequestStartedAt = now();
      return request();
    };

    const queued = serial.then(execute, execute);
    serial = queued.then(
      () => undefined,
      () => undefined
    );
    return raceWithAbort(queued, signal);
  };
}

export const runCjRequestWithPacing = createCjRequestGate();

/**
 * The only default boundary that is allowed to start a CJ HTTP request. Token,
 * refresh, fallback-auth, catalog and order calls all pass through this same
 * process-local gate. The dynamic global fetch lookup keeps offline tests
 * injectable without bypassing the production boundary.
 */
export function createCjTransportFetch(options: {
  runWithPacing?: CjRequestGate;
  fetch?: CjTransportFetch;
} = {}): CjTransportFetch {
  const runWithPacing = options.runWithPacing ?? runCjRequestWithPacing;
  const nativeFetch =
    options.fetch ??
    ((input: string | URL | Request, init?: RequestInit) =>
      globalThis.fetch(input, init));

  return (input, init) =>
    runWithPacing(
      () => nativeFetch(input, init),
      init?.signal ?? undefined
    );
}

export const cjTransportFetch = createCjTransportFetch();

/**
 * Applies one aborting deadline to a logical catalog operation, including auth
 * and queue time. It deliberately does not pace the high-level operation:
 * cjTransportFetch owns pacing for every actual HTTP start, avoiding nested
 * acquisition when cjFetch performs refresh or fallback authentication.
 */
export function createCjCatalogRequestRunner(options: {
  defaultTimeoutMs?: number;
} = {}): CjCatalogRequestRunner {
  const defaultTimeoutMs = boundedTimeoutMs(options.defaultTimeoutMs);

  return async function runCatalogRequest<T>(
    requestOptions: CjCatalogRequestOptions<T>
  ): Promise<T> {
    const timeoutMs = boundedTimeoutMs(
      requestOptions.timeoutMs,
      defaultTimeoutMs
    );
    const controller = new AbortController();
    const timeoutError = new CjCatalogTimeoutError(timeoutMs);
    const timeout = setTimeout(() => controller.abort(timeoutError), timeoutMs);

    try {
      const result = await requestOptions.request(controller.signal);
      if (controller.signal.aborted) throw timeoutError;
      return result;
    } catch (error) {
      if (controller.signal.aborted) throw timeoutError;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export const runCjCatalogRequest = createCjCatalogRequestRunner({
  defaultTimeoutMs: configuredCatalogTimeoutMs(),
});

function configuredCatalogTimeoutMs(): number {
  return boundedTimeoutMs(Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS));
}

function boundedTimeoutMs(value: number | undefined, fallback = DEFAULT_CJ_CATALOG_TIMEOUT_MS): number {
  return Number.isFinite(value) && value !== undefined && value >= 100 && value <= 60_000
    ? Math.floor(value)
    : fallback;
}

function boundedInterval(value: number | undefined): number {
  if (value === undefined) return CJ_MINIMUM_REQUEST_INTERVAL_MS;
  return Number.isFinite(value) && value >= 0 && value <= 60_000
    ? Math.floor(value)
    : CJ_MINIMUM_REQUEST_INTERVAL_MS;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new Error("CJ request aborted");
  }
}

function raceWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(signal.reason ?? new Error("CJ request aborted"));
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason ?? new Error("CJ request aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}
