/**
 * Cookie consent state, persisted in localStorage. Necessary cookies are
 * always allowed; analytics/marketing require an explicit opt-in. Marketing
 * scripts must check this before loading (see CookieConsent component).
 */

export interface CookieConsentState {
  version: typeof COOKIE_CONSENT_VERSION;
  policyVersion: typeof COOKIE_CONSENT_POLICY_VERSION;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

const CONSENT_KEY = "msdf_cookie_consent";
export const COOKIE_CONSENT_VERSION = "cookie-consent.v1" as const;
export const COOKIE_CONSENT_POLICY_VERSION = "privacy-policy.v1" as const;
export const OPEN_COOKIE_PREFERENCES_EVENT = "msdf-open-cookie-preferences";

export function isCurrentCookieConsentContract(input: {
  version?: unknown;
  policyVersion?: unknown;
}): boolean {
  return (
    input.version === COOKIE_CONSENT_VERSION &&
    input.policyVersion === COOKIE_CONSENT_POLICY_VERSION
  );
}

export function parseCookieConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (
      !isCurrentCookieConsentContract(parsed) ||
      parsed.necessary !== true ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.decidedAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.decidedAt))
    ) {
      return null;
    }
    return parsed as CookieConsentState;
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    return parseCookieConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function setCookieConsent(options: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentState {
  const state: CookieConsentState = {
    version: COOKIE_CONSENT_VERSION,
    policyVersion: COOKIE_CONSENT_POLICY_VERSION,
    necessary: true,
    analytics: options.analytics,
    marketing: options.marketing,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("msdf-consent-changed"));
  }
  return state;
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}
