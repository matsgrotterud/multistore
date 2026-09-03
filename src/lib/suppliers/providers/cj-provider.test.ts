import assert from "node:assert/strict";
import test from "node:test";
import { runProviderSearchWithPolicy } from "@/lib/catalog/provider-search-policy";
import {
  CjDropshippingProvider,
  type CjFetch,
  type CjProviderDependencies,
} from "./cj-provider";
import {
  createCjCatalogRequestRunner,
  type CjCatalogRequestRunner,
} from "./cj-request-gate";

const product = {
  pid: "product-1",
  productNameEn: "Supplier product",
  description: "Supplier-backed product description.",
  bigImage: "https://cdn.example/product-1.jpg",
  deliveryCycle: "5-9",
  variants: [{ vid: "variant-1", variantSku: "SKU-1" }],
};

function dependencies(
  overrides: Partial<CjProviderDependencies> = {}
): CjProviderDependencies {
  return {
    getHealthInfo: () => ({ enabled: true, configured: true, missingEnv: [] }),
    getOrderConfig: () => ({
      enabled: true,
      missingEnv: [],
      logisticName: "CJPacket",
      fromCountryCode: "CN",
      payType: 2,
    }),
    isEnabled: () => true,
    ...overrides,
  };
}

function orderInput(externalIds = ["product-1"]) {
  return {
    orderId: "order-1",
    items: externalIds.map((externalId) => ({
      externalId,
      quantity: 1,
      title: `Item ${externalId}`,
      unitPrice: 49,
    })),
    shippingAddress: {
      name: "Test Buyer",
      email: "buyer@example.test",
      addressLine1: "Testveien 1",
      postalCode: "0001",
      city: "Oslo",
      country: "NO",
    },
  };
}

test("health, search, details, media, variant lookup and order use provider boundaries", async () => {
  const paths: string[] = [];
  const catalogSignals: AbortSignal[] = [];
  let catalogBoundaryCalls = 0;

  const request: CjFetch = async <T>(path: string, init?: RequestInit) => {
    paths.push(path);
    if (init?.signal) catalogSignals.push(init.signal);
    if (path.startsWith("/product/listV2")) return { list: [product] } as T;
    if (path.startsWith("/product/query")) return product as T;
    if (path === "/shopping/order/createOrderV2") {
      return { orderId: "cj-order-1" } as T;
    }
    throw new Error(`Unexpected CJ path: ${path}`);
  };
  const runCatalogRequest: CjCatalogRequestRunner = async <T>(options: {
    request: (signal: AbortSignal) => Promise<T>;
    timeoutMs?: number;
  }) => {
    catalogBoundaryCalls += 1;
    return options.request(new AbortController().signal);
  };
  const provider = new CjDropshippingProvider(
    dependencies({ fetch: request, runCatalogRequest })
  );

  assert.equal((await provider.getHealth()).status, "OK");
  assert.equal((await provider.searchProducts({ query: "brush" })).length, 1);
  assert.equal((await provider.getProductDetails({ externalId: "product-1" })).externalId, "product-1");
  assert.ok((await provider.getProductMedia({ externalId: "product-1" })).length > 0);
  assert.equal((await provider.createDropshipOrder(orderInput())).status, "PLACED");

  assert.equal(catalogBoundaryCalls, 5);
  assert.equal(catalogSignals.length, 5);
  assert.ok(catalogSignals.every((signal) => signal instanceof AbortSignal));
  assert.equal(paths.filter((path) => path.startsWith("/product/query")).length, 3);
  assert.equal(paths.at(-1), "/shopping/order/createOrderV2");
});

test("multi-line variant fallback is serial and uses supplier identities", async () => {
  let activeLookups = 0;
  let maxActiveLookups = 0;
  const queryOrder: string[] = [];
  let orderBody: Record<string, unknown> | null = null;
  const request: CjFetch = async <T>(path: string, init?: RequestInit) => {
    if (path.startsWith("/product/query")) {
      activeLookups += 1;
      maxActiveLookups = Math.max(maxActiveLookups, activeLookups);
      const externalId = new URL(`https://cj.invalid${path}`).searchParams.get("pid") ?? "";
      queryOrder.push(externalId);
      await Promise.resolve();
      activeLookups -= 1;
      return {
        ...product,
        pid: externalId,
        variants: [{ vid: `variant-${externalId}` }],
      } as T;
    }
    if (path === "/shopping/order/createOrderV2") {
      orderBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return { orderId: "cj-order-serial" } as T;
    }
    throw new Error(`Unexpected CJ path: ${path}`);
  };
  const immediateCatalog: CjCatalogRequestRunner = async <T>(options: {
    request: (signal: AbortSignal) => Promise<T>;
    timeoutMs?: number;
  }) => options.request(new AbortController().signal);
  const provider = new CjDropshippingProvider(
    dependencies({
      fetch: request,
      runCatalogRequest: immediateCatalog,
    })
  );

  const result = await provider.createDropshipOrder(
    orderInput(["product-a", "product-b", "product-c"])
  );

  assert.equal(result.status, "PLACED");
  assert.equal(maxActiveLookups, 1);
  assert.deepEqual(queryOrder, ["product-a", "product-b", "product-c"]);
  assert.ok(orderBody);
  const products = (orderBody as unknown as { products: Array<{ vid?: string }> }).products;
  assert.deepEqual(
    products.map((entry) => entry.vid),
    ["variant-product-a", "variant-product-b", "variant-product-c"]
  );
});

test("an order response without a supplier identity remains pending reconciliation", async () => {
  const request: CjFetch = async <T>(path: string) => {
    if (path.startsWith("/product/query")) return product as T;
    if (path === "/shopping/order/createOrderV2") return {} as T;
    throw new Error(`Unexpected CJ path: ${path}`);
  };
  const provider = new CjDropshippingProvider(
    dependencies({
      fetch: request,
      runCatalogRequest: async <T>(options: {
        request: (signal: AbortSignal) => Promise<T>;
      }) => options.request(new AbortController().signal),
    })
  );

  const result = await provider.createDropshipOrder(orderInput());

  assert.equal(result.status, "PENDING");
  assert.equal(result.externalOrderId, undefined);
  assert.match(result.errorMessage ?? "", /reconcile/i);
});

for (const fixture of [
  {
    name: "lookup failure",
    response: new Error("variant lookup failed"),
  },
  {
    name: "missing supplier identity",
    response: { ...product, variants: [] },
  },
]) {
  test(`variant ${fixture.name} fails closed before order submission`, async () => {
    let orderPosts = 0;
    const request: CjFetch = async <T>(path: string) => {
      if (path.startsWith("/product/query")) {
        if (fixture.response instanceof Error) throw fixture.response;
        return fixture.response as T;
      }
      if (path === "/shopping/order/createOrderV2") {
        orderPosts += 1;
        return { orderId: "must-not-exist" } as T;
      }
      throw new Error(`Unexpected CJ path: ${path}`);
    };
    const immediateCatalog: CjCatalogRequestRunner = async <T>(options: {
      request: (signal: AbortSignal) => Promise<T>;
      timeoutMs?: number;
    }) => options.request(new AbortController().signal);
    const provider = new CjDropshippingProvider(
      dependencies({ fetch: request, runCatalogRequest: immediateCatalog })
    );

    const result = await provider.createDropshipOrder(orderInput());

    assert.equal(result.status, "ERROR");
    assert.equal(orderPosts, 0);
    assert.match(result.errorMessage ?? "", /variant|identity/i);
  });
}

test("multiple supplier variants fail closed before order submission", async () => {
  let orderPosts = 0;
  const request: CjFetch = async <T>(path: string) => {
    if (path.startsWith("/product/query")) {
      return {
        ...product,
        variants: [
          { vid: "variant-red", variantSku: "SKU-RED" },
          { vid: "variant-blue", variantSku: "SKU-BLUE" },
        ],
      } as T;
    }
    if (path === "/shopping/order/createOrderV2") {
      orderPosts += 1;
      return { orderId: "must-not-exist" } as T;
    }
    throw new Error(`Unexpected CJ path: ${path}`);
  };
  const immediateCatalog: CjCatalogRequestRunner = async <T>(options: {
    request: (signal: AbortSignal) => Promise<T>;
    timeoutMs?: number;
  }) => options.request(new AbortController().signal);
  const provider = new CjDropshippingProvider(
    dependencies({ fetch: request, runCatalogRequest: immediateCatalog })
  );

  const result = await provider.createDropshipOrder(orderInput());

  assert.equal(result.status, "ERROR");
  assert.equal(orderPosts, 0);
  assert.match(result.errorMessage ?? "", /ambiguous.*2 variants/i);
});

test("timed-out CJ search aborts before the retry starts", async () => {
  let attempts = 0;
  let active = 0;
  let maxActive = 0;
  const runCatalogRequest = createCjCatalogRequestRunner({
    defaultTimeoutMs: 100,
  });
  const request: CjFetch = async <T>(_path: string, init?: RequestInit) => {
    attempts += 1;
    active += 1;
    maxActive = Math.max(maxActive, active);
    if (attempts === 1) {
      return new Promise<T>((_, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => {
            active -= 1;
            reject(init.signal?.reason);
          },
          { once: true }
        );
      });
    }
    active -= 1;
    return { list: [product] } as T;
  };
  const provider = new CjDropshippingProvider(
    dependencies({ fetch: request, runCatalogRequest })
  );

  const result = await runProviderSearchWithPolicy({
    providerKey: "cj",
    maxAttempts: 2,
    sleep: async () => undefined,
    search: () => provider.searchProducts({ query: "retry fixture" }),
  });

  assert.equal(result.results.length, 1);
  assert.equal(attempts, 2);
  assert.equal(maxActive, 1);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.status),
    ["TIMEOUT", "SUCCESS"]
  );
});
