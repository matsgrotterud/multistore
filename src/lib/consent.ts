/**
 * Cookie consent state, persisted in localStorage. Necessary cookies are
 * always allowed; analytics/marketing require an explicit opt-in. Marketing
 * scripts must check this before loading (see CookieConsent component).
 */

export interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

const CONSENT_KEY = "msdf_cookie_consent";

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(options: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentState {
  const state: CookieConsentState = {
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
