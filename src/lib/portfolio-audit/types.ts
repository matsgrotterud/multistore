/**
 * Pure data contracts for the portfolio audit gate.
 *
 * Collectors live outside this module. The gate only consumes immutable facts,
 * so evaluating the same policy and evidence always produces the same result.
 */

export const EVIDENCE_STATES = ["PASS", "FAIL", "UNKNOWN", "STALE"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const EVIDENCE_PROVENANCE = ["VERIFIED", "AI_INFERRED"] as const;
export type EvidenceProvenance = (typeof EVIDENCE_PROVENANCE)[number];

export type PredicateValue = string | number | boolean | null;

export interface AuditEvidence {
  /** Flat, allowlisted fact identifier. Dotted names are labels, not object paths. */
  key: string;
  /** Collection/freshness state. Only PASS is usable by a predicate. */
  state: EvidenceState;
  /** AI_INFERRED evidence can never satisfy a HARD rule. */
  provenance: EvidenceProvenance;
  /** Scalar value inspected by the predicate AST. */
  value?: PredicateValue;
  /** Collector-supplied timestamp. The evaluator never reads the system clock. */
  observedAt?: string;
  /** Human-readable context; never interpreted by the evaluator. */
  detail?: string;
}

export type GatePredicate =
  | { op: "exists"; fact: string }
  | { op: "eq"; fact: string; value: PredicateValue }
  | { op: "in"; fact: string; values: PredicateValue[] }
  | { op: "gte"; fact: string; value: number }
  | { op: "lte"; fact: string; value: number }
  | { op: "all"; predicates: GatePredicate[] }
  | { op: "any"; predicates: GatePredicate[] }
  | { op: "not"; predicate: GatePredicate };

export const GATE_RULE_LEVELS = ["HARD", "ADVISORY"] as const;
export type GateRuleLevel = (typeof GATE_RULE_LEVELS)[number];

export interface GateRule {
  id: string;
  level: GateRuleLevel;
  description?: string;
  predicate: GatePredicate;
}

export interface GatePolicy {
  schemaVersion: 1;
  id: string;
  description?: string;
  rules: GateRule[];
}

export const RULE_STATUSES = ["PASS", "FAIL", "UNKNOWN", "STALE", "AI_INFERRED"] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export const GATE_DECISIONS = ["PASS", "REVIEW", "BLOCKED"] as const;
export type GateDecision = (typeof GATE_DECISIONS)[number];

export type GateReasonCode =
  | "POLICY_INVALID"
  | "EVIDENCE_INVALID"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_FAIL"
  | "EVIDENCE_UNKNOWN"
  | "EVIDENCE_STALE"
  | "AI_INFERRED_EVIDENCE"
  | "PREDICATE_FALSE"
  | "PREDICATE_TYPE_MISMATCH";

export interface GateReason {
  code: GateReasonCode;
  message: string;
  evidenceKey?: string;
}

export interface GateRuleEvaluation {
  ruleId: string;
  level: GateRuleLevel;
  status: RuleStatus;
  /** Null means evidence state prevented safe predicate evaluation. */
  predicateMatched: boolean | null;
  evidenceKeys: string[];
  reasons: GateReason[];
}

export interface GateEvaluationSummary {
  totalRules: number;
  passedRules: number;
  blockedHardRules: number;
  advisoryConcerns: number;
}

export interface GateEvaluation {
  policyId: string;
  schemaVersion: 1 | null;
  decision: GateDecision;
  rules: GateRuleEvaluation[];
  summary: GateEvaluationSummary;
}
