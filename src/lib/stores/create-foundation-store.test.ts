import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import {
  createFoundationStore,
  type FoundationStoreDatabase,
} from "./create-foundation-store";

const INPUT = {
  idempotencyKey: "foundation-12345678",
  niche: "camera drones",
  audience: "new creators learning aerial photography",
  brandVoice: "precise, encouraging and honest",
  locale: "nb-NO",
  country: "Norway",
};

function memoryDatabase() {
  const stores = new Map<
    string,
    {
      slug: string;
      name: string;
      launchStatus: string;
      isActive: boolean;
      plannedDomain: string | null;
    }
  >();
  const settingsRows: Array<{ settings: string; store: (typeof stores extends Map<string, infer V> ? V : never) }> = [];
  let creates = 0;

  const tx = {
    $executeRaw: async () => 1,
    storeSettings: {
      findMany: async (args: { where: { settings: { contains: string } }; take: number }) =>
        settingsRows
          .filter((row) => row.settings.includes(args.where.settings.contains))
          .slice(0, args.take),
    },
    store: {
      findUnique: async (args: { where: { slug: string } }) => {
        const store = stores.get(args.where.slug);
        return store ? { id: `id-${store.slug}` } : null;
      },
      create: async (args: { data: Record<string, unknown> }) => {
        creates += 1;
        const data = args.data as {
          slug: string;
          name: string;
          launchStatus: string;
          isActive: boolean;
          plannedDomain: string | null;
          settings: { create: { settings: string } };
          [key: string]: unknown;
        };
        assert.equal("categories" in data, false);
        assert.equal("products" in data, false);
        assert.equal("domains" in data, false);
        assert.equal("supplierSettings" in data, false);
        const store = {
          slug: data.slug,
          name: data.name,
          launchStatus: data.launchStatus,
          isActive: data.isActive,
          plannedDomain: data.plannedDomain,
        };
        stores.set(store.slug, store);
        settingsRows.push({ settings: data.settings.create.settings, store });
        return store;
      },
    },
  };
  const db = {
    $transaction: async <T>(
      callback: (client: Prisma.TransactionClient) => Promise<T>
    ) => callback(tx as unknown as Prisma.TransactionClient),
  } satisfies FoundationStoreDatabase;
  return { db, stores, settingsRows, get creates() { return creates; } };
}

test("foundation creation is replay-safe and writes only the inactive store graph", async () => {
  const memory = memoryDatabase();
  const first = await createFoundationStore(INPUT, memory.db);
  const replay = await createFoundationStore(INPUT, memory.db);

  assert.equal(memory.creates, 1);
  assert.equal(memory.stores.size, 1);
  assert.equal(first.storeSlug, replay.storeSlug);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(first.launchStatus, "DRAFT");
  assert.equal(first.isActive, false);
});

test("one idempotency key cannot be replayed with different foundation input", async () => {
  const memory = memoryDatabase();
  await createFoundationStore(INPUT, memory.db);

  await assert.rejects(
    createFoundationStore({ ...INPUT, niche: "indoor plants" }, memory.db),
    /already used for different input/
  );
  assert.equal(memory.creates, 1);
});
