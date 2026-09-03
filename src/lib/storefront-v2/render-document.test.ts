import assert from "node:assert/strict";
import test from "node:test";
import { digestCatalogValue } from "@/lib/catalog-v2/canonical";
import {
  StoreExperienceRenderDocumentV2Schema,
  STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
} from "./render-document";
import { catalogProjectionToStoreExperienceV2 } from "./catalog-context";
import {
  storeFactoryBuildRequestFixtureV1,
  storeRevisionCandidateFixtureV1,
} from "@/lib/store-factory-v2/test-fixtures";

function validDocument() {
  const request = storeFactoryBuildRequestFixtureV1();
  const candidate = storeRevisionCandidateFixtureV1(request);
  const catalog = catalogProjectionToStoreExperienceV2({
    catalog: candidate.catalogProjection,
    store: {
      name: request.brief.name,
      niche: request.brief.niche,
    },
    verifiedClaims: [],
  });
  return {
    version: STORE_EXPERIENCE_RENDER_DOCUMENT_V2,
    revisionId: "revision-1",
    brief: request.brief,
    catalog,
    manifest: candidate.experienceManifest,
    contentProposal: candidate.contentProposal,
    artifactDigests: {
      catalog: digestCatalogValue(catalog),
      manifest: digestCatalogValue(candidate.experienceManifest),
      contentProposal: digestCatalogValue(candidate.contentProposal),
    },
    activation: {
      scope: "PREVIEW_ONLY" as const,
      liveAuthorized: false as const,
      indexingAuthorized: false as const,
    },
  };
}

test("render document is strict, linked and deeply immutable", () => {
  const document = StoreExperienceRenderDocumentV2Schema.parse(validDocument());

  assert.equal(document.revisionId, "revision-1");
  assert.equal(document.brief.name, document.catalog.store.name);
  assert.equal(
    document.catalog.projectionRef,
    document.contentProposal.catalogProjectionRef
  );
  assert.equal(Object.isFrozen(document), true);
  assert.equal(Object.isFrozen(document.catalog), true);
  assert.equal(Object.isFrozen(document.catalog.products), true);
  assert.equal(Object.isFrozen(document.contentProposal.homepage), true);
  assert.equal(Object.isFrozen(document.manifest.pages.home.blocks), true);
  assert.throws(
    () => Object.defineProperty(document, "revisionId", { value: "revision-2" }),
    TypeError
  );

  for (const invalid of [
    {
      ...validDocument(),
      executableHtml: "<script>alert(1)</script>",
    },
    { ...validDocument(), version: "store-experience-render-document.v3" },
    { ...validDocument(), revisionId: "../revision" },
  ]) {
    assert.equal(
      StoreExperienceRenderDocumentV2Schema.safeParse(invalid).success,
      false
    );
  }
});

test("render document refuses cross-revision artifact combinations", () => {
  const wrongProjection = structuredClone(validDocument());
  wrongProjection.contentProposal.catalogProjectionRef = "projection-other";
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(wrongProjection).success,
    false
  );

  const wrongStore = structuredClone(validDocument());
  wrongStore.catalog.store.name = "Different store";
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(wrongStore).success,
    false
  );

  const incompleteContent = structuredClone(validDocument());
  incompleteContent.contentProposal.products.pop();
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(incompleteContent).success,
    false
  );

  const unknownGuideReference = structuredClone(validDocument());
  unknownGuideReference.contentProposal.guides.push({
    slug: "unknown-product-guide",
    title: "Unknown product guide",
    summary: "A guide with an invalid product relationship.",
    sections: [
      {
        heading: "Overview",
        paragraphs: ["This relationship must fail closed."],
      },
    ],
    relatedProductRefs: ["product-does-not-exist"],
  });
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(unknownGuideReference)
      .success,
    false
  );

  const executableContent = structuredClone(validDocument());
  executableContent.contentProposal.homepage.headline =
    "<script>alert(1)</script>";
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(executableContent).success,
    false
  );

  const tamperedCatalog = structuredClone(validDocument());
  tamperedCatalog.catalog.products[0].title = "Digest bypass attempt";
  assert.equal(
    StoreExperienceRenderDocumentV2Schema.safeParse(tamperedCatalog).success,
    false
  );
});

test("render document cannot authorize live or indexed output", () => {
  for (const activation of [
    {
      scope: "LIVE",
      liveAuthorized: false,
      indexingAuthorized: false,
    },
    {
      scope: "PREVIEW_ONLY",
      liveAuthorized: true,
      indexingAuthorized: false,
    },
    {
      scope: "PREVIEW_ONLY",
      liveAuthorized: false,
      indexingAuthorized: true,
    },
  ]) {
    assert.equal(
      StoreExperienceRenderDocumentV2Schema.safeParse({
        ...validDocument(),
        activation,
      }).success,
      false
    );
  }
});
