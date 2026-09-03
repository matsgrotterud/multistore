"use client";

import { openCookiePreferences } from "@/lib/consent";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="text-white/80 hover:text-white hover:underline"
    >
      Cookie settings
    </button>
  );
}
