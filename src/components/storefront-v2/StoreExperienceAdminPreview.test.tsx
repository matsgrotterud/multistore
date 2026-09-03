import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildReferenceStoreFactoryFixturesV2 } from "@/lib/reference-store-factory-v2";
import { StoreExperienceAdminPreviewV2 } from "./StoreExperienceAdminPreview";

test("immutable reference documents render only local, dimensioned synthetic media", () => {
  for (const fixture of buildReferenceStoreFactoryFixturesV2()) {
    const revision = fixture.revisions[1];
    const product = revision.renderDocument.catalog.products[0];
    const markup = renderToStaticMarkup(
      <StoreExperienceAdminPreviewV2
        document={revision.renderDocument}
        page={{ kind: "pdp", productRef: product.productId }}
      />
    );
    assert.match(markup, /data-render-document-version="store-experience-render-document.v2"/);
    assert.match(markup, /src="\/reference-store-factory-v2\//);
    assert.match(markup, /width="1254"/);
    assert.match(markup, /height="1254"/);
    assert.match(markup, /data-media-rights="VERIFIED_SYNTHETIC"/);
    assert.doesNotMatch(markup, /assets\.example\.invalid/);
  }
});
