import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogSchedulePlan,
  catalogAutomationAllowsProvider,
  catalogCadenceBucket,
  catalogStoreProviderKey,
  normalizeCatalogQuery,
  type CatalogScheduleStore,
} from "./catalog-schedule";
import { deterministicCatalogJobId, prepareCatalogJobsOnce } from "./queue";

test("catalog cadence buckets are deterministic and rotate at the boundary", () => {
  const before = catalogCadenceBucket(new Date("2026-08-29T23:59:59.999Z"), 24);
  const same = catalogCadenceBucket(new Date("2026-08-29T12:00:00.000Z"), 24);
  const after = catalogCadenceBucket(new Date("2026-08-30T00:00:00.000Z"), 24);

  assert.equal(before, same);
  assert.notEqual(before, after);
  assert.throws(() => catalogCadenceBucket(new Date("invalid"), 24));
  assert.throws(() => catalogCadenceBucket(new Date(), 0));
});

test("deterministic job identity deduplicates one exact scheduling scope", () => {
  const base = {
    storeId: "store-1",
    providerKey: "cj",
    jobType: "REFRESH_EXISTING",
    dedupeKey: "daily:123",
  };
  assert.equal(deterministicCatalogJobId(base), deterministicCatalogJobId(base));
  assert.notEqual(
    deterministicCatalogJobId(base),
    deterministicCatalogJobId({ ...base, storeId: "store-2" })
  );
  assert.notEqual(
    deterministicCatalogJobId(base),
    deterministicCatalogJobId({ ...base, dedupeKey: "daily:124" })
  );
});

test("query normalization removes cosmetic differences from discovery dedupe", () => {
  assert.equal(normalizeCatalogQuery("  Fluffy—SLIPPERS!! "), "fluffy slippers");
  assert.equal(normalizeCatalogQuery("Fluffy slippers"), "fluffy slippers");
});

test("mock automation requires an explicit flag", () => {
  assert.equal(
    catalogAutomationAllowsProvider({ providerKey: "mock", allowMockAutomation: false }),
    false
  );
  assert.equal(
    catalogAutomationAllowsProvider({ providerKey: "mock", allowMockAutomation: true }),
    true
  );
  assert.equal(
    catalogAutomationAllowsProvider({ providerKey: "cj", allowMockAutomation: false }),
    true
  );
  assert.equal(
    catalogAutomationAllowsProvider({ providerKey: " MOCK ", allowMockAutomation: false }),
    false
  );
  assert.equal(
    catalogAutomationAllowsProvider({ providerKey: "  ", allowMockAutomation: true }),
    false
  );
});

test("plans complete deterministic coverage for 100 configured stores", () => {
  const now = new Date("2026-08-29T03:00:00.000Z");
  const stores: CatalogScheduleStore[] = Array.from(
    { length: 100 },
    (_, index) => {
      const number = String(index + 1).padStart(3, "0");
      return {
        id: `store-${number}`,
        niche: `niche-${number}`,
        supplierSettings: [
          {
            providerKey: index % 2 === 0 ? "CJ" : "cj",
            importQueries: JSON.stringify([
              `primary query ${number}`,
              `secondary query ${number}`,
              `ignored third query ${number}`,
            ]),
          },
        ],
        categories: [{ id: `category-${number}` }],
      };
    }
  );
  const boundStoreProviders = new Set(
    stores.map((store) => catalogStoreProviderKey(store.id, "cj"))
  );
  const plan = buildCatalogSchedulePlan({
    stores,
    boundStoreProviders,
    allowMockAutomation: false,
    refreshBucket: "123",
    discoveryBucket: "17",
    refreshLimit: 6,
    refreshCadenceHours: 24,
    now,
  });
  const prepared = prepareCatalogJobsOnce(
    [...plan.refreshJobs, ...plan.discoveryJobs],
    now
  );

  assert.equal(plan.refreshJobs.length, 100);
  assert.equal(plan.discoveryJobs.length, 200);
  assert.equal(plan.storesWithoutProvider, 0);
  assert.equal(plan.providersSkipped, 0);
  assert.equal(prepared.jobs.length, 300);
  assert.equal(prepared.duplicateInputs, 0);
  assert.ok(prepared.jobs.every((job) => job.providerKey === "cj"));
});

test("disabled mock stores fail closed and enabled fallback stays explicit", () => {
  const now = new Date("2026-08-29T03:00:00.000Z");
  const explicitMock: CatalogScheduleStore = {
    id: "store-mock",
    niche: "fluffy slippers",
    supplierSettings: [
      { providerKey: "Mock", importQueries: JSON.stringify(["fluffy slippers"]) },
    ],
    categories: [],
  };
  const disabled = buildCatalogSchedulePlan({
    stores: [explicitMock],
    boundStoreProviders: new Set([
      catalogStoreProviderKey(explicitMock.id, "mock"),
    ]),
    allowMockAutomation: false,
    refreshBucket: "123",
    discoveryBucket: "17",
    refreshLimit: 6,
    refreshCadenceHours: 24,
    now,
  });
  assert.equal(disabled.refreshJobs.length, 0);
  assert.equal(disabled.discoveryJobs.length, 0);
  assert.equal(disabled.providersSkipped, 1);
  assert.equal(disabled.storesWithoutProvider, 1);

  const fallback = buildCatalogSchedulePlan({
    stores: [{ ...explicitMock, supplierSettings: [] }],
    boundStoreProviders: new Set([
      catalogStoreProviderKey(explicitMock.id, "mock"),
    ]),
    allowMockAutomation: true,
    refreshBucket: "123",
    discoveryBucket: "17",
    refreshLimit: 6,
    refreshCadenceHours: 24,
    now,
  });
  assert.equal(fallback.refreshJobs.length, 1);
  assert.equal(fallback.discoveryJobs.length, 1);
  assert.equal(fallback.refreshJobs[0].payload.allowFixtureMode, true);
});

test("cosmetic duplicate queries do not consume the two-query budget", () => {
  const now = new Date("2026-08-29T03:00:00.000Z");
  const plan = buildCatalogSchedulePlan({
    stores: [
      {
        id: "store-1",
        niche: "slippers",
        supplierSettings: [
          {
            providerKey: "cj",
            importQueries: JSON.stringify([
              " Fluffy—Slippers ",
              "fluffy slippers",
              "warm slippers",
            ]),
          },
        ],
        categories: [],
      },
    ],
    boundStoreProviders: new Set(),
    allowMockAutomation: false,
    refreshBucket: "123",
    discoveryBucket: "17",
    refreshLimit: 6,
    refreshCadenceHours: 24,
    now,
  });
  const prepared = prepareCatalogJobsOnce(plan.discoveryJobs, now);

  assert.equal(plan.discoveryJobs.length, 2);
  assert.deepEqual(
    plan.discoveryJobs.map((job) => job.payload.query),
    ["Fluffy—Slippers", "warm slippers"]
  );
  assert.equal(prepared.jobs.length, 2);
  assert.equal(prepared.duplicateInputs, 0);
});
