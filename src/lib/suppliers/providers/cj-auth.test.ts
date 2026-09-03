import assert from "node:assert/strict";
import test from "node:test";
import { createCjAuthClient } from "./cj-auth";
import {
  createCjRequestGate,
  createCjTransportFetch,
  type CjTransportFetch,
} from "./cj-request-gate";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("cjFetch forwards the caller AbortSignal to the actual API fetch", async () => {
  let observedSignal: AbortSignal | null = null;
  const nativeFetch: CjTransportFetch = async (_input, init) => {
    observedSignal = init?.signal ?? null;
    return jsonResponse({ data: { ok: true } });
  };
  const transportFetch = createCjTransportFetch({
    runWithPacing: createCjRequestGate({ minimumIntervalMs: 0 }),
    fetch: nativeFetch,
  });
  const client = createCjAuthClient({
    transportFetch,
    env: {
      CJ_ENABLED: "true",
      CJ_ACCESS_TOKEN: "offline-test-token",
    },
  });

  const controller = new AbortController();
  const result = await client.cjFetch<{ ok: boolean }>(
    "/offline-signal-test",
    { signal: controller.signal }
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(observedSignal, controller.signal);
});

test("token refresh and following API HTTP starts share minimum spacing", async () => {
  let clock = 10_000;
  const starts: Array<{ path: string; at: number }> = [];
  const nativeFetch: CjTransportFetch = async (input) => {
    const path = new URL(String(input)).pathname;
    starts.push({ path, at: clock });
    if (path.endsWith("/authentication/refreshAccessToken")) {
      return jsonResponse({
        data: {
          accessToken: "refreshed-token",
          refreshToken: "next-refresh-token",
        },
      });
    }
    return jsonResponse({ data: { ok: true } });
  };
  const transportFetch = createCjTransportFetch({
    runWithPacing: createCjRequestGate({
      minimumIntervalMs: 1_100,
      now: () => clock,
      sleep: async (milliseconds) => {
        clock += milliseconds;
      },
    }),
    fetch: nativeFetch,
  });
  const client = createCjAuthClient({
    transportFetch,
    env: {
      CJ_ENABLED: "true",
      CJ_REFRESH_TOKEN: "refresh-token",
    },
    now: () => clock,
    apiBase: "https://cj.test/api",
  });

  const result = await client.cjFetch<{ ok: boolean }>("/product/listV2");

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(starts, [
    { path: "/api/authentication/refreshAccessToken", at: 10_000 },
    { path: "/api/product/listV2", at: 11_100 },
  ]);
});

test("primary and legacy auth fallback HTTP starts use the same gate", async () => {
  let clock = 20_000;
  const starts: Array<{
    path: string;
    at: number;
    body?: Record<string, string>;
  }> = [];
  let authAttempts = 0;
  const nativeFetch: CjTransportFetch = async (input, init) => {
    const path = new URL(String(input)).pathname;
    starts.push({
      path,
      at: clock,
      body: init?.body
        ? (JSON.parse(String(init.body)) as Record<string, string>)
        : undefined,
    });
    if (path.endsWith("/authentication/getAccessToken")) {
      authAttempts += 1;
      if (authAttempts === 1) {
        return jsonResponse({ message: "API-key auth rejected" }, 401);
      }
      return jsonResponse({
        data: {
          accessToken: "legacy-token",
          refreshToken: "legacy-refresh-token",
        },
      });
    }
    return jsonResponse({ data: { ok: true } });
  };
  const transportFetch = createCjTransportFetch({
    runWithPacing: createCjRequestGate({
      minimumIntervalMs: 1_100,
      now: () => clock,
      sleep: async (milliseconds) => {
        clock += milliseconds;
      },
    }),
    fetch: nativeFetch,
  });
  const client = createCjAuthClient({
    transportFetch,
    env: {
      CJ_ENABLED: "true",
      CJ_API_KEY: "api-key",
      CJ_EMAIL: "operator@example.test",
    },
    now: () => clock,
    apiBase: "https://cj.test/api",
  });

  const result = await client.cjFetch<{ ok: boolean }>("/product/query");

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(
    starts.map(({ path, at }) => ({ path, at })),
    [
      { path: "/api/authentication/getAccessToken", at: 20_000 },
      { path: "/api/authentication/getAccessToken", at: 21_100 },
      { path: "/api/product/query", at: 22_200 },
    ]
  );
  assert.deepEqual(starts[0]?.body, { apiKey: "api-key" });
  assert.deepEqual(starts[1]?.body, {
    email: "operator@example.test",
    password: "api-key",
  });
});
