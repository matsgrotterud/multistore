import assert from "node:assert/strict";
import test from "node:test";
import { allowInternalStorePath, selectEdgeTenant } from "./edge-routing";

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
  assert.equal(allowInternalStorePath(false), true);
  assert.equal(allowInternalStorePath(true), false);
});
