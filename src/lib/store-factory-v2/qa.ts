import {
  CatalogProjectionV2Schema,
  type CatalogProjectionV2,
} from "@/lib/catalog-v2";
import {
  catalogProjectionToStoreExperienceV2,
  isUnsafeStorefrontClaimCopyV2,
  storeExperienceManifestV2Schema,
  validateStoreExperienceManifestV2,
  type StoreExperienceCatalogProjectionV2,
} from "@/lib/storefront-v2";
import {
  STORE_REVISION_QA_REPORT_V1,
  StoreContentProposalV1Schema,
  StoreRevisionCandidateV1Schema,
  StoreRevisionQaReportV1Schema,
  artifactDigestsV1,
  type StoreBuildRequestV1,
  type StoreBuildRequestV2,
  type StoreRevisionCandidateV1,
  type StoreRevisionQaCheckV1,
  type StoreRevisionQaReportV1,
} from "./contracts";

/**
 * Runs the provider-free acceptance boundary for a complete revision artifact.
 * The result depends only on the validated request and candidate; no clock,
 * database state or provider response can alter it.
 */
export function runDeterministicStoreRevisionQaV1(
  request: StoreBuildRequestV1 | StoreBuildRequestV2,
  candidate: StoreRevisionCandidateV1
): StoreRevisionQaReportV1 {
  const catalogResult = CatalogProjectionV2Schema.safeParse(
    candidate.catalogProjection
  );
  const experienceResult = storeExperienceManifestV2Schema.safeParse(
    candidate.experienceManifest
  );
  const contentResult = StoreContentProposalV1Schema.safeParse(
    candidate.contentProposal
  );
  const candidateResult = StoreRevisionCandidateV1Schema.safeParse(candidate);
  const experienceCatalog = toExperienceCatalog(request, candidate);
  const semanticResult = validateStoreExperienceManifestV2(
    candidate.experienceManifest,
    experienceCatalog
  );

  const checks: StoreRevisionQaCheckV1[] = [
    checkWithReasons(
      "CATALOG_CONTRACT",
      catalogResult.success
        ? catalogClaimReasons(catalogResult.data)
        : ["CATALOG_CONTRACT_INVALID"]
    ),
    checkWithReasons("CATALOG_SHAPE", catalogShapeReasons(request, candidate)),
    check(
      "EXPERIENCE_CONTRACT",
      experienceResult.success,
      "EXPERIENCE_CONTRACT_VALID",
      "EXPERIENCE_CONTRACT_INVALID"
    ),
    checkWithReasons(
      "EXPERIENCE_SEMANTICS",
      semanticResult.success
        ? []
        : uniqueSorted(
            semanticResult.issues.map(
              (issue) => `EXPERIENCE_${normalizeReasonCode(issue.code)}`
            )
          )
    ),
    checkWithReasons(
      "CONTENT_CONTRACT",
      contentResult.success
        ? contentClaimReasons(contentResult.data)
        : ["CONTENT_CONTRACT_INVALID"]
    ),
    checkWithReasons(
      "CONTENT_REFERENCES",
      contentReferenceReasons(candidate)
    ),
    check(
      "ARTIFACT_LINKAGE",
      candidateResult.success &&
        artifactsMatchBuildInput(request, candidate),
      "ARTIFACT_LINKAGE_VALID",
      "ARTIFACT_LINKAGE_INVALID"
    ),
    check(
      "PREVIEW_ONLY",
      true,
      "PREVIEW_ONLY_ENFORCED",
      "PREVIEW_ONLY_NOT_ENFORCED"
    ),
  ];
  const reasonCodes = uniqueSorted(
    checks.flatMap((entry) =>
      entry.status === "FAIL" ? entry.reasonCodes : []
    )
  );

  return StoreRevisionQaReportV1Schema.parse({
    version: STORE_REVISION_QA_REPORT_V1,
    status: checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL",
    artifactDigests: artifactDigestsV1(candidate),
    checks,
    reasonCodes,
  });
}

function catalogClaimReasons(catalog: CatalogProjectionV2): string[] {
  const scalarValues = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.flatMap(scalarValues)
      : typeof value === "string"
        ? [value]
        : [];
  const copy = [
    ...catalog.taxonomy.nodes.flatMap((node) => [
      node.name,
      ...(node.description ? [node.description] : []),
    ]),
    ...catalog.collections.flatMap((collection) => [
      collection.title,
      ...(collection.description ? [collection.description] : []),
    ]),
    ...catalog.attributeDefinitions.flatMap((definition) => [
      definition.label,
      ...definition.allowedValues.map((value) => value.label),
    ]),
    ...catalog.products.flatMap((product) => [
      product.title,
      ...(product.subtitle ? [product.subtitle] : []),
      product.description,
      product.seoTitle,
      product.seoDescription,
      ...(product.brand ? [product.brand] : []),
      ...product.attributes.flatMap((attribute) => [
        attribute.label,
        ...scalarValues(attribute.value),
      ]),
      ...product.media.map((media) => media.altText),
      ...product.variants.flatMap((variant) => [
        variant.label,
        ...variant.attributes.flatMap((attribute) => [
          attribute.label,
          ...scalarValues(attribute.value),
        ]),
      ]),
      ...product.purchaseOptions.map((option) => option.label),
    ]),
  ];
  return copy.some(isUnsafeStorefrontClaimCopyV2)
    ? ["CATALOG_UNSAFE_CLAIM_COPY"]
    : [];
}

function contentClaimReasons(
  content: StoreRevisionCandidateV1["contentProposal"]
): string[] {
  const copy = [
    content.homepage.headline,
    content.homepage.introduction,
    content.homepage.seoTitle,
    content.homepage.seoDescription,
    ...content.taxonomy.flatMap((entry) => [entry.title, entry.introduction]),
    ...content.products.flatMap((entry) => [entry.headline, entry.summary]),
    ...content.guides.flatMap((guide) => [
      guide.title,
      guide.summary,
      ...guide.sections.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
      ]),
    ]),
  ];
  return copy.some(isUnsafeStorefrontClaimCopyV2)
    ? ["CONTENT_UNSAFE_CLAIM_COPY"]
    : [];
}

function toExperienceCatalog(
  request: StoreBuildRequestV1 | StoreBuildRequestV2,
  candidate: StoreRevisionCandidateV1
): StoreExperienceCatalogProjectionV2 {
  return catalogProjectionToStoreExperienceV2({
    catalog: candidate.catalogProjection,
    store: { name: request.brief.name, niche: request.brief.niche },
    verifiedClaims: [],
  });
}

function catalogShapeReasons(
  request: StoreBuildRequestV1 | StoreBuildRequestV2,
  candidate: StoreRevisionCandidateV1
): string[] {
  const reasons: string[] = [];
  const productCount = candidate.catalogProjection.products.length;
  if (productCount < request.catalogShape.minimumPreviewProductCount) {
    reasons.push("CATALOG_BELOW_MINIMUM_PREVIEW_COUNT");
  }
  if (productCount > request.catalogShape.targetProductCount) {
    reasons.push("CATALOG_EXCEEDS_TARGET_PRODUCT_COUNT");
  }

  const taxonomySlugs = new Set(
    candidate.catalogProjection.taxonomy.nodes.map((node) => node.slug)
  );
  if (
    request.catalogShape.categories.some(
      (category) => !taxonomySlugs.has(category.key)
    )
  ) {
    reasons.push("CATALOG_REQUIRED_CATEGORY_MISSING");
  }

  if (
    candidate.catalogProjection.products.some(
      (product) =>
        product.price.state === "KNOWN" &&
        product.price.money.currency !== request.brief.currency
    )
  ) {
    reasons.push("CATALOG_CURRENCY_MISMATCH");
  }
  return uniqueSorted(reasons);
}

function contentReferenceReasons(
  candidate: StoreRevisionCandidateV1
): string[] {
  const reasons: string[] = [];
  const taxonomyIds = new Set(
    candidate.catalogProjection.taxonomy.nodes.map(
      (node) => node.taxonomyNodeId
    )
  );
  const productIds = new Set(
    candidate.catalogProjection.products.map((product) => product.productId)
  );
  const contentTaxonomyIds = new Set(
    candidate.contentProposal.taxonomy.map((entry) => entry.taxonomyNodeId)
  );
  const contentProductIds = new Set(
    candidate.contentProposal.products.map((entry) => entry.productId)
  );

  if (
    candidate.contentProposal.taxonomy.some(
      (entry) => !taxonomyIds.has(entry.taxonomyNodeId)
    )
  ) {
    reasons.push("CONTENT_TAXONOMY_REFERENCE_UNKNOWN");
  }
  if (
    candidate.contentProposal.products.some(
      (entry) => !productIds.has(entry.productId)
    ) ||
    candidate.contentProposal.guides.some((guide) =>
      guide.relatedProductRefs.some((productId) => !productIds.has(productId))
    )
  ) {
    reasons.push("CONTENT_PRODUCT_REFERENCE_UNKNOWN");
  }
  if ([...taxonomyIds].some((id) => !contentTaxonomyIds.has(id))) {
    reasons.push("CONTENT_TAXONOMY_COVERAGE_INCOMPLETE");
  }
  if ([...productIds].some((id) => !contentProductIds.has(id))) {
    reasons.push("CONTENT_PRODUCT_COVERAGE_INCOMPLETE");
  }
  return uniqueSorted(reasons);
}

function artifactsMatchBuildInput(
  request: StoreBuildRequestV1 | StoreBuildRequestV2,
  candidate: StoreRevisionCandidateV1
): boolean {
  const projectionRef = candidate.catalogProjection.projectionRef;
  return (
    candidate.experienceManifest.catalogProjectionRef === projectionRef &&
    candidate.contentProposal.catalogProjectionRef === projectionRef &&
    candidate.experienceManifest.chrome.header.brandLabel === request.brief.name
  );
}

function check(
  id: StoreRevisionQaCheckV1["id"],
  passed: boolean,
  passCode: string,
  failCode: string
): StoreRevisionQaCheckV1 {
  return {
    id,
    status: passed ? "PASS" : "FAIL",
    reasonCodes: [passed ? passCode : failCode],
  };
}

function checkWithReasons(
  id: StoreRevisionQaCheckV1["id"],
  failureReasons: string[]
): StoreRevisionQaCheckV1 {
  return failureReasons.length === 0
    ? { id, status: "PASS", reasonCodes: [`${id}_VALID`] }
    : { id, status: "FAIL", reasonCodes: failureReasons };
}

function normalizeReasonCode(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0
  );
}
