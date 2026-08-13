import type { ZodError } from "zod";
import { auditEvidenceListSchema, gatePolicySchema } from "./policy-schema";
import type {
  AuditEvidence,
  GateEvaluation,
  GatePolicy,
  GatePredicate,
  GateReason,
  GateRule,
  GateRuleEvaluation,
  PredicateValue,
  RuleStatus,
} from "./types";

interface PredicateEvaluation {
  matched: boolean;
  reasons: GateReason[];
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; messages: string[] };

/**
 * Evaluate a policy without I/O, time reads or mutation.
 *
 * Malformed policy/evidence is converted to a stable BLOCKED result rather
 * than thrown. A HARD rule passes only with PASS + VERIFIED evidence and a
 * matching predicate.
 */
export function evaluateGate(policyInput: unknown, evidenceInput: unknown): GateEvaluation {
  const policyResult = parsePolicy(policyInput);
  const evidenceResult = parseEvidence(evidenceInput);

  if (!policyResult.success || !evidenceResult.success) {
    return invalidInputEvaluation(
      policyInput,
      policyResult.success ? null : policyResult.messages,
      evidenceResult.success ? null : evidenceResult.messages
    );
  }

  const evidenceByKey = new Map(
    evidenceResult.data.map((evidence) => [evidence.key, evidence] as const)
  );
  const rules = policyResult.data.rules
    .map((rule) => evaluateRule(rule, evidenceByKey))
    .sort(compareRuleEvaluations);

  return buildEvaluation(policyResult.data, rules);
}

function evaluateRule(
  rule: GateRule,
  evidenceByKey: ReadonlyMap<string, AuditEvidence>
): GateRuleEvaluation {
  const evidenceKeys = collectEvidenceKeys(rule.predicate);
  const reasons: GateReason[] = [];
  const usableEvidence: AuditEvidence[] = [];
  const unusableStatuses: RuleStatus[] = [];

  for (const key of evidenceKeys) {
    const evidence = evidenceByKey.get(key);
    if (!evidence) {
      unusableStatuses.push("UNKNOWN");
      reasons.push({
        code: "EVIDENCE_MISSING",
        evidenceKey: key,
        message: `Required evidence '${key}' is missing.`,
      });
      continue;
    }

    if (evidence.state !== "PASS") {
      unusableStatuses.push(evidence.state);
      reasons.push(reasonForEvidenceState(evidence));
      continue;
    }

    usableEvidence.push(evidence);
  }

  if (unusableStatuses.length > 0) {
    return {
      ruleId: rule.id,
      level: rule.level,
      status: strongestUnusableStatus(unusableStatuses),
      predicateMatched: null,
      evidenceKeys,
      reasons: sortReasons(reasons),
    };
  }

  const predicate = evaluatePredicate(rule.predicate, evidenceByKey);
  reasons.push(...predicate.reasons);

  const inferred = usableEvidence.filter((evidence) => evidence.provenance === "AI_INFERRED");
  for (const evidence of inferred) {
    reasons.push({
      code: "AI_INFERRED_EVIDENCE",
      evidenceKey: evidence.key,
      message:
        rule.level === "HARD"
          ? `AI-inferred evidence '${evidence.key}' cannot satisfy a HARD rule.`
          : `Advisory rule uses AI-inferred evidence '${evidence.key}'.`,
    });
  }

  let status: RuleStatus;
  if (predicate.reasons.some((reason) => reason.code === "PREDICATE_TYPE_MISMATCH")) {
    status = "FAIL";
  } else if (!predicate.matched) {
    status = "FAIL";
    reasons.push({
      code: "PREDICATE_FALSE",
      message: `Predicate for rule '${rule.id}' did not match.`,
    });
  } else if (inferred.length > 0) {
    status = "AI_INFERRED";
  } else {
    status = "PASS";
  }

  return {
    ruleId: rule.id,
    level: rule.level,
    status,
    predicateMatched: predicate.matched,
    evidenceKeys,
    reasons: sortReasons(reasons),
  };
}

function evaluatePredicate(
  predicate: GatePredicate,
  evidenceByKey: ReadonlyMap<string, AuditEvidence>
): PredicateEvaluation {
  switch (predicate.op) {
    case "exists":
      return { matched: evidenceByKey.get(predicate.fact)?.value !== undefined, reasons: [] };
    case "eq": {
      const value = evidenceByKey.get(predicate.fact)?.value;
      if (value === undefined) return missingValue(predicate.fact, "eq");
      return { matched: scalarEquals(value, predicate.value), reasons: [] };
    }
    case "in": {
      const value = evidenceByKey.get(predicate.fact)?.value;
      if (value === undefined) return missingValue(predicate.fact, "in");
      return {
        matched: predicate.values.some((candidate) => scalarEquals(value, candidate)),
        reasons: [],
      };
    }
    case "gte":
    case "lte": {
      const value = evidenceByKey.get(predicate.fact)?.value;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return typeMismatch(
          predicate.fact,
          `Operator '${predicate.op}' requires finite numeric evidence.`
        );
      }
      return {
        matched: predicate.op === "gte" ? value >= predicate.value : value <= predicate.value,
        reasons: [],
      };
    }
    case "not": {
      const child = evaluatePredicate(predicate.predicate, evidenceByKey);
      if (child.reasons.length > 0) {
        return { matched: false, reasons: child.reasons };
      }
      return { matched: !child.matched, reasons: child.reasons };
    }
    case "all":
    case "any": {
      // Evaluate every child so diagnostics do not depend on short-circuit order.
      const children = predicate.predicates.map((child) =>
        evaluatePredicate(child, evidenceByKey)
      );
      const reasons = children.flatMap((child) => child.reasons);
      if (reasons.length > 0) {
        return { matched: false, reasons: sortReasons(reasons) };
      }
      return {
        matched:
          predicate.op === "all"
            ? children.every((child) => child.matched)
            : children.some((child) => child.matched),
        reasons: [],
      };
    }
  }
}

function collectEvidenceKeys(predicate: GatePredicate): string[] {
  const keys = new Set<string>();
  const visit = (node: GatePredicate): void => {
    if (node.op === "all" || node.op === "any") {
      node.predicates.forEach(visit);
    } else if (node.op === "not") {
      visit(node.predicate);
    } else {
      keys.add(node.fact);
    }
  };
  visit(predicate);
  return [...keys].sort(compareText);
}

function buildEvaluation(policy: GatePolicy, rules: GateRuleEvaluation[]): GateEvaluation {
  const blockedHardRules = rules.filter(
    (rule) => rule.level === "HARD" && rule.status !== "PASS"
  ).length;
  const advisoryConcerns = rules.filter(
    (rule) => rule.level === "ADVISORY" && rule.status !== "PASS"
  ).length;

  return {
    policyId: policy.id,
    schemaVersion: policy.schemaVersion,
    decision: blockedHardRules > 0 ? "BLOCKED" : advisoryConcerns > 0 ? "REVIEW" : "PASS",
    rules,
    summary: {
      totalRules: rules.length,
      passedRules: rules.filter((rule) => rule.status === "PASS").length,
      blockedHardRules,
      advisoryConcerns,
    },
  };
}

function invalidInputEvaluation(
  policyInput: unknown,
  policyErrors: string[] | null,
  evidenceErrors: string[] | null
): GateEvaluation {
  const rules: GateRuleEvaluation[] = [];

  if (policyErrors) {
    rules.push(systemFailure("policy.invalid", "POLICY_INVALID", policyErrors));
  }
  if (evidenceErrors) {
    rules.push(
      systemFailure("evidence.invalid", "EVIDENCE_INVALID", evidenceErrors)
    );
  }
  rules.sort(compareRuleEvaluations);

  return {
    policyId: safePolicyId(policyInput),
    schemaVersion: null,
    decision: "BLOCKED",
    rules,
    summary: {
      totalRules: rules.length,
      passedRules: 0,
      blockedHardRules: rules.length,
      advisoryConcerns: 0,
    },
  };
}

function systemFailure(
  ruleId: string,
  code: "POLICY_INVALID" | "EVIDENCE_INVALID",
  messages: string[]
): GateRuleEvaluation {
  return {
    ruleId,
    level: "HARD",
    status: "FAIL",
    predicateMatched: null,
    evidenceKeys: [],
    reasons: messages.map((message) => ({ code, message })),
  };
}

function reasonForEvidenceState(evidence: AuditEvidence): GateReason {
  switch (evidence.state) {
    case "FAIL":
      return {
        code: "EVIDENCE_FAIL",
        evidenceKey: evidence.key,
        message: `Evidence '${evidence.key}' has state FAIL.`,
      };
    case "STALE":
      return {
        code: "EVIDENCE_STALE",
        evidenceKey: evidence.key,
        message: `Evidence '${evidence.key}' has state STALE.`,
      };
    case "UNKNOWN":
      return {
        code: "EVIDENCE_UNKNOWN",
        evidenceKey: evidence.key,
        message: `Evidence '${evidence.key}' has state UNKNOWN.`,
      };
    case "PASS":
      throw new Error("PASS evidence does not have a blocking state reason.");
  }
}

function strongestUnusableStatus(statuses: RuleStatus[]): RuleStatus {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("STALE")) return "STALE";
  return "UNKNOWN";
}

function missingValue(fact: string, operator: string): PredicateEvaluation {
  return typeMismatch(fact, `Operator '${operator}' requires an evidence value.`);
}

function typeMismatch(fact: string, message: string): PredicateEvaluation {
  return {
    matched: false,
    reasons: [
      {
        code: "PREDICATE_TYPE_MISMATCH",
        evidenceKey: fact,
        message,
      },
    ],
  };
}

function scalarEquals(left: PredicateValue, right: PredicateValue): boolean {
  return typeof left === typeof right && left === right;
}

function safePolicyId(input: unknown): string {
  if (typeof input !== "object" || input === null || !("id" in input)) {
    return "invalid-policy";
  }
  const id = (input as { id?: unknown }).id;
  return typeof id === "string" && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(id)
    ? id
    : "invalid-policy";
}

function parsePolicy(input: unknown): ParseResult<GatePolicy> {
  try {
    const result = gatePolicySchema.safeParse(input);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, messages: formatZodError(result.error) };
  } catch {
    return {
      success: false,
      messages: ["<root>: Policy validation could not be completed safely."],
    };
  }
}

function parseEvidence(input: unknown): ParseResult<AuditEvidence[]> {
  try {
    const result = auditEvidenceListSchema.safeParse(input);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, messages: formatZodError(result.error) };
  } catch {
    return {
      success: false,
      messages: ["<root>: Evidence validation could not be completed safely."],
    };
  }
}

function formatZodError(error: ZodError): string[] {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .sort(compareText);
}

function sortReasons(reasons: GateReason[]): GateReason[] {
  return [...reasons].sort((left, right) => {
    const keyOrder = compareText(left.evidenceKey ?? "", right.evidenceKey ?? "");
    if (keyOrder !== 0) return keyOrder;
    const codeOrder = compareText(left.code, right.code);
    return codeOrder !== 0 ? codeOrder : compareText(left.message, right.message);
  });
}

function compareRuleEvaluations(left: GateRuleEvaluation, right: GateRuleEvaluation): number {
  const idOrder = compareText(left.ruleId, right.ruleId);
  return idOrder !== 0 ? idOrder : compareText(left.level, right.level);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
