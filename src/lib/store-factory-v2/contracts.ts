import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CATALOG_PROJECTION_V2,
  CatalogProjectionV2Schema,
} from "@/lib/catalog-v2";
import {
  STORE_EXPERIENCE_MANIFEST_V2,
  storeExperienceManifestV2Schema,
} from "@/lib/storefront-v2/manifest";

export const STORE_BRIEF_V1 = "store-brief.v1" as const;
export const CATALOG_SHAPE_V1 = "catalog-shape.v1" as const;
export const STORE_BUILD_REQUEST_V1 = "store-build-request.v1" as const;
export const STORE_BUILD_REQUEST_V2 = "store-build-request.v2" as const;
export const STORE_BUILD_RUN_V1 = "store-build-run.v1" as const;
export const STORE_BUILD_RUN_V2 = "store-build-run.v2" as const;
export const STORE_BUILD_EVENT_V1 = "store-build-event.v1" as const;
export const STORE_REVISION_V1 = "store-revision.v1" as const;
export const STORE_REVISION_V2 = "store-revision.v2" as const;
export const STORE_REVISION_CANDIDATE_V1 =
  "store-revision-candidate.v1" as const;
export const STORE_CONTENT_PROPOSAL_V1 =
  "store-content-proposal.v1" as const;
export const STORE_REVISION_QA_REPORT_V1 =
  "store-revision-qa-report.v1" as const;
export const STORE_REVISION_CONTRACT_MAP_V1 =
  "store-revision-contract-map.v1" as const;
export const STORE_REVISION_CONTRACT_MAP_V2 =
  "store-revision-contract-map.v2" as const;
export const CATALOG_BINDING_V1 = "catalog-binding.v1" as const;
export const STORE_FACTORY_RUNTIME_CAPABILITY_V2_1 =
  "store-factory-runtime.v2.1" as const;
export const STORE_EXPERIENCE_VARIANTS_V2 = ["BASELINE", "REFINED"] as const;
export const PREVIEW_REVISION_POINTER_V1 =
  "preview-revision-pointer.v1" as const;
export const REVISION_REVIEW_REQUEST_V1 =
  "revision-review-request.v1" as const;
export const REVISION_REVIEW_REQUEST_V2 =
  "revision-review-request.v2" as const;
export const PREVIEW_POINTER_MUTATION_V1 =
  "preview-pointer-mutation.v1" as const;

export const STORE_REVISION_QA_CHECK_IDS_V1 = [
  "CATALOG_CONTRACT",
  "CATALOG_SHAPE",
  "EXPERIENCE_CONTRACT",
  "EXPERIENCE_SEMANTICS",
  "CONTENT_CONTRACT",
  "CONTENT_REFERENCES",
  "ARTIFACT_LINKAGE",
  "PREVIEW_ONLY",
] as const;

const digestSchema = z.string().regex(/^[0-9a-f]{64}$/);

const boundedText = (field: string, max: number) =>
  z
    .string({ required_error: `${field} is required.` })
    .trim()
    .min(1, `${field} cannot be empty.`)
    .max(max, `${field} is too long.`);

const unsafePlainText =
  /[<>{}]|```|javascript\s*:|data\s*:\s*text\/html|on[a-z]+\s*=/i;

/** Plain copy only: no markup, templates, style declarations or executable URLs. */
export const StoreContentPlainTextV1Schema = z
  .string()
  .trim()
  .min(1)
  .max(2_000)
  .refine((value) => !unsafePlainText.test(value), {
    message: "Content must be plain text without markup, templates or code",
  });

const contentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/);
const contentSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const StoreBriefV1Schema = z
  .object({
    version: z.literal(STORE_BRIEF_V1),
    name: boundedText("Store name", 120),
    niche: boundedText("Niche", 240),
    audience: boundedText("Audience", 600),
    positioning: boundedText("Positioning", 1_200),
    valueProposition: boundedText("Value proposition", 1_200),
    brandVoice: boundedText("Brand voice", 600),
    locale: z
      .string()
      .trim()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, "Locale must resemble en or en-US."),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/, "Currency must be an uppercase ISO 4217 code."),
  })
  .strict();

export type StoreBriefV1 = z.infer<typeof StoreBriefV1Schema>;

export const CatalogCategoryShapeV1Schema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Category key must be a slug."),
    name: boundedText("Category name", 120),
    targetProductCount: z.number().int().min(1).max(1_000),
  })
  .strict();

export const CatalogShapeV1Schema = z
  .object({
    version: z.literal(CATALOG_SHAPE_V1),
    productClass: boundedText("Product class", 200),
    targetProductCount: z.number().int().min(1).max(10_000),
    minimumPreviewProductCount: z.number().int().min(1).max(10_000),
    categories: z.array(CatalogCategoryShapeV1Schema).min(1).max(100),
  })
  .strict()
  .superRefine((shape, context) => {
    if (shape.minimumPreviewProductCount > shape.targetProductCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimumPreviewProductCount"],
        message: "Minimum preview count cannot exceed target product count.",
      });
    }

    const keys = new Set<string>();
    for (const [index, category] of shape.categories.entries()) {
      if (keys.has(category.key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories", index, "key"],
          message: `Duplicate category key: ${category.key}`,
        });
      }
      keys.add(category.key);
    }

    const allocated = shape.categories.reduce(
      (sum, category) => sum + category.targetProductCount,
      0
    );
    if (allocated !== shape.targetProductCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categories"],
        message:
          "Category target product counts must sum to the catalog target product count.",
      });
    }
  });

export type CatalogShapeV1 = z.infer<typeof CatalogShapeV1Schema>;

export const StoreBuildRequestV1Schema = z
  .object({
    version: z.literal(STORE_BUILD_REQUEST_V1),
    storeId: z.string().trim().min(1).max(128),
    requestKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._:-]*$/,
        "Request key contains unsupported characters."
      ),
    requestedBy: z.string().trim().min(1).max(200),
    brief: StoreBriefV1Schema,
    catalogShape: CatalogShapeV1Schema,
  })
  .strict();

export type StoreBuildRequestV1 = z.infer<typeof StoreBuildRequestV1Schema>;

export const CatalogBindingV1Schema = z
  .object({
    version: z.literal(CATALOG_BINDING_V1),
    artifactId: z.string().trim().min(1).max(180),
    artifactDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    artifactContractVersion: z.string().trim().min(1).max(120),
    projectionRef: z.string().trim().min(1).max(180),
    projectionDigest: digestSchema,
    projectionContractVersion: z.literal(CATALOG_PROJECTION_V2),
    sourceKind: z.enum(["REFERENCE_FIXTURE", "CATALOG_PROJECTION"]),
  })
  .strict();
export type CatalogBindingV1 = z.infer<typeof CatalogBindingV1Schema>;

export const StoreExperienceVariantV2Schema = z.enum(
  STORE_EXPERIENCE_VARIANTS_V2
);
export type StoreExperienceVariantV2 = z.infer<
  typeof StoreExperienceVariantV2Schema
>;

export const StoreBuildBaseRevisionV2Schema = z
  .object({
    revisionId: z.string().trim().min(1).max(128),
    outputDigest: digestSchema,
  })
  .strict();
export type StoreBuildBaseRevisionV2 = z.infer<
  typeof StoreBuildBaseRevisionV2Schema
>;

export const StoreBuildRequestV2Schema = z
  .object({
    version: z.literal(STORE_BUILD_REQUEST_V2),
    storeId: z.string().trim().min(1).max(128),
    requestedBy: z.string().trim().min(1).max(200),
    brief: StoreBriefV1Schema,
    catalogShape: CatalogShapeV1Schema,
    catalogBinding: CatalogBindingV1Schema,
    baseRevision: StoreBuildBaseRevisionV2Schema.nullable(),
    experienceVariant: StoreExperienceVariantV2Schema,
    runtimeCapabilityVersion: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.experienceVariant === "BASELINE" && request.baseRevision) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseRevision"],
        message: "A BASELINE build cannot bind a base revision.",
      });
    }
    if (request.experienceVariant === "REFINED" && !request.baseRevision) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseRevision"],
        message: "A REFINED build must bind the exact base revision and digest.",
      });
    }
  });
export type StoreBuildRequestV2 = z.infer<typeof StoreBuildRequestV2Schema>;

const StoreContentHomepageV1Schema = z
  .object({
    headline: StoreContentPlainTextV1Schema.pipe(z.string().max(140)),
    introduction: StoreContentPlainTextV1Schema.pipe(z.string().max(600)),
    seoTitle: StoreContentPlainTextV1Schema.pipe(z.string().max(70)),
    seoDescription: StoreContentPlainTextV1Schema.pipe(z.string().max(180)),
  })
  .strict();

const StoreContentTaxonomyEntryV1Schema = z
  .object({
    taxonomyNodeId: contentIdSchema,
    title: StoreContentPlainTextV1Schema.pipe(z.string().max(160)),
    introduction: StoreContentPlainTextV1Schema.pipe(z.string().max(800)),
  })
  .strict();

const StoreContentProductEntryV1Schema = z
  .object({
    productId: contentIdSchema,
    headline: StoreContentPlainTextV1Schema.pipe(z.string().max(160)),
    summary: StoreContentPlainTextV1Schema.pipe(z.string().max(800)),
  })
  .strict();

const StoreContentGuideSectionV1Schema = z
  .object({
    heading: StoreContentPlainTextV1Schema.pipe(z.string().max(160)),
    paragraphs: z
      .array(StoreContentPlainTextV1Schema.pipe(z.string().max(1_200)))
      .min(1)
      .max(20),
  })
  .strict();

const StoreContentGuideV1Schema = z
  .object({
    slug: contentSlugSchema,
    title: StoreContentPlainTextV1Schema.pipe(z.string().max(160)),
    summary: StoreContentPlainTextV1Schema.pipe(z.string().max(400)),
    sections: z.array(StoreContentGuideSectionV1Schema).min(1).max(20),
    relatedProductRefs: z.array(contentIdSchema).max(24),
  })
  .strict();

export const StoreContentProposalV1Schema = z
  .object({
    version: z.literal(STORE_CONTENT_PROPOSAL_V1),
    catalogProjectionRef: z.string().trim().min(1).max(180),
    homepage: StoreContentHomepageV1Schema,
    taxonomy: z.array(StoreContentTaxonomyEntryV1Schema).min(1).max(100),
    products: z.array(StoreContentProductEntryV1Schema).min(1).max(10_000),
    guides: z.array(StoreContentGuideV1Schema).max(100),
  })
  .strict()
  .superRefine((proposal, context) => {
    addDuplicateIssues(
      proposal.taxonomy.map((entry) => entry.taxonomyNodeId),
      ["taxonomy"],
      context
    );
    addDuplicateIssues(
      proposal.products.map((entry) => entry.productId),
      ["products"],
      context
    );
    addDuplicateIssues(
      proposal.guides.map((entry) => entry.slug),
      ["guides"],
      context
    );
    proposal.guides.forEach((guide, index) => {
      if (new Set(guide.relatedProductRefs).size !== guide.relatedProductRefs.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guides", index, "relatedProductRefs"],
          message: "Related product references must be unique",
        });
      }
    });
  });

export type StoreContentProposalV1 = z.infer<
  typeof StoreContentProposalV1Schema
>;

export const StoreRevisionCandidateV1Schema = z
  .object({
    version: z.literal(STORE_REVISION_CANDIDATE_V1),
    catalogProjection: CatalogProjectionV2Schema,
    experienceManifest: storeExperienceManifestV2Schema,
    contentProposal: StoreContentProposalV1Schema,
  })
  .strict();

export type StoreRevisionCandidateV1 = z.infer<
  typeof StoreRevisionCandidateV1Schema
>;

export const StoreRevisionContractVersionsV1Schema = z
  .object({
    version: z.literal(STORE_REVISION_CONTRACT_MAP_V1),
    buildRequest: z.literal(STORE_BUILD_REQUEST_V1),
    buildRun: z.literal(STORE_BUILD_RUN_V1),
    storeBrief: z.literal(STORE_BRIEF_V1),
    catalogShape: z.literal(CATALOG_SHAPE_V1),
    revisionCandidate: z.literal(STORE_REVISION_CANDIDATE_V1),
    catalogProjection: z.literal(CATALOG_PROJECTION_V2),
    experienceManifest: z.literal(STORE_EXPERIENCE_MANIFEST_V2),
    contentProposal: z.literal(STORE_CONTENT_PROPOSAL_V1),
    qaReport: z.literal(STORE_REVISION_QA_REPORT_V1),
    storeRevision: z.literal(STORE_REVISION_V1),
  })
  .strict();

export const STORE_REVISION_CONTRACT_VERSIONS_V1 = Object.freeze({
  version: STORE_REVISION_CONTRACT_MAP_V1,
  buildRequest: STORE_BUILD_REQUEST_V1,
  buildRun: STORE_BUILD_RUN_V1,
  storeBrief: STORE_BRIEF_V1,
  catalogShape: CATALOG_SHAPE_V1,
  revisionCandidate: STORE_REVISION_CANDIDATE_V1,
  catalogProjection: CATALOG_PROJECTION_V2,
  experienceManifest: STORE_EXPERIENCE_MANIFEST_V2,
  contentProposal: STORE_CONTENT_PROPOSAL_V1,
  qaReport: STORE_REVISION_QA_REPORT_V1,
  storeRevision: STORE_REVISION_V1,
} as const);

export type StoreRevisionContractVersionsV1 = z.infer<
  typeof StoreRevisionContractVersionsV1Schema
>;

export const StoreRevisionContractVersionsV2Schema = z
  .object({
    version: z.literal(STORE_REVISION_CONTRACT_MAP_V2),
    buildRequest: z.literal(STORE_BUILD_REQUEST_V2),
    buildRun: z.literal(STORE_BUILD_RUN_V2),
    storeBrief: z.literal(STORE_BRIEF_V1),
    catalogShape: z.literal(CATALOG_SHAPE_V1),
    catalogBinding: z.literal(CATALOG_BINDING_V1),
    revisionCandidate: z.literal(STORE_REVISION_CANDIDATE_V1),
    catalogProjection: z.literal(CATALOG_PROJECTION_V2),
    experienceManifest: z.literal(STORE_EXPERIENCE_MANIFEST_V2),
    contentProposal: z.literal(STORE_CONTENT_PROPOSAL_V1),
    qaReport: z.literal(STORE_REVISION_QA_REPORT_V1),
    storeRevision: z.literal(STORE_REVISION_V2),
  })
  .strict();

export const STORE_REVISION_CONTRACT_VERSIONS_V2 = Object.freeze({
  version: STORE_REVISION_CONTRACT_MAP_V2,
  buildRequest: STORE_BUILD_REQUEST_V2,
  buildRun: STORE_BUILD_RUN_V2,
  storeBrief: STORE_BRIEF_V1,
  catalogShape: CATALOG_SHAPE_V1,
  catalogBinding: CATALOG_BINDING_V1,
  revisionCandidate: STORE_REVISION_CANDIDATE_V1,
  catalogProjection: CATALOG_PROJECTION_V2,
  experienceManifest: STORE_EXPERIENCE_MANIFEST_V2,
  contentProposal: STORE_CONTENT_PROPOSAL_V1,
  qaReport: STORE_REVISION_QA_REPORT_V1,
  storeRevision: STORE_REVISION_V2,
} as const);

export type StoreRevisionContractVersionsV2 = z.infer<
  typeof StoreRevisionContractVersionsV2Schema
>;

export const StoreRevisionQaCheckV1Schema = z
  .object({
    id: z.enum(STORE_REVISION_QA_CHECK_IDS_V1),
    status: z.enum(["PASS", "FAIL"]),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).min(1).max(40),
  })
  .strict()
  .superRefine((check, context) => {
    if (new Set(check.reasonCodes).size !== check.reasonCodes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonCodes"],
        message: "QA check reason codes must be unique",
      });
    }
  });

export const StoreRevisionQaReportV1Schema = z
  .object({
    version: z.literal(STORE_REVISION_QA_REPORT_V1),
    status: z.enum(["PASS", "FAIL"]),
    artifactDigests: z
      .object({
        catalogProjection: digestSchema,
        experienceManifest: digestSchema,
        contentProposal: digestSchema,
      })
      .strict(),
    checks: z.array(StoreRevisionQaCheckV1Schema).length(
      STORE_REVISION_QA_CHECK_IDS_V1.length
    ),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).max(100),
  })
  .strict()
  .superRefine((report, context) => {
    const ids = report.checks.map((check) => check.id);
    if (
      ids.some((id, index) => id !== STORE_REVISION_QA_CHECK_IDS_V1[index])
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checks"],
        message: "QA checks must use the complete deterministic order",
      });
    }
    const expectedStatus = report.checks.every((check) => check.status === "PASS")
      ? "PASS"
      : "FAIL";
    if (report.status !== expectedStatus) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "QA report status must match its checks",
      });
    }
    const expectedReasonCodes = [
      ...new Set(
        report.checks.flatMap((check) =>
          check.status === "FAIL" ? check.reasonCodes : []
        )
      ),
    ].sort(compareCodeUnits);
    if (
      canonicalJsonV1(report.reasonCodes) !==
      canonicalJsonV1(expectedReasonCodes)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonCodes"],
        message: "QA report reason codes must equal its failed checks",
      });
    }
  });

export type StoreRevisionQaReportV1 = z.infer<
  typeof StoreRevisionQaReportV1Schema
>;
export type StoreRevisionQaCheckV1 = z.infer<
  typeof StoreRevisionQaCheckV1Schema
>;

const StoreRevisionDocumentBodyV1Schema = z
  .object({
    version: z.literal(STORE_REVISION_V1),
    inputDigest: digestSchema,
    contractVersions: StoreRevisionContractVersionsV1Schema,
    brief: StoreBriefV1Schema,
    catalogShape: CatalogShapeV1Schema,
    catalogProjection: CatalogProjectionV2Schema,
    experienceManifest: storeExperienceManifestV2Schema,
    contentProposal: StoreContentProposalV1Schema,
    qaReport: StoreRevisionQaReportV1Schema,
    activation: z
      .object({
        scope: z.literal("PREVIEW_ONLY"),
        liveAuthorized: z.literal(false),
        indexingAuthorized: z.literal(false),
      })
      .strict(),
  })
  .strict();

export type StoreRevisionDocumentBodyV1 = z.infer<
  typeof StoreRevisionDocumentBodyV1Schema
>;

export const StoreRevisionDocumentV1Schema = StoreRevisionDocumentBodyV1Schema
  .extend({ outputDigest: digestSchema })
  .strict()
  .superRefine((document, context) => {
    if (document.qaReport.status !== "PASS") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qaReport", "status"],
        message: "Only a deterministic QA PASS may become a revision",
      });
    }
    if (
      document.catalogProjection.projectionRef !==
        document.experienceManifest.catalogProjectionRef ||
      document.catalogProjection.projectionRef !==
        document.contentProposal.catalogProjectionRef
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["catalogProjection", "projectionRef"],
        message: "Revision artifacts must share one catalog projection reference",
      });
    }
    const digests = artifactDigestsV1({
      version: STORE_REVISION_CANDIDATE_V1,
      catalogProjection: document.catalogProjection,
      experienceManifest: document.experienceManifest,
      contentProposal: document.contentProposal,
    });
    if (canonicalJsonV1(digests) !== canonicalJsonV1(document.qaReport.artifactDigests)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qaReport", "artifactDigests"],
        message: "QA artifact digests do not match the persisted artifacts",
      });
    }
    if (
      document.outputDigest !==
      storeRevisionOutputDigestV1(storeRevisionDocumentBodyV1(document))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outputDigest"],
        message: "Revision output digest does not match its canonical artifact",
      });
    }
  });

export type StoreRevisionDocumentV1 = z.infer<
  typeof StoreRevisionDocumentV1Schema
>;

const StoreRevisionDocumentBodyV2Schema = z
  .object({
    version: z.literal(STORE_REVISION_V2),
    inputDigest: digestSchema,
    contractVersions: StoreRevisionContractVersionsV2Schema,
    brief: StoreBriefV1Schema,
    catalogShape: CatalogShapeV1Schema,
    catalogBinding: CatalogBindingV1Schema,
    baseRevision: StoreBuildBaseRevisionV2Schema.nullable(),
    experienceVariant: StoreExperienceVariantV2Schema,
    runtimeCapabilityVersion: z.string().trim().min(1).max(120),
    catalogProjection: CatalogProjectionV2Schema,
    experienceManifest: storeExperienceManifestV2Schema,
    contentProposal: StoreContentProposalV1Schema,
    qaReport: StoreRevisionQaReportV1Schema,
    activation: z
      .object({
        scope: z.literal("PREVIEW_ONLY"),
        liveAuthorized: z.literal(false),
        indexingAuthorized: z.literal(false),
      })
      .strict(),
  })
  .strict();

export type StoreRevisionDocumentBodyV2 = z.infer<
  typeof StoreRevisionDocumentBodyV2Schema
>;

export const StoreRevisionDocumentV2Schema = StoreRevisionDocumentBodyV2Schema
  .extend({ outputDigest: digestSchema })
  .strict()
  .superRefine((document, context) => {
    if (
      (document.experienceVariant === "BASELINE" && document.baseRevision) ||
      (document.experienceVariant === "REFINED" && !document.baseRevision)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseRevision"],
        message: "Revision base binding does not match its experience variant",
      });
    }
    if (document.qaReport.status !== "PASS") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qaReport", "status"],
        message: "Only a deterministic QA PASS may become a revision",
      });
    }
    const projectionDigest = digestCanonicalArtifactV1(
      document.catalogProjection
    );
    if (
      document.catalogBinding.projectionRef !==
        document.catalogProjection.projectionRef ||
      document.catalogBinding.projectionDigest !== projectionDigest ||
      document.catalogProjection.projectionRef !==
        document.experienceManifest.catalogProjectionRef ||
      document.catalogProjection.projectionRef !==
        document.contentProposal.catalogProjectionRef
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["catalogBinding"],
        message: "Catalog binding must match every persisted projection artifact",
      });
    }
    const digests = artifactDigestsV1({
      version: STORE_REVISION_CANDIDATE_V1,
      catalogProjection: document.catalogProjection,
      experienceManifest: document.experienceManifest,
      contentProposal: document.contentProposal,
    });
    if (canonicalJsonV1(digests) !== canonicalJsonV1(document.qaReport.artifactDigests)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qaReport", "artifactDigests"],
        message: "QA artifact digests do not match the persisted artifacts",
      });
    }
    if (
      document.outputDigest !==
      storeRevisionOutputDigestV2(storeRevisionDocumentBodyV2(document))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outputDigest"],
        message: "Revision output digest does not match its canonical artifact",
      });
    }
  });

export type StoreRevisionDocumentV2 = z.infer<
  typeof StoreRevisionDocumentV2Schema
>;

export const AnyStoreRevisionDocumentSchema = z.union([
  StoreRevisionDocumentV2Schema,
  StoreRevisionDocumentV1Schema,
]);
export type AnyStoreRevisionDocument = z.infer<
  typeof AnyStoreRevisionDocumentSchema
>;

export function storeRevisionDocumentBodyV2(
  document: StoreRevisionDocumentV2
): StoreRevisionDocumentBodyV2 {
  const { outputDigest: _outputDigest, ...body } = document;
  void _outputDigest;
  return StoreRevisionDocumentBodyV2Schema.parse(body);
}

export function storeRevisionDocumentBodyV1(
  document: StoreRevisionDocumentV1
): StoreRevisionDocumentBodyV1 {
  return StoreRevisionDocumentBodyV1Schema.parse({
    version: document.version,
    inputDigest: document.inputDigest,
    contractVersions: document.contractVersions,
    brief: document.brief,
    catalogShape: document.catalogShape,
    catalogProjection: document.catalogProjection,
    experienceManifest: document.experienceManifest,
    contentProposal: document.contentProposal,
    qaReport: document.qaReport,
    activation: document.activation,
  });
}

export const BuildPhaseV1Schema = z.enum([
  "RECEIVED",
  "VALIDATING",
  "ASSEMBLING_REVISION",
  "PERSISTING_REVISION",
  "COMPLETED",
]);
export type BuildPhaseV1 = z.infer<typeof BuildPhaseV1Schema>;

export const BuildTerminalStateV1Schema = z.enum([
  "SUCCEEDED",
  "PARTIAL_FAILURE",
  "FAILED",
  "CANCELLED",
]);
export type BuildTerminalStateV1 = z.infer<typeof BuildTerminalStateV1Schema>;

export const BuildRunStateV1Schema = z.union([
  z.literal("RUNNING"),
  BuildTerminalStateV1Schema,
]);
export type BuildRunStateV1 = z.infer<typeof BuildRunStateV1Schema>;

export const RevisionStatusV1Schema = z.enum([
  "DRAFT",
  "APPROVED",
  "REJECTED",
]);
export type RevisionStatusV1 = z.infer<typeof RevisionStatusV1Schema>;

export const StoreBuildEventTypeV1Schema = z.enum([
  "RUN_STARTED",
  "PHASE_ENTERED",
  "REVISION_CREATED",
  "RUN_SUCCEEDED",
  "RUN_FAILED",
  "REVISION_APPROVED",
  "REVISION_REJECTED",
  "PREVIEW_PROMOTED",
  "PREVIEW_ROLLED_BACK",
]);
export type StoreBuildEventTypeV1 = z.infer<
  typeof StoreBuildEventTypeV1Schema
>;

export interface StoreBuildRunV1 {
  contractVersion: typeof STORE_BUILD_RUN_V1;
  id: string;
  storeId: string;
  requestKey: string;
  inputDigest: string;
  outputDigest: string | null;
  requestedBy: string;
  /** Canonical, immutable StoreBriefV1 JSON persisted with the run. */
  briefJson: string;
  /** Canonical, immutable CatalogShapeV1 JSON persisted with the run. */
  catalogShapeJson: string;
  state: BuildRunStateV1;
  phase: BuildPhaseV1;
  revisionId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface StoreRevisionV1 {
  contractVersion: typeof STORE_REVISION_V1;
  id: string;
  storeId: string;
  buildRunId: string;
  revisionNumber: number;
  parentRevisionId: string | null;
  inputDigest: string;
  outputDigest: string;
  status: RevisionStatusV1;
  document: StoreRevisionDocumentV1;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
}

export interface StoreBuildRunV2 {
  contractVersion: typeof STORE_BUILD_RUN_V2;
  id: string;
  storeId: string;
  requestKey: string;
  inputDigest: string;
  outputDigest: string | null;
  requestedBy: string;
  requestJson: string;
  briefJson: string;
  catalogShapeJson: string;
  catalogArtifactId: string;
  catalogBindingJson: string;
  state: BuildRunStateV1;
  phase: BuildPhaseV1;
  revisionId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface StoreRevisionV2 {
  contractVersion: typeof STORE_REVISION_V2;
  id: string;
  storeId: string;
  buildRunId: string;
  revisionNumber: number;
  parentRevisionId: string | null;
  catalogArtifactId: string;
  catalogBinding: CatalogBindingV1;
  inputDigest: string;
  outputDigest: string;
  status: RevisionStatusV1;
  document: StoreRevisionDocumentV2;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
}

export interface StoreBuildEventV1 {
  contractVersion: typeof STORE_BUILD_EVENT_V1;
  id: string;
  buildRunId: string;
  sequence: number;
  phase: BuildPhaseV1;
  type: StoreBuildEventTypeV1;
  payload: Readonly<Record<string, unknown>>;
  createdAt: string;
}

export interface PreviewRevisionPointerV1 {
  contractVersion: typeof PREVIEW_REVISION_POINTER_V1;
  storeId: string;
  activeRevisionId: string | null;
  version: number;
  lastAction: "NONE" | "PROMOTE" | "ROLLBACK";
  changedBy: string | null;
  changeReason: string | null;
  updatedAt: string | null;
}

export interface PreviewOnlyMutationV1 {
  scope: "PREVIEW_ONLY";
  liveStatusChanged: false;
}

export const RevisionReviewRequestV1Schema = z
  .object({
    version: z.literal(REVISION_REVIEW_REQUEST_V1),
    storeId: z.string().trim().min(1).max(128),
    revisionId: z.string().trim().min(1).max(128),
    reviewedBy: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(1).max(2_000),
  })
  .strict();
export type RevisionReviewRequestV1 = z.infer<
  typeof RevisionReviewRequestV1Schema
>;

export const RevisionReviewRequestV2Schema = z
  .object({
    version: z.literal(REVISION_REVIEW_REQUEST_V2),
    storeId: z.string().trim().min(1).max(128),
    revisionId: z.string().trim().min(1).max(128),
    expectedOutputDigest: digestSchema,
    reviewedBy: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(1).max(2_000),
  })
  .strict();
export type RevisionReviewRequestV2 = z.infer<
  typeof RevisionReviewRequestV2Schema
>;

export const PreviewPointerMutationV1Schema = z
  .object({
    version: z.literal(PREVIEW_POINTER_MUTATION_V1),
    storeId: z.string().trim().min(1).max(128),
    targetRevisionId: z.string().trim().min(1).max(128),
    expectedPointerVersion: z.number().int().min(0),
    changedBy: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(1).max(2_000),
  })
  .strict();
export type PreviewPointerMutationV1 = z.infer<
  typeof PreviewPointerMutationV1Schema
>;

/** Stable JSON encoding used for request and immutable artifact digests. */
export function canonicalJsonV1(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function digestCanonicalArtifactV1(value: unknown): string {
  return sha256Hex(canonicalJsonV1(value));
}

export function storeBuildInputDigestV1(
  input: Pick<StoreBuildRequestV1, "version" | "storeId" | "brief" | "catalogShape">
): string {
  return digestCanonicalArtifactV1({
    version: input.version,
    storeId: input.storeId,
    brief: input.brief,
    catalogShape: input.catalogShape,
  });
}

export function storeBuildInputDigestV2(input: StoreBuildRequestV2): string {
  return digestCanonicalArtifactV1(StoreBuildRequestV2Schema.parse(input));
}

export function deriveStoreBuildRequestKeyV2(
  input: StoreBuildRequestV2
): string {
  return `sfv2:${storeBuildInputDigestV2(input)}`;
}

export function artifactDigestsV1(
  candidate: StoreRevisionCandidateV1
): StoreRevisionQaReportV1["artifactDigests"] {
  return {
    catalogProjection: digestCanonicalArtifactV1(candidate.catalogProjection),
    experienceManifest: digestCanonicalArtifactV1(candidate.experienceManifest),
    contentProposal: digestCanonicalArtifactV1(candidate.contentProposal),
  };
}

export function storeRevisionOutputDigestV1(
  body: StoreRevisionDocumentBodyV1
): string {
  return digestCanonicalArtifactV1(body);
}

export function storeRevisionOutputDigestV2(
  body: StoreRevisionDocumentBodyV2
): string {
  return digestCanonicalArtifactV1(body);
}

export function deterministicStoreFactoryIdV1(
  prefix: "sbr" | "srv" | "sbe",
  ...parts: Array<string | number>
): string {
  return `${prefix}_${sha256Hex(parts.join("\u001f")).slice(0, 40)}`;
}

export function createStoreRevisionDocumentV1(
  request: StoreBuildRequestV1,
  candidate: StoreRevisionCandidateV1,
  qaReport: StoreRevisionQaReportV1,
  inputDigest = storeBuildInputDigestV1(request)
): StoreRevisionDocumentV1 {
  const parsedRequest = StoreBuildRequestV1Schema.parse(request);
  const parsedCandidate = StoreRevisionCandidateV1Schema.parse(candidate);
  const parsedQaReport = StoreRevisionQaReportV1Schema.parse(qaReport);
  const body: StoreRevisionDocumentBodyV1 = {
    version: STORE_REVISION_V1,
    inputDigest,
    contractVersions: STORE_REVISION_CONTRACT_VERSIONS_V1,
    brief: parsedRequest.brief,
    catalogShape: parsedRequest.catalogShape,
    catalogProjection: parsedCandidate.catalogProjection,
    experienceManifest: parsedCandidate.experienceManifest,
    contentProposal: parsedCandidate.contentProposal,
    qaReport: parsedQaReport,
    activation: {
      scope: "PREVIEW_ONLY",
      liveAuthorized: false,
      indexingAuthorized: false,
    },
  };
  return StoreRevisionDocumentV1Schema.parse({
    ...body,
    outputDigest: storeRevisionOutputDigestV1(body),
  });
}

export function createStoreRevisionDocumentV2(
  request: StoreBuildRequestV2,
  candidate: StoreRevisionCandidateV1,
  qaReport: StoreRevisionQaReportV1,
  inputDigest = storeBuildInputDigestV2(request)
): StoreRevisionDocumentV2 {
  const parsedRequest = StoreBuildRequestV2Schema.parse(request);
  const parsedCandidate = StoreRevisionCandidateV1Schema.parse(candidate);
  const parsedQaReport = StoreRevisionQaReportV1Schema.parse(qaReport);
  const body: StoreRevisionDocumentBodyV2 = {
    version: STORE_REVISION_V2,
    inputDigest,
    contractVersions: STORE_REVISION_CONTRACT_VERSIONS_V2,
    brief: parsedRequest.brief,
    catalogShape: parsedRequest.catalogShape,
    catalogBinding: parsedRequest.catalogBinding,
    baseRevision: parsedRequest.baseRevision,
    experienceVariant: parsedRequest.experienceVariant,
    runtimeCapabilityVersion: parsedRequest.runtimeCapabilityVersion,
    catalogProjection: parsedCandidate.catalogProjection,
    experienceManifest: parsedCandidate.experienceManifest,
    contentProposal: parsedCandidate.contentProposal,
    qaReport: parsedQaReport,
    activation: {
      scope: "PREVIEW_ONLY",
      liveAuthorized: false,
      indexingAuthorized: false,
    },
  };
  return StoreRevisionDocumentV2Schema.parse({
    ...body,
    outputDigest: storeRevisionOutputDigestV2(body),
  });
}

function addDuplicateIssues(
  values: readonly string[],
  path: Array<string | number>,
  context: z.RefinementCtx
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, index],
        message: `Duplicate reference: ${value}`,
      });
    }
    seen.add(value);
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => compareCodeUnits(left, right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }
  return value;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
