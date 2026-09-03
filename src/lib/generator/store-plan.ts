import type { GuardrailReport } from "@/lib/ai/content-guardrails";
import type { StoreBlueprint, StoreBlueprintInput } from "@/lib/ai/types";
import {
  INTENT_VERSION,
  PRODUCT_CLASS_PROFILE_VERSION,
  QUERY_PLAN_VERSION,
  type ClassQueryPlanV1,
  type NicheIntentV1,
  type ProductClassProfileV1,
} from "@/lib/generator-v3/contracts";
import {
  fingerprintGeneratorRequest,
  signGeneratorPayload,
  verifyGeneratorPayload,
} from "@/lib/generator/signed-plan-token";

export const STORE_PLAN_VERSION = "store-plan.v1" as const;
const CLASS_PROPOSAL_KIND = "PRODUCT_CLASS_PROPOSAL_V1";
const APPROVED_PLAN_KIND = "APPROVED_STORE_PLAN_V1";

export interface ProductClassProposalTokenPayloadV1 {
  version: typeof STORE_PLAN_VERSION;
  input: StoreBlueprintInput;
  classProfile: ProductClassProfileV1;
}

export interface ApprovedStorePlanV1 {
  version: typeof STORE_PLAN_VERSION;
  input: StoreBlueprintInput;
  classProfile: ProductClassProfileV1;
  intent: NicheIntentV1;
  queryPlan: ClassQueryPlanV1;
  blueprint: StoreBlueprint;
  guardrails: GuardrailReport;
  planDigest: string;
}

type TokenOptions = Parameters<typeof signGeneratorPayload>[2];

function planIdentity(
  value: Omit<ApprovedStorePlanV1, "planDigest">
): string {
  return fingerprintGeneratorRequest(value);
}

export function issueProductClassProposalToken(
  input: StoreBlueprintInput,
  classProfile: ProductClassProfileV1,
  options?: TokenOptions
): string {
  if (
    classProfile.version !== PRODUCT_CLASS_PROFILE_VERSION ||
    classProfile.source !== "RUNTIME_PROVISIONAL" ||
    !classProfile.requiresAdminConfirmation ||
    classProfile.policyDecision !== "MANUAL_REVIEW_REQUIRED" ||
    classProfile.liveCommerceAllowed ||
    classProfile.autonomousLaunchAllowed
  ) {
    throw new Error("Only a server-owned provisional preview class can be proposed.");
  }
  return signGeneratorPayload<ProductClassProposalTokenPayloadV1>(
    CLASS_PROPOSAL_KIND,
    { version: STORE_PLAN_VERSION, input, classProfile },
    options
  );
}

export function verifyProductClassProposalToken(
  token: string,
  options?: TokenOptions
): ProductClassProposalTokenPayloadV1 {
  const payload = verifyGeneratorPayload<ProductClassProposalTokenPayloadV1>(
    token,
    CLASS_PROPOSAL_KIND,
    options
  );
  if (
    payload?.version !== STORE_PLAN_VERSION ||
    typeof payload.input?.niche !== "string" ||
    payload.classProfile?.version !== PRODUCT_CLASS_PROFILE_VERSION ||
    payload.classProfile.source !== "RUNTIME_PROVISIONAL" ||
    !payload.classProfile.requiresAdminConfirmation ||
    payload.classProfile.policyDecision !== "MANUAL_REVIEW_REQUIRED" ||
    payload.classProfile.liveCommerceAllowed ||
    payload.classProfile.autonomousLaunchAllowed
  ) {
    throw new Error("Product-class proposal token contains an invalid policy profile.");
  }
  return payload;
}

export function issueApprovedStorePlanToken(
  value: Omit<ApprovedStorePlanV1, "planDigest">,
  options?: TokenOptions
): { token: string; plan: ApprovedStorePlanV1 } {
  const plan: ApprovedStorePlanV1 = {
    ...value,
    planDigest: planIdentity(value),
  };
  return {
    token: signGeneratorPayload(APPROVED_PLAN_KIND, plan, options),
    plan,
  };
}

export function verifyApprovedStorePlanToken(
  token: string,
  options?: TokenOptions
): ApprovedStorePlanV1 {
  const plan = verifyGeneratorPayload<ApprovedStorePlanV1>(
    token,
    APPROVED_PLAN_KIND,
    options
  );
  const { planDigest, ...identity } = plan ?? ({} as ApprovedStorePlanV1);
  if (
    plan?.version !== STORE_PLAN_VERSION ||
    plan.classProfile?.version !== PRODUCT_CLASS_PROFILE_VERSION ||
    plan.intent?.version !== INTENT_VERSION ||
    plan.queryPlan?.version !== QUERY_PLAN_VERSION ||
    typeof plan.blueprint?.brandName !== "string" ||
    !Array.isArray(plan.blueprint?.categories) ||
    plan.blueprint.categories.length !== 1 ||
    !Array.isArray(plan.queryPlan?.queries) ||
    plan.queryPlan.queries.length < 1 ||
    plan.guardrails?.passed !== true ||
    plan.intent.productClass !== plan.classProfile.productClass ||
    plan.queryPlan.productClass !== plan.classProfile.productClass ||
    plan.blueprint.categories[0]?.slug !== plan.classProfile.category.slug ||
    plan.classProfile.policyDecision === "BLOCK" ||
    plan.classProfile.liveCommerceAllowed !== plan.intent.liveCommerceAllowed ||
    plan.classProfile.autonomousLaunchAllowed !== plan.intent.autonomousLaunchAllowed ||
    planDigest !== planIdentity(identity)
  ) {
    throw new Error("Approved store plan is invalid or no longer internally consistent.");
  }
  return plan;
}

export function executionRequestFingerprint(input: {
  planDigest: string;
  importProducts: boolean;
  autoPublishScored: boolean;
  providerMode: "CONFIGURED" | "SYNTHETIC_DEMO" | "FOUNDATION_ONLY";
  providerKeys: string[];
}): string {
  return fingerprintGeneratorRequest(input);
}
