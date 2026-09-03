import assert from "node:assert/strict";
import test from "node:test";
import {
  CANDIDATE_IMPORT_CLAIM_STATUS,
  executeAtomicCandidateImport,
} from "./candidate-import-transaction";

interface MemoryState {
  candidate: {
    status: string;
    importedProductId: string | null;
  };
  products: string[];
  variants: string[];
  media: string[];
  gallery: string[];
  supplierIdentityProducts: string[];
}

interface MemoryOptions {
  crashAfter?: "PRODUCT" | "VARIANT" | "MEDIA" | "GALLERY";
  failFinalization?: boolean;
  loseFirstCommitResponse?: boolean;
}

function cloneState(state: MemoryState): MemoryState {
  return structuredClone(state);
}

function commitState(target: MemoryState, source: MemoryState): void {
  target.candidate = source.candidate;
  target.products = source.products;
  target.variants = source.variants;
  target.media = source.media;
  target.gallery = source.gallery;
  target.supplierIdentityProducts = source.supplierIdentityProducts;
}

function createMemoryImporter(state: MemoryState, options: MemoryOptions = {}) {
  let transactionTail = Promise.resolve();
  let loseResponse = options.loseFirstCommitResponse === true;

  const withTransaction = <T>(
    operation: (transaction: MemoryState) => Promise<T>
  ): Promise<T> => {
    const run = transactionTail.then(async () => {
      const draft = cloneState(state);
      const result = await operation(draft);
      commitState(state, draft);
      if (loseResponse) {
        loseResponse = false;
        throw new Error("connection lost after commit");
      }
      return result;
    });
    transactionTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };

  return () =>
    executeAtomicCandidateImport({
      candidateId: "candidate-1",
      supplierIdentityLabel: "store-1/mock/external-1",
      withTransaction,
      claimCandidate: async (transaction) => {
        if (
          transaction.candidate.status !== "APPROVED" ||
          transaction.candidate.importedProductId !== null
        ) {
          return 0;
        }
        transaction.candidate.status = CANDIDATE_IMPORT_CLAIM_STATUS;
        return 1;
      },
      readCandidateState: async (transaction) => ({
        ...transaction.candidate,
      }),
      assertImportedProductIdentity: async (transaction, productId) => {
        if (!transaction.products.includes(productId)) {
          throw new Error("imported product identity is inconsistent");
        }
      },
      findSupplierIdentityProductIds: async (transaction) => [
        ...transaction.supplierIdentityProducts,
      ],
      createProductGraph: async (transaction) => {
        const productId = "product-1";
        transaction.products.push(productId);
        if (options.crashAfter === "PRODUCT") throw new Error("product crash");
        transaction.variants.push("variant-1");
        if (options.crashAfter === "VARIANT") throw new Error("variant crash");
        transaction.media.push("media-1");
        if (options.crashAfter === "MEDIA") throw new Error("media crash");
        transaction.gallery.push("image-1");
        if (options.crashAfter === "GALLERY") throw new Error("gallery crash");
        transaction.supplierIdentityProducts.push(productId);
        return productId;
      },
      finalizeCandidate: async (transaction, productId) => {
        if (
          options.failFinalization ||
          transaction.candidate.status !== CANDIDATE_IMPORT_CLAIM_STATUS ||
          transaction.candidate.importedProductId !== null
        ) {
          return 0;
        }
        transaction.candidate.status = "IMPORTED";
        transaction.candidate.importedProductId = productId;
        return 1;
      },
    });
}

function approvedState(): MemoryState {
  return {
    candidate: { status: "APPROVED", importedProductId: null },
    products: [],
    variants: [],
    media: [],
    gallery: [],
    supplierIdentityProducts: [],
  };
}

for (const crashAfter of ["PRODUCT", "VARIANT", "MEDIA", "GALLERY"] as const) {
  test(`a crash after ${crashAfter.toLowerCase()} creation rolls back the complete import graph`, async () => {
    const state = approvedState();
    const run = createMemoryImporter(state, { crashAfter });

    await assert.rejects(run(), new RegExp(`${crashAfter.toLowerCase()} crash`));
    assert.deepEqual(state, approvedState());
  });
}

test("a failed final IMPORTED CAS rolls back product and child rows", async () => {
  const state = approvedState();
  const run = createMemoryImporter(state, { failFinalization: true });

  await assert.rejects(run(), /finalization affected 0 rows/);
  assert.deepEqual(state, approvedState());
});

test("retry after a committed-but-lost response returns the same product", async () => {
  const state = approvedState();
  const run = createMemoryImporter(state, { loseFirstCommitResponse: true });

  await assert.rejects(run(), /connection lost after commit/);
  const replay = await run();

  assert.deepEqual(replay, { productId: "product-1", replayed: true });
  assert.deepEqual(state.products, ["product-1"]);
  assert.deepEqual(state.variants, ["variant-1"]);
  assert.deepEqual(state.media, ["media-1"]);
  assert.deepEqual(state.gallery, ["image-1"]);
});

test("concurrent import attempts serialize to one graph and one replay", async () => {
  const state = approvedState();
  const run = createMemoryImporter(state);

  const results = await Promise.all([run(), run()]);

  assert.deepEqual(
    results.sort((left, right) => Number(left.replayed) - Number(right.replayed)),
    [
      { productId: "product-1", replayed: false },
      { productId: "product-1", replayed: true },
    ]
  );
  assert.equal(state.products.length, 1);
  assert.equal(state.variants.length, 1);
  assert.equal(state.media.length, 1);
  assert.equal(state.gallery.length, 1);
});

test("an existing supplier identity fails closed and rolls back the claim", async () => {
  const state = approvedState();
  state.supplierIdentityProducts.push("historical-orphan");
  const before = cloneState(state);
  const run = createMemoryImporter(state);

  await assert.rejects(run(), /supplier identity .* already belongs/);
  assert.deepEqual(state, before);
});

