import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCandidateApprovalCasResult,
  candidateSummaryDelta,
  enforceCandidateMediaRequirement,
  isCandidateReadyForApproval,
  requireVerifiedStoredPrimaryImage,
  selectVerifiedStoredCandidateMedia,
  selectVerifiedStoredCandidateImages,
  stageCandidateEvaluationStatus,
} from "./candidate-media-state";

test("a quality pass stays non-importable ENRICHING until durable image proof", () => {
  assert.equal(stageCandidateEvaluationStatus("ENRICHED"), "ENRICHING");
  assert.equal(isCandidateReadyForApproval("ENRICHING"), false);
  assert.deepEqual(candidateSummaryDelta("ENRICHING"), {
    enriched: 0,
    rejected: 0,
  });
  assert.throws(
    () => assertCandidateApprovalCasResult("candidate-1", 0, "ENRICHING"),
    /cannot be approved from ENRICHING/
  );
  assert.doesNotThrow(() =>
    assertCandidateApprovalCasResult("candidate-1", 1, "ENRICHED")
  );
});

test("a verified persisted image CAS-promotes ENRICHING to ENRICHED", async () => {
  const targets: string[] = [];
  const result = await enforceCandidateMediaRequirement({
    ingest: async () => ({ stored: 1, failed: 0, skipped: 0 }),
    countUsablePersistedImages: async () => 1,
    transitionCandidate: async ({ targetStatus }) => {
      targets.push(targetStatus);
      return { applied: true, actualStatus: targetStatus };
    },
  });

  assert.equal(result.mediaReady, true);
  assert.equal(result.finalStatus, "ENRICHED");
  assert.equal(result.transitionApplied, true);
  assert.deepEqual(targets, ["ENRICHED"]);
});

test("a media safety guard failure CAS-rejects with diagnostics", async () => {
  let rejectionReason = "";
  const result = await enforceCandidateMediaRequirement({
    ingest: async () => {
      throw new Error("remote database plus local media storage is blocked");
    },
    countUsablePersistedImages: async () => 0,
    transitionCandidate: async ({ targetStatus, rejectionReason: reason }) => {
      assert.equal(targetStatus, "REJECTED");
      rejectionReason = reason ?? "";
      return { applied: true, actualStatus: "REJECTED" };
    },
  });

  assert.equal(result.mediaReady, false);
  assert.equal(result.finalStatus, "REJECTED");
  assert.match(rejectionReason, /MEDIA_STORED_USABLE_IMAGE_MISSING/);
  assert.match(rejectionReason, /MEDIA_INGESTION_ERROR/);
});

test("zero-row rejection CAS reconciles APPROVED and never reports it as rejected", async () => {
  const result = await enforceCandidateMediaRequirement({
    ingest: async () => ({ stored: 0, failed: 2, skipped: 0 }),
    countUsablePersistedImages: async () => 0,
    transitionCandidate: async () => ({
      applied: false,
      actualStatus: "APPROVED",
    }),
  });

  assert.equal(result.targetStatus, "REJECTED");
  assert.equal(result.transitionApplied, false);
  assert.equal(result.finalStatus, "APPROVED");
  assert.deepEqual(candidateSummaryDelta(result.finalStatus), {
    enriched: 0,
    rejected: 0,
  });
  assert.match(result.diagnostics.at(-1) ?? "", /actual_APPROVED/);
});

test("zero-row promotion CAS reconciles the actual rejecting winner", async () => {
  const result = await enforceCandidateMediaRequirement({
    ingest: async () => ({ stored: 1, failed: 0, skipped: 0 }),
    countUsablePersistedImages: async () => 1,
    transitionCandidate: async () => ({
      applied: false,
      actualStatus: "REJECTED",
    }),
  });

  assert.equal(result.targetStatus, "ENRICHED");
  assert.equal(result.finalStatus, "REJECTED");
  assert.deepEqual(candidateSummaryDelta(result.finalStatus), {
    enriched: 0,
    rejected: 1,
  });
  assert.match(result.diagnostics.at(-1) ?? "", /actual_REJECTED/);
});

test("video-only and spoofed IMAGE rows never satisfy final image evidence", () => {
  const assets = [
      {
        mediaType: "VIDEO",
        ingestionStatus: "STORED",
        storageUrl: "https://cdn.example/video.mp4",
        contentType: "video/mp4",
        isPrimary: true,
        sortOrder: 0,
      },
      {
        mediaType: "IMAGE",
        ingestionStatus: "STORED",
        storageUrl: "https://cdn.example/spoofed.mp4",
        contentType: "video/mp4",
        isPrimary: true,
        sortOrder: 1,
      },
    ];
  const images = selectVerifiedStoredCandidateImages(
    assets,
    Boolean
  );
  const verifiedMedia = selectVerifiedStoredCandidateMedia(assets, Boolean);

  assert.deepEqual(images, []);
  assert.deepEqual(verifiedMedia.map((asset) => asset.mediaType), ["VIDEO"]);
  assert.throws(
    () => requireVerifiedStoredPrimaryImage("candidate-video-only", images),
    /requires at least one usable verified STORED IMAGE/
  );
});

test("mock candidates use the same safe ENRICHING promotion contract", async () => {
  assert.equal(stageCandidateEvaluationStatus("ENRICHED"), "ENRICHING");
  const result = await enforceCandidateMediaRequirement({
    ingest: async () => ({ stored: 0, failed: 0, skipped: 1 }),
    countUsablePersistedImages: async () => 1,
    transitionCandidate: async ({ targetStatus }) => ({
      applied: true,
      actualStatus: targetStatus,
    }),
  });
  assert.equal(result.finalStatus, "ENRICHED");
  assert.equal(isCandidateReadyForApproval(result.finalStatus ?? ""), true);
});
