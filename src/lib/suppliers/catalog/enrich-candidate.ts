import { prisma } from "@/lib/db";
import { ingestProductMedia } from "@/lib/media/ingest-product-media";
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
  if (details.media.length > 0) {
    await ingestProductMedia({
      candidateId: updated.id,
      providerKey: provider.key,
      externalId: details.externalId,
      title: details.title,
      media: details.media,
    });
  }
}

