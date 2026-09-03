import assert from "node:assert/strict";
import test from "node:test";
import { runCatalogJob } from "./catalog-jobs";
import { CatalogJobPermanentError } from "./errors";

for (const jobType of ["ENRICH", "MEDIA_SYNC", "SOMETHING_NEW"]) {
  test(`${jobType} cannot be recorded as a skipped success`, async () => {
    await assert.rejects(
      runCatalogJob({
        storeId: "store-1",
        providerKey: "mock",
        jobType,
        payloadJson: "{}",
      }),
      (error: unknown) => {
        assert.ok(error instanceof CatalogJobPermanentError);
        assert.equal(
          error.code,
          jobType === "SOMETHING_NEW" ? "UNKNOWN_JOB_TYPE" : "UNSUPPORTED_JOB_TYPE"
        );
        return true;
      }
    );
  });
}

test("invalid discovery and route-order payloads are permanent failures", async () => {
  for (const jobType of ["DISCOVER", "ROUTE_ORDER"]) {
    await assert.rejects(
      runCatalogJob({
        storeId: "store-1",
        providerKey: "mock",
        jobType,
        payloadJson: "{}",
      }),
      (error: unknown) => {
        assert.ok(error instanceof CatalogJobPermanentError);
        assert.equal(error.code, "INVALID_JOB_PAYLOAD");
        return true;
      }
    );
  }
});
