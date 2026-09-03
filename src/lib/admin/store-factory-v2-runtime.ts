import { z } from "zod";
import {
  buildCatalogProjectionV2,
  CatalogProjectionV2Schema,
  CatalogReferenceFixtureV2Schema,
  digestCatalogValue,
  type CatalogProjectionV2,
} from "@/lib/catalog-v2";
import type { StoreFactoryV2SchemaReport } from "@/lib/db/store-factory-v2-schema";
import { diffStoreRevisionV2 } from "@/lib/revision-diff-v2";
import {
  PREVIEW_POINTER_MUTATION_V1,
  REVISION_REVIEW_REQUEST_V2,
  RevisionStatusV1Schema,
  StoreFactoryV2Error,
  StoreFactoryV2Service,
  digestCanonicalArtifactV1,
  type PreviewOnlyMutationV1,
  type PreviewRevisionPointerV1,
  type StoreBuildEventV1,
  type StoreFactoryV2Repository,
  type StoreRevisionV2,
} from "@/lib/store-factory-v2";
import {
  catalogProjectionToStoreExperienceV2,
  StoreExperienceRenderDocumentV2Schema,
  STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
  validateStoreExperienceManifestV2,
  type StoreExperienceCatalogProjectionV2,
  type StoreExperienceManifestV2,
  type StoreExperienceRenderDocumentV2,
} from "@/lib/storefront-v2";

export const STORE_FACTORY_V2_ADMIN_RUNTIME =
  "store-factory-v2-admin-runtime.v1" as const;

export type StoreFactoryV2AdminRuntimeErrorCode =
  | "FEATURE_DISABLED"
  | "SCHEMA_NOT_COMPLETE"
  | "STORE_NOT_FOUND"
  | "STORE_NOT_PREVIEW_ACTIVE"
  | "PILOT_STORE_NOT_ALLOWED"
  | "REVISION_NOT_FOUND_FOR_STORE"
  | "REVISION_TENANT_MISMATCH"
  | "REVISION_RUNTIME_INVALID"
  | "ACTIVE_POINTER_INVALID"
  | "REVISION_STATE_CONFLICT"
  | "POINTER_VERSION_CONFLICT";

export class StoreFactoryV2AdminRuntimeError extends Error {
  readonly code: StoreFactoryV2AdminRuntimeErrorCode;

  constructor(code: StoreFactoryV2AdminRuntimeErrorCode, message: string) {
    super(message);
    this.name = "StoreFactoryV2AdminRuntimeError";
    this.code = code;
  }
}

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const adminMutationBindingSchema = z.object({
  storeId: identifierSchema,
  storeSlug: slugSchema,
  revisionId: identifierSchema,
  reason: z.string().trim().min(6).max(1_000),
});

export const StoreFactoryV2AdminReviewInputSchema = adminMutationBindingSchema
  .extend({
    intent: z.enum(["APPROVE", "REJECT"]),
    expectedOutputDigest: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export type StoreFactoryV2AdminReviewInput = z.infer<
  typeof StoreFactoryV2AdminReviewInputSchema
>;

export const StoreFactoryV2AdminPointerInputSchema = adminMutationBindingSchema
  .extend({
    intent: z.enum(["PROMOTE", "ROLLBACK"]),
    expectedPointerVersion: z.number().int().nonnegative(),
  })
  .strict();

export type StoreFactoryV2AdminPointerInput = z.infer<
  typeof StoreFactoryV2AdminPointerInputSchema
>;

/** Compatibility union for callers that dispatch by intent. */
export const StoreFactoryV2AdminMutationInputSchema = z.discriminatedUnion(
  "intent",
  [StoreFactoryV2AdminReviewInputSchema, StoreFactoryV2AdminPointerInputSchema]
);

export type StoreFactoryV2AdminMutationInput = z.infer<
  typeof StoreFactoryV2AdminMutationInputSchema
>;

export const StoreFactoryV2PilotStoreIdsSchema = z
  .array(identifierSchema)
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Pilot store ids must be unique.",
  });

export function parseStoreFactoryV2PilotStoreIds(
  value: string | undefined
): ReadonlySet<string> {
  if (!value?.trim()) return new Set();
  const ids = value.split(",").map((entry) => entry.trim());
  return new Set(StoreFactoryV2PilotStoreIdsSchema.parse(ids));
}

export interface StoreFactoryV2MutationOriginContext {
  origin: string | null;
  host: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  secFetchSite?: string | null;
  /** Enable only behind a trusted proxy that overwrites both forwarded headers. */
  trustForwardedHeaders?: boolean;
}

/**
 * Browser mutation policy for Store Factory admin actions.
 *
 * Unlike the shopper helper, this compares the complete canonical origin
 * (scheme + host). Forwarded values are ignored unless the deployment opts in
 * and supplies exactly one conservative host/protocol pair.
 */
export function isStoreFactoryV2SameOriginMutation(
  context: StoreFactoryV2MutationOriginContext
): boolean {
  if (!context.origin || context.secFetchSite !== "same-origin") return false;

  const directHost = canonicalRequestHost(context.host);
  if (!directHost) return false;

  let requestHost = directHost;
  let requestProtocol: "http:" | "https:" | null = null;
  if (context.trustForwardedHeaders) {
    const forwardedHost = canonicalRequestHost(context.forwardedHost);
    const forwardedProtocol = canonicalForwardedProtocol(context.forwardedProto);
    if (!forwardedHost || !forwardedProtocol) return false;
    requestHost = forwardedHost;
    requestProtocol = forwardedProtocol;
  } else {
    requestProtocol = isLoopbackHost(directHost) ? "http:" : null;
  }
  if (!requestProtocol) return false;

  try {
    const supplied = new URL(context.origin);
    if (
      supplied.username ||
      supplied.password ||
      supplied.pathname !== "/" ||
      supplied.search ||
      supplied.hash
    ) {
      return false;
    }
    const expected = new URL(`${requestProtocol}//${requestHost}`);
    return supplied.origin === expected.origin;
  } catch {
    return false;
  }
}

function canonicalRequestHost(value: string | null | undefined): string | null {
  const candidate = value?.trim().toLowerCase();
  if (!candidate || candidate.includes(",") || candidate.includes("/") || candidate.includes("@")) {
    return null;
  }
  try {
    const parsed = new URL(`http://${candidate}`);
    return parsed.pathname === "/" && !parsed.search && !parsed.hash
      ? parsed.host
      : null;
  } catch {
    return null;
  }
}

function canonicalForwardedProtocol(
  value: string | null | undefined
): "http:" | "https:" | null {
  const candidate = value?.trim().toLowerCase();
  if (!candidate || candidate.includes(",")) return null;
  return candidate === "http"
    ? "http:"
    : candidate === "https"
      ? "https:"
      : null;
}

function isLoopbackHost(host: string): boolean {
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

export const StoreFactoryV2PersistedStoreBindingSchema = z
  .object({
    id: identifierSchema,
    slug: slugSchema,
    launchStatus: z.literal("PREVIEW"),
    isActive: z.literal(true),
  })
  .strict();

export type StoreFactoryV2PersistedStoreBinding = z.infer<
  typeof StoreFactoryV2PersistedStoreBindingSchema
>;

export interface PersistedStoreRevisionListItemV2 {
  id: string;
  revisionNumber: number;
  parentRevisionId: string | null;
  buildRunId: string;
  outputDigest: string;
  status: StoreRevisionV2["status"];
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
  activePreview: boolean;
}

export interface PersistedStoreBuildEventViewV2 {
  id: string;
  buildRunId: string;
  sequence: number;
  phase: string;
  type: string;
  detail: string;
  createdAt: string;
  audit: {
    actor: string | null;
    reason: string | null;
    previousRevisionId: string | null;
    targetRevisionId: string | null;
    previousPointerVersion: number | null;
    pointerVersion: number | null;
  };
}

export interface PersistedStoreFactoryWorkspaceV2 {
  version: typeof STORE_FACTORY_V2_ADMIN_RUNTIME;
  storeId: string;
  storeSlug: string;
  storeName: string;
  niche: string;
  selectedRevision: PersistedStoreRevisionListItemV2;
  revisions: readonly PersistedStoreRevisionListItemV2[];
  pointer: PreviewRevisionPointerV1;
  renderDocument: StoreExperienceRenderDocumentV2;
  catalog: StoreExperienceCatalogProjectionV2;
  manifest: StoreExperienceManifestV2;
  diff: ReturnType<typeof diffStoreRevisionV2>;
  diffBaseRevisionId: string | null;
  events: readonly PersistedStoreBuildEventViewV2[];
  build: {
    fixtureKey: "drones" | "apparel" | "consumables" | null;
    experienceVariant: "BASELINE" | "REFINED";
    activeExperienceVariant: "BASELINE" | "REFINED" | null;
    activeRevisionStatus: StoreRevisionV2["status"] | null;
    canCreateBaseline: boolean;
    canCreateRefined: boolean;
    refinedEligibilityReason:
      | "ACTIVE_APPROVED_BASELINE"
      | "NO_ACTIVE_PREVIEW"
      | "ACTIVE_NOT_APPROVED"
      | "ACTIVE_NOT_BASELINE"
      | "ACTIVE_REFERENCE_FIXTURE_UNAVAILABLE"
      | "SELECTED_REFERENCE_FIXTURE_MISMATCH";
  };
  activation: {
    scope: "PREVIEW_ONLY";
    liveAuthorized: false;
    indexingAuthorized: false;
  };
}

type RevisionListRow = {
  id: unknown;
  revisionNumber: unknown;
  parentRevisionId: unknown;
  buildRunId: unknown;
  outputDigest: unknown;
  status: unknown;
  createdAt: unknown;
  reviewedAt: unknown;
  reviewedBy: unknown;
  reviewReason: unknown;
};

type CatalogArtifactRow = {
  id: unknown;
  sourceKind: unknown;
  contractVersion: unknown;
  artifactJson: unknown;
  contentDigest: unknown;
};

export interface StoreFactoryV2AdminReadClient {
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
}

export interface LoadPersistedStoreFactoryWorkspaceInputV2 {
  storeId: string;
  storeSlug: string;
  storeName: string;
  niche: string;
  launchStatus: string;
  isActive: boolean;
  requestedRevisionId?: string | null;
}

export type LoadPersistedStoreFactoryWorkspaceResultV2 =
  | { status: "LOADED"; workspace: PersistedStoreFactoryWorkspaceV2 }
  | { status: "EMPTY"; workspace: null }
  | { status: "REVISION_NOT_FOUND"; workspace: null };

/** Strict gate used immediately before every Store Factory persistence call. */
export function assertStoreFactoryV2AdminRuntimeEnabled(input: {
  featureEnabled: boolean;
  schema: StoreFactoryV2SchemaReport;
}): void {
  if (!input.featureEnabled) {
    throw new StoreFactoryV2AdminRuntimeError(
      "FEATURE_DISABLED",
      "Storefront V2 is disabled."
    );
  }
  if (
    input.schema.status !== "COMPLETE" ||
    input.schema.persistenceEnabled !== true
  ) {
    throw new StoreFactoryV2AdminRuntimeError(
      "SCHEMA_NOT_COMPLETE",
      "Store Factory V2 schema capability is not complete."
    );
  }
}

/** All persisted reads and writes are restricted to explicit active PREVIEW pilots. */
export function assertStoreFactoryV2PilotStoreEnabled(input: {
  store: {
    id: string;
    slug: string;
    launchStatus: string;
    isActive: boolean;
  };
  pilotStoreIds: ReadonlySet<string>;
}): asserts input is {
  store: StoreFactoryV2PersistedStoreBinding;
  pilotStoreIds: ReadonlySet<string>;
} {
  const binding = StoreFactoryV2PersistedStoreBindingSchema.safeParse(input.store);
  if (!binding.success) {
    throw new StoreFactoryV2AdminRuntimeError(
      "STORE_NOT_PREVIEW_ACTIVE",
      "Persisted Store Factory V2 requires an active PREVIEW store."
    );
  }
  if (!input.pilotStoreIds.has(binding.data.id)) {
    throw new StoreFactoryV2AdminRuntimeError(
      "PILOT_STORE_NOT_ALLOWED",
      "The store is not in the explicit Store Factory V2 pilot allowlist."
    );
  }
}

/**
 * Tenant-scoped read adapter. Revision JSON is parsed and digest-verified by
 * the durable repository before any artifact reaches the renderer.
 */
export async function loadPersistedStoreFactoryWorkspaceV2(
  input: LoadPersistedStoreFactoryWorkspaceInputV2,
  dependencies: {
    db: StoreFactoryV2AdminReadClient;
    repository: StoreFactoryV2Repository;
    featureEnabled: boolean;
    schema: StoreFactoryV2SchemaReport;
    pilotStoreIds: ReadonlySet<string>;
  }
): Promise<LoadPersistedStoreFactoryWorkspaceResultV2> {
  assertStoreFactoryV2AdminRuntimeEnabled(dependencies);
  const storeId = identifierSchema.parse(input.storeId);
  const storeSlug = slugSchema.parse(input.storeSlug);
  assertStoreFactoryV2PilotStoreEnabled({
    store: {
      id: storeId,
      slug: storeSlug,
      launchStatus: input.launchStatus,
      isActive: input.isActive,
    },
    pilotStoreIds: dependencies.pilotStoreIds,
  });
  const requestedRevisionId = input.requestedRevisionId
    ? identifierSchema.parse(input.requestedRevisionId)
    : null;

  // The active pointer is authoritative. It is read before revision history so
  // a corrupt or cross-tenant target can never silently fall back to "latest".
  const pointer = await dependencies.repository.getPreviewPointer(storeId);
  if (pointer.storeId !== storeId) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_TENANT_MISMATCH",
      "Preview pointer escaped its tenant scope."
    );
  }

  let activeRow: RevisionListRow | null = null;
  let activeMetadataExact: PersistedStoreRevisionListItemV2 | null = null;
  if (pointer.activeRevisionId) {
    const activeRows = await dependencies.db.$queryRawUnsafe<RevisionListRow[]>(
      `${revisionListProjection()}
       WHERE "storeId" = $1 AND "id" = $2
       LIMIT 1`,
      storeId,
      pointer.activeRevisionId
    );
    activeRow = activeRows[0] ?? null;
    try {
      activeMetadataExact = activeRow ? parseRevisionListRow(activeRow) : null;
    } catch {
      activeMetadataExact = null;
    }
    if (!activeMetadataExact || activeMetadataExact.id !== pointer.activeRevisionId) {
      throw new StoreFactoryV2AdminRuntimeError(
        "ACTIVE_POINTER_INVALID",
        "The active preview pointer does not resolve to an exact tenant revision."
      );
    }
  }

  const selectedRevisionId = requestedRevisionId ?? pointer.activeRevisionId;
  let selectedRow =
    selectedRevisionId && selectedRevisionId === pointer.activeRevisionId
      ? activeRow
      : null;
  if (selectedRevisionId && !selectedRow) {
    const selectedRows = await dependencies.db.$queryRawUnsafe<RevisionListRow[]>(
      `${revisionListProjection()}
       WHERE "storeId" = $1 AND "id" = $2
       LIMIT 1`,
      storeId,
      selectedRevisionId
    );
    selectedRow = selectedRows[0] ?? null;
    if (
      !selectedRow ||
      identifierSchema.safeParse(selectedRow.id).data !== selectedRevisionId
    ) {
      return { status: "REVISION_NOT_FOUND", workspace: null };
    }
  }

  const rows = await dependencies.db.$queryRawUnsafe<RevisionListRow[]>(
    `${revisionListProjection()}
     WHERE "storeId" = $1
     ORDER BY "revisionNumber" DESC
     LIMIT 50`,
    storeId
  );
  if (rows.length === 0 && !selectedRow) {
    return { status: "EMPTY", workspace: null };
  }

  let metadata = rows.map(parseRevisionListRow);
  if (activeMetadataExact) {
    metadata = metadata.filter(
      (revision) => revision.id !== activeMetadataExact.id
    );
    metadata.push(activeMetadataExact);
  }
  if (selectedRow && selectedRevisionId !== activeMetadataExact?.id) {
    let selectedMetadataExact: PersistedStoreRevisionListItemV2;
    try {
      selectedMetadataExact = parseRevisionListRow(selectedRow);
    } catch {
      throw new StoreFactoryV2AdminRuntimeError(
        "REVISION_RUNTIME_INVALID",
        "The selected revision metadata is malformed."
      );
    }
    metadata = metadata.filter(
      (revision) => revision.id !== selectedMetadataExact.id
    );
    metadata.push(selectedMetadataExact);
  }
  metadata.sort((left, right) => right.revisionNumber - left.revisionNumber);
  metadata = metadata.map((revision) => ({
    ...revision,
    activePreview: pointer.activeRevisionId === revision.id,
  }));

  const selectedMetadata = selectedRevisionId
    ? metadata.find((revision) => revision.id === selectedRevisionId)
    : metadata[0];
  if (!selectedMetadata) {
    return { status: "REVISION_NOT_FOUND", workspace: null };
  }

  let activeRevision: StoreRevisionV2 | null = null;
  let activeProjection: CatalogProjectionV2 | null = null;
  if (activeMetadataExact) {
    try {
      activeRevision = await dependencies.repository.getRevision(
        activeMetadataExact.id
      );
      assertRevisionMatchesMetadata(storeId, activeMetadataExact, activeRevision);
      if (activeRevision.status !== "APPROVED") {
        throw new Error("Active revision is not approved.");
      }
      activeProjection = await loadBoundCatalogProjection(
        dependencies.db,
        storeId,
        activeRevision
      );
    } catch {
      throw new StoreFactoryV2AdminRuntimeError(
        "ACTIVE_POINTER_INVALID",
        "The active preview pointer target failed immutable revision validation."
      );
    }
  }

  const selected =
    activeRevision?.id === selectedMetadata.id
      ? activeRevision
      : await dependencies.repository.getRevision(selectedMetadata.id);
  assertRevisionMatchesMetadata(storeId, selectedMetadata, selected);

  let baseMetadata = selected.parentRevisionId
    ? metadata.find((revision) => revision.id === selected.parentRevisionId)
    : metadata.find(
        (revision) => revision.revisionNumber < selected.revisionNumber
      );
  if (selected.parentRevisionId && !baseMetadata) {
    const parentRows = await dependencies.db.$queryRawUnsafe<RevisionListRow[]>(
      `${revisionListProjection()}
       WHERE "storeId" = $1 AND "id" = $2
       LIMIT 1`,
      storeId,
      selected.parentRevisionId
    );
    if (parentRows[0]) baseMetadata = parseRevisionListRow(parentRows[0]);
  }
  const base = baseMetadata
    ? await dependencies.repository.getRevision(baseMetadata.id)
    : null;
  if (baseMetadata) assertRevisionMatchesMetadata(storeId, baseMetadata, base);

  const persistedProjection =
    activeRevision?.id === selected.id && activeProjection
      ? activeProjection
      : await loadBoundCatalogProjection(dependencies.db, storeId, selected);
  const catalog = revisionExperienceCatalog(selected, input, persistedProjection);
  const validation = validateStoreExperienceManifestV2(
    selected.document.experienceManifest,
    catalog
  );
  if (!validation.success) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      `Persisted manifest failed runtime validation: ${validation.issues
        .map((issue) => issue.code)
        .join(",")}`
    );
  }
  const renderDocumentResult = StoreExperienceRenderDocumentV2Schema.safeParse({
    version: STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
    revisionId: selected.id,
    brief: selected.document.brief,
    catalog,
    manifest: validation.manifest,
    contentProposal: selected.document.contentProposal,
    artifactDigests: {
      catalog: digestCatalogValue(catalog),
      manifest: digestCatalogValue(validation.manifest),
      contentProposal: digestCatalogValue(selected.document.contentProposal),
    },
    activation: selected.document.activation,
  });
  if (!renderDocumentResult.success) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Persisted revision artifacts do not form a valid render document."
    );
  }
  const renderDocument = renderDocumentResult.data;

  const events = await dependencies.repository.listStoreBuildEvents(storeId);
  const selectedFixtureKey = referenceFixtureKey(
    selected.document.catalogShape.productClass
  );
  const activeFixtureKey = activeRevision
    ? referenceFixtureKey(activeRevision.document.catalogShape.productClass)
    : null;
  const activeExperienceVariant =
    activeRevision?.document.experienceVariant ?? null;
  let refinedEligibilityReason: PersistedStoreFactoryWorkspaceV2["build"]["refinedEligibilityReason"];
  if (!activeRevision) {
    refinedEligibilityReason = "NO_ACTIVE_PREVIEW";
  } else if (activeRevision.status !== "APPROVED") {
    refinedEligibilityReason = "ACTIVE_NOT_APPROVED";
  } else if (activeExperienceVariant !== "BASELINE") {
    refinedEligibilityReason = "ACTIVE_NOT_BASELINE";
  } else if (!activeFixtureKey) {
    refinedEligibilityReason = "ACTIVE_REFERENCE_FIXTURE_UNAVAILABLE";
  } else if (selectedFixtureKey !== activeFixtureKey) {
    refinedEligibilityReason = "SELECTED_REFERENCE_FIXTURE_MISMATCH";
  } else {
    refinedEligibilityReason = "ACTIVE_APPROVED_BASELINE";
  }

  return {
    status: "LOADED",
    workspace: {
      version: STORE_FACTORY_V2_ADMIN_RUNTIME,
      storeId,
      storeSlug: slugSchema.parse(input.storeSlug),
      storeName: input.storeName,
      niche: input.niche,
      selectedRevision: metadata.find(
        (revision) => revision.id === selected.id
      )!,
      revisions: metadata,
      pointer,
      renderDocument,
      catalog: renderDocument.catalog,
      manifest: renderDocument.manifest,
      diff: diffStoreRevisionV2(
        base?.document ?? {},
        selected.document,
        { maxEntries: 100 }
      ),
      diffBaseRevisionId: base?.id ?? null,
      events: events.map(eventView),
      build: {
        fixtureKey: selectedFixtureKey,
        experienceVariant: selected.document.experienceVariant,
        activeExperienceVariant,
        activeRevisionStatus: activeRevision?.status ?? null,
        canCreateBaseline: selectedFixtureKey !== null,
        canCreateRefined:
          refinedEligibilityReason === "ACTIVE_APPROVED_BASELINE",
        refinedEligibilityReason,
      },
      activation: renderDocument.activation,
    },
  };
}

export interface ExecuteStoreFactoryV2AdminMutationDependencies {
  schema: StoreFactoryV2SchemaReport;
  featureEnabled: boolean;
  pilotStoreIds: ReadonlySet<string>;
  repository: StoreFactoryV2Repository;
  findStore: (input: {
    id: string;
    slug: string;
  }) => Promise<{
    id: string;
    slug: string;
    launchStatus: string;
    isActive: boolean;
  } | null>;
  clock?: () => Date;
}

export interface StoreFactoryV2AdminMutationResult
  extends PreviewOnlyMutationV1 {
  intent: StoreFactoryV2AdminMutationInput["intent"];
  revisionId: string;
  pointerVersion: number | null;
}

async function resolvePersistedMutationStore(
  binding: { storeId: string; storeSlug: string },
  dependencies: ExecuteStoreFactoryV2AdminMutationDependencies
): Promise<StoreFactoryV2PersistedStoreBinding> {
  assertStoreFactoryV2AdminRuntimeEnabled(dependencies);
  const store = await dependencies.findStore({
    id: binding.storeId,
    slug: binding.storeSlug,
  });
  if (!store || store.id !== binding.storeId || store.slug !== binding.storeSlug) {
    throw new StoreFactoryV2AdminRuntimeError(
      "STORE_NOT_FOUND",
      "Store binding was not found."
    );
  }
  assertStoreFactoryV2PilotStoreEnabled({
    store,
    pilotStoreIds: dependencies.pilotStoreIds,
  });
  return StoreFactoryV2PersistedStoreBindingSchema.parse(store);
}

/** Review is revision-CAS: status and output digest are resolved server-side. */
export async function executeStoreFactoryV2AdminReview(
  rawInput: unknown,
  dependencies: ExecuteStoreFactoryV2AdminMutationDependencies
): Promise<StoreFactoryV2AdminMutationResult> {
  const input = StoreFactoryV2AdminReviewInputSchema.parse(rawInput);
  await resolvePersistedMutationStore(input, dependencies);
  const revision = await dependencies.repository.getRevision(input.revisionId);
  if (!revision) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_NOT_FOUND_FOR_STORE",
      "Revision was not found."
    );
  }
  if (revision.storeId !== input.storeId) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_TENANT_MISMATCH",
      "Revision does not belong to the requested store."
    );
  }
  if (revision.status !== "DRAFT") {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_STATE_CONFLICT",
      `Review expected a DRAFT revision, found ${revision.status}.`
    );
  }
  if (revision.outputDigest !== input.expectedOutputDigest) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_STATE_CONFLICT",
      "Review output digest no longer matches the immutable revision."
    );
  }

  const service = new StoreFactoryV2Service({
    repository: dependencies.repository,
    clock: dependencies.clock,
    assembler: {
      assemble: () => {
        throw new Error("Admin revision controls cannot assemble builds.");
      },
    },
  });
  const actor = "shared-admin-session";
  const request = {
    version: REVISION_REVIEW_REQUEST_V2,
    storeId: input.storeId,
    revisionId: input.revisionId,
    expectedOutputDigest: input.expectedOutputDigest,
    reviewedBy: actor,
    reason: input.reason,
  };
  const result =
    input.intent === "APPROVE"
      ? await service.approveRevision(request)
      : await service.rejectRevision(request);

  if (result.scope !== "PREVIEW_ONLY" || result.liveStatusChanged !== false) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Revision operation crossed the preview-only boundary."
    );
  }
  return {
    intent: input.intent,
    revisionId: input.revisionId,
    pointerVersion: null,
    scope: "PREVIEW_ONLY",
    liveStatusChanged: false,
  };
}

/** Pointer changes are version-CAS and never share the review contract. */
export async function executeStoreFactoryV2AdminPointerMutation(
  rawInput: unknown,
  dependencies: ExecuteStoreFactoryV2AdminMutationDependencies
): Promise<StoreFactoryV2AdminMutationResult> {
  const input = StoreFactoryV2AdminPointerInputSchema.parse(rawInput);
  await resolvePersistedMutationStore(input, dependencies);

  const [revision, pointer] = await Promise.all([
    dependencies.repository.getRevision(input.revisionId),
    dependencies.repository.getPreviewPointer(input.storeId),
  ]);
  if (!revision) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_NOT_FOUND_FOR_STORE",
      "Revision was not found."
    );
  }
  if (revision.storeId !== input.storeId || pointer.storeId !== input.storeId) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_TENANT_MISMATCH",
      "Revision or preview pointer does not belong to the requested store."
    );
  }
  if (pointer.version !== input.expectedPointerVersion) {
    throw new StoreFactoryV2AdminRuntimeError(
      "POINTER_VERSION_CONFLICT",
      `Expected preview pointer version ${input.expectedPointerVersion}, found ${pointer.version}.`
    );
  }

  const service = new StoreFactoryV2Service({
    repository: dependencies.repository,
    clock: dependencies.clock,
    assembler: {
      assemble: () => {
        throw new Error("Admin revision controls cannot assemble builds.");
      },
    },
  });
  const request = {
    version: PREVIEW_POINTER_MUTATION_V1,
    storeId: input.storeId,
    targetRevisionId: input.revisionId,
    expectedPointerVersion: input.expectedPointerVersion,
    changedBy: "shared-admin-session",
    reason: input.reason,
  };
  const result =
    input.intent === "PROMOTE"
      ? await service.promotePreviewRevision(request)
      : await service.rollbackPreviewRevision(request);
  if (result.scope !== "PREVIEW_ONLY" || result.liveStatusChanged !== false) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Revision operation crossed the preview-only boundary."
    );
  }
  return {
    intent: input.intent,
    revisionId: input.revisionId,
    pointerVersion: result.pointer.version,
    scope: "PREVIEW_ONLY",
    liveStatusChanged: false,
  };
}

/** Compatibility dispatcher; new server actions call the split functions. */
export async function executeStoreFactoryV2AdminMutation(
  rawInput: unknown,
  dependencies: ExecuteStoreFactoryV2AdminMutationDependencies
): Promise<StoreFactoryV2AdminMutationResult> {
  const input = StoreFactoryV2AdminMutationInputSchema.parse(rawInput);
  return input.intent === "APPROVE" || input.intent === "REJECT"
    ? executeStoreFactoryV2AdminReview(input, dependencies)
    : executeStoreFactoryV2AdminPointerMutation(input, dependencies);
}

function revisionListProjection(): string {
  return `SELECT "id", "revisionNumber", "parentRevisionId", "buildRunId",
                 "outputDigest", "status", "createdAt", "reviewedAt",
                 "reviewedBy", "reviewReason"
          FROM "StoreRevision"`;
}

function parseRevisionListRow(
  row: RevisionListRow
): PersistedStoreRevisionListItemV2 {
  return {
    id: identifierSchema.parse(row.id),
    revisionNumber: z.number().int().positive().parse(row.revisionNumber),
    parentRevisionId:
      row.parentRevisionId === null
        ? null
        : identifierSchema.parse(row.parentRevisionId),
    buildRunId: identifierSchema.parse(row.buildRunId),
    outputDigest: z.string().regex(/^[a-f0-9]{64}$/).parse(row.outputDigest),
    status: RevisionStatusV1Schema.parse(row.status),
    createdAt: toIso(row.createdAt),
    reviewedAt: row.reviewedAt === null ? null : toIso(row.reviewedAt),
    reviewedBy:
      row.reviewedBy === null
        ? null
        : z.string().trim().min(1).max(200).parse(row.reviewedBy),
    reviewReason:
      row.reviewReason === null
        ? null
        : z.string().trim().min(1).max(2_000).parse(row.reviewReason),
    activePreview: false,
  };
}

function assertRevisionMatchesMetadata(
  storeId: string,
  metadata: PersistedStoreRevisionListItemV2,
  revision: StoreRevisionV2 | null
): asserts revision is StoreRevisionV2 {
  if (!revision) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_NOT_FOUND_FOR_STORE",
      "Revision disappeared while loading the workspace."
    );
  }
  if (
    revision.storeId !== storeId ||
    revision.id !== metadata.id ||
    revision.buildRunId !== metadata.buildRunId ||
    revision.revisionNumber !== metadata.revisionNumber ||
    revision.outputDigest !== metadata.outputDigest ||
    revision.status !== metadata.status
  ) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_TENANT_MISMATCH",
      "Revision metadata does not match its tenant-scoped index."
    );
  }
}

async function loadBoundCatalogProjection(
  db: StoreFactoryV2AdminReadClient,
  storeId: string,
  revision: StoreRevisionV2
): Promise<CatalogProjectionV2> {
  const rows = await db.$queryRawUnsafe<CatalogArtifactRow[]>(
    `SELECT "id", "sourceKind", "contractVersion", "artifactJson", "contentDigest"
     FROM "CatalogArtifactV2"
     WHERE "storeId" = $1 AND "id" = $2
     LIMIT 1`,
    storeId,
    revision.catalogArtifactId
  );
  const row = rows[0];
  if (!row || identifierSchema.safeParse(row.id).data !== revision.catalogArtifactId) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Revision catalog binding does not resolve to an exact tenant artifact."
    );
  }
  const sourceKind = z
    .enum(["REFERENCE_FIXTURE", "CATALOG_PROJECTION"])
    .parse(row.sourceKind);
  const contractVersion = z.string().trim().min(1).max(120).parse(row.contractVersion);
  const contentDigest = z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .parse(row.contentDigest);
  let artifactJson: unknown;
  try {
    artifactJson =
      typeof row.artifactJson === "string"
        ? JSON.parse(row.artifactJson)
        : row.artifactJson;
  } catch {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Persisted catalog artifact JSON is malformed."
    );
  }
  const parsedArtifact =
    sourceKind === "REFERENCE_FIXTURE"
      ? CatalogReferenceFixtureV2Schema.parse(artifactJson)
      : CatalogProjectionV2Schema.parse(artifactJson);
  if (
    revision.catalogBinding.artifactId !== revision.catalogArtifactId ||
    revision.catalogBinding.sourceKind !== sourceKind ||
    revision.catalogBinding.artifactContractVersion !== contractVersion ||
    revision.catalogBinding.artifactDigest !== contentDigest ||
    digestCatalogValue(parsedArtifact) !== contentDigest
  ) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Persisted catalog artifact failed binding or digest verification."
    );
  }

  let projection: CatalogProjectionV2;
  if (sourceKind === "REFERENCE_FIXTURE") {
    const projected = buildCatalogProjectionV2(parsedArtifact);
    if (projected.status !== "PROJECTED") {
      throw new StoreFactoryV2AdminRuntimeError(
        "REVISION_RUNTIME_INVALID",
        "Bound reference catalog cannot be projected."
      );
    }
    projection = projected.projection;
  } else {
    projection = CatalogProjectionV2Schema.parse(parsedArtifact);
  }
  if (
    projection.projectionRef !== revision.catalogBinding.projectionRef ||
    digestCanonicalArtifactV1(projection) !== revision.catalogBinding.projectionDigest ||
    digestCanonicalArtifactV1(revision.document.catalogProjection) !==
      revision.catalogBinding.projectionDigest
  ) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Persisted catalog projection does not match the immutable revision."
    );
  }
  return projection;
}

function revisionExperienceCatalog(
  revision: StoreRevisionV2,
  input: Pick<
    LoadPersistedStoreFactoryWorkspaceInputV2,
    "storeName" | "niche"
  >,
  projection: CatalogProjectionV2
): StoreExperienceCatalogProjectionV2 {
  return catalogProjectionToStoreExperienceV2({
    catalog: projection,
    store: {
      name: revision.document.brief.name || input.storeName,
      niche: revision.document.brief.niche || input.niche,
    },
    verifiedClaims: [],
  });
}

function eventView(event: StoreBuildEventV1): PersistedStoreBuildEventViewV2 {
  const detailByType: Record<StoreBuildEventV1["type"], string> = {
    RUN_STARTED: "Build request claimed with an idempotent request key.",
    PHASE_ENTERED: `Build entered ${event.phase.replaceAll("_", " ").toLowerCase()}.`,
    REVISION_CREATED: "Immutable revision artifact persisted after deterministic QA.",
    RUN_SUCCEEDED: "Build completed successfully with matching output digests.",
    RUN_FAILED: "Build settled without a promotable revision.",
    REVISION_APPROVED: "Revision approved for internal preview only.",
    REVISION_REJECTED: "Revision rejected; its immutable history remains available.",
    PREVIEW_PROMOTED: "Preview pointer changed through compare-and-swap.",
    PREVIEW_ROLLED_BACK: "Preview pointer rolled back through compare-and-swap.",
  };
  return {
    id: event.id,
    buildRunId: event.buildRunId,
    sequence: event.sequence,
    phase: event.phase,
    type: event.type,
    detail: detailByType[event.type],
    createdAt: event.createdAt,
    audit: {
      actor: eventText(event.payload, "changedBy") ?? eventText(event.payload, "reviewedBy"),
      reason: eventText(event.payload, "reason"),
      previousRevisionId: eventText(event.payload, "previousRevisionId"),
      targetRevisionId: eventText(event.payload, "revisionId"),
      previousPointerVersion: eventInteger(
        event.payload,
        "previousPointerVersion"
      ),
      pointerVersion: eventInteger(event.payload, "pointerVersion"),
    },
  };
}

function eventText(
  payload: Readonly<Record<string, unknown>>,
  key: string
): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length <= 2_000 ? value : null;
}

function eventInteger(
  payload: Readonly<Record<string, unknown>>,
  key: string
): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function referenceFixtureKey(
  productClass: string
): PersistedStoreFactoryWorkspaceV2["build"]["fixtureKey"] {
  const key = productClass.startsWith("reference.")
    ? productClass.slice("reference.".length)
    : "";
  return key === "drones" || key === "apparel" || key === "consumables"
    ? key
    : null;
}

function toIso(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new StoreFactoryV2AdminRuntimeError(
      "REVISION_RUNTIME_INVALID",
      "Persisted revision timestamp is invalid."
    );
  }
  return date.toISOString();
}

export function storeFactoryV2AdminErrorCode(error: unknown): string {
  if (error instanceof StoreFactoryV2AdminRuntimeError) return error.code;
  if (error instanceof StoreFactoryV2Error) return error.code;
  if (error instanceof z.ZodError) return "INVALID_REQUEST";
  return "ACTION_FAILED";
}
