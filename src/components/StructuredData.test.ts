import assert from "node:assert/strict";
import test from "node:test";
import { serializeStructuredData } from "./StructuredData";

test("JSON-LD serialization cannot break out of its script tag", () => {
  const serialized = serializeStructuredData({
    name: '</script><script>alert("supplier")</script>',
    detail: "A&B > C",
  });

  assert.equal(serialized.includes("</script>"), false);
  assert.equal(serialized.includes("<script>"), false);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /A\\u0026B \\u003e C/);
  assert.deepEqual(JSON.parse(serialized), {
    name: '</script><script>alert("supplier")</script>',
    detail: "A&B > C",
  });
});
