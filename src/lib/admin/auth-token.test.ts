import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSessionToken,
  isAdminAuthEnvironmentConfigured,
  isAdminPasswordValid,
  isAdminSessionTokenValid,
  type AdminAuthEnvironment,
} from "./auth-token";

const productionEnvironment: AdminAuthEnvironment = {
  NODE_ENV: "production",
  ADMIN_PASSWORD: "correct-horse-battery-staple",
  ADMIN_SESSION_SECRET: "a-separate-session-secret-with-32-chars",
};

test("production admin token requires strong separated configuration", () => {
  assert.equal(
    isAdminAuthEnvironmentConfigured({
      ...productionEnvironment,
      ADMIN_SESSION_SECRET: "short",
    }),
    false
  );
  assert.equal(
    createAdminSessionToken({
      ...productionEnvironment,
      ADMIN_SESSION_SECRET: "short",
    }),
    null
  );
  assert.equal(isAdminAuthEnvironmentConfigured(productionEnvironment), true);
});

test("admin preview accepts only the exact cryptographically derived token", () => {
  const token = createAdminSessionToken(productionEnvironment);
  assert.ok(token);
  assert.equal(isAdminSessionTokenValid(undefined, productionEnvironment), false);
  assert.equal(isAdminSessionTokenValid("present-but-invalid", productionEnvironment), false);
  assert.equal(isAdminSessionTokenValid(`${token}0`, productionEnvironment), false);
  assert.equal(isAdminSessionTokenValid(token, productionEnvironment), true);
});

test("login password validation and development fallback preserve existing behavior", () => {
  assert.equal(
    isAdminPasswordValid("wrong-password", productionEnvironment),
    false
  );
  assert.equal(
    isAdminPasswordValid(
      "correct-horse-battery-staple",
      productionEnvironment
    ),
    true
  );

  const developmentEnvironment: AdminAuthEnvironment = {
    NODE_ENV: "development",
    ADMIN_PASSWORD: "local-password-is-long-enough",
  };
  const token = createAdminSessionToken(developmentEnvironment);
  assert.ok(token);
  assert.equal(
    isAdminSessionTokenValid(token, developmentEnvironment),
    true
  );
});
