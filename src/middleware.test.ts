import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  type AdminAuthEnvironment,
} from "@/lib/admin/auth-token";
import { middleware } from "./middleware";

const testAuthEnvironment: AdminAuthEnvironment = {
  NODE_ENV: "production",
  ADMIN_PASSWORD: "correct-horse-battery-staple",
  ADMIN_SESSION_SECRET: "a-separate-session-secret-with-32-chars",
};

const mutableProcessEnvironment = process.env as Record<
  string,
  string | undefined
>;

function restoreEnvironment(
  key:
    | "NODE_ENV"
    | "ADMIN_PASSWORD"
    | "ADMIN_SESSION_SECRET"
    | "NEXT_PUBLIC_SITE_URL"
    | "VERCEL_PROJECT_PRODUCTION_URL"
    | "VERCEL_URL",
  value: string | undefined
) {
  if (value === undefined) delete mutableProcessEnvironment[key];
  else mutableProcessEnvironment[key] = value;
}

test("production deployment root redirects to the admin control plane", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };

  try {
    mutableProcessEnvironment.NODE_ENV = "production";
    mutableProcessEnvironment.NEXT_PUBLIC_SITE_URL =
      "https://multistore-virid.vercel.app";

    const response = await middleware(
      new NextRequest("https://multistore-virid.vercel.app/")
    );

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://multistore-virid.vercel.app/admin"
    );
  } finally {
    restoreEnvironment("NODE_ENV", previous.NODE_ENV);
    restoreEnvironment(
      "NEXT_PUBLIC_SITE_URL",
      previous.NEXT_PUBLIC_SITE_URL
    );
  }
});

test("production deployment root can use the Vercel system hostname", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  try {
    mutableProcessEnvironment.NODE_ENV = "production";
    delete mutableProcessEnvironment.NEXT_PUBLIC_SITE_URL;
    delete mutableProcessEnvironment.VERCEL_PROJECT_PRODUCTION_URL;
    mutableProcessEnvironment.VERCEL_URL = "multistore-virid.vercel.app";

    const response = await middleware(
      new NextRequest("https://multistore-virid.vercel.app/")
    );

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://multistore-virid.vercel.app/admin"
    );
  } finally {
    restoreEnvironment("NODE_ENV", previous.NODE_ENV);
    restoreEnvironment(
      "NEXT_PUBLIC_SITE_URL",
      previous.NEXT_PUBLIC_SITE_URL
    );
    restoreEnvironment(
      "VERCEL_PROJECT_PRODUCTION_URL",
      previous.VERCEL_PROJECT_PRODUCTION_URL
    );
    restoreEnvironment("VERCEL_URL", previous.VERCEL_URL);
  }
});

test("production /s preview is available only to a verified admin session", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  try {
    mutableProcessEnvironment.NODE_ENV = testAuthEnvironment.NODE_ENV;
    mutableProcessEnvironment.ADMIN_PASSWORD = testAuthEnvironment.ADMIN_PASSWORD;
    mutableProcessEnvironment.ADMIN_SESSION_SECRET =
      testAuthEnvironment.ADMIN_SESSION_SECRET;

    const anonymous = await middleware(
      new NextRequest("https://multistore.example/s/preview-store")
    );
    assert.equal(anonymous.status, 404);
    assert.equal(await anonymous.text(), "Not Found");

    const forged = await middleware(
      new NextRequest("https://multistore.example/s/preview-store", {
        headers: { cookie: `${ADMIN_COOKIE_NAME}=present-but-invalid` },
      })
    );
    assert.equal(forged.status, 404);

    const token = createAdminSessionToken(testAuthEnvironment);
    assert.ok(token);
    const authenticated = await middleware(
      new NextRequest("https://multistore.example/s/preview-store", {
        headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      })
    );
    assert.equal(authenticated.status, 200);
    assert.equal(authenticated.headers.get("x-middleware-next"), "1");
    assert.match(
      authenticated.headers.get("set-cookie") ?? "",
      /msdf_store=preview-store/
    );

    mutableProcessEnvironment.NODE_ENV = "development";
    delete mutableProcessEnvironment.ADMIN_PASSWORD;
    delete mutableProcessEnvironment.ADMIN_SESSION_SECRET;
    const development = await middleware(
      new NextRequest("http://localhost:3010/s/preview-store")
    );
    assert.equal(development.status, 200);
    assert.equal(development.headers.get("x-middleware-next"), "1");
  } finally {
    restoreEnvironment("NODE_ENV", previous.NODE_ENV);
    restoreEnvironment("ADMIN_PASSWORD", previous.ADMIN_PASSWORD);
    restoreEnvironment(
      "ADMIN_SESSION_SECRET",
      previous.ADMIN_SESSION_SECRET
    );
  }
});
