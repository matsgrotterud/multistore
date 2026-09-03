import { prisma } from "@/lib/db";
import { ingestRequiredCandidateMedia } from "@/lib/catalog/candidate-media-ingestion";
import { upsertCandidateFromResult } from "@/lib/catalog/candidate-service";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";

export async function enrichCandidate(candidateId: string): Promise<void> {
  const candidate = await prisma.productCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  const provider = getCommerceProvider(candidate.providerKey);
  const details = await provider.getProductDetails({
    externalId: candidate.externalId,
    sourceUrl: candidate.sourceUrl ?? undefined,
  });
  const updated = await upsertCandidateFromResult({
    storeId: candidate.storeId,
    categoryId: candidate.categoryId ?? undefined,
    providerKey: provider.key,
    result: details,
    providerReliability: 0.75,
  });
  if (updated.status === "ENRICHING") {
    const mediaResult = await ingestRequiredCandidateMedia({
      candidateId: updated.id,
      providerKey: provider.key,
      externalId: details.externalId,
      title: details.title,
      media: details.media,
    });
    if (
      !mediaResult.mediaReady ||
      !["ENRICHED", "APPROVED", "IMPORTED"].includes(
        mediaResult.finalStatus ?? ""
      )
    ) {
      throw new Error(
        [mediaResult.rejectionReason, ...mediaResult.diagnostics]
          .filter(Boolean)
          .join("; ") || "Candidate media enrichment did not reach a ready state."
      );
    }
  }
}
