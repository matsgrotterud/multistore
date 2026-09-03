import { z } from "zod";

/**
 * Storefront Presentation V1 is deliberately data, not executable markup.
 * A store may select a reviewed visual preset and reorder an allowlisted set
 * of sections, while the commerce, SEO and product-truth components remain
 * shared and server-owned.
 */

export const STOREFRONT_ARCHETYPES = [
  "classic",
  "editorial",
  "technical",
  "playful",
  "rugged",
  "soft",
  "minimal",
] as const;
export type StorefrontArchetype = (typeof STOREFRONT_ARCHETYPES)[number];

export const STOREFRONT_DENSITIES = ["airy", "balanced", "compact"] as const;
export type StorefrontDensity = (typeof STOREFRONT_DENSITIES)[number];

export const STOREFRONT_HERO_COMPOSITIONS = [
  "catalog-collage",
  "editorial-split",
  "statement",
] as const;
export type StorefrontHeroComposition =
  (typeof STOREFRONT_HERO_COMPOSITIONS)[number];

export const STOREFRONT_SECTION_IDS = [
  "categories",
  "featured-products",
  "guides",
  "decision-tools",
  "newsletter",
  "faq",
] as const;
export type StorefrontSectionId = (typeof STOREFRONT_SECTION_IDS)[number];

export const OPTIONAL_STOREFRONT_SECTION_IDS = [
  "categories",
  "guides",
  "decision-tools",
  "newsletter",
  "faq",
] as const;
export type OptionalStorefrontSectionId =
  (typeof OPTIONAL_STOREFRONT_SECTION_IDS)[number];

const storefrontSectionSchema = z.enum(STOREFRONT_SECTION_IDS);
const optionalStorefrontSectionSchema = z.enum(OPTIONAL_STOREFRONT_SECTION_IDS);

export const storefrontPresentationV1Schema = z.object({
  version: z.literal("storefront-presentation.v1"),
  archetype: z.enum(STOREFRONT_ARCHETYPES),
  density: z.enum(STOREFRONT_DENSITIES),
  hero: z.enum(STOREFRONT_HERO_COMPOSITIONS),
  sectionOrder: z.array(storefrontSectionSchema),
  hiddenSections: z.array(optionalStorefrontSectionSchema),
});

export type StorefrontPresentationV1 = z.infer<
  typeof storefrontPresentationV1Schema
>;

export const CLASSIC_STOREFRONT_PRESENTATION: StorefrontPresentationV1 = {
  version: "storefront-presentation.v1",
  archetype: "classic",
  density: "balanced",
  hero: "catalog-collage",
  sectionOrder: [
    "categories",
    "featured-products",
    "guides",
    "decision-tools",
    "newsletter",
    "faq",
  ],
  hiddenSections: [],
};

const ARCHETYPE_PRESETS: Record<
  Exclude<StorefrontArchetype, "classic">,
  Omit<StorefrontPresentationV1, "version" | "archetype">
> = {
  editorial: {
    density: "airy",
    hero: "statement",
    sectionOrder: [
      "featured-products",
      "categories",
      "guides",
      "decision-tools",
      "newsletter",
      "faq",
    ],
    hiddenSections: [],
  },
  technical: {
    density: "compact",
    hero: "editorial-split",
    sectionOrder: [
      "featured-products",
      "decision-tools",
      "categories",
      "guides",
      "faq",
      "newsletter",
    ],
    hiddenSections: [],
  },
  playful: {
    density: "balanced",
    hero: "catalog-collage",
    sectionOrder: [
      "categories",
      "decision-tools",
      "featured-products",
      "guides",
      "newsletter",
      "faq",
    ],
    hiddenSections: [],
  },
  rugged: {
    density: "balanced",
    hero: "statement",
    sectionOrder: [
      "categories",
      "featured-products",
      "decision-tools",
      "guides",
      "faq",
      "newsletter",
    ],
    hiddenSections: [],
  },
  soft: {
    density: "airy",
    hero: "editorial-split",
    sectionOrder: [
      "categories",
      "featured-products",
      "guides",
      "newsletter",
      "faq",
      "decision-tools",
    ],
    hiddenSections: [],
  },
  minimal: {
    density: "airy",
    hero: "editorial-split",
    sectionOrder: [
      "featured-products",
      "categories",
      "guides",
      "faq",
      "newsletter",
      "decision-tools",
    ],
    hiddenSections: [],
  },
};

export function presentationForArchetype(
  archetype: StorefrontArchetype
): StorefrontPresentationV1 {
  if (archetype === "classic") {
    return {
      ...CLASSIC_STOREFRONT_PRESENTATION,
      sectionOrder: [...CLASSIC_STOREFRONT_PRESENTATION.sectionOrder],
      hiddenSections: [],
    };
  }
  const preset = ARCHETYPE_PRESETS[archetype];
  return {
    version: "storefront-presentation.v1",
    archetype,
    density: preset.density,
    hero: preset.hero,
    sectionOrder: [...preset.sectionOrder],
    hiddenSections: [...preset.hiddenSections],
  };
}

function uniqueAllowedSections(
  sections: readonly StorefrontSectionId[]
): StorefrontSectionId[] {
  const allowed = new Set<StorefrontSectionId>(STOREFRONT_SECTION_IDS);
  const result: StorefrontSectionId[] = [];
  for (const section of sections) {
    if (allowed.has(section) && !result.includes(section)) result.push(section);
  }
  return result;
}

/**
 * Normalize a saved manifest at the rendering boundary. Featured products are
 * mandatory and every known section appears at most once. New future sections
 * are appended safely for older saved manifests.
 */
export function normalizeStorefrontPresentation(
  value: StorefrontPresentationV1 | null | undefined
): StorefrontPresentationV1 {
  if (!value) return presentationForArchetype("classic");

  const preset = presentationForArchetype(value.archetype);
  const sectionOrder = uniqueAllowedSections(value.sectionOrder);
  if (!sectionOrder.includes("featured-products")) {
    sectionOrder.unshift("featured-products");
  }
  for (const section of preset.sectionOrder) {
    if (!sectionOrder.includes(section)) sectionOrder.push(section);
  }

  return {
    ...value,
    sectionOrder,
    hiddenSections: Array.from(new Set(value.hiddenSections)).filter(
      (section): section is OptionalStorefrontSectionId =>
        OPTIONAL_STOREFRONT_SECTION_IDS.includes(section)
    ),
  };
}

export function resolveStorefrontPresentation(
  value: StorefrontPresentationV1 | null | undefined,
  legacyHomepage?: {
    heroVariant?: string;
    showQuizCta?: boolean;
    showComparisonCta?: boolean;
  }
): StorefrontPresentationV1 {
  if (value) return normalizeStorefrontPresentation(value);

  const classic = presentationForArchetype("classic");
  if (
    legacyHomepage?.heroVariant === "video" ||
    legacyHomepage?.heroVariant === "showcase"
  ) {
    classic.hero = "statement";
  } else if (
    legacyHomepage?.heroVariant === "split" ||
    legacyHomepage?.heroVariant === "editorial" ||
    legacyHomepage?.heroVariant === "minimal"
  ) {
    classic.hero = "editorial-split";
  }
  if (
    legacyHomepage?.showQuizCta === false &&
    legacyHomepage?.showComparisonCta === false
  ) {
    classic.hiddenSections = ["decision-tools"];
  }
  return classic;
}

export function visibleStorefrontSections(
  presentation: StorefrontPresentationV1
): StorefrontSectionId[] {
  const hidden = new Set(presentation.hiddenSections);
  return normalizeStorefrontPresentation(presentation).sectionOrder.filter(
    (section) => section === "featured-products" || !hidden.has(section)
  );
}

export interface PresentationRecommendationInput {
  niche: string;
  positioning?: string;
  brandVoice?: string;
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/** Deterministic, explainable preset selection for newly generated stores. */
export function recommendStorefrontPresentation(
  input: PresentationRecommendationInput
): StorefrontPresentationV1 {
  const text = `${input.niche} ${input.positioning ?? ""} ${
    input.brandVoice ?? ""
  }`.toLowerCase();

  if (
    includesAny(text, [
      "drone",
      "tech",
      "electronic",
      "gadget",
      "office",
      "ergonomic",
      "tool",
    ])
  ) {
    return presentationForArchetype("technical");
  }
  if (
    includesAny(text, [
      "hiking",
      "outdoor",
      "camping",
      "fishing",
      "bait",
      "survival",
      "rugged",
    ])
  ) {
    return presentationForArchetype("rugged");
  }
  if (
    includesAny(text, [
      "slipper",
      "comfort",
      "wellness",
      "spa",
      "sleep",
      "bath",
      "cozy",
      "soft",
    ])
  ) {
    return presentationForArchetype("soft");
  }
  if (
    includesAny(text, [
      "toy",
      "pet",
      "dog",
      "cat",
      "children",
      "kids",
      "playful",
    ])
  ) {
    return presentationForArchetype("playful");
  }
  if (
    includesAny(text, [
      "bamboo",
      "sustainable",
      "eco",
      "toothbrush",
      "zero waste",
      "clean",
      "simple",
    ])
  ) {
    return presentationForArchetype("minimal");
  }
  if (
    includesAny(text, [
      "fashion",
      "shoe",
      "jewelry",
      "atelier",
      "premium",
      "luxury",
      "design",
    ])
  ) {
    return presentationForArchetype("editorial");
  }
  return presentationForArchetype("editorial");
}
