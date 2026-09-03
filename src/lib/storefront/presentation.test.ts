import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStoreSettings,
  preserveVersionedStoreArtifacts,
  serializeStoreSettings,
} from "@/lib/settings/store-settings";
import { buildStoreFoundation } from "@/lib/storefront/store-foundation";
import {
  CLASSIC_STOREFRONT_PRESENTATION,
  STOREFRONT_ARCHETYPES,
  normalizeStorefrontPresentation,
  presentationForArchetype,
  recommendStorefrontPresentation,
  resolveStorefrontPresentation,
  storefrontPresentationV1Schema,
  visibleStorefrontSections,
} from "@/lib/storefront/presentation";

test("legacy settings stay on the classic compatibility presentation", () => {
  const settings = parseStoreSettings(
    JSON.stringify({ homepage: { heroVariant: "default" } })
  );

  assert.equal(settings.presentation, null);
  assert.deepEqual(
    resolveStorefrontPresentation(settings.presentation, settings.homepage),
    CLASSIC_STOREFRONT_PRESENTATION
  );
});

test("a malformed presentation falls back locally without erasing other settings", () => {
  const settings = parseStoreSettings(
    JSON.stringify({
      presentation: {
        version: "storefront-presentation.v1",
        archetype: "execute-arbitrary-css",
      },
      automation: { autoPublishMinScore: 88 },
      generation: null,
    })
  );

  assert.equal(settings.presentation, null);
  assert.equal(settings.automation.autoPublishMinScore, 88);
  assert.equal(settings.generation, null);
});

test("a malformed foundation falls back locally without erasing other settings", () => {
  const settings = parseStoreSettings(
    JSON.stringify({
      foundation: { version: "store-foundation.v1", audit: "forged" },
      automation: { autoPublishMinScore: 91 },
    })
  );

  assert.equal(settings.foundation, null);
  assert.equal(settings.automation.autoPublishMinScore, 91);
});

test("the broad store form preserves versioned foundation bytes", () => {
  const foundation = buildStoreFoundation({
    identity: {
      brandName: "Preserved Studio",
      logoText: "Preserved",
      niche: "calm workspaces",
      audience: "focused teams",
      brandVoice: "clear and calm",
      locale: "en-GB",
      country: "United Kingdom",
    },
    positioning: "An internal foundation.",
    presentation: presentationForArchetype("minimal"),
    theme: {
      primaryColor: "#111827",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    },
  });
  const foundationCreation = {
    version: "foundation-store-creation.v1" as const,
    idempotencyKey: "foundation-12345678",
    inputFingerprint: "a".repeat(64),
  };
  const current = parseStoreSettings(
    JSON.stringify({ foundation, foundationCreation })
  );
  const merchant = parseStoreSettings(
    JSON.stringify({ automation: { autoPublishMinScore: 93 } })
  );
  const merged = preserveVersionedStoreArtifacts(merchant, current);

  assert.equal(JSON.stringify(merged.foundation), JSON.stringify(foundation));
  assert.deepEqual(merged.foundationCreation, foundationCreation);
  assert.equal(merged.automation.autoPublishMinScore, 93);
});

test("every preset is valid, unique and keeps featured products visible", () => {
  const signatures = new Set<string>();
  for (const archetype of STOREFRONT_ARCHETYPES) {
    const presentation = presentationForArchetype(archetype);
    assert.equal(storefrontPresentationV1Schema.safeParse(presentation).success, true);
    assert.equal(visibleStorefrontSections(presentation).includes("featured-products"), true);
    signatures.add(serializeStoreSettings(parseStoreSettings(JSON.stringify({ presentation }))));
  }
  assert.equal(signatures.size, STOREFRONT_ARCHETYPES.length);
});

test("normalization deduplicates sections and restores mandatory sections", () => {
  const presentation = normalizeStorefrontPresentation({
    ...presentationForArchetype("technical"),
    sectionOrder: ["faq", "faq", "categories"],
    hiddenSections: ["faq", "faq"],
  });

  assert.equal(presentation.sectionOrder[0], "featured-products");
  assert.equal(presentation.sectionOrder.filter((entry) => entry === "faq").length, 1);
  assert.deepEqual(presentation.hiddenSections, ["faq"]);
  assert.equal(visibleStorefrontSections(presentation).includes("faq"), false);
});

test("legacy hero and CTA controls map into the safe presentation contract", () => {
  const presentation = resolveStorefrontPresentation(null, {
    heroVariant: "video",
    showQuizCta: false,
    showComparisonCta: false,
  });

  assert.equal(presentation.hero, "statement");
  assert.equal(presentation.hiddenSections.includes("decision-tools"), true);
});

test("generator recommendations are deterministic and niche-matched", () => {
  const cases = [
    ["camera drones", "technical"],
    ["fluffy slippers", "soft"],
    ["hiking gear", "rugged"],
    ["vegan dog toys", "playful"],
    ["bamboo toothbrushes", "minimal"],
    ["green fashion shoes", "editorial"],
  ] as const;

  for (const [niche, archetype] of cases) {
    const first = recommendStorefrontPresentation({ niche });
    const second = recommendStorefrontPresentation({ niche });
    assert.equal(first.archetype, archetype);
    assert.deepEqual(first, second);
  }
});
