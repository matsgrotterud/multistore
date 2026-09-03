import {
  EVALUATOR_VERSION,
  GENERATION_RESULT_VERSION,
  INTENT_VERSION,
  ONTOLOGY_VERSION,
  POLICY_VERSION,
  QUERY_PLAN_VERSION,
  type CandidateEvaluationV1,
  type CandidateEvidenceInputV1,
  type CandidateQualityFactsV1,
  type ClassQueryPlanV1,
  type EvaluationGateV1,
  type GenerationEvidenceV1,
  type GenerationResultV1,
  type NicheIntentV1,
  type PolicyOutcomeV1,
  type ProductClassProfileV1,
} from "./contracts";
import {
  profileFromStaticOntologyV1,
  proposeRuntimeProductClassV1,
  resolveNicheIntentFromProfileV1,
  validateRuntimeProductClassProfileV1,
} from "./class-profile";
import { PRODUCT_ONTOLOGY_V1 } from "./ontology";

const MERCHANDISING_ONLY = ["premium", "featured", "everyday", "pick", "picks", "accessory", "accessories", "fluffy", "warm"];

function normalize(value: string): string {
  return value.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function hasPhrase(text: string, phrase: string): boolean {
  const haystack = ` ${normalize(text)} `;
  const needle = ` ${normalize(phrase)} `;
  return haystack.includes(needle);
}

function classSpecificExcludedConcept(input: {
  productClass: string | null;
  title: string;
  description: string;
  providerCategoryPath: string;
}): { className: string; concept: string } | null {
  if (input.productClass !== "electronics.camera-drones") return null;
  const title = normalize(input.title);
  const category = normalize(input.providerCategoryPath);
  if (
    /\b(?:drone|quadcopter) (?:accessories|parts|components)\b/.test(category) ||
    /\b(?:accessories|parts|components) (?:for )?(?:camera )?(?:drone|quadcopter)s?\b/.test(category)
  ) {
    return { className: "drone-accessories", concept: "drone accessories" };
  }

  const accessory =
    "(?:batter(?:y|ies)|chargers?|propellers?|carry(?:ing)? cases?|protective cases?|storage cases?|bags?|landing pads?|controllers?|replacement arms?|motors?|goggles?|filters?|mounts?|cables?|charging hubs?)";
  const drone = "(?:camera )?(?:drones?|quadcopters?)";
  const accessoryInTitle = title.match(new RegExp(`\\b${accessory}\\b`));
  const droneInTitle = new RegExp(`\\b${drone}\\b`).test(title);
  const droneInSupportingEvidence = new RegExp(`\\b${drone}\\b`).test(
    normalize(`${input.description} ${input.providerCategoryPath}`)
  );
  if (accessoryInTitle && !droneInTitle && droneInSupportingEvidence) {
    return {
      className: "drone-accessories",
      concept: accessoryInTitle[0],
    };
  }
  const patterns = [
    new RegExp(
      `\\b${accessory}\\b(?: \\w+){0,8} (?:for|compatible with|designed for|replacement for)(?: \\w+){0,8} \\b${drone}\\b`
    ),
    new RegExp(
      `\\b(?:replacement|spare|protective|carry|carrying|storage|charging)\\b(?: \\w+){0,4} \\b${accessory}\\b(?: \\w+){0,10} \\b${drone}\\b`
    ),
    new RegExp(
      `\\b${drone}\\b (?:replacement |spare |intelligent flight |flight |charging )?${accessory}\\b`
    ),
  ];
  const match = patterns.map((pattern) => title.match(pattern)).find(Boolean);
  return match
    ? { className: "drone-accessories", concept: match[0] }
    : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function pass(explanation: string, evidence: EvaluationGateV1["evidence"] = []): EvaluationGateV1 {
  return { state: "PASS", reasonCodes: [], explanation, evidence };
}

function gate(
  state: EvaluationGateV1["state"],
  reason: string,
  explanation: string,
  evidence: EvaluationGateV1["evidence"] = []
): EvaluationGateV1 {
  return { state, reasonCodes: [reason], explanation, evidence };
}

export function resolveNicheIntentV1(
  input: unknown,
  confirmedRuntimeProfile?: ProductClassProfileV1
): NicheIntentV1 {
  const object = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const niche = typeof object.niche === "string" ? object.niche.trim() : "";
  const endUser = typeof object.endUser === "string" ? object.endUser.trim() : "";
  const normalizedNiche = normalize(`${niche} ${endUser}`);
  const matches = PRODUCT_ONTOLOGY_V1.filter((entry) =>
    entry.nichePatterns.some((pattern) => pattern.test(normalizedNiche))
  );
  const entry = matches.length === 1 ? matches[0] : null;
  if (entry) {
    return resolveNicheIntentFromProfileV1(
      input,
      profileFromStaticOntologyV1(entry)
    );
  }

  const runtimeProposal = entry ? null : proposeRuntimeProductClassV1(input);
  const runtimeProfile = validateRuntimeProductClassProfileV1(
    input,
    confirmedRuntimeProfile
  );
  if (runtimeProfile) {
    return resolveNicheIntentFromProfileV1(input, runtimeProfile);
  }

  const blockedProposal =
    runtimeProposal?.status === "BLOCKED" ? runtimeProposal : null;
  const excludedConcepts = Array.isArray(object.negativeKeywords)
    ? object.negativeKeywords
        .filter((value): value is string => typeof value === "string")
        .map(normalize)
    : [];

  return {
    version: INTENT_VERSION,
    classifierVersion: ONTOLOGY_VERSION,
    normalizedNiche,
    productClass: null,
    headNoun: null,
    requiredClassConcepts: [],
    qualifiers: [],
    allowedAdjacentClasses: [],
    excludedProductClasses: [],
    excludedClassRules: [],
    excludedConcepts: unique(excludedConcepts),
    targetEndUser: endUser || null,
    riskFlags: blockedProposal?.riskFlags ?? ["UNKNOWN_PRODUCT_CLASS"],
    policyDecision: blockedProposal ? "BLOCK" : "MANUAL_REVIEW_REQUIRED",
    confidence: blockedProposal ? 1 : 0,
    evidence: [],
    reasonCodes: blockedProposal
      ? unique(["POLICY_PRODUCT_CLASS_BLOCKED", ...blockedProposal.reasonCodes])
      : unique([
          "INSUFFICIENT_INTENT_EVIDENCE",
          ...(runtimeProposal?.reasonCodes ?? []),
        ]),
    liveCommerceAllowed: false,
    autonomousLaunchAllowed: false,
  };
}

export function buildClassQueryPlanV1(intent: NicheIntentV1): ClassQueryPlanV1 {
  if (
    intent.policyDecision === "BLOCK" ||
    !intent.productClass ||
    intent.confidence < 0.8 ||
    intent.requiredClassConcepts.length === 0
  ) {
    return {
      version: QUERY_PLAN_VERSION,
      productClass: intent.productClass ?? "unknown",
      queries: [],
      forbiddenMerchandisingOnlyTerms: MERCHANDISING_ONLY,
    };
  }
  const base = intent.requiredClassConcepts.filter((concept) => concept.split(" ").length > 1).slice(0, 5);
  const qualified = intent.qualifiers.flatMap((qualifier) =>
    base.slice(0, 2).map((concept) => ({ query: `${qualifier} ${concept}`, classConcept: concept, qualifier }))
  );
  return {
    version: QUERY_PLAN_VERSION,
    productClass: intent.productClass,
    queries: [...qualified, ...base.map((concept) => ({ query: concept, classConcept: concept }))]
      .filter((entry, index, all) => all.findIndex((candidate) => candidate.query === entry.query) === index)
      .slice(0, 8),
    forbiddenMerchandisingOnlyTerms: MERCHANDISING_ONLY,
  };
}

export function evaluateCandidateV1(
  intent: NicheIntentV1,
  rawInput: unknown
): CandidateEvaluationV1 {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as CandidateEvidenceInputV1;
  const title = typeof input.title === "string" ? input.title : "";
  const description = typeof input.description === "string" ? input.description : "";
  const providerCategoryPath = typeof input.providerCategoryPath === "string" ? input.providerCategoryPath : "";
  const specs = Array.isArray(input.specs) ? input.specs : [];
  const variants = Array.isArray(input.variants) ? input.variants : [];
  const fields = [
    { field: "title" as const, value: title },
    { field: "description" as const, value: description },
    { field: "providerCategoryPath" as const, value: providerCategoryPath },
    ...specs.map((spec) => ({ field: "specs" as const, value: `${spec.label}: ${spec.value}` })),
    ...variants.map((variant) => ({ field: "variants" as const, value: `${variant.title ?? ""} ${variant.optionSummary ?? ""}`.trim() })),
  ].filter((field) => field.value.trim());
  const evidenceText = fields.map((field) => field.value).join(" ");
  let relevance: EvaluationGateV1;

  if (
    !intent.productClass ||
    intent.confidence < 0.8 ||
    intent.requiredClassConcepts.length === 0
  ) {
    relevance = gate("UNKNOWN", "RELEVANCE_INTENT_UNKNOWN", "Product class is not known with enough confidence.");
  } else {
    const explicitExclusion = intent.excludedConcepts.find((concept) =>
      hasPhrase(evidenceText, concept)
    );
    const classSpecificExclusion = classSpecificExcludedConcept({
      productClass: intent.productClass,
      title,
      description,
      providerCategoryPath,
    });
    const mismatch = classSpecificExclusion
      ? {
          className: classSpecificExclusion.className,
          concepts: [classSpecificExclusion.concept],
        }
      : intent.excludedClassRules.find((excluded) =>
          excluded.concepts.some((concept) => hasPhrase(evidenceText, concept))
        );
    const matched = fields.filter((field) =>
      intent.requiredClassConcepts.some((concept) => hasPhrase(field.value, concept))
    );
    if (explicitExclusion) {
      relevance = gate(
        "FAIL",
        `RELEVANCE_EXPLICIT_EXCLUSION:${explicitExclusion}`,
        `Supplier evidence matches the explicit exclusion ${explicitExclusion}.`,
        fields.filter((field) => hasPhrase(field.value, explicitExclusion))
      );
    } else if (mismatch) {
      relevance = gate(
        "FAIL",
        `RELEVANCE_CLASS_MISMATCH:${mismatch.className}`,
        `Supplier evidence matches excluded product class ${mismatch.className}.`,
        fields.filter((field) => mismatch.concepts.some((concept) => hasPhrase(field.value, concept)))
      );
    } else if (matched.length === 0) {
      relevance = gate(
        "FAIL",
        "RELEVANCE_REQUIRED_CLASS_MISSING",
        "No required product-class concept exists in supplier evidence."
      );
    } else {
      relevance = pass("Supplier evidence contains the required product class.", matched);
    }
  }

  const policy = intent.policyDecision === "BLOCK"
    ? gate(
        "FAIL",
        "POLICY_PRODUCT_CLASS_BLOCKED",
        "Product-class policy blocks catalog preview and live commerce."
      )
    : intent.policyDecision === "ALLOW"
      ? pass("Intent policy permits catalog evaluation.")
      : intent.productClass
        ? gate("REVIEW", "POLICY_MANUAL_REVIEW_REQUIRED", "This product class requires merchant review.")
        : gate("UNKNOWN", "POLICY_PRODUCT_CLASS_UNKNOWN", "Policy cannot be decided for an unknown product class.");
  const supplierEvidence = input.providerKey && input.externalId
    ? pass("Provider and external identity are present.")
    : gate("UNKNOWN", "SUPPLIER_PROVENANCE_INCOMPLETE", "Provider identity is incomplete.");
  const mediaReadiness = (input.usableStoredMediaCount ?? 0) > 0
    ? pass("At least one usable stored media asset exists.")
    : gate("FAIL", "MEDIA_STORED_USABLE_MISSING", "No usable, durably stored product image exists.");
  const variantReadiness = input.variantIdentityReady === false
    ? gate("FAIL", "VARIANT_IDENTITY_INVALID", "Required variant identity is missing.")
    : input.variantIdentityReady === true
      ? pass("Variant identity is ready.")
      : gate("UNKNOWN", "VARIANT_READINESS_UNKNOWN", "Variant readiness has not been verified.");
  const priceMargin = input.price != null && input.price > 0 && input.marginPercent != null
    ? pass("Price and margin evidence are present.")
    : gate("UNKNOWN", "PRICE_MARGIN_UNKNOWN", "Price or margin evidence is missing.");
  const shipping = input.shippingDaysMax != null && input.shippingDaysMax > 0
    ? pass("Shipping estimate is present.")
    : gate("UNKNOWN", "SHIPPING_UNKNOWN", "Shipping estimate is missing.");
  const riskIp = input.riskVeto
    ? gate("FAIL", "RISK_HARD_VETO", "A hard risk veto is present.")
    : pass("No hard risk veto was supplied.");
  const grounded = input.groundedContentReady === true;
  const previewPass = relevance.state === "PASS" && policy.state !== "FAIL" && mediaReadiness.state === "PASS" && supplierEvidence.state === "PASS" && riskIp.state === "PASS" && grounded;
  const previewVisibility = previewPass
    ? pass("All hard preview gates pass.")
    : gate("FAIL", "PREVIEW_HARD_GATE_FAILED", "One or more hard preview gates did not pass.");
  const livePass = previewPass && policy.state === "PASS" && variantReadiness.state === "PASS" && priceMargin.state === "PASS" && shipping.state === "PASS" && intent.liveCommerceAllowed;
  const liveCommerceEligibility = livePass
    ? pass("All candidate live-commerce gates pass.")
    : gate("FAIL", "LIVE_COMMERCE_GATE_FAILED", "Live-commerce evidence is incomplete or policy-blocked.");

  return {
    version: EVALUATOR_VERSION,
    evaluatedAt: new Date().toISOString(),
    intentVersion: INTENT_VERSION,
    productClass: intent.productClass,
    relevance,
    policy,
    supplierEvidence,
    mediaReadiness,
    variantReadiness,
    priceMargin,
    shipping,
    riskIp,
    previewVisibility,
    liveCommerceEligibility,
  };
}

export function decideCandidatePolicyV1(
  evaluation: CandidateEvaluationV1,
  quality: CandidateQualityFactsV1
): PolicyOutcomeV1 {
  const reasons: string[] = [];
  if (!quality.relevant || evaluation.relevance.state !== "PASS") reasons.push("RELEVANCE_NOT_PASS");
  if (
    evaluation.policy.state === "FAIL" ||
    quality.policyGate === "FAIL" ||
    quality.hardRiskVeto
  ) {
    reasons.push("POLICY_OR_RISK_VETO");
  }
  if (!quality.supplierProvenanceReady) reasons.push("SUPPLIER_PROVENANCE_MISSING");
  if (quality.usableStoredMediaCount < 1) reasons.push("MEDIA_STORED_USABLE_MISSING");
  if (!quality.variantIdentityReady) reasons.push("VARIANT_IDENTITY_NOT_READY");
  if (!quality.groundedContentReady) reasons.push("GROUNDED_CONTENT_NOT_READY");
  const hardBlocked = reasons.length > 0;
  return {
    version: POLICY_VERSION,
    decision: hardBlocked ? "BLOCK" : evaluation.policy.state === "REVIEW" ? "REVIEW" : "ALLOW",
    reasonCodes: reasons,
    previewVisible: !hardBlocked,
    liveCommerceAllowed: !hardBlocked && evaluation.liveCommerceEligibility.state === "PASS",
    autonomousLaunchAllowed: !hardBlocked && evaluation.policy.state === "PASS" && evaluation.liveCommerceEligibility.state === "PASS",
  };
}

export function decideGenerationPolicyV1(evidence: GenerationEvidenceV1): PolicyOutcomeV1 {
  const result = buildGenerationResultV1(evidence);
  return {
    version: POLICY_VERSION,
    decision: result.status === "READY_FOR_PREVIEW" ? "ALLOW" : result.status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW" ? "REVIEW" : "BLOCK",
    reasonCodes: result.reasonCodes,
    previewVisible: result.previewReady,
    liveCommerceAllowed: result.liveCommerceAllowed,
    autonomousLaunchAllowed: result.status === "READY_FOR_PREVIEW" && evidence.intent.autonomousLaunchAllowed,
  };
}

export function buildGenerationResultV1(input: GenerationEvidenceV1): GenerationResultV1 {
  let status: GenerationResultV1["status"];
  const reasons: string[] = [];
  if (input.cancelled) status = "CANCELLED";
  else if (input.validationFailed) status = "VALIDATION_FAILED";
  else if (input.intent.policyDecision === "BLOCK") status = "POLICY_BLOCKED";
  else if (!input.intent.productClass || input.intent.confidence < 0.8) status = "INSUFFICIENT_INTENT_EVIDENCE";
  else if (input.providerFailed) status = "PROVIDER_FAILED";
  else if (input.importedProducts > input.importBudget) status = "VALIDATION_FAILED";
  else if (input.relevantProducts < input.minimumProducts || input.previewVisibleProducts < input.minimumProducts) status = "INSUFFICIENT_RELEVANT_PRODUCTS";
  else if (input.intent.policyDecision === "MANUAL_REVIEW_REQUIRED") status = "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW";
  else status = "READY_FOR_PREVIEW";
  if (status !== "READY_FOR_PREVIEW" && status !== "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW") reasons.push(status);
  if (status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW") reasons.push("MANUAL_REVIEW_REQUIRED");
  return {
    version: GENERATION_RESULT_VERSION,
    status,
    previewReady: status === "READY_FOR_PREVIEW" || status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    manualReviewRequired: status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    liveCommerceAllowed: status === "READY_FOR_PREVIEW" && input.intent.liveCommerceAllowed,
    reasonCodes: reasons,
    counts: {
      minimumProducts: input.minimumProducts,
      relevantProducts: input.relevantProducts,
      previewVisibleProducts: input.previewVisibleProducts,
      importedProducts: input.importedProducts,
      importBudget: input.importBudget,
    },
  };
}
