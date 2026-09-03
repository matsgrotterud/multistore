import { z } from "zod";
import { digestStoreExperienceClientValueV2 } from "./client-digest";
import { StoreExperienceCatalogProjectionV2Schema } from "./catalog-context";
import { storeExperienceManifestV2Schema } from "./manifest";
import { validateStoreExperienceManifestV2 } from "./validation";

export const STORE_EXPERIENCE_RENDER_DOCUMENT_V2 =
  "store-experience-render-document.v2" as const;

const revisionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const digestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

const boundedText = (max: number) => z.string().trim().min(1).max(max);
const unsafePlainText =
  /[<>{}]|```|javascript\s*:|data\s*:\s*text\/html|on[a-z]+\s*=/i;
const plainTextSchema = z
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

/** Client-safe mirror of the versioned brief fields used by a revision. */
export const StoreExperienceRenderBriefV1Schema = z
  .object({
    version: z.literal("store-brief.v1"),
    name: boundedText(120),
    niche: boundedText(240),
    audience: boundedText(600),
    positioning: boundedText(1_200),
    valueProposition: boundedText(1_200),
    brandVoice: boundedText(600),
    locale: z
      .string()
      .trim()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
    currency: z.string().trim().regex(/^[A-Z]{3}$/),
  })
  .strict();

const contentHomepageSchema = z
  .object({
    headline: plainTextSchema.pipe(z.string().max(140)),
    introduction: plainTextSchema.pipe(z.string().max(600)),
    seoTitle: plainTextSchema.pipe(z.string().max(70)),
    seoDescription: plainTextSchema.pipe(z.string().max(180)),
  })
  .strict();
const contentTaxonomyEntrySchema = z
  .object({
    taxonomyNodeId: contentIdSchema,
    title: plainTextSchema.pipe(z.string().max(160)),
    introduction: plainTextSchema.pipe(z.string().max(800)),
  })
  .strict();
const contentProductEntrySchema = z
  .object({
    productId: contentIdSchema,
    headline: plainTextSchema.pipe(z.string().max(160)),
    summary: plainTextSchema.pipe(z.string().max(800)),
  })
  .strict();
const contentGuideSectionSchema = z
  .object({
    heading: plainTextSchema.pipe(z.string().max(160)),
    paragraphs: z
      .array(plainTextSchema.pipe(z.string().max(1_200)))
      .min(1)
      .max(20),
  })
  .strict();
const contentGuideSchema = z
  .object({
    slug: contentSlugSchema,
    title: plainTextSchema.pipe(z.string().max(160)),
    summary: plainTextSchema.pipe(z.string().max(400)),
    sections: z.array(contentGuideSectionSchema).min(1).max(20),
    relatedProductRefs: z.array(contentIdSchema).max(24),
  })
  .strict();

/** Client-safe mirror of revision-owned content; executable copy is refused. */
export const StoreExperienceRenderContentProposalV1Schema = z
  .object({
    version: z.literal("store-content-proposal.v1"),
    catalogProjectionRef: z.string().trim().min(1).max(180),
    homepage: contentHomepageSchema,
    taxonomy: z.array(contentTaxonomyEntrySchema).min(1).max(100),
    products: z.array(contentProductEntrySchema).min(1).max(10_000),
    guides: z.array(contentGuideSchema).max(100),
  })
  .strict()
  .superRefine((proposal, context) => {
    for (const [path, values] of [
      ["taxonomy", proposal.taxonomy.map((entry) => entry.taxonomyNodeId)],
      ["products", proposal.products.map((entry) => entry.productId)],
      ["guides", proposal.guides.map((entry) => entry.slug)],
    ] as const) {
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: `${path} must use unique stable references`,
        });
      }
    }
    proposal.guides.forEach((guide, index) => {
      if (
        new Set(guide.relatedProductRefs).size !==
        guide.relatedProductRefs.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guides", index, "relatedProductRefs"],
          message: "Related product references must be unique",
        });
      }
    });
  });

export const StoreExperiencePreviewActivationV2Schema = z
  .object({
    scope: z.literal("PREVIEW_ONLY"),
    liveAuthorized: z.literal(false),
    indexingAuthorized: z.literal(false),
  })
  .strict();

const StoreExperienceRenderDocumentV2BodySchema = z
  .object({
    version: z.literal(STORE_EXPERIENCE_RENDER_DOCUMENT_V2),
    revisionId: revisionIdSchema,
    brief: StoreExperienceRenderBriefV1Schema,
    catalog: StoreExperienceCatalogProjectionV2Schema,
    manifest: storeExperienceManifestV2Schema,
    contentProposal: StoreExperienceRenderContentProposalV1Schema,
    artifactDigests: z
      .object({
        catalog: digestSchema,
        manifest: digestSchema,
        contentProposal: digestSchema,
      })
      .strict(),
    activation: StoreExperiencePreviewActivationV2Schema,
  })
  .strict()
  .superRefine((document, context) => {
    for (const [key, value] of [
      ["catalog", document.catalog],
      ["manifest", document.manifest],
      ["contentProposal", document.contentProposal],
    ] as const) {
      if (
        document.artifactDigests[key] !==
        digestStoreExperienceClientValueV2(value)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["artifactDigests", key],
          message: `${key} digest does not attest the render artifact`,
        });
      }
    }

    const projectionRef = document.catalog.projectionRef;
    if (
      document.manifest.catalogProjectionRef !== projectionRef ||
      document.contentProposal.catalogProjectionRef !== projectionRef
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["catalog", "projectionRef"],
        message:
          "Catalog, manifest and content must share one projection reference",
      });
    }

    if (
      document.catalog.store.name !== document.brief.name ||
      document.catalog.store.niche !== document.brief.niche ||
      document.manifest.chrome.header.brandLabel !== document.brief.name
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["brief"],
        message:
          "Brief identity must match the rendered catalog and manifest brand",
      });
    }

    const productIds = new Set(
      document.catalog.products.map((product) => product.productId)
    );
    const categoryIds = new Set(
      document.catalog.categories.map((category) => category.categoryId)
    );
    const contentProductIds = new Set(
      document.contentProposal.products.map((product) => product.productId)
    );
    const contentCategoryIds = new Set(
      document.contentProposal.taxonomy.map(
        (category) => category.taxonomyNodeId
      )
    );

    const hasUnknownContentReference =
      document.contentProposal.products.some(
        (product) => !productIds.has(product.productId)
      ) ||
      document.contentProposal.taxonomy.some(
        (category) => !categoryIds.has(category.taxonomyNodeId)
      ) ||
      document.contentProposal.guides.some((guide) =>
        guide.relatedProductRefs.some((productId) => !productIds.has(productId))
      );
    const hasIncompleteContentCoverage =
      [...productIds].some((productId) => !contentProductIds.has(productId)) ||
      [...categoryIds].some(
        (categoryId) => !contentCategoryIds.has(categoryId)
      );

    if (hasUnknownContentReference || hasIncompleteContentCoverage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentProposal"],
        message:
          "Content references must exactly cover the rendered catalog graph",
      });
    }

    const manifestValidation = validateStoreExperienceManifestV2(
      document.manifest,
      document.catalog
    );
    if (!manifestValidation.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manifest"],
        message: `Manifest is not valid for the rendered catalog: ${manifestValidation.issues
          .map((issue) => `${issue.code}@${issue.path}`)
          .join(",")}`,
      });
    }
  });

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value as DeepReadonly<T>;
  }
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value as DeepReadonly<T>;
}

/**
 * A single immutable, renderer-ready preview snapshot. Parsing revalidates all
 * cross-artifact references; callers cannot combine independently valid but
 * unrelated revision artifacts.
 */
export const StoreExperienceRenderDocumentV2Schema =
  StoreExperienceRenderDocumentV2BodySchema.transform(
    (value): Readonly<z.infer<typeof StoreExperienceRenderDocumentV2BodySchema>> =>
      deepFreeze(value) as z.infer<
        typeof StoreExperienceRenderDocumentV2BodySchema
      >
  );

export type StoreExperienceRenderDocumentV2 = z.infer<
  typeof StoreExperienceRenderDocumentV2Schema
>;

export type StoreExperiencePreviewActivationV2 = z.infer<
  typeof StoreExperiencePreviewActivationV2Schema
>;
