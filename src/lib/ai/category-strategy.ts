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
 * Multiple category-specific CJ queries: the category itself, niche-qualified
 * variants, simple product terms and supplier hints — with negative keywords
 * removed and buyer age never included.
 */
export function buildCategoryImportQueries(
  input: CategoryStrategyInput,
  categoryName: string
): string[] {
  const lowerCategory = categoryName.toLowerCase();
  const queries = uniqueLower([
    categoryName,
    `${input.niche} ${categoryName}`,
    input.niche,
    ...(input.supplierSearchHints ?? []).map((hint) =>
      hint.toLowerCase().includes(lowerCategory) ? hint : `${hint} ${categoryName}`
    ),
    ...(input.supplierSearchHints ?? []),
  ]);
  return dropNegatives(queries, input.negativeKeywords).slice(0, 6);
}

/**
 * Vertical-aware default negative keywords merged with any explicit ones, so a
 * fish-bait store does not import shoes, a kids store does not import pet items,
 * etc. Conservative to avoid emptying stores.
 */
export function deriveNegativeKeywords(input: CategoryStrategyInput): string[] {
  const haystack = `${input.niche} ${input.endUser ?? ""}`.toLowerCase();
  const defaults: string[] = [];

  const isKids = /\b(child|children|kid|kids|toddler|baby|infant|nursery)\b/.test(haystack);
  const isPet = /\b(dog|cat|pet|puppy|kitten|pets)\b/.test(haystack);
  const isFishing = /\b(fish|bait|tackle|lure|angler|fishing|carp|bass)\b/.test(haystack);
  const isFootwear = /\b(shoe|shoes|sneaker|footwear|boot|trainer)\b/.test(haystack);

  if (isKids && !isPet) defaults.push("dog", "cat", "pet");
  if (isPet && !isKids) defaults.push("baby", "infant", "for kids", "children");
  if (isFishing) defaults.push("aquarium decoration", "toy fish", "fishing shoes");
  if (isFootwear) defaults.push("toy", "doll", "keychain", "miniature");

  return uniqueLower([...(input.negativeKeywords ?? []), ...defaults]);
}
