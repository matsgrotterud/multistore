import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogAutopilotHistoryHref,
  encodeCatalogHistoryCursor,
  parseCatalogHistoryCursor,
  parseDurableCatalogEvidence,
  type DurableCatalogEvidenceInput,
} from "./catalog-autopilot";
import { executeCatalogAutopilotManualJob } from "./catalog-autopilot-manual-run";
import { handleAdminCatalogJobRunRequest } from "./catalog-job-run-route";
import {
  CATALOG_AUTOPILOT_MANUAL_JOB_TYPES,
  parseAdminCatalogJobRunRequest,
} from "./manual-catalog-job";
import { CatalogJobNotRunnableError } from "@/lib/jobs/runner";

const observedAt = new Date("2026-08-29T10:00:00.000Z");

function unavailableEvidence(
  overrides: Partial<DurableCatalogEvidenceInput> = {}
): DurableCatalogEvidenceInput {
  return {
    providerKey: "cj",
    externalId: "supplier-1",
    sourceStatus: "SOURCE_UNAVAILABLE",
    observedAt,
    snapshotVersion: null,
    snapshotFingerprint: null,
    snapshotJson: null,
    observationReasonCodesJson: JSON.stringify(["PROVIDER_NOT_READY"]),
    proposal: {
      contractVersion: "catalog-refresh-proposal.v1",
      proposalFingerprint: "a".repeat(64),
      decision: "SOURCE_UNAVAILABLE",
      alignmentStatus: "NOT_EVALUATED",
      workflowStatus: "SOURCE_UNAVAILABLE",
      reasonCodesJson: JSON.stringify(["PROVIDER_NOT_READY"]),
      changesJson: "[]",
      alignmentJson: JSON.stringify({
        version: "catalog-alignment.v1",
        status: "NOT_EVALUATED",
        evaluatedFields: [],
        skippedFields: [],
        reasonCodes: ["CATALOG_ALIGNMENT_NOT_EVALUATED"],
        changes: [],
      }),
    },
    ...overrides,
  };
}

test("durable catalog parser accepts strict unavailable evidence", () => {
  const parsed = parseDurableCatalogEvidence(unavailableEvidence());

  assert.equal(parsed.valid, true);
  assert.equal(parsed.decision, "SOURCE_UNAVAILABLE");
  assert.equal(parsed.sourceStatus, "SOURCE_UNAVAILABLE");
  assert.deepEqual(parsed.reasonCodes, ["PROVIDER_NOT_READY"]);
  assert.equal(parsed.snapshot, null);
});

test("durable catalog parser contains malformed historical JSON", () => {
  const input = unavailableEvidence();
  input.proposal = input.proposal
    ? {
        ...input.proposal,
        reasonCodesJson: "not-json",
        alignmentJson: JSON.stringify({ version: "wrong" }),
      }
    : null;

  const parsed = parseDurableCatalogEvidence(input);

  assert.equal(parsed.valid, false);
  assert.ok(parsed.issues.includes("proposal reason codes"));
  assert.ok(parsed.issues.includes("alignment"));
  assert.deepEqual(parsed.reasonCodes, []);
});

test("durable catalog parser rejects missing proposals and source contradictions", () => {
  const missing = parseDurableCatalogEvidence(unavailableEvidence({ proposal: null }));
  assert.equal(missing.valid, false);
  assert.ok(missing.issues.includes("proposal missing"));

  const contradicted = parseDurableCatalogEvidence(
    unavailableEvidence({ sourceStatus: "AVAILABLE" })
  );
  assert.equal(contradicted.valid, false);
  assert.ok(contradicted.issues.includes("available observation snapshot missing"));
  assert.ok(contradicted.issues.includes("decision/source mismatch"));
});

test("catalog history cursor round-trips and rejects malformed input", () => {
  const encoded = encodeCatalogHistoryCursor({ observedAt, id: "cobs_123" });
  assert.deepEqual(parseCatalogHistoryCursor(encoded), {
    observedAt,
    id: "cobs_123",
  });
  assert.equal(parseCatalogHistoryCursor("not-valid-json"), null);
  assert.equal(
    parseCatalogHistoryCursor(
      Buffer.from(JSON.stringify({ observedAt: observedAt.toISOString(), id: "x", extra: true })).toString(
        "base64url"
      )
    ),
    null
  );
});

test("catalog history href preserves only present filters", () => {
  assert.equal(
    buildCatalogAutopilotHistoryHref({
      store: "pilot-store",
      provider: "cj",
      decision: "PROPOSED",
      source: "",
      cursor: "cursor-value",
    }),
    "/admin/catalog-autopilot?store=pilot-store&provider=cj&decision=PROPOSED&cursor=cursor-value"
  );
  assert.equal(buildCatalogAutopilotHistoryHref({}), "/admin/catalog-autopilot");
});

test("admin job endpoint input requires one exact job id", () => {
  assert.deepEqual(
    parseAdminCatalogJobRunRequest({ jobId: "catalog-12345678" }),
    { jobId: "catalog-12345678" }
  );

  for (const input of [
    null,
    {},
    { jobId: "short" },
    { jobId: "catalog-12345678", batchSize: 20 },
    { jobIds: ["catalog-12345678"] },
  ]) {
    assert.throws(
      () => parseAdminCatalogJobRunRequest(input),
      /exactly one catalog job id|exact catalog job id/
    );
  }
});

test("Autopilot manual runner allowlist cannot be broadened by request input", () => {
  assert.deepEqual(CATALOG_AUTOPILOT_MANUAL_JOB_TYPES, ["REFRESH_EXISTING"]);
  assert.throws(
    () =>
      parseAdminCatalogJobRunRequest({
        jobId: "catalog-12345678",
        allowedJobTypes: ["DISCOVER"],
      }),
    /exactly one catalog job id/
  );
});

test("manual action converts stale or double-click contention into a clear isolated status", async () => {
  const state = await executeCatalogAutopilotManualJob(
    "catalog-12345678",
    async (options) => {
      assert.equal(options.jobId, "catalog-12345678");
      assert.deepEqual(options.allowedJobTypes, ["REFRESH_EXISTING"]);
      throw new CatalogJobNotRunnableError(options.jobId);
    }
  );

  assert.equal(state.status, "not-runnable");
  assert.match(state.message ?? "", /No other queued job was touched/);
});

test("manual action reports a settled selected job without exposing a broader runner", async () => {
  const state = await executeCatalogAutopilotManualJob(
    "catalog-12345678",
    async (options) => {
      assert.deepEqual(options.allowedJobTypes, ["REFRESH_EXISTING"]);
      return { succeeded: 1, failed: 0, executions: [{ outcome: "SUCCESS" }] };
    }
  );

  assert.equal(state.status, "success");
});

test("admin job API returns stable JSON 401 before parsing or running", async () => {
  let runs = 0;
  const response = await handleAdminCatalogJobRunRequest(
    new Request("http://localhost/api/admin/jobs/run", {
      method: "POST",
      body: "not-json",
    }),
    {
      isAuthenticated: async () => false,
      runExactJob: async () => {
        runs += 1;
        return {};
      },
    }
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "ADMIN_AUTH_REQUIRED",
  });
  assert.equal(runs, 0);
});

test("authenticated admin job API passes only exact REFRESH_EXISTING scope", async () => {
  const response = await handleAdminCatalogJobRunRequest(
    new Request("http://localhost/api/admin/jobs/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "catalog-12345678" }),
    }),
    {
      isAuthenticated: async () => true,
      runExactJob: async (options) => {
        assert.equal(options.jobId, "catalog-12345678");
        assert.deepEqual(options.allowedJobTypes, ["REFRESH_EXISTING"]);
        return { processed: 1 };
      },
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    summary: { processed: 1 },
  });
});
