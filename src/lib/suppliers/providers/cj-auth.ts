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
  if (!process.env.CJ_EMAIL) missing.push("CJ_EMAIL");
  if (!process.env.CJ_API_KEY) missing.push("CJ_API_KEY");
  return missing;
}

async function cjFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCjAccessToken();
  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as { code?: number; result?: T; message?: string; data?: T };
  if (!response.ok || (json.code !== undefined && json.code !== 200 && json.code !== 0)) {
    throw new Error(json.message ?? `CJ API error (${response.status})`);
  }
  return (json.result ?? json.data ?? json) as T;
}

export async function getCjAccessToken(): Promise<string> {
  if (!isEnabled()) {
    throw new Error("CJ_ENABLED is not true");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  if (process.env.CJ_ACCESS_TOKEN && process.env.CJ_REFRESH_TOKEN) {
    try {
      const refreshed = await refreshCjToken(process.env.CJ_REFRESH_TOKEN);
      return refreshed.accessToken;
    } catch {
      // fall through to full auth
    }
  }

  const email = process.env.CJ_EMAIL;
  const apiKey = process.env.CJ_API_KEY;
  if (!email || !apiKey) {
    throw new Error("CJ_EMAIL and CJ_API_KEY are required");
  }

  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: apiKey }),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse;
    message?: string;
  };

  if (!response.ok || !json.result?.accessToken) {
    throw new Error(json.message ?? "CJ authentication failed");
  }

  cacheToken(json.result);
  return json.result.accessToken;
}

async function refreshCjToken(refreshToken: string): Promise<CjTokenResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse;
    message?: string;
  };

  if (!response.ok || !json.result?.accessToken) {
    throw new Error(json.message ?? "CJ token refresh failed");
  }

  cacheToken(json.result);
  return json.result;
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

export { cjFetch, isEnabled as isCjEnabled };
