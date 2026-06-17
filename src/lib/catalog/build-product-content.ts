import { generateProductCopy } from "@/lib/ai/store-blueprint";
import { checkContent } from "@/lib/ai/content-guardrails";
import type { FaqItem, SpecItem } from "@/lib/types";

/**
 * Minimum-viable PREMIUM product content for imported supplier products.
 *
 * Raw supplier (CJ) titles/descriptions are unusable on a real storefront, so
 * every imported product gets store-specific copy built from supplier FACTS
 * (specs, variants, brand, origin, shipping) via the existing AI copy
 * infrastructure (`generateProductCopy`, deterministic mock fallback) and run
 * through the content guardrails before publish.
 *
 * Honesty rules: we never invent certifications, safety/medical claims,
 * warranties, ratings/reviews, local stock or exact performance numbers that
 * are not present in supplier data. Thin content is marked noindex/NEEDS_REVIEW.
 */

export interface BuildProductContentInput {
  storeName: string;
  niche: string;
  audience: string;
  brandVoice?: string;
  categoryName: string;
  rawTitle: string;
  rawDescription?: string | null;
  brand?: string | null;
  specs: SpecItem[];
  variantOptionSummaries: string[];
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin?: string | null;
}

export interface BuiltProductContent {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  pros: string[];
  cons: string[];
  specs: SpecItem[];
  useCases: string[];
  faq: FaqItem[];
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  noindex: boolean;
  qualityStatus: "READY" | "NEEDS_REVIEW";
  guardrailFlags: string[];
  /** Number of supplier facts available — drives the thin-content decision. */
  factScore: number;
}

const GENERIC_BRANDS = new Set([
  "",
  "oem",
  "no brand",
  "nobrand",
  "generic",
  "unbranded",
  "n/a",
  "na",
]);

/** Turn a noisy supplier title into a clean, readable product title. */
export function cleanProductTitle(raw: string): string {
  let title = (raw || "")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, " ") // emoji/symbols
    .replace(/[\[(（【][^\])）】]*[\])）】]/g, " ") // bracketed promo blocks
    .replace(/\b(free shipping|hot sale|new arrival|wholesale|drop ?shipping|in stock)\b/gi, " ")
    .replace(/[|/\\]+/g, " ")
    .replace(/[，、]+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*,+/g, ", ")
    .trim()
    .replace(/^[,\-–—\s]+|[,\-–—\s]+$/g, "");

  // De-shout titles that are mostly uppercase.
  const letters = title.replace(/[^a-z]/gi, "");
  const upper = title.replace(/[^A-Z]/g, "");
  if (letters.length > 0 && upper.length / letters.length > 0.7) {
    title = title
      .toLowerCase()
      .replace(/\b([a-z])/g, (match) => match.toUpperCase());
  }

  if (title.length > 70) {
    const cut = title.slice(0, 70);
    const lastSpace = cut.lastIndexOf(" ");
    title = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
  }

  return title || (raw || "Product").slice(0, 70);
}

function dedupeSpecs(specs: SpecItem[]): SpecItem[] {
  const seen = new Set<string>();
  const out: SpecItem[] = [];
  for (const spec of specs) {
    const label = spec.label?.trim();
    const value = spec.value?.trim();
    if (!label || !value) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, value });
    if (out.length >= 12) break;
  }
  return out;
}

export async function buildImportedProductContent(
  input: BuildProductContentInput
): Promise<BuiltProductContent> {
  const title = cleanProductTitle(input.rawTitle);
  const supplierSpecs = dedupeSpecs(input.specs);

  const { copy } = await generateProductCopy({
    productTitle: title,
    niche: input.niche,
    audience: input.audience,
    brandVoice: input.brandVoice || "clear, honest, practical",
    specs: supplierSpecs,
    shippingDaysMin: input.shippingDaysMin,
    shippingDaysMax: input.shippingDaysMax,
  });

  // Layer honest, supplier-derived facts on top of the generated specs.
  const derivedSpecs: SpecItem[] = [...supplierSpecs];
  const brand = input.brand?.trim();
  if (brand && !GENERIC_BRANDS.has(brand.toLowerCase())) {
    if (!derivedSpecs.some((spec) => spec.label.toLowerCase() === "brand")) {
      derivedSpecs.push({ label: "Brand", value: brand });
    }
  }
  if (input.countryOfOrigin?.trim()) {
    derivedSpecs.push({ label: "Ships from", value: input.countryOfOrigin.trim() });
  }
  if (input.variantOptionSummaries.length > 0) {
    derivedSpecs.push({
      label: "Options",
      value: input.variantOptionSummaries.slice(0, 6).join(" · "),
    });
  }
  derivedSpecs.push({
    label: "Typical delivery",
    value: `${input.shippingDaysMin}–${input.shippingDaysMax} business days`,
  });
  const specs = dedupeSpecs(derivedSpecs);

  const subtitle =
    copy.subtitle ||
    `${input.categoryName} chosen for ${input.audience}`;

  const seoTitle = (copy.seoTitle || `${title} | ${input.storeName}`).slice(0, 65);
  const seoDescription = (copy.seoDescription || copy.shortDescription).slice(0, 155);
  const imageAlt = `${title} — ${input.categoryName}`.slice(0, 120);

  const factScore =
    supplierSpecs.length +
    input.variantOptionSummaries.length +
    (brand && !GENERIC_BRANDS.has(brand.toLowerCase()) ? 1 : 0) +
    (input.countryOfOrigin?.trim() ? 1 : 0);

  const report = checkContent({
    text: [
      copy.description,
      copy.shortDescription,
      ...copy.pros,
      ...copy.cons,
      ...copy.faq.flatMap((item) => [item.question, item.answer]),
    ].join("\n"),
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });

  // Thin if guardrails flag it, copy is blocked, or there are barely any
  // supplier facts to substantiate the page.
  const thin = report.recommendNoindex || !report.passed || factScore < 1;

  return {
    title,
    subtitle,
    shortDescription: copy.shortDescription,
    description: copy.description,
    pros: copy.pros,
    cons: copy.cons,
    specs,
    useCases: copy.useCases,
    faq: copy.faq,
    seoTitle,
    seoDescription,
    imageAlt,
    noindex: thin,
    qualityStatus: thin ? "NEEDS_REVIEW" : "READY",
    guardrailFlags: report.flags.map((flag) => `${flag.severity}:${flag.rule}`),
    factScore,
  };
}
