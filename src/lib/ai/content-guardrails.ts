/**
 * Content guardrails.
 *
 * Every piece of generated (or imported) content is screened before it can
 * be published. The guardrails enforce the platform's honesty rules:
 * no fake reviews, no fabricated claims, no implied local stock when
 * fulfillment is from a remote supplier, mandatory shipping/return
 * transparency, and a minimum quality bar (thin/duplicate content gets a
 * noindex recommendation instead of polluting the index).
 */

export type GuardrailSeverity = "BLOCK" | "WARN" | "INFO";

export interface GuardrailFlag {
  rule: string;
  severity: GuardrailSeverity;
  message: string;
}

export interface GuardrailReport {
  passed: boolean;
  recommendNoindex: boolean;
  flags: GuardrailFlag[];
}

const FAKE_REVIEW_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:out of\s*5|\/\s*5)\s*stars?\b/i,
  /\bthousands of (?:5|five)[- ]star reviews\b/i,
  /\bour customers rate (?:us|it)\b/i,
  /\bverified reviews?\b/i,
];

const FAKE_CLAIM_PATTERNS = [
  /\b(?:clinically|scientifically|lab)[- ]proven\b/i,
  /\bguaranteed to (?:cure|fix|eliminate)\b/i,
  /\b#1 (?:best[- ]?seller|rated)\b/i,
  /\bdoctor[- ]recommended\b/i,
  /\baward[- ]winning\b/i,
];

const LOCAL_STOCK_PATTERNS = [
  /\bships? (?:today|same[- ]day) from our (?:local )?warehouse\b/i,
  /\bin stock locally\b/i,
  /\blocal (?:stock|inventory|warehouse)\b/i,
  /\bdispatched from our store\b/i,
];

const SCARCITY_PATTERNS = [
  /\bonly \d+ left\b/i,
  /\bselling out fast\b/i,
  /\bhurry[,!]? (?:before|while)\b/i,
  /\boffer ends (?:tonight|today|soon)\b/i,
];

const THIN_CONTENT_MIN_WORDS = 120;

export interface ContentCheckInput {
  text: string;
  /** Pages from the same store to compare against for near-duplicates. */
  siblingTexts?: string[];
  /** Whether the surrounding page already shows shipping transparency. */
  pageShowsShippingDisclosure?: boolean;
  /** Whether the surrounding page already links/states the return policy. */
  pageShowsReturnPolicy?: boolean;
}

export function checkContent(input: ContentCheckInput): GuardrailReport {
  const flags: GuardrailFlag[] = [];
  const text = input.text;

  for (const pattern of FAKE_REVIEW_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-fake-reviews",
        severity: "BLOCK",
        message: `Review-like claim detected (${pattern}). Reviews may only come from real collected data.`,
      });
    }
  }

  for (const pattern of FAKE_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-unverifiable-claims",
        severity: "BLOCK",
        message: `Unverifiable claim detected (${pattern}). Remove or substantiate with a citable source.`,
      });
    }
  }

  for (const pattern of LOCAL_STOCK_PATTERNS) {
    if (pattern.test(text) && !isNegatedLocalStockMention(text)) {
      flags.push({
        rule: "no-implied-local-stock",
        severity: "BLOCK",
        message:
          "Copy implies local stock. Fulfillment is via third-party suppliers; use the store's shipping disclosure instead.",
      });
    }
  }

  for (const pattern of SCARCITY_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-fake-scarcity",
        severity: "BLOCK",
        message: "Fake-scarcity pattern detected. Remove urgency copy that is not backed by real inventory data.",
      });
    }
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < THIN_CONTENT_MIN_WORDS) {
    flags.push({
      rule: "thin-content",
      severity: "WARN",
      message: `Only ${wordCount} words (minimum ${THIN_CONTENT_MIN_WORDS}). Recommend noindex until expanded.`,
    });
  }

  if (input.siblingTexts && input.siblingTexts.length > 0) {
    for (const sibling of input.siblingTexts) {
      const similarity = jaccardSimilarity(text, sibling);
      if (similarity > 0.7) {
        flags.push({
          rule: "duplicate-ish-content",
          severity: "WARN",
          message: `Content is ${(similarity * 100).toFixed(0)}% similar to an existing page. Rewrite with a unique, store-specific angle or noindex.`,
        });
        break;
      }
    }
  }

  if (input.pageShowsShippingDisclosure === false) {
    flags.push({
      rule: "shipping-transparency",
      severity: "WARN",
      message: "Page does not show a shipping disclosure. Add realistic delivery windows and fulfillment origin.",
    });
  }

  if (input.pageShowsReturnPolicy === false) {
    flags.push({
      rule: "return-transparency",
      severity: "WARN",
      message: "Page does not surface the return policy. Link or summarize it near the buying decision.",
    });
  }

  const hasBlocker = flags.some((flag) => flag.severity === "BLOCK");
  const recommendNoindex = flags.some(
    (flag) => flag.rule === "thin-content" || flag.rule === "duplicate-ish-content"
  );

  return { passed: !hasBlocker, recommendNoindex, flags };
}

/** Allow honest disclosures like "we do not claim local stock". */
function isNegatedLocalStockMention(text: string): boolean {
  return /\b(?:never|not|don't|do not|without|instead of)\b[^.]{0,60}\blocal stock\b/i.test(
    text
  );
}

/** Cheap shingle-based similarity for duplicate-ish detection. */
function jaccardSimilarity(a: string, b: string): number {
  const shinglesA = shingles(a);
  const shinglesB = shingles(b);
  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;
  let intersection = 0;
  for (const shingle of shinglesA) {
    if (shinglesB.has(shingle)) intersection += 1;
  }
  return intersection / (shinglesA.size + shinglesB.size - intersection);
}

function shingles(text: string, size = 3): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  return result;
}
