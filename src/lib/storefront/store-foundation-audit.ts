import { contrastRatio } from "@/lib/theme";
import type {
  StoreFoundationAuditV1,
  StoreFoundationV1,
} from "./store-foundation-contract";

const ALLOWED_EVIDENCE_REF =
  /^(merchant-brief|store-state|platform-policy):[a-z0-9._-]+$/;

const CATALOG_CLAIM_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: "PRICE_CLAIM", pattern: /(?:[$€£]\s?\d|\b(?:price|prices|cheapest|lowest price)\b)/i },
  { code: "DELIVERY_CLAIM", pattern: /\b(?:delivery|shipping|ships? in|business days?)\b/i },
  { code: "INVENTORY_CLAIM", pattern: /\b(?:in stock|out of stock|only \d+ left|selling fast)\b/i },
  { code: "REVIEW_CLAIM", pattern: /\b(?:customer reviews?|ratings?|[1-5](?:\.\d)? stars?)\b/i },
  { code: "TESTING_CLAIM", pattern: /\b(?:tested|best in test|clinically proven|certified)\b/i },
  { code: "SUPERLATIVE_CLAIM", pattern: /\b(?:best sellers?|bestsellers?|market-leading|premium quality)\b/i },
  { code: "SCARCITY_CLAIM", pattern: /\b(?:limited time|today only|act now|while supplies last)\b/i },
];

export function auditStoreFoundation(
  foundation: Omit<StoreFoundationV1, "audit" | "foundationDigest"> &
    Partial<Pick<StoreFoundationV1, "audit" | "foundationDigest">>,
  options: { expectedInputDigest?: string } = {}
): StoreFoundationAuditV1 {
  const blocks = [
    foundation.homepage.hero,
    ...foundation.homepage.principles,
    foundation.homepage.catalogStatus,
  ];
  const text = [
    ...blocks.flatMap((block) => [block.title, block.body]),
    foundation.seoDraft.title,
    foundation.seoDraft.description,
    ...foundation.seoDraft.topicBriefs.flatMap((brief) => [brief.title, brief.angle]),
  ].join("\n");
  const blockedClaims = CATALOG_CLAIM_PATTERNS.filter(({ pattern }) =>
    pattern.test(text)
  ).map(({ code }) => code);
  const grounded = [...blocks, ...foundation.seoDraft.topicBriefs].every(
    (entry) =>
      entry.evidenceRefs.length > 0 &&
      entry.evidenceRefs.every((reference) => ALLOWED_EVIDENCE_REF.test(reference))
  );
  const productTopicsWaiting = foundation.seoDraft.topicBriefs
    .filter((brief) => brief.searchIntent === "COMMERCIAL_RESEARCH")
    .every((brief) => brief.state === "WAITING_FOR_CATALOG");
  const ratio = contrastRatio(
    foundation.themeSnapshot.textColor,
    foundation.themeSnapshot.backgroundColor
  );
  const inputCurrent =
    !options.expectedInputDigest ||
    foundation.inputDigest === options.expectedInputDigest;

  const checks: StoreFoundationAuditV1["checks"] = [
    {
      id: "FOUNDATION_INPUT_CURRENT",
      status: inputCurrent ? "PASS" : "REVIEW",
      detail: inputCurrent
        ? "Foundation input digest matches the current store identity and design snapshot."
        : "Store identity or design changed after this foundation was saved; regenerate or save it again.",
    },
    {
      id: "FOUNDATION_COPY_GROUNDED",
      status: grounded ? "PASS" : "REVIEW",
      detail: grounded
        ? "Every renderable block has an allowlisted merchant, store-state or platform-policy reference."
        : "One or more renderable blocks lack an allowlisted evidence reference.",
    },
    {
      id: "NO_CATALOG_CLAIMS",
      status: blockedClaims.length === 0 ? "PASS" : "REVIEW",
      detail:
        blockedClaims.length === 0
          ? "No price, inventory, delivery, review, testing or scarcity claim appears in the foundation."
          : `Catalog-dependent claims are blocked: ${blockedClaims.join(", ")}.`,
    },
    {
      id: "SEO_DRAFT_NOINDEX",
      status: foundation.seoDraft.status === "DRAFT_NOINDEX" ? "PASS" : "REVIEW",
      detail:
        foundation.seoDraft.status === "DRAFT_NOINDEX"
          ? "SEO work is explicitly a noindex draft."
          : "Foundation SEO must remain DRAFT_NOINDEX.",
    },
    {
      id: "PRODUCT_TOPICS_WAITING",
      status: productTopicsWaiting ? "PASS" : "REVIEW",
      detail: productTopicsWaiting
        ? "Commercial-research topics remain locked until catalog evidence exists."
        : "A commercial-research topic is incorrectly marked ready before catalog evidence.",
    },
    {
      id: "PRESENTATION_VERSIONED",
      status:
        foundation.presentation.version === "storefront-presentation.v1"
          ? "PASS"
          : "REVIEW",
      detail: "Foundation uses the reviewed Storefront Presentation V1 contract.",
    },
    {
      id: "TEXT_CONTRAST",
      status: ratio >= 4.5 ? "PASS" : "REVIEW",
      detail:
        ratio >= 4.5
          ? `Body text contrast is ${ratio.toFixed(2)}:1 (WCAG AA threshold 4.5:1).`
          : `Body text contrast is ${ratio.toFixed(2)}:1; raise it to at least 4.5:1.`,
    },
  ];

  return {
    version: "store-foundation-audit.v1",
    status: checks.every((check) => check.status === "PASS") ? "PASS" : "REVIEW",
    checks,
    blockedClaims,
  };
}
