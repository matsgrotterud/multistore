import { createHash } from "node:crypto";
import {
  INTENT_VERSION,
  ONTOLOGY_VERSION,
  PRODUCT_CLASS_PROFILE_VERSION,
  type NicheIntentV1,
  type ProductClassExclusionV1,
  type ProductClassProfileV1,
  type RuntimeProductClassProposalV1,
} from "./contracts";
import {
  PRODUCT_ONTOLOGY_V1,
  type ProductOntologyEntryV1,
} from "./ontology";

const AUDIENCE_ONLY_TOKENS = new Set([
  "adult",
  "adults",
  "grownup",
  "grownups",
]);

const NOISE_TOKENS = new Set([
  "affordable",
  "best",
  "cheap",
  "cool",
  "luxury",
  "premium",
  "top",
  "trending",
]);

const GENERIC_OR_NON_PHYSICAL_HEADS = new Set([
  "accessories",
  "accessory",
  "app",
  "apps",
  "collection",
  "collections",
  "course",
  "courses",
  "deal",
  "deals",
  "download",
  "downloads",
  "dream",
  "dreams",
  "essential",
  "essentials",
  "experience",
  "experiences",
  "gift",
  "gifts",
  "idea",
  "ideas",
  "insurance",
  "item",
  "items",
  "lifestyle",
  "loan",
  "loans",
  "pick",
  "picks",
  "product",
  "products",
  "service",
  "services",
  "shop",
  "software",
  "store",
  "stuff",
  "subscription",
  "subscriptions",
]);

const BLOCKED_RUNTIME_RULES: Array<{
  flag: string;
  reason: string;
  pattern: RegExp;
}> = [
  {
    flag: "CHILD_OR_BABY_PRODUCT",
    reason: "RUNTIME_CLASS_CHILD_SAFETY_REVIEW_REQUIRED",
    pattern: /\b(?:baby|babies|child|children|infant|infants|kid|kids|toddler|toddlers)\b/i,
  },
  {
    flag: "WEAPON_OR_EXPLOSIVE",
    reason: "RUNTIME_CLASS_PROHIBITED_OR_WEAPON",
    pattern:
      /\b(?:ammo|ammunition|bomb|explosive|firearm|firearms|gun|guns|knife|knives|rifle|rifles|sword|swords|weapon|weapons)\b/i,
  },
  {
    flag: "MEDICAL_OR_HEALTH_CLAIM_PRODUCT",
    reason: "RUNTIME_CLASS_MEDICAL_REVIEW_REQUIRED",
    pattern:
      /\b(?:diagnostic|drug|drugs|healthcare|medical|medicine|medicines|surgical|therapeutic|therapy)\b/i,
  },
  {
    flag: "INGESTIBLE_OR_SUPPLEMENT",
    reason: "RUNTIME_CLASS_INGESTIBLE_REVIEW_REQUIRED",
    pattern:
      /\b(?:alcohol|beer|beverage|beverages|candy|drink|drinks|food|foods|supplement|supplements|vitamin|vitamins|wine)\b/i,
  },
  {
    flag: "TOBACCO_VAPE_OR_CANNABIS",
    reason: "RUNTIME_CLASS_REGULATED_SUBSTANCE",
    pattern:
      /\b(?:cannabis|cigar|cigars|cigarette|cigarettes|nicotine|tobacco|vape|vapes|vaping)\b/i,
  },
  {
    flag: "SEXUAL_WELLNESS_PRODUCT",
    reason: "RUNTIME_CLASS_ADULT_PRODUCT_REVIEW_REQUIRED",
    // "adult" alone is an audience descriptor and intentionally does not match.
    pattern: /\b(?:adult toys?|sex toys?|sexual wellness)\b/i,
  },
  {
    flag: "COSMETIC_OR_BODY_APPLICATION",
    reason: "RUNTIME_CLASS_COSMETIC_REVIEW_REQUIRED",
    pattern:
      /\b(?:cosmetic|cosmetics|makeup|skin care|skincare|tattoo|tattoos)\b/i,
  },
  {
    flag: "SAFETY_CRITICAL_PRODUCT",
    reason: "RUNTIME_CLASS_SAFETY_REVIEW_REQUIRED",
    pattern:
      /\b(?:car seat|fire extinguisher|helmet|helmets|life jacket|life jackets|protective equipment)\b/i,
  },
];

const RUNTIME_COMMON_EXCLUSIONS: ProductClassExclusionV1[] = [
  {
    className: "decor",
    concepts: ["wall decor", "ornament", "decoration", "poster", "figurine"],
  },
  {
    className: "keychain",
    concepts: ["keychain", "key chain", "key ring", "keyring"],
  },
  {
    className: "doll-or-miniature",
    concepts: ["doll", "dollhouse", "miniature", "mini replica"],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inputRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, "-").slice(0, 48);
}

function singularizeWord(value: string): string {
  if (value === "shoes") return "shoe";
  if (value === "hats") return "hat";
  if (/[^aeiou]ies$/.test(value)) return `${value.slice(0, -3)}y`;
  if (/(?:ches|shes|xes|zes)$/.test(value)) return value.slice(0, -2);
  if (value.endsWith("s") && !value.endsWith("ss")) return value.slice(0, -1);
  return value;
}

function pluralizeWord(value: string): string {
  if (value === "shoe") return "shoes";
  if (/[^aeiou]y$/.test(value)) return `${value.slice(0, -1)}ies`;
  if (/(?:ch|sh|x|z|s)$/.test(value)) return `${value}es`;
  return `${value}s`;
}

function phraseWithLastWord(words: string[], lastWord: string): string {
  return [...words.slice(0, -1), lastWord].join(" ");
}

function classConceptsFor(words: string[]): string[] {
  const last = words.at(-1)!;
  const singular = singularizeWord(last);
  const plural = singular === last ? pluralizeWord(last) : last;
  const concepts = [
    words.join(" "),
    phraseWithLastWord(words, singular),
    phraseWithLastWord(words, plural),
  ];
  return [...new Set(concepts)];
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function profileWithHash(
  profile: Omit<ProductClassProfileV1, "profileHash">
): ProductClassProfileV1 {
  return {
    ...profile,
    profileHash: hash(canonicalJson(profile)),
  };
}

function buildProfile(normalizedProductType: string): ProductClassProfileV1 {
  const words = normalizedProductType.split(" ");
  const classConcepts = classConceptsFor(words);
  const headNoun = singularizeWord(words.at(-1)!);
  const categoryPhrase = phraseWithLastWord(words, pluralizeWord(headNoun));
  const categorySlug = slugify(categoryPhrase);
  const identityHash = hash(
    `${PRODUCT_CLASS_PROFILE_VERSION}\n${normalizedProductType}`
  );
  const profileWithoutHash = {
    version: PRODUCT_CLASS_PROFILE_VERSION,
    source: "RUNTIME_PROVISIONAL" as const,
    serverOwned: true as const,
    requiresAdminConfirmation: true,
    productClass: `runtime.${slugify(normalizedProductType)}.${identityHash.slice(0, 12)}`,
    normalizedProductType,
    headNoun,
    classConcepts,
    qualifiers: [],
    excludedClasses: RUNTIME_COMMON_EXCLUSIONS.map((entry) => ({
      className: entry.className,
      concepts: [...entry.concepts],
    })),
    policyDecision: "MANUAL_REVIEW_REQUIRED" as const,
    riskFlags: ["RUNTIME_PRODUCT_CLASS_PREVIEW_ONLY"],
    category: {
      slug: categorySlug,
      name: titleCase(categoryPhrase),
      description: `${titleCase(categoryPhrase)} that passed supplier-evidence relevance checks. This provisional class requires merchant review.`,
    },
    liveCommerceAllowed: false,
    autonomousLaunchAllowed: false,
  };
  return profileWithHash(profileWithoutHash);
}

/** Convert one code-reviewed ontology entry into the same serializable contract. */
export function profileFromStaticOntologyV1(
  entry: ProductOntologyEntryV1
): ProductClassProfileV1 {
  return profileWithHash({
    version: PRODUCT_CLASS_PROFILE_VERSION,
    source: "STATIC_ONTOLOGY",
    serverOwned: true,
    requiresAdminConfirmation: false,
    productClass: entry.productClass,
    normalizedProductType: normalize(entry.headNoun),
    headNoun: entry.headNoun,
    classConcepts: [...entry.classConcepts],
    qualifiers: [...entry.qualifiers],
    excludedClasses: entry.excludedClasses.map((excluded) => ({
      className: excluded.className,
      concepts: [...excluded.concepts],
    })),
    policyDecision: entry.policy,
    riskFlags: [...entry.riskFlags],
    category: { ...entry.category },
    liveCommerceAllowed: entry.policy === "ALLOW",
    autonomousLaunchAllowed: entry.policy === "ALLOW",
  });
}

/** Resolve and snapshot one known code-reviewed class by its stable key. */
export function profileFromOntologyV1(
  productClass: string | null
): ProductClassProfileV1 | null {
  if (!productClass) return null;
  const entry = PRODUCT_ONTOLOGY_V1.find(
    (candidate) => candidate.productClass === productClass
  );
  return entry ? profileFromStaticOntologyV1(entry) : null;
}

/**
 * Propose a narrow physical-product profile without granting it any policy
 * authority. This function is deliberately conservative. A proposal is only a
 * server-owned candidate for explicit admin confirmation; it is never a live
 * product-class approval.
 */
export function proposeRuntimeProductClassV1(
  input: unknown
): RuntimeProductClassProposalV1 {
  const object = inputRecord(input);
  const niche = typeof object.niche === "string" ? object.niche.trim() : "";
  const endUser = typeof object.endUser === "string" ? object.endUser.trim() : "";
  const riskText = normalize(`${niche} ${endUser}`);
  const blocked = BLOCKED_RUNTIME_RULES.filter((rule) => rule.pattern.test(riskText));

  if (blocked.length > 0) {
    return {
      status: "BLOCKED",
      profile: null,
      reasonCodes: [...new Set(blocked.map((rule) => rule.reason))],
      riskFlags: [...new Set(blocked.map((rule) => rule.flag))],
    };
  }

  const productWords = normalize(niche)
    .split(" ")
    .filter(Boolean)
    .filter((word) => !AUDIENCE_ONLY_TOKENS.has(word))
    .filter((word) => !NOISE_TOKENS.has(word));
  const head = productWords.at(-1) ?? "";
  const ambiguous =
    productWords.length < 2 ||
    productWords.length > 6 ||
    !/^[a-z][a-z0-9-]{2,}$/.test(head) ||
    GENERIC_OR_NON_PHYSICAL_HEADS.has(head);

  if (ambiguous) {
    return {
      status: "AMBIGUOUS",
      profile: null,
      reasonCodes: ["RUNTIME_PRODUCT_CLASS_AMBIGUOUS"],
      riskFlags: [],
    };
  }

  const profile = buildProfile(productWords.join(" "));
  return {
    status: "PROPOSED",
    profile,
    reasonCodes: ["RUNTIME_PRODUCT_CLASS_CONFIRMATION_REQUIRED"],
    riskFlags: [...profile.riskFlags],
  };
}

/**
 * A client-submitted profile is never trusted. Rebuild the proposal from the
 * original input and accept only a byte-equivalent server-owned snapshot.
 */
export function validateRuntimeProductClassProfileV1(
  input: unknown,
  candidate: unknown
): ProductClassProfileV1 | null {
  const proposed = proposeRuntimeProductClassV1(input);
  if (proposed.status !== "PROPOSED") return null;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  return canonicalJson(candidate) === canonicalJson(proposed.profile)
    ? proposed.profile
    : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hasPhrase(text: string, phrase: string): boolean {
  const haystack = ` ${normalize(text)} `;
  const needle = ` ${normalize(phrase)} `;
  return haystack.includes(needle);
}

/**
 * Resolve an immutable intent from an already selected profile.
 *
 * This is the execution-safe counterpart to free-form classification: every
 * field used by query planning and candidate evaluation is copied from the
 * pinned profile. Runtime profiles are recomputed from the original input, so
 * a client cannot widen concepts or promote its policy while submitting it.
 */
export function resolveNicheIntentFromProfileV1(
  input: unknown,
  candidateProfile: ProductClassProfileV1
): NicheIntentV1 {
  const object = inputRecord(input);
  const niche = typeof object.niche === "string" ? object.niche.trim() : "";
  const endUser = typeof object.endUser === "string" ? object.endUser.trim() : "";
  const negativeKeywords = Array.isArray(object.negativeKeywords)
    ? object.negativeKeywords.filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  const profile = candidateProfile.source === "RUNTIME_PROVISIONAL"
    ? validateRuntimeProductClassProfileV1(input, candidateProfile)
    : (() => {
        const ontology = PRODUCT_ONTOLOGY_V1.find(
          (entry) => entry.productClass === candidateProfile.productClass
        );
        if (!ontology) return null;
        const expected = profileFromStaticOntologyV1(ontology);
        return canonicalJson(candidateProfile) === canonicalJson(expected)
          ? expected
          : null;
      })();

  if (!profile) {
    throw new Error("INVALID_PRODUCT_CLASS_PROFILE");
  }

  return {
    version: INTENT_VERSION,
    classifierVersion: ONTOLOGY_VERSION,
    normalizedNiche: normalize(`${niche} ${endUser}`),
    productClass: profile.productClass,
    headNoun: profile.headNoun,
    requiredClassConcepts: [...profile.classConcepts],
    qualifiers: profile.qualifiers.filter((qualifier) => hasPhrase(niche, qualifier)),
    allowedAdjacentClasses: [],
    excludedProductClasses: profile.excludedClasses.map((entry) => entry.className),
    excludedClassRules: profile.excludedClasses.map((entry) => ({
      className: entry.className,
      concepts: [...entry.concepts],
    })),
    excludedConcepts: unique(negativeKeywords.map(normalize)),
    targetEndUser: endUser || null,
    riskFlags: [...profile.riskFlags],
    policyDecision: profile.policyDecision,
    confidence: profile.source === "STATIC_ONTOLOGY" ? 0.96 : 1,
    evidence: unique([niche, `product-class-profile:${profile.profileHash}`]),
    reasonCodes:
      profile.policyDecision === "ALLOW"
        ? []
        : profile.policyDecision === "BLOCK"
          ? ["POLICY_PRODUCT_CLASS_BLOCKED"]
          : [
              "INTENT_POLICY_MANUAL_REVIEW",
              ...(profile.source === "RUNTIME_PROVISIONAL"
                ? ["RUNTIME_PRODUCT_CLASS_PREVIEW_ONLY"]
                : []),
            ],
    liveCommerceAllowed:
      profile.policyDecision === "ALLOW" && profile.liveCommerceAllowed,
    autonomousLaunchAllowed:
      profile.policyDecision === "ALLOW" && profile.autonomousLaunchAllowed,
  };
}
