import { z } from "zod";
import type { AuditEvidence, GatePolicy, GatePredicate } from "./types";

const MAX_RULES = 100;
const MAX_PREDICATES_PER_GROUP = 20;
const MAX_AST_DEPTH = 8;
const MAX_AST_NODES_PER_RULE = 100;
const MAX_EVIDENCE_ITEMS = 1_000;

/** Lower-case flat identifiers only; dots never trigger property traversal. */
export const auditIdentifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/,
    "Use a lower-case audit identifier containing letters, numbers, dots, dashes or underscores."
  );

export const predicateValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const existsPredicateSchema = z
  .object({ op: z.literal("exists"), fact: auditIdentifierSchema })
  .strict();
const equalsPredicateSchema = z
  .object({ op: z.literal("eq"), fact: auditIdentifierSchema, value: predicateValueSchema })
  .strict();
const inPredicateSchema = z
  .object({
    op: z.literal("in"),
    fact: auditIdentifierSchema,
    values: z.array(predicateValueSchema).min(1).max(50),
  })
  .strict();
const gtePredicateSchema = z
  .object({ op: z.literal("gte"), fact: auditIdentifierSchema, value: z.number().finite() })
  .strict();
const ltePredicateSchema = z
  .object({ op: z.literal("lte"), fact: auditIdentifierSchema, value: z.number().finite() })
  .strict();

/**
 * Deliberately small AST allowlist. No executable expressions, dynamic paths,
 * regexes, transforms or callbacks can enter a policy.
 */
export const gatePredicateSchema: z.ZodType<GatePredicate> = z.lazy(() =>
  z.discriminatedUnion("op", [
    existsPredicateSchema,
    equalsPredicateSchema,
    inPredicateSchema,
    gtePredicateSchema,
    ltePredicateSchema,
    z
      .object({
        op: z.literal("all"),
        predicates: z
          .array(gatePredicateSchema)
          .min(1)
          .max(MAX_PREDICATES_PER_GROUP),
      })
      .strict(),
    z
      .object({
        op: z.literal("any"),
        predicates: z
          .array(gatePredicateSchema)
          .min(1)
          .max(MAX_PREDICATES_PER_GROUP),
      })
      .strict(),
    z.object({ op: z.literal("not"), predicate: gatePredicateSchema }).strict(),
  ])
);

const gateRuleSchema = z
  .object({
    id: auditIdentifierSchema,
    level: z.enum(["HARD", "ADVISORY"]),
    description: z.string().max(500).optional(),
    predicate: gatePredicateSchema,
  })
  .strict();

export const gatePolicySchema: z.ZodType<GatePolicy> = z
  .object({
    schemaVersion: z.literal(1),
    id: auditIdentifierSchema,
    description: z.string().max(1_000).optional(),
    rules: z.array(gateRuleSchema).min(1).max(MAX_RULES),
  })
  .strict()
  .superRefine((policy, ctx) => {
    addDuplicateIssues(
      policy.rules.map((rule) => rule.id),
      "rule id",
      ["rules"],
      ctx
    );

    policy.rules.forEach((rule, index) => {
      const stats = predicateStats(rule.predicate);
      if (stats.depth > MAX_AST_DEPTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rules", index, "predicate"],
          message: `Predicate depth exceeds ${MAX_AST_DEPTH}.`,
        });
      }
      if (stats.nodes > MAX_AST_NODES_PER_RULE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rules", index, "predicate"],
          message: `Predicate node count exceeds ${MAX_AST_NODES_PER_RULE}.`,
        });
      }
    });
  });

export const auditEvidenceSchema: z.ZodType<AuditEvidence> = z
  .object({
    key: auditIdentifierSchema,
    state: z.enum(["PASS", "FAIL", "UNKNOWN", "STALE"]),
    provenance: z.enum(["VERIFIED", "AI_INFERRED"]),
    value: predicateValueSchema.optional(),
    observedAt: z.string().datetime({ offset: true }).optional(),
    detail: z.string().max(1_000).optional(),
  })
  .strict();

export const auditEvidenceListSchema = z
  .array(auditEvidenceSchema)
  .max(MAX_EVIDENCE_ITEMS)
  .superRefine((evidence, ctx) => {
    addDuplicateIssues(
      evidence.map((item) => item.key),
      "evidence key",
      [],
      ctx
    );
  });

function predicateStats(predicate: GatePredicate, depth = 1): { depth: number; nodes: number } {
  if (predicate.op === "not") {
    const child = predicateStats(predicate.predicate, depth + 1);
    return { depth: child.depth, nodes: child.nodes + 1 };
  }
  if (predicate.op === "all" || predicate.op === "any") {
    const children = predicate.predicates.map((child) => predicateStats(child, depth + 1));
    return {
      depth: Math.max(depth, ...children.map((child) => child.depth)),
      nodes: 1 + children.reduce((sum, child) => sum + child.nodes, 0),
    };
  }
  return { depth, nodes: 1 };
}

function addDuplicateIssues(
  values: string[],
  label: string,
  basePath: Array<string | number>,
  ctx: z.RefinementCtx
): void {
  const firstIndex = new Map<string, number>();
  values.forEach((value, index) => {
    const first = firstIndex.get(value);
    if (first === undefined) {
      firstIndex.set(value, index);
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [...basePath, index],
      message: `Duplicate ${label} '${value}' (first seen at index ${first}).`,
    });
  });
}
