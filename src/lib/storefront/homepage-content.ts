import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";

/**
 * Derives the premium storefront homepage copy from the store record.
 *
 * Everything here is generated from real store fields (niche, audience,
 * shipping windows, returns, support) plus honest, brand-voice framing about
 * curation and transparency. It NEVER fabricates reviews, ratings, sales
 * counts, scarcity, certifications or press. It is fully generic: any generated
 * store gets sensible, on-brand copy with graceful fallbacks.
 */

export function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** "open-ended-play" -> "Open Ended Play". */
export function humanizeUseCase(value: string): string {
  return titleCase(value.replace(/[-_]+/g, " "));
}

/** Render an audience descriptor naturally ("0-6" -> "ages 0–6"). */
export function formatAudience(audience: string): string {
  const trimmed = audience.trim();
  if (/^\d+\s*[-–—]\s*\d+$/.test(trimmed)) {
    return `ages ${trimmed.replace(/[-–—]/, "–")}`;
  }
  return trimmed;
}

function firstSentence(value: string): string {
  const match = value.split(/(?<=[.!?])\s/)[0];
  return match?.trim() || value.trim();
}

export interface ValuePillar {
  title: string;
  detail: string;
}

export interface HomepageCopy {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubhead: string;
  heroAssurance: string;
  badgeLabel: string;
  categoriesTitle: string;
  categoriesSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  whyTitle: string;
  whyBody: string;
  whyPillars: ValuePillar[];
  themesTitle: string;
  themesSubtitle: string;
  closingTitle: string;
  closingBody: string;
}

export function buildHomepageCopy(store: StoreWithTheme): HomepageCopy {
  const niche = store.niche.trim();
  const nicheTitle = titleCase(niche);
  const nicheLower = niche.toLowerCase();
  const audience = store.audience?.trim();
  const audiencePhrase = audience ? formatAudience(audience) : "";
  const shipping = `${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax}`;

  const heroHeadline =
    store.valueProposition?.trim() || `${nicheTitle}, chosen with care.`;

  const heroSubhead = audiencePhrase
    ? `A focused ${nicheLower} collection for ${audiencePhrase} — every product is hand-picked and compared on real specs, delivery time and value. No bulk listings, no hype.`
    : `A focused ${nicheLower} collection — every product is hand-picked and compared on real specs, delivery time and value. No bulk listings, no hype.`;

  const heroAssurance = `${shipping}-day tracked delivery · transparent supplier fulfillment · human support at ${store.supportEmail}`;

  return {
    heroEyebrow: nicheTitle,
    heroHeadline,
    heroSubhead,
    heroAssurance,
    badgeLabel: "Hand-picked",

    categoriesTitle: "Explore the collection",
    categoriesSubtitle: `A considered ${nicheLower} edit, organised by category.`,

    featuredTitle: "The current edit",
    featuredSubtitle:
      "Ranked by our own product score — value, delivery speed and information quality. Never paid placement.",

    whyTitle: `Why ${store.name}`,
    whyBody:
      store.positioning?.trim() ||
      `We built ${store.name} to make ${nicheLower} feel considered again — a small, honest selection instead of an endless catalog.`,
    whyPillars: [
      {
        title: "Curated, not cluttered",
        detail:
          "Every item is selected by hand and ranked on value, delivery speed and information quality — never on who pays most.",
      },
      {
        title: "Transparent by default",
        detail: `Real ${shipping}-day delivery windows and clear sourcing on every product. ${firstSentence(
          store.shippingOriginDisclosure
        )}`,
      },
      {
        title: audiencePhrase ? `Chosen with ${audiencePhrase} in mind` : "Chosen with intent",
        detail: `A ${nicheLower} edit that stays small on purpose, so each pick earns its place.`,
      },
    ],

    themesTitle: "Find your fit",
    themesSubtitle: "Shop by how you'll actually use it.",

    closingTitle: "Take a closer look",
    closingBody: `Explore the full ${nicheLower} collection — honest details, real delivery windows and easy, tracked checkout.`,
  };
}

export interface ValueStripItem {
  title: string;
  detail: string;
}

/** Honest logistics/trust strip derived straight from the store record. */
export function buildValueStrip(store: StoreWithTheme): ValueStripItem[] {
  return [
    {
      title: "Hand-picked selection",
      detail: store.audience
        ? `Curated for ${formatAudience(store.audience)}`
        : "Chosen, not bulk-listed",
    },
    {
      title: `${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax}-day delivery`,
      detail: "Realistic windows, tracked shipping",
    },
    {
      title: "Clear returns",
      detail: firstSentence(store.returnPolicySummary),
    },
    {
      title: "Human support",
      detail: store.supportEmail,
    },
  ];
}
