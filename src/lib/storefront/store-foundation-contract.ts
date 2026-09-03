import { z } from "zod";
import { storefrontPresentationV1Schema } from "./presentation";

export const STORE_FOUNDATION_VERSION = "store-foundation.v1" as const;

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const evidenceRefSchema = z
  .string()
  .regex(/^(merchant-brief|store-state|platform-policy):[a-z0-9._-]+$/);

export const foundationBlockSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["HERO", "PRINCIPLE", "CATALOG_STATUS"]),
  title: z.string().trim().min(3).max(90),
  body: z.string().trim().min(20).max(420),
  evidenceKind: z.enum(["MERCHANT_BRIEF", "STORE_STATE", "PLATFORM_POLICY"]),
  evidenceRefs: z.array(evidenceRefSchema).min(1),
  state: z.enum(["READY_FOR_ADMIN_PREVIEW", "WAITING_FOR_CATALOG"]),
});

export const foundationTopicBriefSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(100),
  angle: z.string().trim().min(20).max(360),
  searchIntent: z.enum(["BRAND", "INFORMATIONAL", "COMMERCIAL_RESEARCH"]),
  evidenceRefs: z.array(evidenceRefSchema).min(1),
  state: z.enum(["READY_FOR_ADMIN_PREVIEW", "WAITING_FOR_CATALOG"]),
});

export const foundationAuditCheckSchema = z.object({
  id: z.enum([
    "FOUNDATION_INPUT_CURRENT",
    "FOUNDATION_COPY_GROUNDED",
    "NO_CATALOG_CLAIMS",
    "SEO_DRAFT_NOINDEX",
    "PRODUCT_TOPICS_WAITING",
    "PRESENTATION_VERSIONED",
    "TEXT_CONTRAST",
  ]),
  status: z.enum(["PASS", "REVIEW"]),
  detail: z.string().min(1),
});

export const storeFoundationAuditV1Schema = z.object({
  version: z.literal("store-foundation-audit.v1"),
  status: z.enum(["PASS", "REVIEW"]),
  checks: z.array(foundationAuditCheckSchema),
  blockedClaims: z.array(z.string()),
});

export const storeFoundationV1Schema = z.object({
  version: z.literal(STORE_FOUNDATION_VERSION),
  inputDigest: digestSchema,
  foundationDigest: digestSchema,
  identity: z.object({
    brandName: z.string().trim().min(1).max(90),
    logoText: z.string().trim().min(1).max(40),
    niche: z.string().trim().min(2).max(160),
    audience: z.string().trim().min(2).max(240),
    brandVoice: z.string().trim().min(2).max(240),
    locale: z.string().trim().min(2).max(20),
    country: z.string().trim().min(2).max(80),
  }),
  presentation: storefrontPresentationV1Schema,
  themeSnapshot: z.object({
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    textColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  homepage: z.object({
    hero: foundationBlockSchema,
    principles: z.array(foundationBlockSchema).min(3).max(5),
    catalogStatus: foundationBlockSchema,
  }),
  seoDraft: z.object({
    status: z.literal("DRAFT_NOINDEX"),
    title: z.string().trim().min(10).max(70),
    description: z.string().trim().min(40).max(170),
    topicBriefs: z.array(foundationTopicBriefSchema).min(3).max(8),
  }),
  audit: storeFoundationAuditV1Schema,
});

export type FoundationBlockV1 = z.infer<typeof foundationBlockSchema>;
export type FoundationTopicBriefV1 = z.infer<typeof foundationTopicBriefSchema>;
export type StoreFoundationAuditV1 = z.infer<typeof storeFoundationAuditV1Schema>;
export type StoreFoundationV1 = z.infer<typeof storeFoundationV1Schema>;

export interface StoreFoundationOverrides {
  heroTitle?: string;
  heroBody?: string;
  seoTitle?: string;
  seoDescription?: string;
}
