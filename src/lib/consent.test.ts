import assert from "node:assert/strict";
import test from "node:test";
import {
  COOKIE_CONSENT_POLICY_VERSION,
  COOKIE_CONSENT_VERSION,
  isCurrentCookieConsentContract,
  parseCookieConsent,
} from "./consent";

test("only the current complete consent contract is accepted", () => {
  const current = {
    version: COOKIE_CONSENT_VERSION,
    policyVersion: COOKIE_CONSENT_POLICY_VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    decidedAt: "2026-09-01T12:00:00.000Z",
  };
  assert.deepEqual(parseCookieConsent(JSON.stringify(current)), current);
  assert.equal(parseCookieConsent(null), null);
  assert.equal(parseCookieConsent("not-json"), null);
});

test("legacy or version-mismatched consent requires a new decision", () => {
  assert.equal(
    parseCookieConsent(
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        decidedAt: "2026-09-01T12:00:00.000Z",
      })
    ),
    null
  );
  assert.equal(
    parseCookieConsent(
      JSON.stringify({
        version: "cookie-consent.v0",
        policyVersion: COOKIE_CONSENT_POLICY_VERSION,
        necessary: true,
        analytics: true,
        marketing: false,
        decidedAt: "2026-09-01T12:00:00.000Z",
      })
    ),
    null
  );
});

test("tracking consent is bound to both schema and privacy-policy versions", () => {
  assert.equal(
    isCurrentCookieConsentContract({
      version: COOKIE_CONSENT_VERSION,
      policyVersion: COOKIE_CONSENT_POLICY_VERSION,
    }),
    true
  );
  assert.equal(
    isCurrentCookieConsentContract({
      version: COOKIE_CONSENT_VERSION,
      policyVersion: "privacy-policy.legacy",
    }),
    false
  );
  assert.equal(
    isCurrentCookieConsentContract({
      version: "cookie-consent.legacy",
      policyVersion: COOKIE_CONSENT_POLICY_VERSION,
    }),
    false
  );
});
