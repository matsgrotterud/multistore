"use client";

import { useEffect, useState } from "react";
import { getCookieConsent, setCookieConsent } from "@/lib/consent";

/**
 * Cookie consent banner. Necessary cookies are always on; analytics and
 * marketing are opt-in. Accept and reject get equal visual weight by design
 * (no dark patterns), and no marketing/analytics script loads before a
 * positive decision (enforced in src/lib/analytics/track.ts).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  function decide(options: { analytics: boolean; marketing: boolean }) {
    setCookieConsent(options);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:p-5"
    >
      <div className="mx-auto max-w-site">
        <h2 className="text-sm font-bold text-ink">Cookies on this site</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink/70">
          Necessary cookies keep the cart and checkout working and are always
          on. Analytics and marketing cookies are optional and only used if
          you allow them.
        </p>

        {showDetails && (
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Optional cookie categories</legend>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              Necessary (always on)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Analytics — anonymous usage statistics
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Marketing — personalized campaigns
            </label>
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Equal visual weight on accept and reject — intentionally. */}
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              decide(
                showDetails
                  ? { analytics, marketing }
                  : { analytics: true, marketing: true }
              )
            }
          >
            {showDetails ? "Save choices" : "Accept all"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => decide({ analytics: false, marketing: false })}
          >
            Reject optional
          </button>
          {!showDetails && (
            <button
              type="button"
              className="text-sm font-medium text-ink/70 underline hover:text-primary"
              onClick={() => setShowDetails(true)}
            >
              Choose per category
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
