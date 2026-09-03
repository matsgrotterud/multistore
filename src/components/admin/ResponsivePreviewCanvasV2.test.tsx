import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ResponsivePreviewCanvasV2,
  isSafeResponsivePreviewUrlV2,
} from "./ResponsivePreviewCanvasV2";

test("a fixed 1440px preview is contained by the admin canvas", () => {
  const markup = renderToStaticMarkup(
    <ResponsivePreviewCanvasV2
      viewport={1440}
      previewTitle="Drone reference"
      previewUrl="/admin-preview/store-factory-v2?fixture=drones&amp;revision=rev-2"
    />
  );
  assert.match(markup, /data-preview-canvas="contained"/);
  assert.match(markup, /max-w-full overflow-hidden/);
  assert.match(markup, /width:1440px/);
  assert.match(markup, /data-preview-fit="true"/);
  assert.match(markup, /data-preview-real-viewport="true"/);
  assert.match(markup, /data-preview-code-policy="authenticated-internal-route"/);
  assert.match(markup, /referrerPolicy="no-referrer"/);
  assert.match(markup, /sandbox="allow-same-origin allow-scripts"/);
  assert.match(markup, /1440px storefront preview/);
  assert.match(markup, /Full screen/);
  assert.equal((markup.match(/min-h-11/g) ?? []).length, 2);
});

test("preview canvas accepts only the exact internal frame route", () => {
  assert.equal(
    isSafeResponsivePreviewUrlV2(
      "/admin-preview/store-factory-v2?fixture=drones&revision=rev-2"
    ),
    true
  );
  assert.equal(isSafeResponsivePreviewUrlV2("https://example.com/frame"), false);
  assert.equal(isSafeResponsivePreviewUrlV2("//example.com/frame"), false);
  assert.equal(isSafeResponsivePreviewUrlV2("/api/checkout"), false);
  assert.equal(
    isSafeResponsivePreviewUrlV2(
      "/admin-preview/store-factory-v2?fixture=drones&next=/api/checkout"
    ),
    false
  );
});
