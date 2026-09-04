import assert from "node:assert/strict";
import test from "node:test";
import {
  allowInternalStorePath,
  isDeploymentControlPlaneRoot,
  resolveMiddlewareHostStore,
  selectEdgeTenant,
} from "./edge-routing";

test("only the exact configured production deployment root enters the control plane", () => {
  const configuredHosts = [
    "https://multistore-virid.vercel.app/",
    "multistore-preview.vercel.app",
  ];

  assert.equal(
    isDeploymentControlPlaneRoot({
      isProduction: true,
      pathname: "/",
      requestHost: "MULTISTORE-VIRID.VERCEL.APP",
      configuredHosts,
    }),
    true
  );
  assert.equal(
    isDeploymentControlPlaneRoot({
      isProduction: true,
      pathname: "/p/example",
      requestHost: "multistore-virid.vercel.app",
      configuredHosts,
    }),
    false
  );
  assert.equal(
    isDeploymentControlPlaneRoot({
      isProduction: true,
      pathname: "/",
      requestHost: "shop.customer.example",
      configuredHosts: ["https://shop.customer.example"],
    }),
    false
  );
  assert.equal(
    isDeploymentControlPlaneRoot({
      isProduction: true,
      pathname: "/",
      requestHost: "multistore-virid.vercel.app.attacker.example",
      configuredHosts,
    }),
    false
  );
  assert.equal(
    isDeploymentControlPlaneRoot({
      isProduction: false,
      pathname: "/",
      requestHost: "multistore-virid.vercel.app",
      configuredHosts,
    }),
    false
  );
});

test("production resolver remains authoritative even when a static alias exists", async () => {
  let resolverCalls = 0;

  const store = await resolveMiddlewareHostStore({
    isProduction: true,
    host: "known.example",
    staticStore: "known-store",
    resolveProductionHost: async (host) => {
      resolverCalls += 1;
      return host === "known.example" ? "known-store" : null;
    },
  });

  assert.equal(store, "known-store");
  assert.equal(resolverCalls, 1);
});

test("middleware rejects a static production candidate that is still PREVIEW", async () => {
  const store = await resolveMiddlewareHostStore({
    isProduction: true,
    host: "preview.example",
    staticStore: "preview-store",
    resolveProductionHost: async () => null,
  });

  assert.equal(store, null);
  assert.deepEqual(
    selectEdgeTenant({
      isProduction: true,
      hostStore: store,
      queryStore: "preview-store",
      cookieStore: "preview-store",
      defaultStore: "preview-store",
    }),
    { kind: "NOT_FOUND" }
  );
});

test("middleware resolves an unknown static production host from the domain table", async () => {
  const store = await resolveMiddlewareHostStore({
    isProduction: true,
    host: "dynamic.example",
    staticStore: null,
    resolveProductionHost: async (host) =>
      host === "dynamic.example" ? "dynamic-store" : null,
  });

  assert.equal(store, "dynamic-store");
});

test("middleware fails closed when production domain resolution is unavailable", async () => {
  const store = await resolveMiddlewareHostStore({
    isProduction: true,
    host: "unknown.example",
    staticStore: null,
    resolveProductionHost: async () => {
      throw new Error("database unavailable");
    },
  });

  assert.equal(store, null);
});

test("middleware does not add a database lookup to development tenant selection", async () => {
  let resolverCalls = 0;

  const store = await resolveMiddlewareHostStore({
    isProduction: false,
    host: "localhost:3010",
    staticStore: "mapped-dev-store",
    resolveProductionHost: async () => {
      resolverCalls += 1;
      return "database-store";
    },
  });

  assert.equal(store, "mapped-dev-store");
  assert.equal(resolverCalls, 0);
});

test("a recognized host cannot be overridden by query or cookie", () => {
  assert.deepEqual(
    selectEdgeTenant({
      isProduction: true,
      hostStore: "host-store",
      queryStore: "query-store",
      cookieStore: "cookie-store",
      defaultStore: "default-store",
    }),
    { kind: "STORE", slug: "host-store", rememberInCookie: false }
  );
});

test("an unknown production host fails closed", () => {
  assert.deepEqual(
    selectEdgeTenant({
      isProduction: true,
      hostStore: null,
      queryStore: "query-store",
      cookieStore: "cookie-store",
      defaultStore: "default-store",
    }),
    { kind: "NOT_FOUND" }
  );
});

test("development can select a preview tenant without weakening production", () => {
  assert.deepEqual(
    selectEdgeTenant({
      isProduction: false,
      hostStore: null,
      queryStore: "query-store",
      cookieStore: "cookie-store",
      defaultStore: "default-store",
    }),
    { kind: "STORE", slug: "query-store", rememberInCookie: true }
  );
  assert.equal(
    allowInternalStorePath({
      isProduction: false,
      hasVerifiedAdminSession: false,
    }),
    true
  );
  assert.equal(
    allowInternalStorePath({
      isProduction: true,
      hasVerifiedAdminSession: false,
    }),
    false
  );
  assert.equal(
    allowInternalStorePath({
      isProduction: true,
      hasVerifiedAdminSession: true,
    }),
    true
  );
});
