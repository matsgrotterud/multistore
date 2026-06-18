/**
 * Deterministic, shopper-friendly category + import-query strategy (Generator V2).
 *
 * Replaces the old behaviour where raw supplier "keywords" were turned directly
 * into categories. Categories now come from (1) explicit categoryHints, else
 * (2) a vertical detector, else (3) neutral merchandising labels. Supplier
 * search hints only influence import QUERIES, never category names. Buyer age is
 * never used in categories or queries.
 */

export interface CategoryStrategyInput {
  niche: string;
  endUser?: string;
  categoryHints?: string[];
  supplierSearchHints?: string[];
  negativeKeywords?: string[];
  /** Already-sanitized public audience phrase (no numeric ages). */
  audience?: string;
}

export interface DerivedCategory {
  slug: string;
  name: string;
  description: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => (word.length <= 2 && word === word.toLowerCase() ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

/** Ordered vertical detector. First match wins; order matters (dog-toy before toy). */
const VERTICALS: { test: RegExp; categories: string[] }[] = [
  { test: /\bdog\b.*\btoy|toy.*\bdog\b|\bdog toys?\b/i, categories: ["Chew Toys", "Plush Toys", "Treat Puzzles", "Rope & Tug", "Outdoor Play"] },
  { test: /\bcat\b.*\btoy|toy.*\bcat\b|\bcat toys?\b/i, categories: ["Wand Toys", "Catnip Toys", "Interactive Play", "Scratchers"] },
  { test: /\b(fish|bait|tackle|lure|lures|angler|angling|fishing|carp|bass)\b/i, categories: ["Hard Lures", "Soft Baits", "Hooks & Rigs", "Lines & Leaders", "Tackle Storage"] },
  { test: /\b(shoe|shoes|sneaker|sneakers|footwear|boot|boots|trainer|trainers)\b/i, categories: ["Running Shoes", "Casual Sneakers", "Trail Shoes", "Sustainable Footwear", "Shoe Care"] },
  { test: /\b(child|children|kid|kids|toddler|baby|infant|nursery)\b.*\btoy|toy.*\b(child|children|kid|kids|toddler|baby|infant|nursery)\b/i, categories: ["Wooden Toys", "Educational Toys", "Puzzles & Games", "Pretend Play", "Outdoor Play"] },
  { test: /\b(toy|toys)\b/i, categories: ["Building Sets", "Educational Toys", "Puzzles & Games", "Outdoor Play"] },
  { test: /\b(dog|cat|pet|puppy|kitten|pets)\b/i, categories: ["Food & Treats", "Beds & Comfort", "Walking & Travel", "Grooming", "Toys & Play"] },
  { test: /\b(coffee|espresso|barista|brew)\b/i, categories: ["Espresso Gear", "Pour-Over & Filter", "Grinders", "Mugs & Accessories"] },
  { test: /\b(skincare|skin care|beauty|cosmetic|cosmetics|serum|moisturizer)\b/i, categories: ["Cleansers", "Serums & Treatments", "Moisturizers", "Tools & Accessories"] },
  { test: /\b(kitchen|cookware|utensil|chef|baking)\b/i, categories: ["Cookware", "Tools & Gadgets", "Storage", "Bakeware"] },
  { test: /\b(fitness|gym|workout|yoga|training)\b/i, categories: ["Strength Gear", "Cardio & Mobility", "Apparel", "Accessories"] },
  { test: /\b(hiking|camp|camping|outdoor|backpack|trekking)\b/i, categories: ["Backpacks", "Shelter & Sleep", "Cooking & Hydration", "Trail Accessories"] },
  { test: /\b(candle|candles|home decor|decor|homeware)\b/i, categories: ["Candles", "Home Fragrance", "Decor Accents", "Gift Sets"] },
  { test: /\b(plant|plants|garden|gardening|succulent)\b/i, categories: ["Indoor Plants", "Planters & Pots", "Plant Care", "Tools & Accessories"] },
];

const GENERIC_FALLBACK = ["Featured Picks", "Everyday Essentials", "Premium Selection", "Accessories"];

function categoryNames(input: CategoryStrategyInput): string[] {
  const hints = (input.categoryHints ?? []).map((hint) => titleCase(hint)).filter(Boolean);
  if (hints.length > 0) return dedupeCaseInsensitive(hints).slice(0, 5);

  const haystack = `${input.niche} ${input.endUser ?? ""}`;
  for (const vertical of VERTICALS) {
    if (vertical.test.test(haystack)) return vertical.categories.slice(0, 5);
  }
  return GENERIC_FALLBACK.slice();
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

export function deriveStoreCategories(input: CategoryStrategyInput): DerivedCategory[] {
  const audience = (input.audience ?? "").trim() || "everyday use";
  return categoryNames(input).map((name) => ({
    slug: slugify(name),
    name,
    description: `${name} from our ${input.niche} selection, chosen for ${audience}.`,
  }));
}

function dropNegatives(queries: string[], negativeKeywords?: string[]): string[] {
  const negatives = (negativeKeywords ?? []).map((n) => n.toLowerCase().trim()).filter(Boolean);
  if (negatives.length === 0) return queries;
  return queries.filter((query) => {
    const lower = query.toLowerCase();
    return !negatives.some((negative) => lower.includes(negative));
  });
}

function uniqueLower(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Store-wide supplier import queries derived from the niche + supplier hints.
 * No buyer age, no "best sellers" hype. Used for StoreSupplierSettings.
 */
export function buildStoreImportQueries(input: CategoryStrategyInput): string[] {
  const queries = uniqueLower([
    input.niche,
    ...(input.supplierSearchHints ?? []),
    ...categoryNames(input).map((name) => `${input.niche} ${name}`.trim()),
  ]);
  return dropNegatives(queries, input.negativeKeywords).slice(0, 8);
}

/**
 * For pet niches, turn a merchandising category name into concrete supplier
 * queries that include the animal + product intent. This avoids bare, ambiguous
 * queries like "Treat Puzzles" that match "trick or treat" Halloween décor.
 */
function refinePetCategoryQueries(animal: string, categoryName: string): string[] | null {
  const c = categoryName.toLowerCase();
  if (/treat|puzzle|feeder|enrich|iq|interactive/.test(c)) {
    return [
      `${animal} treat dispenser toy`,
      `${animal} puzzle feeder`,
      `interactive ${animal} puzzle toy`,
      `${animal} enrichment toy`,
      `slow feeder puzzle ${animal}`,
    ];
  }
  if (/chew/.test(c)) {
    return [`${animal} chew toy`, `durable ${animal} chew toy`, `${animal} teething toy`];
  }
  if (/plush|soft/.test(c)) {
    return [`${animal} plush toy`, `squeaky plush ${animal} toy`];
  }
  if (/rope|tug/.test(c)) {
    return [`${animal} rope toy`, `tug toy for ${animal}`];
  }
  if (/outdoor|fetch|ball|play/.test(c)) {
    return [`${animal} fetch toy`, `${animal} ball toy`, `outdoor ${animal} toy`];
  }
  if (/scratch/.test(c)) {
    return [`${animal} scratcher`, `${animal} scratching post`];
  }
  if (/wand|catnip|teaser/.test(c)) {
    return [`${animal} wand toy`, `${animal} catnip toy`, `interactive ${animal} teaser toy`];
  }
  return null;
}

/**
 * Multiple category-specific CJ queries: the category itself, niche-qualified
 * variants, simple product terms and supplier hints — with negative keywords
 * removed and buyer age never included. For pet verticals, ambiguous category
 * names are expanded into concrete, animal-qualified product queries.
 */
export function buildCategoryImportQueries(
  input: CategoryStrategyInput,
  categoryName: string
): string[] {
  const vertical = detectVertical(input.niche, input.endUser);
  const lowerCategory = categoryName.toLowerCase();

  let base: string[];
  if (vertical === "dog" || vertical === "cat" || vertical === "pet") {
    const animal = vertical === "cat" ? "cat" : vertical === "pet" ? "pet" : "dog";
    const refined = refinePetCategoryQueries(animal, categoryName);
    // Animal-qualified queries only — never the bare category name, which is the
    // ambiguous form CJ mismatches against (e.g. "Treat Puzzles").
    base = refined
      ? [...refined, `${input.niche} ${categoryName}`]
      : [`${animal} ${categoryName} toy`, `${input.niche} ${categoryName}`, `${animal} ${categoryName}`];
  } else {
    base = [
      categoryName,
      `${input.niche} ${categoryName}`,
      input.niche,
      ...(input.supplierSearchHints ?? []).map((hint) =>
        hint.toLowerCase().includes(lowerCategory) ? hint : `${hint} ${categoryName}`
      ),
    ];
  }

  const queries = uniqueLower([...base, ...(input.supplierSearchHints ?? [])]);
  return dropNegatives(queries, input.negativeKeywords).slice(0, 6);
}

/* --------------------------------------------------------------------------
 * Vertical-aware supplier relevance (Generator V2 hardening)
 *
 * Real supplier search (CJ) is fuzzy: a "dog treat puzzle" query happily returns
 * "trick or treat" Halloween décor. We therefore (a) generate more concrete
 * supplier queries and (b) require positive niche/end-user evidence + reject
 * obvious mismatches (other species, décor, dolls) before import — while staying
 * generic enough to leave unknown niches untouched.
 * ------------------------------------------------------------------------ */

export type Vertical = "dog" | "cat" | "pet" | "fishing" | "footwear" | "kids" | "generic";

export interface RelevanceProfile {
  vertical: Vertical;
  /** When true, a candidate must contain at least one positive token. */
  requirePositive: boolean;
  positiveTokens: string[];
  /** Hard reject if any appears in title/description. */
  negativeTokens: string[];
  /** Reject `token` unless one of `unlessAny` is also present (context rescue). */
  conditionalNegatives: { token: string; unlessAny: string[] }[];
}

const DECOR_NEGATIVES = [
  "ornament",
  "wall decoration",
  "wall decor",
  "resin decoration",
  "figurine",
  "pumpkin decor",
  "halloween decoration",
  "party decoration",
  "garland",
  "wreath",
  "sticker",
  "keychain",
  "costume",
];

export function detectVertical(niche: string, endUser?: string): Vertical {
  const h = `${niche} ${endUser ?? ""}`.toLowerCase();
  const hasDog = /\b(dog|dogs|puppy|puppies|canine|doggie)\b/.test(h);
  const hasCat = /\b(cat|cats|kitten|kittens|feline)\b/.test(h);
  if (hasDog && !hasCat) return "dog";
  if (hasCat && !hasDog) return "cat";
  if (/\b(pet|pets)\b/.test(h) || (hasDog && hasCat)) return "pet";
  if (/\b(fish|bait|tackle|lure|lures|angler|angling|fishing|carp|bass)\b/.test(h)) return "fishing";
  if (/\b(shoe|shoes|sneaker|sneakers|footwear|boot|boots|trainer|trainers)\b/.test(h)) return "footwear";
  if (/\b(child|children|kid|kids|toddler|baby|infant|nursery)\b/.test(h)) return "kids";
  return "generic";
}

export function buildRelevanceProfile(input: {
  niche: string;
  endUser?: string;
  categoryHints?: string[];
}): RelevanceProfile {
  const vertical = detectVertical(input.niche, input.endUser);
  const context = `${input.niche} ${input.endUser ?? ""} ${(input.categoryHints ?? []).join(" ")}`.toLowerCase();
  const animalConditionalDoll = {
    token: "doll",
    unlessAny: ["dog", "puppy", "cat", "kitten", "pet", "canine", "feline"],
  };

  switch (vertical) {
    case "dog": {
      // Cross-species terms are CONDITIONAL, not hard, negatives: supplier dog
      // products routinely mention "cat" in dual-species descriptions ("for dogs
      // and cats"). Reject only cat-ONLY items (cat term present with no dog
      // evidence), so legitimate dog toys are kept.
      const dogSupport = ["dog", "dogs", "puppy", "puppies", "canine", "doggie", "doggy"];
      const catCrossNegatives = /\bcat|kitten|feline\b/.test(context)
        ? []
        : ["cat", "kitten", "feline"].map((token) => ({ token, unlessAny: dogSupport }));
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "dog", "dogs", "puppy", "puppies", "canine", "doggie", "pet", "chew", "squeaky",
          "tug", "rope", "fetch", "treat dispenser", "puzzle feeder", "slow feeder",
          "dog toy", "pet toy", "teething", "snuffle", "enrichment", "kong",
        ],
        negativeTokens: uniqueLower([...DECOR_NEGATIVES, "baby", "infant"]),
        conditionalNegatives: [animalConditionalDoll, ...catCrossNegatives],
      };
    }
    case "cat": {
      const catSupport = ["cat", "cats", "kitten", "kittens", "feline"];
      const dogCrossNegatives = /\bdog|puppy|canine\b/.test(context)
        ? []
        : ["dog", "puppy", "canine"].map((token) => ({ token, unlessAny: catSupport }));
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "cat", "cats", "kitten", "kittens", "feline", "pet", "scratcher", "catnip",
          "wand toy", "cat toy", "pet toy", "teaser", "mouse toy", "enrichment",
        ],
        negativeTokens: uniqueLower([...DECOR_NEGATIVES, "baby", "infant"]),
        conditionalNegatives: [animalConditionalDoll, ...dogCrossNegatives],
      };
    }
    case "pet":
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "pet", "dog", "cat", "puppy", "kitten", "animal", "chew", "squeaky", "tug",
          "rope", "fetch", "scratcher", "catnip", "treat dispenser", "puzzle feeder",
          "pet toy", "enrichment",
        ],
        negativeTokens: uniqueLower([...DECOR_NEGATIVES, "baby", "infant"]),
        conditionalNegatives: [animalConditionalDoll],
      };
    case "fishing":
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "fish", "fishing", "bait", "lure", "lures", "tackle", "hook", "hooks", "rig",
          "rod", "reel", "angler", "angling", "carp", "bass", "trout", "pike", "line",
          "leader", "sinker", "swivel", "jig", "spinner", "float", "bobber", "spoon",
        ],
        negativeTokens: uniqueLower([
          "shoe", "sneaker", "boot", "aquarium decoration", "doll", "clothing", "dress",
          ...DECOR_NEGATIVES,
        ]),
        conditionalNegatives: [],
      };
    case "footwear":
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "shoe", "shoes", "sneaker", "sneakers", "trainer", "trainers", "footwear",
          "boot", "boots", "sandal", "sandals", "loafer", "runner", "running shoe",
          "sole", "insole", "lace", "cleat",
        ],
        negativeTokens: uniqueLower(["toy", "doll", "miniature", ...DECOR_NEGATIVES]),
        conditionalNegatives: [],
      };
    case "kids":
      return {
        vertical,
        requirePositive: true,
        positiveTokens: [
          "kid", "kids", "child", "children", "toddler", "baby", "learning", "educational",
          "wooden", "puzzle", "building", "blocks", "stem", "montessori", "play", "plush",
          "stuffed", "toy", "toys",
        ],
        negativeTokens: uniqueLower(["dog", "cat", "pet", "aquarium"]),
        conditionalNegatives: [],
      };
    default:
      // Unknown vertical: do not require positive evidence (avoid damaging other
      // niches); only explicit negative keywords apply downstream.
      return {
        vertical: "generic",
        requirePositive: false,
        positiveTokens: [],
        negativeTokens: [],
        conditionalNegatives: [],
      };
  }
}

/**
 * Decide if a supplier candidate is relevant for a niche. Returns a reason when
 * rejected (useful for debug/admin). Only enforces positive evidence for known
 * verticals; generic niches fall back to the caller's query-term matching.
 */
export function evaluateRelevance(
  profile: RelevanceProfile,
  title: string,
  description: string | null | undefined,
  extraNegatives: string[] = []
): { relevant: boolean; reason?: string } {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();

  const negatives = uniqueLower([...profile.negativeTokens, ...extraNegatives]).map((n) =>
    n.toLowerCase()
  );
  const hitNegative = negatives.find((negative) => negative && haystack.includes(negative));
  if (hitNegative) return { relevant: false, reason: `matched negative term "${hitNegative}"` };

  for (const conditional of profile.conditionalNegatives) {
    if (
      haystack.includes(conditional.token) &&
      !conditional.unlessAny.some((token) => haystack.includes(token))
    ) {
      return { relevant: false, reason: `"${conditional.token}" without supporting context` };
    }
  }

  if (profile.requirePositive) {
    const hasPositive = profile.positiveTokens.some((token) => haystack.includes(token));
    if (!hasPositive) {
      return { relevant: false, reason: `no positive ${profile.vertical} evidence` };
    }
  }

  return { relevant: true };
}

/**
 * Vertical-aware default negative keywords merged with any explicit ones, so a
 * fish-bait store does not import shoes, a dog store does not import cat/décor
 * items, etc. Conservative to avoid emptying stores.
 */
export function deriveNegativeKeywords(input: CategoryStrategyInput): string[] {
  const profile = buildRelevanceProfile(input);
  return uniqueLower([...(input.negativeKeywords ?? []), ...profile.negativeTokens]);
}
