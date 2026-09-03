import { prisma } from "@/lib/db";
import {
  CANDIDATE_MEDIA_STAGING_STATUS,
  enforceCandidateMediaRequirement,
  selectVerifiedStoredCandidateImages,
  type CandidateMediaRequirementOutcome,
} from "@/lib/catalog/candidate-media-state";
import {
  ingestProductMedia,
  type IngestProductMediaInput,
} from "@/lib/media/ingest-product-media";
import {
  getMediaStorageSafetyReport,
  isStoredMediaUrlUsable,
} from "@/lib/storage/media-storage-safety";
import { getStorageProvider } from "@/lib/storage/storage-provider";

/**
 * Ingest required candidate images and CAS-promote ENRICHING only after at
 * least one safe, fetched-content-verified IMAGE is durably associated.
 */
export async function ingestRequiredCandidateMedia(
  input: IngestProductMediaInput & { candidateId: string }
): Promise<CandidateMediaRequirementOutcome> {
  return enforceCandidateMediaRequirement({
    ingest: () => ingestProductMedia(input),
    countUsablePersistedImages: async () => {
      const storage = getStorageProvider();
      const safety = getMediaStorageSafetyReport();
      // With a remote DB and blocked local storage, root-relative legacy URLs
      // are machine-local, not safe evidence. Absolute durable URLs can still
      // satisfy the requirement if this candidate already has one.
      const usabilityProvider = safety.unsafe ? "vercel-blob" : storage.name;
      const assets = await prisma.productMediaAsset.findMany({
        where: { candidateId: input.candidateId },
        select: {
          mediaType: true,
          ingestionStatus: true,
          storageUrl: true,
          contentType: true,
          isPrimary: true,
          sortOrder: true,
        },
      });
      return selectVerifiedStoredCandidateImages(assets, (storageUrl) =>
        isStoredMediaUrlUsable(storageUrl, usabilityProvider)
      ).length;
    },
    transitionCandidate: async ({ targetStatus, rejectionReason }) => {
      const transition = await prisma.productCandidate.updateMany({
        where: {
          id: input.candidateId,
          status: CANDIDATE_MEDIA_STAGING_STATUS,
        },
        data: {
          status: targetStatus,
          rejectionReason: rejectionReason ?? null,
        },
      });
      if (transition.count === 1) {
        return { applied: true, actualStatus: targetStatus };
      }
      const current = await prisma.productCandidate.findUnique({
        where: { id: input.candidateId },
        select: { status: true },
      });
      return { applied: false, actualStatus: current?.status ?? null };
    },
  });
}
