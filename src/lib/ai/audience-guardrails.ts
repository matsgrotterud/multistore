/**
 * Audience / age public-copy guardrails (Generator V2).
 *
 * The core failure these prevent: a buyer persona / demographic typed into the
 * generator (e.g. "casual anglers 40-60") leaking verbatim into public product,
 * category and SEO copy ("fish bait for 40-60"). Buyer age is almost never
 * product-relevant; it must be stripped from public copy. Age is only kept when
 * it describes the END USER of an age-relevant niche (e.g. kids' toys "ages 3-6").
 */

export interface AudienceContext {
  niche: string;
  targetCustomer?: string;
  endUser?: string;
  ageRange?: string;
}

const KID_END_USER = /\b(kid|kids|child|children|toddler|toddlers|baby|babies|infant|infants|newborn|nursery|preschool|preschooler|schoolkid)\b/i;

/**
 * True only when an age range genuinely describes the product's end user, i.e.
 * kids/baby goods. Pet life-stage and adult buyer demographics do NOT qualify.
 */
export function isAgeRelevantNiche(ctx: AudienceContext): boolean {
  const text = `${ctx.niche} ${ctx.endUser ?? ""}`.toLowerCase();
  return KID_END_USER.test(text);
}

/** True when the supplied age range is a buyer demographic (must stay private). */
export function isBuyerAgeOnly(ctx: AudienceContext): boolean {
  if (!ctx.ageRange?.trim()) return false;
  return !isAgeRelevantNiche(ctx);
}

/**
 * Remove age-demographic phrases from public copy. Only strips number ranges
 * that carry an explicit age cue ("for 40-60", "ages 35-55", "30-45 year-olds")
 * so legitimate numbers (e.g. "5-12 business days", prices) are left intact.
 */
export function stripBuyerAgeFromPublicCopy(text: string): string {
  if (!text) return text;
  let out = text;
  // "for ages 40-60" / "aged 35 to 55" / "ages 3-6"
  out = out.replace(/\b(?:for\s+)?(?:ages?|aged)\s+\d{1,2}\s*(?:[-–—]|to)\s*\d{1,2}\+?\b/gi, " ");
  // "for 40-60" (age cue is the leading "for" + bare range)
  out = out.replace(/\bfor\s+\d{1,2}\s*(?:[-–—]|to)\s*\d{1,2}\+?\b/gi, " ");
  // "30-45 year-olds" / "30 to 45 years"
  out = out.replace(/\b\d{1,2}\s*(?:[-–—]|to)\s*\d{1,2}\s*(?:year[- ]?olds?|years?|yrs?|yo)\b/gi, " ");
  // tidy leftovers: dangling "for", doubled spaces, stray punctuation/dashes
  out = out.replace(/\bfor\s+(?=[.,;:)]|$)/gi, " ");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  out = out.replace(/[\s,\-–—]+$/g, "").trim();
  return out;
}

/**
 * Context-aware cleaner for any public string. Keeps end-user age for
 * age-relevant niches; strips buyer-age demographics everywhere else.
 */
export function sanitizePublicCopy(text: string, ctx: AudienceContext): string {
  if (!text) return text;
  if (isAgeRelevantNiche(ctx)) return text;
  return stripBuyerAgeFromPublicCopy(text);
}

/**
 * Produce a safe, public-facing audience phrase from the buyer persona, with all
 * numeric ages removed. Falls back to a neutral phrase so downstream copy never
 * interpolates an empty or age-laden audience.
 *   "casual anglers 40-60" -> "casual anglers"
 *   "dog owners"           -> "dog owners"
 *   (empty)                -> "<niche> customers"
 */
export function sanitizePublicAudienceText(ctx: AudienceContext): string {
  let phrase = (ctx.targetCustomer ?? "").trim();
  if (phrase) {
    phrase = phrase
      .replace(/\b(?:ages?|aged)\b/gi, " ")
      .replace(/\d{1,2}\s*(?:[-–—]|to)\s*\d{1,2}\+?/g, " ")
      .replace(/\b\d+\+?\b/g, " ")
      .replace(/\b(?:year[- ]?olds?|years?|yrs?|yo)\b/gi, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s,\-–—]+|[\s,\-–—]+$/g, "")
      .trim();
  }
  if (phrase) return phrase;

  const endUser = (ctx.endUser ?? "").trim().toLowerCase();
  if (endUser && /\b(dog|cat|pet|puppy|kitten|bird|horse)\b/.test(endUser)) {
    return "pet owners";
  }
  const niche = ctx.niche.trim();
  return niche ? `${niche} customers` : "everyday customers";
}
