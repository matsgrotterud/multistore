const CJ_API_BASE = process.env.CJ_API_BASE ?? "https://developers.cjdropshipping.com/api2.0/v1";

interface CjTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiryDate?: string;
}

let cachedToken: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

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
  const token = await getCjAccessToken();
  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
      ...(process.env.CJ_PLATFORM_TOKEN ? { platformToken: process.env.CJ_PLATFORM_TOKEN } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as {
    code?: number;
    result?: T | boolean;
    message?: string;
    data?: T;
  };
  if (!response.ok || (json.code !== undefined && json.code !== 200 && json.code !== 0)) {
    throw new Error(json.message ?? `CJ API error (${response.status})`);
  }
  if (json.data !== undefined) return json.data as T;
  if (typeof json.result === "object" && json.result !== null) return json.result as T;
  return json as T;
}

export async function getCjAccessToken(): Promise<string> {
  if (!isEnabled()) {
    throw new Error("CJ_ENABLED is not true");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  if (process.env.CJ_REFRESH_TOKEN) {
    try {
      const refreshed = await refreshCjToken(process.env.CJ_REFRESH_TOKEN);
      return refreshed.accessToken;
    } catch {
      // Fall through to a static token or API-key auth.
    }
  }

  if (process.env.CJ_ACCESS_TOKEN) {
    cachedToken = {
      accessToken: process.env.CJ_ACCESS_TOKEN,
      refreshToken: process.env.CJ_REFRESH_TOKEN ?? "",
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    };
    return process.env.CJ_ACCESS_TOKEN;
  }

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error("CJ_API_KEY or CJ_ACCESS_TOKEN is required");
  }

  try {
    const response = await requestToken({ apiKey });
    cacheToken(response);
    return response.accessToken;
  } catch (error) {
    if (!process.env.CJ_EMAIL) throw error;
  }

  const legacyResponse = await requestToken({
    email: process.env.CJ_EMAIL,
    password: apiKey,
  });
  cacheToken(legacyResponse);
  return legacyResponse.accessToken;
}

async function requestToken(body: Record<string, string>): Promise<CjTokenResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse | boolean;
    data?: CjTokenResponse;
    message?: string;
  };
  const token = json.data ?? (typeof json.result === "object" ? json.result : undefined);

  if (!response.ok || !token?.accessToken) {
    throw new Error(json.message ?? "CJ authentication failed");
  }

  return token;
}

async function refreshCjToken(refreshToken: string): Promise<CjTokenResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse | boolean;
    data?: CjTokenResponse;
    message?: string;
  };
  const token = json.data ?? (typeof json.result === "object" ? json.result : undefined);

  if (!response.ok || !token?.accessToken) {
    throw new Error(json.message ?? "CJ token refresh failed");
  }

  cacheToken(token);
  return token;
}

function cacheToken(result: CjTokenResponse): void {
  const expiresAt = result.accessTokenExpiryDate
    ? new Date(result.accessTokenExpiryDate).getTime()
    : Date.now() + 12 * 60 * 60 * 1000;
  cachedToken = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt,
  };
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
