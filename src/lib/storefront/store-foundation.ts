import { createHash } from "node:crypto";
import { stableJson } from "@/lib/portfolio-audit/stable-json";
import type { StorefrontPresentationV1 } from "./presentation";
import { auditStoreFoundation } from "./store-foundation-audit";
import {
  STORE_FOUNDATION_VERSION,
  storeFoundationV1Schema,
  type StoreFoundationOverrides,
  type StoreFoundationV1,
} from "./store-foundation-contract";

export interface BuildStoreFoundationInput {
  identity: StoreFoundationV1["identity"];
  positioning: string;
  presentation: StorefrontPresentationV1;
  theme: StoreFoundationV1["themeSnapshot"];
  overrides?: StoreFoundationOverrides;
}

export function buildStoreFoundation(
  input: BuildStoreFoundationInput
): StoreFoundationV1 {
  const identity = normalizeIdentity(input.identity);
  const inputDigest = digest({
    identity,
    positioning: normalizeText(input.positioning),
    presentation: input.presentation,
    theme: normalizeTheme(input.theme),
  });
  const niche = identity.niche;
  const brand = identity.brandName;
  const audience = identity.audience;

  const draft = {
    version: STORE_FOUNDATION_VERSION,
    inputDigest,
    identity,
    presentation: input.presentation,
    themeSnapshot: normalizeTheme(input.theme),
    homepage: {
      hero: {
        id: "foundation-hero",
        kind: "HERO" as const,
        title: cleanOverride(
          input.overrides?.heroTitle,
          `${brand}, shaped around ${niche}`,
          90
        ),
        body: cleanOverride(
          input.overrides?.heroBody,
          `An internal brand foundation for ${audience}. The identity, voice and storefront structure can be refined while the catalog remains unapproved.`,
          420
        ),
        evidenceKind: "MERCHANT_BRIEF" as const,
        evidenceRefs: ["merchant-brief:identity", "store-state:catalog-unapproved"],
        state: "READY_FOR_ADMIN_PREVIEW" as const,
      },
      principles: [
        {
          id: "clarity-before-promotion",
          kind: "PRINCIPLE" as const,
          title: "Clarity before promotion",
          body: truncate(
            `Give ${audience} a clear point of view on ${niche} before asking for attention or conversion.`,
            420
          ),
          evidenceKind: "MERCHANT_BRIEF" as const,
          evidenceRefs: ["merchant-brief:audience", "merchant-brief:positioning"],
          state: "READY_FOR_ADMIN_PREVIEW" as const,
        },
        {
          id: "evidence-before-claims",
          kind: "PRINCIPLE" as const,
          title: "Evidence before claims",
          body:
            "Product-specific statements stay unpublished until the platform has current, reviewable catalog evidence.",
          evidenceKind: "PLATFORM_POLICY" as const,
          evidenceRefs: ["platform-policy:catalog-truth"],
          state: "READY_FOR_ADMIN_PREVIEW" as const,
        },
        {
          id: "useful-by-design",
          kind: "PRINCIPLE" as const,
          title: "Useful by design",
          body: truncate(
            `The visual system and content structure should help ${audience} understand the store without invented urgency or unsupported proof.`,
            420
          ),
          evidenceKind: "PLATFORM_POLICY" as const,
          evidenceRefs: ["merchant-brief:brand-voice", "platform-policy:honest-content"],
          state: "READY_FOR_ADMIN_PREVIEW" as const,
        },
      ],
      catalogStatus: {
        id: "catalog-status",
        kind: "CATALOG_STATUS" as const,
        title: "Catalog awaiting evidence",
        body:
          "This foundation contains no approved product offer. Product-led sections, conversion flows and indexable search content remain locked.",
        evidenceKind: "STORE_STATE" as const,
        evidenceRefs: ["store-state:catalog-unapproved", "platform-policy:noindex-before-launch"],
        state: "WAITING_FOR_CATALOG" as const,
      },
    },
    seoDraft: {
      status: "DRAFT_NOINDEX" as const,
      title: cleanOverride(
        input.overrides?.seoTitle,
        truncate(`${brand} | A clearer approach to ${niche}`, 70),
        70
      ),
      description: cleanOverride(
        input.overrides?.seoDescription,
        truncate(
          `Explore the brand foundation for ${brand}, created around ${niche} for ${audience}. Product-led search pages remain locked pending evidence.`,
          170
        ),
        170
      ),
      topicBriefs: [
        {
          id: "brand-approach",
          title: truncate(`The ${brand} approach to ${niche}`, 100),
          angle: truncate(
            `Explain the merchant brief, intended audience and editorial principles behind ${brand} without making product claims.`,
            360
          ),
          searchIntent: "BRAND" as const,
          evidenceRefs: ["merchant-brief:identity", "merchant-brief:positioning"],
          state: "READY_FOR_ADMIN_PREVIEW" as const,
        },
        {
          id: "niche-glossary",
          title: truncate(`A practical ${niche} glossary`, 100),
          angle:
            "Define durable category language and user questions. Keep supplier facts, product comparisons and commercial recommendations out of the draft.",
          searchIntent: "INFORMATIONAL" as const,
          evidenceRefs: ["merchant-brief:niche", "platform-policy:honest-content"],
          state: "READY_FOR_ADMIN_PREVIEW" as const,
        },
        {
          id: "comparison-framework",
          title: truncate(`How to compare ${niche} options`, 100),
          angle:
            "Prepare the structure for a future comparison, but leave every product-specific criterion and recommendation locked until evidence is available.",
          searchIntent: "COMMERCIAL_RESEARCH" as const,
          evidenceRefs: ["store-state:catalog-unapproved", "platform-policy:catalog-truth"],
          state: "WAITING_FOR_CATALOG" as const,
        },
        {
          id: "selection-questions",
          title: truncate(`${niche} questions to answer before choosing`, 100),
          angle:
            "Outline the shopper questions the future catalog must answer. Do not fill in product facts or recommendations before verification.",
          searchIntent: "COMMERCIAL_RESEARCH" as const,
          evidenceRefs: ["merchant-brief:audience", "store-state:catalog-unapproved"],
          state: "WAITING_FOR_CATALOG" as const,
        },
      ],
    },
  };
  const audit = auditStoreFoundation(draft);
  const foundationDigest = digest({ ...draft, audit });
  return storeFoundationV1Schema.parse({ ...draft, audit, foundationDigest });
}

function normalizeIdentity(
  identity: StoreFoundationV1["identity"]
): StoreFoundationV1["identity"] {
  return {
    brandName: normalizeText(identity.brandName),
    logoText: normalizeText(identity.logoText),
    niche: normalizeText(identity.niche),
    audience: normalizeText(identity.audience),
    brandVoice: normalizeText(identity.brandVoice),
    locale: normalizeText(identity.locale),
    country: normalizeText(identity.country),
  };
}

function normalizeTheme(
  theme: StoreFoundationV1["themeSnapshot"]
): StoreFoundationV1["themeSnapshot"] {
  return {
    primaryColor: theme.primaryColor.toLowerCase(),
    backgroundColor: theme.backgroundColor.toLowerCase(),
    textColor: theme.textColor.toLowerCase(),
  };
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function cleanOverride(
  override: string | undefined,
  fallback: string,
  maxLength: number
): string {
  const normalized = normalizeText(override ?? "");
  return truncate(normalized || fallback, maxLength);
}

function truncate(value: string, maxLength: number): string {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}
