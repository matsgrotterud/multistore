import { createHash, timingSafeEqual } from "node:crypto";

export const CATALOG_AUTOPILOT_SCHEMA_VERSION = "catalog-autopilot.v1" as const;

export const CATALOG_AUTOPILOT_TABLES = [
  "CatalogRefreshExecution",
  "CatalogSupplierObservation",
  "CatalogRefreshProposal",
  "CatalogProductState",
  "CatalogRefreshCursor",
] as const;

export type CatalogAutopilotTable = (typeof CATALOG_AUTOPILOT_TABLES)[number];

const REQUIRED_COLUMNS = {
  CatalogRefreshExecution: [
    "id",
    "catalogJobId",
    "catalogJobAttempt",
    "catalogSyncRunId",
    "storeId",
    "providerKey",
    "mode",
    "handlerOutcome",
    "settlementStatus",
    "settlementCode",
    "startedAt",
    "completedAt",
    "selected",
    "scanned",
    "skippedFresh",
    "observed",
    "baselineCaptured",
    "unchanged",
    "proposed",
    "reviewRequired",
    "sourceUnavailable",
    "scanCursorStart",
    "scanCursorNext",
    "scanCursorRevisionStart",
    "scanWrapped",
    "createdAt",
  ],
  CatalogSupplierObservation: [
    "id",
    "idempotencyKey",
    "executionId",
    "storeId",
    "productId",
    "providerKey",
    "externalId",
    "sourceStatus",
    "observedAt",
    "productRevisionAt",
    "storefrontRevisionFingerprint",
    "snapshotVersion",
    "snapshotFingerprint",
    "snapshotJson",
    "reasonCodesJson",
    "createdAt",
  ],
  CatalogRefreshProposal: [
    "id",
    "observationId",
    "storeId",
    "productId",
    "providerKey",
    "contractVersion",
    "proposalFingerprint",
    "decision",
    "alignmentStatus",
    "reasonCodesJson",
    "changesJson",
    "alignmentJson",
    "workflowStatus",
    "reviewedAt",
    "reviewedBy",
    "appliedAt",
    "createdAt",
  ],
  CatalogProductState: [
    "id",
    "storeId",
    "productId",
    "providerKey",
    "externalId",
    "latestExecutionId",
    "latestObservationId",
    "latestProposalId",
    "latestDecision",
    "latestAlignmentStatus",
    "latestSourceStatus",
    "lastAttemptAt",
    "lastSuccessfulObservationId",
    "lastSuccessfulObservationAt",
    "consecutiveFailures",
    "openProposalId",
    "openProposalStatus",
    "updatedAt",
  ],
  CatalogRefreshCursor: [
    "storeId",
    "providerKey",
    "lastProductId",
    "revision",
    "lastExecutionId",
    "createdAt",
    "updatedAt",
  ],
} as const satisfies Record<CatalogAutopilotTable, readonly string[]>;

export const CATALOG_AUTOPILOT_CHECKS = [
  {
    name: "CatalogRefreshExecution_contract_check",
    tableName: "CatalogRefreshExecution",
    definitionFingerprint: "b87dc76f35faa5ef47844a879c8d893d3be64034c25121b7def8185a99e8d7d2",
  },
  {
    name: "CatalogSupplierObservation_contract_check",
    tableName: "CatalogSupplierObservation",
    definitionFingerprint: "06710bbe62ea02d486c1f9c4aa0dc68ffc5c2cf7fdbe0448b709608a50035017",
  },
  {
    name: "CatalogRefreshProposal_contract_check",
    tableName: "CatalogRefreshProposal",
    definitionFingerprint: "fe55cf85074547182909d01461e187186d96a40ab21e9a4bbb489dbf32399864",
  },
  {
    name: "CatalogProductState_contract_check",
    tableName: "CatalogProductState",
    definitionFingerprint: "d33debe0f75c38642b8a048c2576f22c0ab69b96333c7a5098e0f498ea607c24",
  },
  {
    name: "CatalogRefreshCursor_contract_check",
    tableName: "CatalogRefreshCursor",
    definitionFingerprint: "4489816046e19f70109c2a6f3520e693dbb32f3eebd20d0976727436379b4981",
  },
] as const;

export const CATALOG_AUTOPILOT_FUNCTIONS = {
  guardCatalogRefreshExecutionScope:
    "466c3c8f56ce2e8004637dda13404d5a7d4046e88a223ab2ae6c9ca316581483",
  guardCatalogSupplierObservationScope:
    "308418b2783b46d0b188b7c435f29b508c6d4d53d01b2c7e87365774d9c967a3",
  guardCatalogRefreshProposalScope:
    "94cb314673ca2a5c233df70a5dd38042915d8fdf1c6bb736f06e3dd27ed169ff",
  guardCatalogProductStateScope:
    "22c15ccc79bbec6b356b0d4177fd3ce9015243458d95ef36c6d47873f97db9af",
  guardCatalogRefreshEvidenceImmutable:
    "65f926ec199e6b5a3d060842f9ecebac40fe12d1cb97bd17e70ff849e176cc1a",
  guardCatalogRefreshProposalFactsImmutable:
    "39a34d472272b4c369048f9a981166904e2ab4dcd0ca48c19af08dae13857fbe",
} as const;

export const CATALOG_AUTOPILOT_TRIGGERS = [
  {
    name: "CatalogRefreshExecution_scope",
    tableName: "CatalogRefreshExecution",
    functionName: "guardCatalogRefreshExecutionScope",
    events: ["INSERT"],
  },
  {
    name: "CatalogSupplierObservation_scope",
    tableName: "CatalogSupplierObservation",
    functionName: "guardCatalogSupplierObservationScope",
    events: ["INSERT"],
  },
  {
    name: "CatalogRefreshProposal_scope",
    tableName: "CatalogRefreshProposal",
    functionName: "guardCatalogRefreshProposalScope",
    events: ["INSERT"],
  },
  {
    name: "CatalogProductState_scope",
    tableName: "CatalogProductState",
    functionName: "guardCatalogProductStateScope",
    events: ["INSERT", "UPDATE"],
  },
  {
    name: "CatalogRefreshExecution_immutable",
    tableName: "CatalogRefreshExecution",
    functionName: "guardCatalogRefreshEvidenceImmutable",
    events: ["UPDATE"],
  },
  {
    name: "CatalogSupplierObservation_immutable",
    tableName: "CatalogSupplierObservation",
    functionName: "guardCatalogRefreshEvidenceImmutable",
    events: ["UPDATE"],
  },
  {
    name: "CatalogRefreshProposal_facts_immutable",
    tableName: "CatalogRefreshProposal",
    functionName: "guardCatalogRefreshProposalFactsImmutable",
    events: ["UPDATE"],
  },
] as const;

export const CATALOG_AUTOPILOT_INDEXES = [
  index("CatalogRefreshExecution_storeId_providerKey_completedAt_id_idx", "CatalogRefreshExecution", [
    "storeId",
    "providerKey",
    "completedAt",
    "id",
  ]),
  index("CatalogRefreshExecution_catalogSyncRunId_idx", "CatalogRefreshExecution", [
    "catalogSyncRunId",
  ]),
  index("CatalogRefreshExecution_settlementStatus_completedAt_idx", "CatalogRefreshExecution", [
    "settlementStatus",
    "completedAt",
  ]),
  index(
    "CatalogRefreshExecution_catalogJobId_catalogJobAttempt_key",
    "CatalogRefreshExecution",
    ["catalogJobId", "catalogJobAttempt"],
    true
  ),
  index("CatalogSupplierObservation_idempotencyKey_key", "CatalogSupplierObservation", [
    "idempotencyKey",
  ], true),
  index(
    "CatalogSupplierObservation_storeId_providerKey_observedAt_i_idx",
    "CatalogSupplierObservation",
    ["storeId", "providerKey", "observedAt", "id"]
  ),
  index(
    "CatalogSupplierObservation_productId_providerKey_observedAt_idx",
    "CatalogSupplierObservation",
    ["productId", "providerKey", "observedAt", "id"]
  ),
  index(
    "CatalogSupplierObservation_providerKey_externalId_observedA_idx",
    "CatalogSupplierObservation",
    ["providerKey", "externalId", "observedAt"]
  ),
  index("CatalogSupplierObservation_sourceStatus_observedAt_idx", "CatalogSupplierObservation", [
    "sourceStatus",
    "observedAt",
  ]),
  index(
    "CatalogSupplierObservation_executionId_productId_key",
    "CatalogSupplierObservation",
    ["executionId", "productId"],
    true
  ),
  index("CatalogRefreshProposal_observationId_key", "CatalogRefreshProposal", ["observationId"], true),
  index(
    "CatalogRefreshProposal_storeId_workflowStatus_createdAt_id_idx",
    "CatalogRefreshProposal",
    ["storeId", "workflowStatus", "createdAt", "id"]
  ),
  index("CatalogRefreshProposal_storeId_decision_createdAt_idx", "CatalogRefreshProposal", [
    "storeId",
    "decision",
    "createdAt",
  ]),
  index("CatalogRefreshProposal_productId_providerKey_createdAt_idx", "CatalogRefreshProposal", [
    "productId",
    "providerKey",
    "createdAt",
  ]),
  index("CatalogRefreshProposal_proposalFingerprint_idx", "CatalogRefreshProposal", [
    "proposalFingerprint",
  ]),
  index("CatalogProductState_storeId_providerKey_lastAttemptAt_idx", "CatalogProductState", [
    "storeId",
    "providerKey",
    "lastAttemptAt",
  ]),
  index("CatalogProductState_storeId_openProposalStatus_updatedAt_idx", "CatalogProductState", [
    "storeId",
    "openProposalStatus",
    "updatedAt",
  ]),
  index("CatalogProductState_latestSourceStatus_lastAttemptAt_idx", "CatalogProductState", [
    "latestSourceStatus",
    "lastAttemptAt",
  ]),
  index("CatalogProductState_providerKey_externalId_idx", "CatalogProductState", [
    "providerKey",
    "externalId",
  ]),
  index("CatalogProductState_openProposalId_idx", "CatalogProductState", ["openProposalId"]),
  index("CatalogProductState_productId_providerKey_key", "CatalogProductState", [
    "productId",
    "providerKey",
  ], true),
  index("CatalogRefreshCursor_updatedAt_idx", "CatalogRefreshCursor", ["updatedAt"]),
  index("Product_storeId_providerKey_externalId_idx", "Product", [
    "storeId",
    "providerKey",
    "externalId",
  ]),
] as const;

function index(
  name: string,
  tableName: string,
  columns: readonly string[],
  unique = false
) {
  return { name, tableName, columns, unique } as const;
}

export interface CatalogSchemaColumn {
  tableName: string;
  columnName: string;
}

export interface CatalogSchemaCheck {
  tableName: string;
  name: string;
  validated: boolean;
  definitionFingerprint: string;
}

export interface CatalogSchemaTrigger {
  tableName: string;
  name: string;
  functionName: string;
  functionSourceFingerprint: string;
  functionLanguage: string;
  functionSchema: string;
  functionReturnType: string;
  functionVolatility: string;
  functionSecurityDefiner: boolean;
  functionLeakproof: boolean;
  functionStrict: boolean;
  functionParallel: string;
  functionConfigIsNull: boolean;
  functionArgumentCount: number;
  enabledMode: string;
  timing: string;
  events: readonly string[];
  rowLevel: boolean;
  whenExpression: string | null;
  argumentCount: number;
}

export interface CatalogSchemaIndex {
  tableName: string;
  name: string;
  columns: readonly string[];
  unique: boolean;
  valid: boolean;
  ready: boolean;
}

export interface CatalogAutopilotSchemaInspection {
  tables: readonly string[];
  columns: readonly CatalogSchemaColumn[];
  checks: readonly CatalogSchemaCheck[];
  triggers: readonly CatalogSchemaTrigger[];
  indexes: readonly CatalogSchemaIndex[];
}

export type CatalogAutopilotSchemaStatus = "ABSENT" | "PARTIAL" | "COMPLETE";

export interface CatalogAutopilotSchemaReport {
  status: CatalogAutopilotSchemaStatus;
  missing: readonly string[];
  incompatible: readonly string[];
  satisfied: number;
  expected: number;
}

export function inspectCatalogAutopilotSchema(
  inspection: CatalogAutopilotSchemaInspection
): CatalogAutopilotSchemaReport {
  const missing: string[] = [];
  const incompatible: string[] = [];
  let satisfied = 0;
  let relevant = 0;

  for (const tableName of CATALOG_AUTOPILOT_TABLES) {
    if (inspection.tables.includes(tableName)) {
      relevant += 1;
      satisfied += 1;
    } else {
      missing.push(`table public.${tableName}`);
    }
  }

  for (const [tableName, columns] of Object.entries(REQUIRED_COLUMNS)) {
    for (const columnName of columns) {
      const found = inspection.columns.some(
        (column) => column.tableName === tableName && column.columnName === columnName
      );
      if (found) {
        relevant += 1;
        satisfied += 1;
      } else {
        missing.push(`column public.${tableName}.${columnName}`);
      }
    }
  }

  for (const expected of CATALOG_AUTOPILOT_CHECKS) {
    const actual = inspection.checks.find(
      (check) => check.tableName === expected.tableName && check.name === expected.name
    );
    if (!actual) {
      missing.push(`check ${expected.tableName}.${expected.name}`);
      continue;
    }
    relevant += 1;
    if (
      !actual.validated ||
      actual.definitionFingerprint !== expected.definitionFingerprint
    ) {
      incompatible.push(
        `check ${expected.tableName}.${expected.name} is unvalidated or has semantic drift`
      );
    } else {
      satisfied += 1;
    }
  }

  for (const expected of CATALOG_AUTOPILOT_TRIGGERS) {
    const actual = inspection.triggers.find(
      (trigger) => trigger.tableName === expected.tableName && trigger.name === expected.name
    );
    if (!actual) {
      missing.push(`trigger ${expected.tableName}.${expected.name}`);
      continue;
    }
    relevant += 1;
    const actualEvents = [...actual.events].sort();
    const expectedEvents = [...expected.events].sort();
    const eventsMatch =
      actualEvents.length === expectedEvents.length &&
      actualEvents.every((event, position) => event === expectedEvents[position]);
    const expectedFunctionFingerprint = CATALOG_AUTOPILOT_FUNCTIONS[expected.functionName];
    if (
      actual.enabledMode !== "O" ||
      actual.timing !== "BEFORE" ||
      !actual.rowLevel ||
      actual.whenExpression !== null ||
      actual.argumentCount !== 0 ||
      !eventsMatch ||
      actual.functionName !== expected.functionName ||
      actual.functionSourceFingerprint !== expectedFunctionFingerprint ||
      actual.functionLanguage !== "plpgsql" ||
      actual.functionSchema !== "public" ||
      actual.functionReturnType !== "trigger" ||
      actual.functionVolatility !== "v" ||
      actual.functionSecurityDefiner ||
      actual.functionLeakproof ||
      actual.functionStrict ||
      actual.functionParallel !== "u" ||
      !actual.functionConfigIsNull ||
      actual.functionArgumentCount !== 0
    ) {
      incompatible.push(
        `trigger ${expected.tableName}.${expected.name} or ${expected.functionName} has semantic drift`
      );
    } else {
      satisfied += 1;
    }
  }

  for (const expected of CATALOG_AUTOPILOT_INDEXES) {
    const actual = inspection.indexes.find(
      (candidate) => candidate.tableName === expected.tableName && candidate.name === expected.name
    );
    if (!actual) {
      missing.push(`index ${expected.tableName}.${expected.name}`);
      continue;
    }
    relevant += 1;
    const columnsMatch =
      actual.columns.length === expected.columns.length &&
      actual.columns.every((column, position) => column === expected.columns[position]);
    if (
      !actual.valid ||
      !actual.ready ||
      actual.unique !== expected.unique ||
      !columnsMatch
    ) {
      incompatible.push(`index ${expected.tableName}.${expected.name} has the wrong definition`);
    } else {
      satisfied += 1;
    }
  }

  const expected = satisfied + missing.length + incompatible.length;
  const status: CatalogAutopilotSchemaStatus =
    missing.length === 0 && incompatible.length === 0
      ? "COMPLETE"
      : relevant === 0
        ? "ABSENT"
        : "PARTIAL";

  return { status, missing, incompatible, satisfied, expected };
}

export type CatalogAutopilotApplyDecision =
  | "APPLY"
  | "NOOP_COMPLETE"
  | "REFUSE_TARGET_CONFIRMATION"
  | "REFUSE_PARTIAL";

export function decideCatalogAutopilotSchemaApply(input: {
  report: CatalogAutopilotSchemaReport;
  targetFingerprint: string;
  confirmedTargetFingerprint?: string;
}): CatalogAutopilotApplyDecision {
  if (!fingerprintsEqual(input.targetFingerprint, input.confirmedTargetFingerprint)) {
    return "REFUSE_TARGET_CONFIRMATION";
  }
  if (input.report.status === "PARTIAL") return "REFUSE_PARTIAL";
  if (input.report.status === "COMPLETE") return "NOOP_COMPLETE";
  return "APPLY";
}

export function databaseTargetFingerprint(databaseUrl: string): string {
  const normalized = databaseUrl.trim();
  if (!/^postgres(?:ql)?:\/\//i.test(normalized)) {
    throw new Error("The selected database environment variable is not a PostgreSQL URL.");
  }
  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

export function catalogCheckDefinitionFingerprint(definition: string): string {
  return sha256(definition.replace(/\r\n/g, "\n").trim());
}

/**
 * Fingerprint executable PL/pgSQL semantics while ignoring formatting,
 * comments and human-only RAISE EXCEPTION message copy. Quoted identifiers and
 * all other string literals remain exact tokens, so changing a predicate,
 * value, operator, statement or control-flow token changes the fingerprint.
 */
export function catalogFunctionSemanticFingerprint(source: string): string {
  const rawTokens =
    source.replace(/\r\n/g, "\n").match(
      /\s+|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|<>|>=|<=|:=|::|\|\||&&|[A-Za-z_][A-Za-z0-9_$]*|\d+(?:\.\d+)?|./g
    ) ?? [];
  const semanticTokens: string[] = [];

  for (const token of rawTokens) {
    if (/^\s+$/.test(token) || token.startsWith("--") || token.startsWith("/*")) continue;
    const previous = semanticTokens.slice(-2);
    if (
      token.startsWith("'") &&
      previous[0] === "RAISE" &&
      previous[1] === "EXCEPTION"
    ) {
      semanticTokens.push("'<message>'");
      continue;
    }
    semanticTokens.push(/^[A-Za-z_]/.test(token) ? token.toUpperCase() : token);
  }

  return sha256(JSON.stringify(semanticTokens));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprintsEqual(expected: string, received: string | undefined): boolean {
  if (!received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
}

export interface CatalogAutopilotDdlReport {
  valid: boolean;
  problems: readonly string[];
}

export function inspectCatalogAutopilotDdl(sql: string): CatalogAutopilotDdlReport {
  const problems: string[] = [];
  const normalized = sql.replace(/\r\n/g, "\n").trim();

  if (!normalized.startsWith("BEGIN;")) problems.push("DDL must start with BEGIN;");
  if (!normalized.endsWith("COMMIT;")) problems.push("DDL must end with COMMIT;");
  if ((normalized.match(/^BEGIN;$/gm) ?? []).length !== 1) {
    problems.push("DDL must contain exactly one top-level BEGIN;");
  }
  if ((normalized.match(/^COMMIT;$/gm) ?? []).length !== 1) {
    problems.push("DDL must contain exactly one top-level COMMIT;");
  }
  if (/^(?:DROP|TRUNCATE|DELETE|UPDATE)\b/im.test(normalized)) {
    problems.push("DDL must not contain destructive top-level statements");
  }
  if (/^ALTER\s+TABLE\b[^;]*\bDROP\b/im.test(normalized)) {
    problems.push("DDL must not drop table objects");
  }

  const requiredNames = [
    ...CATALOG_AUTOPILOT_TABLES,
    ...new Set(Object.values(REQUIRED_COLUMNS).flat()),
    ...CATALOG_AUTOPILOT_CHECKS.map((item) => item.name),
    ...Object.keys(CATALOG_AUTOPILOT_FUNCTIONS),
    ...CATALOG_AUTOPILOT_TRIGGERS.map((item) => item.name),
    ...CATALOG_AUTOPILOT_INDEXES.map((item) => item.name),
  ];
  for (const name of requiredNames) {
    if (!normalized.includes(`"${name}"`)) problems.push(`DDL is missing ${name}`);
  }

  const functionSources = new Map(
    [...normalized.matchAll(/CREATE FUNCTION "([^"]+)"\(\) RETURNS TRIGGER AS \$\$([\s\S]*?)\$\$ LANGUAGE plpgsql;/g)].map(
      (match) => [match[1] ?? "", match[2] ?? ""] as const
    )
  );
  for (const [functionName, expectedFingerprint] of Object.entries(
    CATALOG_AUTOPILOT_FUNCTIONS
  )) {
    const source = functionSources.get(functionName);
    if (!source) {
      problems.push(`DDL is missing the body for ${functionName}`);
    } else if (catalogFunctionSemanticFingerprint(source) !== expectedFingerprint) {
      problems.push(`DDL function ${functionName} has semantic drift`);
    }
  }

  return { valid: problems.length === 0, problems };
}

export function makeCompleteCatalogAutopilotInspection(): CatalogAutopilotSchemaInspection {
  return {
    tables: [...CATALOG_AUTOPILOT_TABLES],
    columns: Object.entries(REQUIRED_COLUMNS).flatMap(([tableName, columns]) =>
      columns.map((columnName) => ({ tableName, columnName }))
    ),
    checks: CATALOG_AUTOPILOT_CHECKS.map((check) => ({ ...check, validated: true })),
    triggers: CATALOG_AUTOPILOT_TRIGGERS.map((trigger) => ({
      tableName: trigger.tableName,
      name: trigger.name,
      functionName: trigger.functionName,
      functionSourceFingerprint: CATALOG_AUTOPILOT_FUNCTIONS[trigger.functionName],
      functionLanguage: "plpgsql",
      functionSchema: "public",
      functionReturnType: "trigger",
      functionVolatility: "v",
      functionSecurityDefiner: false,
      functionLeakproof: false,
      functionStrict: false,
      functionParallel: "u",
      functionConfigIsNull: true,
      functionArgumentCount: 0,
      enabledMode: "O",
      timing: "BEFORE",
      events: [...trigger.events],
      rowLevel: true,
      whenExpression: null,
      argumentCount: 0,
    })),
    indexes: CATALOG_AUTOPILOT_INDEXES.map((requiredIndex) => ({
      ...requiredIndex,
      columns: [...requiredIndex.columns],
      valid: true,
      ready: true,
    })),
  };
}
