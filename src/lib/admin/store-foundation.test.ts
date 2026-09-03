import assert from "node:assert/strict";
import test from "node:test";
import { proposeStoreFoundation, type StoreFoundationSource } from "./store-foundation";
import { serializeStoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/settings/store-settings";
import { presentationForArchetype } from "@/lib/storefront/presentation";

function source(overrides: Partial<StoreFoundationSource> = {}): StoreFoundationSource {
  return {
    name: "Foundation Test",
    logoText: "Foundation",
    niche: "quiet interiors",
    audience: "people planning calm rooms",
    brandVoice: "warm and direct",
    positioning: "A clear foundation for a future store.",
    locale: "nb-NO",
    theme: {
      primaryColor: "#1d4ed8",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    },
    settings: null,
    ...overrides,
  };
}

test("existing explicit presentation is reused by the foundation proposal", () => {
  const presentation = presentationForArchetype("technical");
  const settings = {
    ...DEFAULT_STORE_SETTINGS,
    presentation,
  };
  const proposed = proposeStoreFoundation(
    source({ settings: { settings: serializeStoreSettings(settings) } })
  );
  assert.deepEqual(proposed.presentation, presentation);
});

test("proposal generation performs no catalog inference and remains deterministic", () => {
  const first = proposeStoreFoundation(source());
  const second = proposeStoreFoundation(source());
  assert.deepEqual(first, second);
  assert.equal(first.homepage.catalogStatus.state, "WAITING_FOR_CATALOG");
  assert.equal(first.seoDraft.status, "DRAFT_NOINDEX");
});
