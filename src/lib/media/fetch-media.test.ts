import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchMedia,
  isPublicIpAddress,
  requireFetchedMediaTypeMatch,
  normalizeContentType,
  validateMediaUrl,
} from "./fetch-media";

test("normalizes the non-standard image/jpg alias to image/jpeg", () => {
  assert.equal(normalizeContentType("image/jpg"), "image/jpeg");
  assert.equal(normalizeContentType(" IMAGE/JPG ; charset=binary"), "image/jpeg");
  assert.equal(normalizeContentType("image/jpeg; charset=binary"), "image/jpeg");
});

test("fetched content type overrides neither a declared image nor video", () => {
  assert.equal(requireFetchedMediaTypeMatch("IMAGE", "IMAGE"), "IMAGE");
  assert.equal(requireFetchedMediaTypeMatch(undefined, "VIDEO"), "VIDEO");
  assert.throws(
    () => requireFetchedMediaTypeMatch("IMAGE", "VIDEO"),
    /MEDIA_TYPE_MISMATCH/
  );
});

test("fetchMedia accepts image/jpg and returns the canonical MIME type", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]), {
      status: 200,
      headers: { "content-type": "image/jpg" },
    })) as typeof fetch;

  try {
    const result = await fetchMedia("https://supplier.example/product.jpg", {
      resolveHost: async () => ["93.184.216.34"],
    });
    assert.equal(result.contentType, "image/jpeg");
    assert.equal(result.extension, "jpg");
    assert.equal(result.mediaType, "IMAGE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a video body cannot pass when the response claims it is an image", async () => {
  const originalFetch = globalThis.fetch;
  const mp4Body = Uint8Array.from([
    0x00, 0x00, 0x00, 0x18,
    0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d,
  ]);
  globalThis.fetch = (async () =>
    new Response(mp4Body, {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    })) as typeof fetch;

  try {
    await assert.rejects(
      fetchMedia("https://supplier.example/spoofed.jpg", {
        resolveHost: async () => ["93.184.216.34"],
      }),
      /content signature does not match image\/jpeg/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("media URL validation blocks local targets, credentials and non-default ports", () => {
  assert.throws(() => validateMediaUrl("http://supplier.example/a.jpg"), /protocol/);
  assert.throws(() => validateMediaUrl("https://localhost/a.jpg"), /not public/);
  assert.throws(() => validateMediaUrl("https://user:pass@example.com/a.jpg"), /credentials/);
  assert.throws(() => validateMediaUrl("https://example.com:8443/a.jpg"), /default HTTPS port/);
});

test("private, loopback, link-local and metadata IPs are rejected", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.1.2",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ]) {
    assert.equal(isPublicIpAddress(address), false, address);
  }
  assert.equal(isPublicIpAddress("93.184.216.34"), true);
  assert.equal(isPublicIpAddress("2606:2800:220:1:248:1893:25c8:1946"), true);
});

test("streaming limit aborts a response even without Content-Length", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(Uint8Array.from([1, 2, 3, 4, 5]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    })) as typeof fetch;
  try {
    await assert.rejects(
      fetchMedia("https://supplier.example/large.jpg", {
        maxFileMb: 4 / 1024 / 1024,
        resolveHost: async () => ["93.184.216.34"],
      }),
      /exceeds max size/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("redirect targets are revalidated before the next fetch", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/metadata" },
    })) as typeof fetch;
  try {
    await assert.rejects(
      fetchMedia("https://supplier.example/start.jpg", {
        resolveHost: async () => ["93.184.216.34"],
      }),
      /private or reserved/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
