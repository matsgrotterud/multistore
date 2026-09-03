import type { z } from "zod";
import {
  categoryReferenceSetV2,
  productReferenceSetV2,
  type StoreExperienceCatalogProjectionV2,
} from "./catalog-context";
import {
  STORE_EXPERIENCE_CLAIMS_V2,
  storeExperienceManifestV2Schema,
  type StoreExperienceManifestV2,
} from "./manifest";
import type {
  StoreExperienceClaimV2,
  StoreExperienceValidationIssueV2,
} from "./validation-types";

export interface StoreExperienceValidationSuccessV2 {
  success: true;
  manifest: StoreExperienceManifestV2;
  issues: [];
}

export interface StoreExperienceValidationFailureV2 {
  success: false;
  manifest: null;
  issues: StoreExperienceValidationIssueV2[];
}

export type StoreExperienceValidationResultV2 =
  | StoreExperienceValidationSuccessV2
  | StoreExperienceValidationFailureV2;

function zodPath(path: z.ZodIssue["path"]): string {
  if (path.length === 0) return "$";
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") return `${result}[${segment}]`;
    return result === "$" ? `$.${segment}` : `${result}.${segment}`;
  }, "$");
}

function channelToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function relativeLuminanceV2(hex: string): number {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (
    channelToLinear(red) * 0.2126 +
    channelToLinear(green) * 0.7152 +
    channelToLinear(blue) * 0.0722
  );
}

export function contrastRatioV2(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminanceV2(foreground);
  const backgroundLuminance = relativeLuminanceV2(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(
  issues: StoreExperienceValidationIssueV2[],
  foreground: string,
  background: string,
  path: string,
  label: string,
  minimum = 4.5
): void {
  const ratio = contrastRatioV2(foreground, background);
  if (ratio + Number.EPSILON < minimum) {
    issues.push({
      code: "INSUFFICIENT_CONTRAST",
      path,
      message: `${label} contrast is ${ratio.toFixed(2)}:1; ${minimum.toFixed(
        1
      )}:1 is required`,
    });
  }
}

const claimPatterns = [
  /\b(?:best|number one|#1|guaranteed|lowest price|cheapest)\b/i,
  /\b(?:risk[- ]free|zero risk|always works|never fails)\b/i,
  /\b(?:clinically proven|doctor approved|medically proven)\b/i,
  /\b(?:cures?|treats?|prevents?)\b/i,
  /\b(?:carbon neutral|eco[- ]friendly|fully sustainable)\b/i,
  /\bfree shipping\b/i,
] as const;

/** Shared, conservative copy gate for every generated storefront artifact. */
export function isUnsafeStorefrontClaimCopyV2(value: string): boolean {
  return claimPatterns.some((pattern) => pattern.test(value));
}

const nonCopyKeys = new Set([
  "id",
  "type",
  "href",
  "featuredProductRef",
  "productRefs",
  "categoryRefs",
  "catalogProjectionRef",
  "claim",
  "claims",
  "cartSlot",
  "merchantIdentitySlot",
  "policyLinksSlot",
  "productCardSlot",
  "gallerySlot",
  "purchaseSlot",
  "contentSlot",
  "policySlot",
]);

function collectAuthoredCopy(
  value: unknown,
  path = "$",
  key = ""
): Array<{ path: string; value: string }> {
  if (typeof value === "string") {
    return nonCopyKeys.has(key) ? [] : [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectAuthoredCopy(entry, `${path}[${index}]`, key)
    );
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([entryKey, entry]) =>
    collectAuthoredCopy(entry, `${path}.${entryKey}`, entryKey)
  );
}

function validateClaimCopy(
  manifest: StoreExperienceManifestV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  for (const entry of collectAuthoredCopy(manifest)) {
    if (isUnsafeStorefrontClaimCopyV2(entry.value)) {
      issues.push({
        code: "UNSAFE_CLAIM_COPY",
        path: entry.path,
        message:
          "Absolute, medical, environmental, price or shipping claims require a separate evidence-backed surface",
      });
    }
  }
}

function countBlocks(
  manifest: StoreExperienceManifestV2,
  page: keyof StoreExperienceManifestV2["pages"],
  type: string
): number {
  return manifest.pages[page].blocks.filter((block) => block.type === type)
    .length;
}

function requireExactlyOneBlock(
  manifest: StoreExperienceManifestV2,
  issues: StoreExperienceValidationIssueV2[],
  page: keyof StoreExperienceManifestV2["pages"],
  type: string
): void {
  const count = countBlocks(manifest, page, type);
  if (count === 0) {
    issues.push({
      code: "REQUIRED_BLOCK_MISSING",
      path: `$.pages.${page}.blocks`,
      message: `${page} requires one ${type} block`,
    });
  } else if (count > 1) {
    issues.push({
      code: "REQUIRED_BLOCK_DUPLICATED",
      path: `$.pages.${page}.blocks`,
      message: `${page} permits only one ${type} block`,
    });
  }
}

function validateRequiredBlocks(
  manifest: StoreExperienceManifestV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  const required: Array<
    [keyof StoreExperienceManifestV2["pages"], string]
  > = [
    ["home", "hero"],
    ["home", "product-grid"],
    ["plp", "category-header"],
    ["plp", "product-grid"],
    ["pdp", "product-gallery"],
    ["pdp", "product-summary"],
    ["pdp", "purchase-panel"],
    ["content", "content-header"],
    ["content", "article-body"],
    ["content", "policy-page"],
  ];
  for (const [page, type] of required) {
    requireExactlyOneBlock(manifest, issues, page, type);
  }

  const blockIds = new Map<string, string>();
  for (const [page, pageManifest] of Object.entries(manifest.pages)) {
    pageManifest.blocks.forEach((block, index) => {
      const path = `$.pages.${page}.blocks[${index}].id`;
      const firstPath = blockIds.get(block.id);
      if (firstPath) {
        issues.push({
          code: "DUPLICATE_BLOCK_ID",
          path,
          message: `Block id ${block.id} is already used at ${firstPath}`,
        });
      } else {
        blockIds.set(block.id, path);
      }
    });
  }
}

function featureBlockLocations(
  manifest: StoreExperienceManifestV2,
  type: string
): string[] {
  const paths: string[] = [];
  for (const [page, pageManifest] of Object.entries(manifest.pages)) {
    pageManifest.blocks.forEach((block, index) => {
      if (block.type === type) paths.push(`$.pages.${page}.blocks[${index}]`);
    });
  }
  return paths;
}

function validateFeatureBlock(
  issues: StoreExperienceValidationIssueV2[],
  enabled: boolean,
  feature: keyof StoreExperienceManifestV2["features"],
  paths: string[]
): void {
  if (!enabled && paths.length > 0) {
    for (const path of paths) {
      issues.push({
        code: "FEATURE_BLOCK_DISABLED",
        path,
        message: `${feature} blocks require features.${feature} to be enabled`,
      });
    }
  } else if (enabled && paths.length === 0) {
    issues.push({
      code: "FEATURE_BLOCK_MISSING",
      path: `$.features.${feature}`,
      message: `${feature} is enabled but its allowlisted block is absent`,
    });
  }
}

function validateFeatures(
  manifest: StoreExperienceManifestV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  validateFeatureBlock(
    issues,
    manifest.features.quiz,
    "quiz",
    featureBlockLocations(manifest, "quiz-callout")
  );
  validateFeatureBlock(
    issues,
    manifest.features.compare,
    "compare",
    featureBlockLocations(manifest, "comparison-callout")
  );
  validateFeatureBlock(
    issues,
    manifest.features.wishlist,
    "wishlist",
    featureBlockLocations(manifest, "wishlist-control")
  );
  validateFeatureBlock(
    issues,
    manifest.features.recommendations,
    "recommendations",
    [
      ...featureBlockLocations(manifest, "recommendation-grid"),
      ...featureBlockLocations(manifest, "related-products"),
    ]
  );
}

function validateReferences(
  manifest: StoreExperienceManifestV2,
  catalog: StoreExperienceCatalogProjectionV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  const products = productReferenceSetV2(catalog);
  const categories = categoryReferenceSetV2(catalog);

  const validateProduct = (productRef: string, path: string) => {
    if (!products.has(productRef)) {
      issues.push({
        code: "UNKNOWN_PRODUCT_REF",
        path,
        message: `Product ${productRef} is not present in the Catalog V2 projection`,
      });
    }
  };
  const validateCategory = (categoryRef: string, path: string) => {
    if (!categories.has(categoryRef)) {
      issues.push({
        code: "UNKNOWN_CATEGORY_REF",
        path,
        message: `Category ${categoryRef} is not present in the Catalog V2 projection`,
      });
    }
  };

  for (const [page, pageManifest] of Object.entries(manifest.pages)) {
    pageManifest.blocks.forEach((block, blockIndex) => {
      const blockPath = `$.pages.${page}.blocks[${blockIndex}]`;
      if ("featuredProductRef" in block && block.featuredProductRef) {
        validateProduct(
          block.featuredProductRef,
          `${blockPath}.featuredProductRef`
        );
      }
      if ("productRefs" in block) {
        block.productRefs.forEach((productRef, index) =>
          validateProduct(productRef, `${blockPath}.productRefs[${index}]`)
        );
      }
      if ("ribbons" in block && block.ribbons) {
        block.ribbons.forEach((ribbon, index) => {
          validateProduct(
            ribbon.productRef,
            `${blockPath}.ribbons[${index}].productRef`
          );
          if (
            "productRefs" in block &&
            !block.productRefs.includes(ribbon.productRef)
          ) {
            issues.push({
              code: "RIBBON_PRODUCT_NOT_IN_BLOCK",
              path: `${blockPath}.ribbons[${index}].productRef`,
              message: "A product ribbon may only annotate a product rendered by its block",
            });
          }
        });
      }
      if ("categoryRefs" in block) {
        block.categoryRefs.forEach((categoryRef, index) =>
          validateCategory(categoryRef, `${blockPath}.categoryRefs[${index}]`)
        );
      }
    });
  }
}

function collectClaims(
  manifest: StoreExperienceManifestV2
): Array<{ claim: StoreExperienceClaimV2; path: string }> {
  const claims: Array<{ claim: StoreExperienceClaimV2; path: string }> = [];
  manifest.pages.home.blocks.forEach((block, blockIndex) => {
    if (block.type !== "value-propositions") return;
    block.items.forEach((item, itemIndex) => {
      claims.push({
        claim: item.claim,
        path: `$.pages.home.blocks[${blockIndex}].items[${itemIndex}].claim`,
      });
    });
  });
  manifest.pages.pdp.blocks.forEach((block, blockIndex) => {
    if (block.type !== "trust-facts") return;
    block.claims.forEach((claim, claimIndex) => {
      claims.push({
        claim,
        path: `$.pages.pdp.blocks[${blockIndex}].claims[${claimIndex}]`,
      });
    });
  });
  return claims;
}

function validateClaims(
  manifest: StoreExperienceManifestV2,
  catalog: StoreExperienceCatalogProjectionV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  const allowedClaims = new Set<StoreExperienceClaimV2>(
    (catalog.verifiedClaims ?? []).filter((claim) =>
      STORE_EXPERIENCE_CLAIMS_V2.includes(claim)
    )
  );
  for (const entry of collectClaims(manifest)) {
    const availabilityVerified =
      entry.claim !== "verified-availability" ||
      (catalog.products.length > 0 &&
        catalog.products.every((product) => product.availability !== "UNKNOWN"));
    if (!allowedClaims.has(entry.claim) || !availabilityVerified) {
      issues.push({
        code: "UNVERIFIED_CLAIM",
        path: entry.path,
        message: `Claim ${entry.claim} is not verified by the supplied catalog/policy context`,
      });
    }
  }
}

function validateContrast(
  manifest: StoreExperienceManifestV2,
  issues: StoreExperienceValidationIssueV2[]
): void {
  const palette = manifest.designTokens.palette;
  checkContrast(
    issues,
    palette.text,
    palette.background,
    "$.designTokens.palette.text",
    "Text on background"
  );
  checkContrast(
    issues,
    palette.mutedText,
    palette.background,
    "$.designTokens.palette.mutedText",
    "Muted text on background"
  );
  checkContrast(
    issues,
    palette.text,
    palette.surface,
    "$.designTokens.palette.text",
    "Text on surface"
  );
  checkContrast(
    issues,
    palette.mutedText,
    palette.surface,
    "$.designTokens.palette.mutedText",
    "Muted text on surface"
  );
  checkContrast(
    issues,
    palette.onPrimary,
    palette.primary,
    "$.designTokens.palette.onPrimary",
    "Text on primary"
  );
  checkContrast(
    issues,
    palette.primary,
    palette.background,
    "$.designTokens.palette.primary",
    "Primary links on background"
  );
  checkContrast(
    issues,
    palette.primary,
    palette.surface,
    "$.designTokens.palette.primary",
    "Primary links on surface"
  );
}

/**
 * Safe rendering-boundary validation. Unknown fields/blocks fail the Zod gate;
 * semantic checks then enforce platform shells, catalog references, claims and
 * accessible contrast without evaluating author-supplied content.
 */
export function validateStoreExperienceManifestV2(
  value: unknown,
  catalog: StoreExperienceCatalogProjectionV2
): StoreExperienceValidationResultV2 {
  const parsed = storeExperienceManifestV2Schema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      manifest: null,
      issues: parsed.error.issues.map((issue) => ({
        code: "SCHEMA_INVALID",
        path: zodPath(issue.path),
        message: issue.message,
      })),
    };
  }

  const manifest = parsed.data;
  const issues: StoreExperienceValidationIssueV2[] = [];
  if (manifest.catalogProjectionRef !== catalog.projectionRef) {
    issues.push({
      code: "CATALOG_PROJECTION_MISMATCH",
      path: "$.catalogProjectionRef",
      message: "Manifest and catalog projection references do not match",
    });
  }
  validateRequiredBlocks(manifest, issues);
  validateFeatures(manifest, issues);
  validateReferences(manifest, catalog, issues);
  validateClaims(manifest, catalog, issues);
  validateClaimCopy(manifest, issues);
  validateContrast(manifest, issues);

  if (issues.length > 0) {
    return { success: false, manifest: null, issues };
  }
  return { success: true, manifest, issues: [] };
}
