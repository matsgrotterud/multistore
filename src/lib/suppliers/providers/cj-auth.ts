import {
  cjTransportFetch,
  type CjTransportFetch,
} from "@/lib/suppliers/providers/cj-request-gate";

const DEFAULT_CJ_API_BASE =
  "https://developers.cjdropshipping.com/api2.0/v1";

interface CjTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiryDate?: string;
}

interface CjAuthClientOptions {
  transportFetch?: CjTransportFetch;
  env?: Readonly<Record<string, string | undefined>>;
  now?: () => number;
  apiBase?: string;
}

export interface CjAuthClient {
  cjFetch<T>(path: string, init?: RequestInit): Promise<T>;
  getAccessToken(signal?: AbortSignal): Promise<string>;
}

/**
 * Creates an isolated auth client while keeping every real CJ HTTP start on
 * the supplied transport. Production uses the singleton process-local paced
 * transport; tests can inject the same boundary with a virtual clock.
 */
export function createCjAuthClient(
  options: CjAuthClientOptions = {}
): CjAuthClient {
  const transportFetch = options.transportFetch ?? cjTransportFetch;
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;
  const apiBase = options.apiBase ?? env.CJ_API_BASE ?? DEFAULT_CJ_API_BASE;
  let cachedToken: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null = null;

  const cacheToken = (result: CjTokenResponse): void => {
    const expiresAt = result.accessTokenExpiryDate
      ? new Date(result.accessTokenExpiryDate).getTime()
      : now() + 12 * 60 * 60 * 1000;
    cachedToken = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt,
    };
  };

  const requestToken = async (
    body: Record<string, string>,
    signal?: AbortSignal
  ): Promise<CjTokenResponse> => {
    const response = await transportFetch(
      `${apiBase}/authentication/getAccessToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      }
    );

    const json = (await response.json()) as {
      code?: number;
      result?: CjTokenResponse | boolean;
      data?: CjTokenResponse;
      message?: string;
    };
    const token =
      json.data ??
      (typeof json.result === "object" ? json.result : undefined);

    if (!response.ok || !token?.accessToken) {
      throw new Error(json.message ?? "CJ authentication failed");
    }

    return token;
  };

  const refreshCjToken = async (
    refreshToken: string,
    signal?: AbortSignal
  ): Promise<CjTokenResponse> => {
    const response = await transportFetch(
      `${apiBase}/authentication/refreshAccessToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        signal,
      }
    );

    const json = (await response.json()) as {
      code?: number;
      result?: CjTokenResponse | boolean;
      data?: CjTokenResponse;
      message?: string;
    };
    const token =
      json.data ??
      (typeof json.result === "object" ? json.result : undefined);

    if (!response.ok || !token?.accessToken) {
      throw new Error(json.message ?? "CJ token refresh failed");
    }

    cacheToken(token);
    return token;
  };

  const getAccessToken = async (signal?: AbortSignal): Promise<string> => {
    if (env.CJ_ENABLED !== "true") {
      throw new Error("CJ_ENABLED is not true");
    }

    if (cachedToken && cachedToken.expiresAt > now() + 60_000) {
      return cachedToken.accessToken;
    }

    if (env.CJ_REFRESH_TOKEN) {
      try {
        const refreshed = await refreshCjToken(env.CJ_REFRESH_TOKEN, signal);
        return refreshed.accessToken;
      } catch (error) {
        if (signal?.aborted) throw error;
        // Fall through to a static token or API-key auth.
      }
    }

    if (env.CJ_ACCESS_TOKEN) {
      cachedToken = {
        accessToken: env.CJ_ACCESS_TOKEN,
        refreshToken: env.CJ_REFRESH_TOKEN ?? "",
        expiresAt: now() + 12 * 60 * 60 * 1000,
      };
      return env.CJ_ACCESS_TOKEN;
    }

    const apiKey = env.CJ_API_KEY;
    if (!apiKey) {
      throw new Error("CJ_API_KEY or CJ_ACCESS_TOKEN is required");
    }

    try {
      const response = await requestToken({ apiKey }, signal);
      cacheToken(response);
      return response.accessToken;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (!env.CJ_EMAIL) throw error;
    }

    const legacyResponse = await requestToken(
      {
        email: env.CJ_EMAIL,
        password: apiKey,
      },
      signal
    );
    cacheToken(legacyResponse);
    return legacyResponse.accessToken;
  };

  const request = async <T>(
    path: string,
    init?: RequestInit
  ): Promise<T> => {
    const token = await getAccessToken(init?.signal ?? undefined);
    const response = await transportFetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
        ...(env.CJ_PLATFORM_TOKEN
          ? { platformToken: env.CJ_PLATFORM_TOKEN }
          : {}),
        ...(init?.headers ?? {}),
      },
    });

    const json = (await response.json()) as {
      code?: number;
      result?: T | boolean;
      message?: string;
      data?: T;
    };
    if (
      !response.ok ||
      (json.code !== undefined && json.code !== 200 && json.code !== 0)
    ) {
      throw new Error(json.message ?? `CJ API error (${response.status})`);
    }
    if (json.data !== undefined) return json.data as T;
    if (typeof json.result === "object" && json.result !== null) {
      return json.result as T;
    }
    return json as T;
  };

  return { cjFetch: request, getAccessToken };
}

const defaultAuthClient = createCjAuthClient();

function isEnabled(): boolean {
  return process.env.CJ_ENABLED === "true";
}

function requiredEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.CJ_API_KEY && !process.env.CJ_ACCESS_TOKEN) {
    missing.push("CJ_API_KEY");
  }
  return missing;
}

async function cjFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return defaultAuthClient.cjFetch<T>(path, init);
}

export async function getCjAccessToken(signal?: AbortSignal): Promise<string> {
  return defaultAuthClient.getAccessToken(signal);
}

export function getCjHealthInfo(): {
  enabled: boolean;
  missingEnv: string[];
  configured: boolean;
} {
  const missingEnv = isEnabled() ? requiredEnv() : ["CJ_ENABLED"];
  return {
    enabled: isEnabled(),
    missingEnv,
    configured: isEnabled() && missingEnv.length === 0,
  };
}

export function isCjOrderApiEnabled(): boolean {
  return process.env.CJ_ORDER_API_ENABLED === "true";
}

export function isCjManualFulfillmentEnabled(): boolean {
  return (
    process.env.CJ_MANUAL_FULFILLMENT_ENABLED === "true" ||
    process.env.MANUAL_FULFILLMENT_ENABLED === "true"
  );
}

export function getCjOrderConfig(): {
  enabled: boolean;
  missingEnv: string[];
  logisticName: string | null;
  fromCountryCode: string | null;
  payType: 2 | 3;
} {
  const logisticName = process.env.CJ_LOGISTIC_NAME?.trim() || null;
  const fromCountryCode = process.env.CJ_FROM_COUNTRY_CODE?.trim().toUpperCase() || null;
  const missingEnv: string[] = [];
  if (!logisticName) missingEnv.push("CJ_LOGISTIC_NAME");
  if (!fromCountryCode) missingEnv.push("CJ_FROM_COUNTRY_CODE");
  return {
    enabled: isCjOrderApiEnabled() && missingEnv.length === 0,
    missingEnv,
    logisticName,
    fromCountryCode,
    payType: process.env.CJ_ORDER_PAY_TYPE === "2" ? 2 : 3,
  };
}

export { cjFetch, isEnabled as isCjEnabled };
