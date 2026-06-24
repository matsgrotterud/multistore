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

/* ----- token utilities: word-boundary, plural-tolerant matching ----- */

/** Light singularization so "hooks" and "hook" match without substring bugs. */
function singular(token: string): string {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

/** Split text into singularized word tokens (no substring false positives). */
function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singular);
}

function phraseTokens(phrase: string): string[] {
  return tokenize(phrase);
}

/** True if `phrase` (token sequence) appears contiguously in `textTokens`. */
function containsPhrase(textTokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0) return false;
  for (let i = 0; i + phrase.length <= textTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < phrase.length; j++) {
      if (textTokens[i + j] !== phrase[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/** Words ignored entirely when reading plan/candidate text. */
const STOPWORDS = new Set([
  "for", "and", "the", "with", "of", "a", "an", "to", "in", "on", "by", "or", "your", "our",
  "pcs", "pc", "piece", "set", "pack", "kit", "new", "hot", "sale", "best", "quality",
]);

/**
 * Generic / ambiguous tokens that must NEVER count as relevance evidence on
 * their own. Niche-agnostic by design: includes the user-flagged weak nouns
 * (hook, line, fish, ball, toy, shoe, filter, rack, ...) plus common ecommerce
 * filler and colours/adjectives. A weak token only "helps" implicitly by
 * appearing next to a real specific niche token (which is what actually passes).
 */
const GENERIC_TOKENS = new Set([
  "hook", "line", "fish", "ball", "toy", "shoe", "filter", "rack", "spoon", "float", "plush", "collar",
  "item", "product", "gift", "accessory", "bottle", "case", "bag", "box", "holder", "cover", "pad",
  "mat", "clip", "strap", "stand", "frame", "sheet", "part", "gadget", "device", "tool",
  "mini", "miniature", "size", "color", "colour", "pattern", "shape", "style", "model", "type", "kind",
  "soft", "hard", "small", "large", "big", "portable", "multifunctional", "adjustable",
  "durable", "universal", "mixed", "cute", "lovely", "fashion", "fashionable", "creative",
  "green", "blue", "red", "black", "white", "pink", "yellow", "grey", "gray", "colorful", "colourful",
]);

/** Specific (non-generic, non-stopword) evidence tokens within a piece of text. */
function specificTokensOf(text: string): string[] {
  return tokenize(text).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t) && !GENERIC_TOKENS.has(t)
  );
}

/**
 * Generic, niche-agnostic product-class mismatch layer. Each class is rejected
 * for a store UNLESS the store's plan (niche/category/hints) explicitly allows
 * it (allow tokens present, or the niche itself reads like that class). This is
 * what stops "drywall hooks" in a fish store and "toy shoes" in a footwear
 * store without per-niche blacklists.
 */
interface ProductClass {
  name: string;
  /** Phrases (word-boundary) that identify a candidate as belonging to the class. */
  indicators: string[];
  /** Tokens/phrases in the plan that mean the merchant actually wants this class. */
  allow: string[];
}

const PRODUCT_CLASSES: ProductClass[] = [
  {
    name: "hardware",
    indicators: [
      "drywall", "plywood", "wall hook", "s hook", "towel rack", "towel bar", "curtain hook",
      "adhesive hook", "self adhesive hook", "coat hook", "robe hook", "bath hook", "utility hook",
    ],
    allow: ["hardware", "tool", "diy", "drywall", "screw", "fastener", "garage", "workshop", "bracket", "mount"],
  },
  {
    name: "aquarium",
    indicators: ["aquarium", "fish tank", "tank filter", "filter media", "fish bowl", "aquatic plant", "reef tank"],
    allow: ["aquarium", "fish tank", "aquatic", "reef", "tank", "pond"],
  },
  {
    name: "decor",
    indicators: [
      "ornament", "wall decoration", "wall hanging", "wall decal", "wall sticker", "figurine",
      "pumpkin decor", "garland", "wreath", "tabletop decor", "trick or treat", "christmas decoration",
      "halloween decoration", "statue",
    ],
    allow: ["decor", "decoration", "ornament", "figurine", "festive", "christmas", "halloween", "party", "interior"],
  },
  {
    name: "apparel-accessory",
    indicators: [
      "keychain", "key chain", "key ring", "sticker", "costume", "t shirt", "tshirt", "hoodie",
      "lanyard", "phone case", "brooch", "enamel pin", "fridge magnet",
    ],
    allow: [
      "apparel", "clothing", "fashion", "accessory", "wear", "keychain", "sticker", "costume",
      "jewelry", "jewellery", "pin", "magnet",
    ],
  },
  {
    name: "baby-kids",
    indicators: ["baby", "infant", "toddler", "newborn", "nursery", "diaper"],
    allow: ["baby", "infant", "toddler", "kid", "child", "nursery", "newborn"],
  },
];

/**
 * Evidence-based relevance profile derived entirely from the store plan
 * (niche / end user / categories / supplier hints / import queries / negative
 * keywords). Replaces the old "one weak token passes" vertical token lists.
 */
export interface RelevanceProfile {
  niche: string;
  vertical: Vertical;
  /** When false (rare), accept anything not explicitly negative. */
  requireEvidence: boolean;
  /** Multi-word plan phrases — one match is strong evidence. */
  strongPhrases: string[][];
  /** Specific (non-generic) plan tokens — one match is sufficient evidence. */
  specificTokens: Set<string>;
  /** Niche/end-user identity tokens that rescue conditional negatives. */
  nicheCoreTokens: Set<string>;
  /** Explicit user/caller negatives — hard reject (word-boundary phrase). */
  hardNegativePhrases: string[][];
  /** Reject phrase unless a rescue token is also present (e.g. cross-species). */
  conditionalNegatives: { phrase: string[]; rescue: string[] }[];
  /** Generic product classes NOT allowed by this niche. */
  activeClasses: { name: string; indicators: string[][] }[];
}

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

export interface RelevanceProfileInput {
  niche: string;
  endUser?: string;
  targetCustomer?: string;
  categoryHints?: string[];
  supplierSearchHints?: string[];
  negativeKeywords?: string[];
  /** Actual supplier import queries used for this store/category. */
  importQueries?: string[];
}

/**
 * Build a data-driven, evidence-based relevance profile from the store plan.
 * Nothing here is niche-specific: strong phrases + specific tokens come straight
 * from niche / categories / hints / queries, while product-class mismatch and
 * cross-species rules are generic and only fire when the plan does not allow them.
 */
export function buildRelevanceProfile(input: RelevanceProfileInput): RelevanceProfile {
  const niche = input.niche ?? "";
  const vertical = detectVertical(niche, input.endUser);

  // Categories: explicit hints if given, otherwise the same derived categories
  // the store would use — so the profile has real vocabulary even with no hints.
  const derivedCategories = categoryNames({
    niche,
    endUser: input.endUser,
    categoryHints: input.categoryHints,
    supplierSearchHints: input.supplierSearchHints,
    negativeKeywords: input.negativeKeywords,
  });

  const planPhrases = uniqueLower([
    niche,
    ...(input.categoryHints ?? []),
    ...derivedCategories,
    ...(input.supplierSearchHints ?? []),
    ...(input.importQueries ?? []),
  ]);
  const planText = [niche, input.endUser ?? "", ...planPhrases].join(" ");
  const planTokens = tokenize(planText);
  const planTokenSet = new Set(planTokens);

  // Strong = multi-token plan phrases (e.g. "soft fishing bait", "running shoes").
  const strongPhrases: string[][] = [];
  for (const phrase of planPhrases) {
    const toks = phraseTokens(phrase).filter((t) => !STOPWORDS.has(t));
    if (toks.length >= 2) strongPhrases.push(toks);
  }

  const specificTokens = new Set(specificTokensOf(planText));
  const nicheCoreTokens = new Set(specificTokensOf(`${niche} ${input.endUser ?? ""}`));

  // Cross-species conditional negatives (generalised dog/cat lesson).
  const h = `${niche} ${input.endUser ?? ""}`.toLowerCase();
  const hasDog = /\b(dog|dogs|puppy|puppies|canine|doggie|doggy|pup)\b/.test(h);
  const hasCat = /\b(cat|cats|kitten|kittens|feline|kitty)\b/.test(h);
  const dogTokens = ["dog", "puppy", "canine", "doggie", "pup"];
  const catTokens = ["cat", "kitten", "feline", "kitty"];
  const conditionalNegatives: { phrase: string[]; rescue: string[] }[] = [];
  if (hasDog && !hasCat) {
    for (const t of catTokens) conditionalNegatives.push({ phrase: phraseTokens(t), rescue: dogTokens });
    dogTokens.forEach((t) => nicheCoreTokens.add(singular(t)));
  } else if (hasCat && !hasDog) {
    for (const t of dogTokens) conditionalNegatives.push({ phrase: phraseTokens(t), rescue: catTokens });
    catTokens.forEach((t) => nicheCoreTokens.add(singular(t)));
  }

  // "doll" is universally suspicious unless the product clearly matches the
  // niche identity (or the merchant explicitly listed it as a hard negative).
  const userNegSingles = new Set((input.negativeKeywords ?? []).map((n) => singular(n.toLowerCase().trim())));
  if (!userNegSingles.has("doll")) {
    conditionalNegatives.push({ phrase: phraseTokens("doll"), rescue: [...nicheCoreTokens] });
  }

  const hardNegativePhrases = uniqueLower(input.negativeKeywords ?? [])
    .map((n) => phraseTokens(n))
    .filter((p) => p.length > 0);

  // A product class is enforced unless the plan allows it (allow token present)
  // or the niche itself reads like that class (so an aquarium store keeps tanks).
  const activeClasses = PRODUCT_CLASSES.filter((cls) => {
    const allowedByToken = cls.allow.some((a) => {
      const at = phraseTokens(a);
      return at.length <= 1 ? planTokenSet.has(at[0]) : containsPhrase(planTokens, at);
    });
    const nicheIsClass = cls.indicators.some((ind) => containsPhrase(planTokens, phraseTokens(ind)));
    return !(allowedByToken || nicheIsClass);
  }).map((cls) => ({ name: cls.name, indicators: cls.indicators.map(phraseTokens) }));

  return {
    niche,
    vertical,
    requireEvidence: true,
    strongPhrases,
    specificTokens,
    nicheCoreTokens,
    hardNegativePhrases,
    conditionalNegatives,
    activeClasses,
  };
}

/**
 * Evidence-based relevance gate. A candidate passes only when it shows real
 * niche evidence (a strong plan phrase or a specific plan token) AND trips no
 * hard negative, no disallowed product class, and no unresolved conditional
 * negative. A single generic token (hook/fish/shoe/...) never passes alone.
 * Returns a machine-readable reason for rejected candidates.
 */
export function evaluateRelevance(
  profile: RelevanceProfile,
  title: string,
  description: string | null | undefined,
  extraNegatives: string[] = []
): { relevant: boolean; reason?: string } {
  const textTokens = tokenize(`${title} ${description ?? ""}`);

  // 1. Hard negatives (explicit user + caller-provided), word-boundary.
  const hardNegs = [
    ...profile.hardNegativePhrases,
    ...uniqueLower(extraNegatives)
      .map((n) => phraseTokens(n))
      .filter((p) => p.length > 0),
  ];
  for (const neg of hardNegs) {
    if (containsPhrase(textTokens, neg)) {
      return { relevant: false, reason: `hard-negative:${neg.join(" ")}` };
    }
  }

  // 2. Generic product-class mismatch (only classes not allowed by this niche).
  for (const cls of profile.activeClasses) {
    if (cls.indicators.some((ind) => containsPhrase(textTokens, ind))) {
      return { relevant: false, reason: `product-class-mismatch:${cls.name}` };
    }
  }

  // 3. Conditional negatives without rescue evidence (cross-species / doll).
  for (const cond of profile.conditionalNegatives) {
    if (containsPhrase(textTokens, cond.phrase)) {
      const rescued = cond.rescue.some((r) => textTokens.includes(singular(r)));
      if (!rescued) {
        return {
          relevant: false,
          reason: `conditional-negative-without-positive-evidence:${cond.phrase.join(" ")}`,
        };
      }
    }
  }

  // 4. Evidence threshold: strong plan phrase OR a specific plan token.
  if (!profile.requireEvidence) return { relevant: true };
  if (profile.strongPhrases.some((p) => containsPhrase(textTokens, p))) return { relevant: true };
  if (textTokens.some((t) => profile.specificTokens.has(t))) return { relevant: true };

  return { relevant: false, reason: "weak-positive-only" };
}

/**
 * Explicit, user-provided negative keywords (normalised + de-duplicated). The
 * generic product-class layer now handles décor/hardware/aquarium/species drift,
 * so this no longer injects vertical token lists (which previously caused bare
 * "cat" to reject legitimate dog products).
 */
export function deriveNegativeKeywords(input: CategoryStrategyInput): string[] {
  return uniqueLower(input.negativeKeywords ?? []);
}
