import type { STORE_EXPERIENCE_CLAIMS_V2 } from "./manifest";

export type StoreExperienceClaimV2 =
  (typeof STORE_EXPERIENCE_CLAIMS_V2)[number];

export const STORE_EXPERIENCE_VALIDATION_CODES_V2 = [
  "SCHEMA_INVALID",
  "CATALOG_PROJECTION_MISMATCH",
  "DUPLICATE_BLOCK_ID",
  "REQUIRED_BLOCK_MISSING",
  "REQUIRED_BLOCK_DUPLICATED",
  "FEATURE_BLOCK_DISABLED",
  "FEATURE_BLOCK_MISSING",
  "UNKNOWN_PRODUCT_REF",
  "RIBBON_PRODUCT_NOT_IN_BLOCK",
  "UNKNOWN_CATEGORY_REF",
  "UNVERIFIED_CLAIM",
  "UNSAFE_CLAIM_COPY",
  "INSUFFICIENT_CONTRAST",
] as const;

export type StoreExperienceValidationCodeV2 =
  (typeof STORE_EXPERIENCE_VALIDATION_CODES_V2)[number];

export interface StoreExperienceValidationIssueV2 {
  code: StoreExperienceValidationCodeV2;
  path: string;
  message: string;
}
