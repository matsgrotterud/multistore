import assert from "node:assert/strict";
import test from "node:test";
import { deterministicCatalogJobId } from "@/lib/jobs/queue";
import {
  prepareCatalogShadowRefreshJobRunRequest,
  prepareCatalogShadowRefreshRequest,
} from "./admin-catalog-autopilot";

function requestForm(overrides: Record<string, string> = {}): FormData {
  const values = {
    binding: "store-1\u001fCJ",
    requestId: "019ff9b6-2f6b-7453-a3d0-68e01559d98a",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

test("manual refresh preparation is deterministic and canonicalizes provider identity", async () => {
  const first = await prepareCatalogShadowRefreshRequest(requestForm());
  const repeated = await prepareCatalogShadowRefreshRequest(requestForm());

  assert.deepEqual(first, repeated);
  assert.equal(first.storeId, "store-1");
  assert.equal(first.providerKey, "cj");
  assert.equal(
    first.dedupeKey,
    "admin-shadow-refresh.v1:019ff9b6-2f6b-7453-a3d0-68e01559d98a"
  );
  assert.deepEqual(first.payload, {
    limit: 12,
    allowFixtureMode: false,
    force: true,
  });
  assert.equal(
    deterministicCatalogJobId({ ...first, jobType: "REFRESH_EXISTING" }),
    deterministicCatalogJobId({ ...repeated, jobType: "REFRESH_EXISTING" })
  );
});

test("fixture permission is explicit and is only retained for mock", async () => {
  const cj = await prepareCatalogShadowRefreshRequest(
    requestForm({ allowFixtureMode: "on" })
  );
  const mock = await prepareCatalogShadowRefreshRequest(
    requestForm({ binding: "store-1\u001fMoCk", allowFixtureMode: "on" })
  );

  assert.equal(cj.payload.allowFixtureMode, false);
  assert.equal(mock.providerKey, "mock");
  assert.equal(mock.payload.allowFixtureMode, true);
});

test("binding overrides must agree with the selected store and provider", async () => {
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(
      requestForm({ storeId: "store-2" })
    ),
    /Store binding does not match/
  );
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(
      requestForm({ providerKey: "mock" })
    ),
    /Provider binding does not match/
  );
});

test("missing, malformed or delimiter-bearing request ids fail closed", async () => {
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(requestForm({ requestId: "" })),
    /valid stable refresh request id/
  );
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(requestForm({ requestId: "short" })),
    /valid stable refresh request id/
  );
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(
      requestForm({ requestId: "valid-looking\u001fsecond-operation" })
    ),
    /valid stable refresh request id/
  );
});

test("malformed bindings fail before any queue preparation", async () => {
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(requestForm({ binding: "store-only" })),
    /Store and provider are required/
  );
  await assert.rejects(
    prepareCatalogShadowRefreshRequest(
      requestForm({ binding: "store\u001fprovider\u001fextra" })
    ),
    /Store and provider are required/
  );
});

test("manual run action preparation requires one exact eligible-looking job id", async () => {
  const valid = new FormData();
  valid.set("jobId", "catalog-12345678");
  assert.deepEqual(await prepareCatalogShadowRefreshJobRunRequest(valid), {
    jobId: "catalog-12345678",
  });

  for (const jobId of ["", "short", "catalog/12345678", "catalog-12345678\u001fother"]) {
    const invalid = new FormData();
    invalid.set("jobId", jobId);
    await assert.rejects(
      prepareCatalogShadowRefreshJobRunRequest(invalid),
      /exact catalog job id/
    );
  }
});
