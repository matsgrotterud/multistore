import assert from "node:assert/strict";
import test from "node:test";
import type {
  GeneratorMediaAdapterV1,
  GeneratorPersistenceAdapterV1,
  GeneratorPipelineAdaptersV1,
  GeneratorProviderAdapterV1,
  PipelineCandidateV1,
  PipelineCommitInputV1,
  PipelineCommitReceiptV1,
  PipelineMediaReceiptV1,
  PipelineSearchInputV1,
  RunGeneratorPipelineInputV1,
} from "./pipeline";
import { runGeneratorPipelineV1 } from "./pipeline";

function readyCandidate(
  externalId: string,
  title = "Interactive dog puzzle toy"
): PipelineCandidateV1 {
  return {
    providerKey: "fake",
    externalId,
    evidence: {
      title,
      description: "Durable enrichment toy for dogs.",
      providerCategoryPath: "Pet supplies > Dog toys",
      sourceUrl: `https://supplier.example/products/${externalId}`,
      variants: [{ title: `${title} default` }],
      variantIdentityReady: true,
      price: 39,
      marginPercent: 35,
      shippingDaysMax: 12,
      riskVeto: false,
      groundedContentReady: true,
    },
  };
}

class FakeProvider implements GeneratorProviderAdapterV1 {
  readonly calls: PipelineSearchInputV1[] = [];
  fail = false;

  constructor(
    private readonly rowsFor: (
      input: PipelineSearchInputV1
    ) => readonly PipelineCandidateV1[]
  ) {}

  async search(input: PipelineSearchInputV1) {
    this.calls.push(input);
    if (this.fail) throw new Error("provider unavailable");
    return this.rowsFor(input);
  }
}

class FakeMedia implements GeneratorMediaAdapterV1 {
  readonly active = new Map<string, PipelineMediaReceiptV1>();
  readonly discarded: string[] = [];
  failExternalId: string | null = null;

  async stage(input: Parameters<GeneratorMediaAdapterV1["stage"]>[0]) {
    if (input.candidate.externalId === this.failExternalId) {
      throw new Error("media failed");
    }
    const candidateKey = `${input.candidate.providerKey}:${input.candidate.externalId}`;
    const receipt = {
      candidateKey,
      usableStoredMediaCount: 2,
      storageRefs: [`staged://${input.tenantId}/${input.candidate.externalId}/1`],
    } satisfies PipelineMediaReceiptV1;
    this.active.set(candidateKey, receipt);
    return receipt;
  }

  async discard(input: Parameters<GeneratorMediaAdapterV1["discard"]>[0]) {
    for (const receipt of input.receipts) {
      this.active.delete(receipt.candidateKey);
      this.discarded.push(receipt.candidateKey);
    }
  }
}

class FakePersistence implements GeneratorPersistenceAdapterV1 {
  readonly committed = new Map<string, PipelineCommitReceiptV1>();
  readonly commits: PipelineCommitInputV1[] = [];
  fail = false;

  private key(tenantId: string, idempotencyKey: string) {
    return `${tenantId}\u0000${idempotencyKey}`;
  }

  async findCommitted(input: {
    tenantId: string;
    idempotencyKey: string;
  }): Promise<PipelineCommitReceiptV1 | null> {
    return this.committed.get(this.key(input.tenantId, input.idempotencyKey)) ?? null;
  }

  async commitPreview(input: PipelineCommitInputV1) {
    if (this.fail) throw new Error("atomic persistence failed");
    const key = this.key(input.tenantId, input.idempotencyKey);
    const existing = this.committed.get(key);
    if (existing) return { kind: "EXISTING" as const, receipt: existing };
    const receipt: PipelineCommitReceiptV1 = {
      tenantId: input.tenantId,
      idempotencyKey: input.idempotencyKey,
      storeId: `store-${this.committed.size + 1}`,
      result: input.result,
      products: [...input.products],
    };
    this.commits.push(input);
    this.committed.set(key, receipt);
    return { kind: "COMMITTED" as const, receipt };
  }
}

function harness(
  provider: FakeProvider,
  media = new FakeMedia(),
  persistence = new FakePersistence()
): GeneratorPipelineAdaptersV1 & {
  provider: FakeProvider;
  media: FakeMedia;
  persistence: FakePersistence;
} {
  return { provider, media, persistence };
}

function request(
  overrides: Partial<RunGeneratorPipelineInputV1> = {}
): RunGeneratorPipelineInputV1 {
  return {
    tenantId: "tenant-a",
    idempotencyKey: "request-1",
    intentInput: { niche: "dog puzzle toys", endUser: "dogs" },
    minimumProducts: 2,
    importBudget: 3,
    categoryByClassConcept: {
      "dog toy": "dog-toys",
      "dog toys": "dog-toys",
      "puppy toy": "puppy-toys",
      "puppy toys": "puppy-toys",
      "dog chew toy": "chew-toys",
      "dog puzzle toy": "puzzle-toys",
      "dog enrichment toy": "enrichment-toys",
      "dog treat dispenser": "treat-toys",
    },
    ...overrides,
  };
}

test("commits a low-risk catalog only as a noindex PREVIEW", async () => {
  const seen = new Set<string>();
  const adapters = harness(
    new FakeProvider(() => {
      const rows = [readyCandidate("dog-1"), readyCandidate("dog-2")];
      return rows.filter((row) => !seen.has(row.externalId) && seen.add(row.externalId));
    })
  );

  const execution = await runGeneratorPipelineV1(request(), adapters);

  assert.equal(execution.result.status, "READY_FOR_PREVIEW");
  assert.equal(execution.result.previewReady, true);
  assert.equal(execution.result.liveCommerceAllowed, false);
  assert.equal(execution.storeId, "store-1");
  assert.equal(adapters.persistence.commits.length, 1);
  const commit = adapters.persistence.commits[0]!;
  assert.deepEqual(commit.store, {
    launchStatus: "PREVIEW",
    noindex: true,
    liveCommerceAllowed: false,
  });
  assert.equal(commit.products.length, 2);
  assert.equal(
    commit.products.every(
      (product) =>
        product.previewVisible &&
        !product.isPublished &&
        product.noindex &&
        !product.liveCommerceAllowed
    ),
    true
  );
});

test("zero candidates is insufficient and performs no visible write", async () => {
  const adapters = harness(new FakeProvider(() => []));

  const execution = await runGeneratorPipelineV1(request(), adapters);

  assert.equal(execution.result.status, "INSUFFICIENT_RELEVANT_PRODUCTS");
  assert.equal(execution.storeId, null);
  assert.equal(adapters.persistence.commits.length, 0);
  assert.equal(adapters.persistence.committed.size, 0);
  assert.equal(adapters.media.active.size, 0);
});

test("provider failure fails closed before media or persistence", async () => {
  const provider = new FakeProvider(() => []);
  provider.fail = true;
  const adapters = harness(provider);

  const execution = await runGeneratorPipelineV1(request(), adapters);

  assert.equal(execution.result.status, "PROVIDER_FAILED");
  assert.equal(execution.storeId, null);
  assert.equal(adapters.media.active.size, 0);
  assert.equal(adapters.persistence.commits.length, 0);
});

test("policy-blocked runtime niche never reaches provider, media or persistence", async () => {
  const provider = new FakeProvider(() => [readyCandidate("unsafe-1")]);
  const adapters = harness(provider);

  const execution = await runGeneratorPipelineV1(
    request({ intentInput: { niche: "medical diagnostic devices" } }),
    adapters
  );

  assert.equal(execution.intent.policyDecision, "BLOCK");
  assert.equal(execution.result.status, "POLICY_BLOCKED");
  assert.equal(execution.result.previewReady, false);
  assert.equal(execution.result.liveCommerceAllowed, false);
  assert.deepEqual(execution.queryPlan.queries, []);
  assert.equal(provider.calls.length, 0);
  assert.equal(adapters.media.active.size, 0);
  assert.equal(adapters.persistence.commits.length, 0);
});

test("idempotent replay returns the same store without duplicate effects", async () => {
  const seen = new Set<string>();
  const provider = new FakeProvider(() => {
    const rows = [readyCandidate("dog-1"), readyCandidate("dog-2")];
    return rows.filter((row) => !seen.has(row.externalId) && seen.add(row.externalId));
  });
  const adapters = harness(provider);

  const first = await runGeneratorPipelineV1(request(), adapters);
  const callsAfterFirst = provider.calls.length;
  const second = await runGeneratorPipelineV1(request(), adapters);

  assert.equal(first.storeId, "store-1");
  assert.equal(second.storeId, first.storeId);
  assert.equal(second.replayed, true);
  assert.equal(provider.calls.length, callsAfterFirst);
  assert.equal(adapters.persistence.commits.length, 1);
  assert.equal(adapters.persistence.committed.size, 1);
});

test("deduplicates provider external IDs and keeps the first stable category", async () => {
  const duplicate = readyCandidate("same-external-id");
  const provider = new FakeProvider(() => [duplicate]);
  const adapters = harness(provider);
  const input = request({ minimumProducts: 1, importBudget: 3 });

  const execution = await runGeneratorPipelineV1(input, adapters);

  assert.equal(execution.result.status, "READY_FOR_PREVIEW");
  assert.equal(execution.products.length, 1);
  assert.equal(execution.products[0]?.candidateKey, "fake:same-external-id");
  assert.equal(
    execution.products[0]?.categoryKey,
    provider.calls[0]?.categoryKey,
    "the earliest deterministic query owns category assignment"
  );
});

test("never imports above the exact budget", async () => {
  const candidates = Array.from({ length: 8 }, (_, index) =>
    readyCandidate(`dog-${index + 1}`)
  );
  const provider = new FakeProvider((input) =>
    input.queryIndex === 0 ? candidates : []
  );
  const adapters = harness(provider);

  const execution = await runGeneratorPipelineV1(
    request({ minimumProducts: 3, importBudget: 3 }),
    adapters
  );

  assert.equal(execution.result.status, "READY_FOR_PREVIEW");
  assert.equal(execution.products.length, 3);
  assert.equal(execution.result.counts.importedProducts, 3);
  assert.equal(adapters.persistence.commits[0]?.products.length, 3);
  assert.equal(adapters.media.active.size, 3);
});

for (const failure of ["media", "persistence"] as const) {
  test(`${failure} failure leaves no visible store or product`, async () => {
    const candidates = [readyCandidate("dog-1"), readyCandidate("dog-2")];
    const provider = new FakeProvider((input) =>
      input.queryIndex === 0 ? candidates : []
    );
    const media = new FakeMedia();
    const persistence = new FakePersistence();
    if (failure === "media") media.failExternalId = "dog-2";
    if (failure === "persistence") persistence.fail = true;
    const adapters = harness(provider, media, persistence);

    const execution = await runGeneratorPipelineV1(request(), adapters);

    assert.equal(execution.result.status, "VALIDATION_FAILED");
    assert.equal(execution.storeId, null);
    assert.equal(persistence.committed.size, 0);
    assert.equal(persistence.commits.length, 0);
    assert.equal(media.active.size, 0);
    assert.equal(media.discarded.includes("fake:dog-1"), true);
  });
}

test("tenant scope isolates identical idempotency and external IDs", async () => {
  const provider = new FakeProvider((input) =>
    input.queryIndex === 0
      ? [readyCandidate("shared-1"), readyCandidate("shared-2")]
      : []
  );
  const adapters = harness(provider);

  const tenantA = await runGeneratorPipelineV1(
    request({ tenantId: "tenant-a", idempotencyKey: "same-key" }),
    adapters
  );
  const tenantB = await runGeneratorPipelineV1(
    request({ tenantId: "tenant-b", idempotencyKey: "same-key" }),
    adapters
  );

  assert.equal(tenantA.storeId, "store-1");
  assert.equal(tenantB.storeId, "store-2");
  assert.equal(adapters.persistence.committed.size, 2);
  assert.deepEqual(
    adapters.persistence.commits.map((commit) => commit.tenantId),
    ["tenant-a", "tenant-b"]
  );
  assert.equal(
    adapters.persistence.commits.every((commit) =>
      commit.products.every((product) =>
        ["shared-1", "shared-2"].includes(product.externalId)
      )
    ),
    true
  );
});
