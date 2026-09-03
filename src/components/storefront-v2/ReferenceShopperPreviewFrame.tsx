"use client";

import { resolveReferenceStoreMediaV2 } from "@/lib/reference-store-media-v2";
import type { StoreExperienceRenderDocumentV2 } from "@/lib/storefront-v2/render-document";
import { ReferenceShopperPreviewV2 } from "./ReferenceShopperPreview";

export interface ReferenceShopperPreviewFrameV2Props {
  document: StoreExperienceRenderDocumentV2;
}

/**
 * Client boundary for the authenticated iframe route. It receives one already
 * verified immutable document and exposes no persistence or public routing.
 */
export function ReferenceShopperPreviewFrameV2({
  document,
}: ReferenceShopperPreviewFrameV2Props) {
  return (
    <main
      className="min-h-screen min-w-0 bg-white"
      data-reference-shopper-frame="authenticated-admin-v2"
      data-render-document-id={`${document.version}:${document.revisionId}`}
      data-preview-scope={document.activation.scope}
    >
      <ReferenceShopperPreviewV2
        revisionKey={document.revisionId}
        catalog={document.catalog}
        manifest={document.manifest}
        contentProposal={document.contentProposal}
        resolveMedia={resolveReferenceStoreMediaV2}
      />
    </main>
  );
}
