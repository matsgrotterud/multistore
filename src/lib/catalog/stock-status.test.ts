import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateProductStockStatus,
  isSellableLiveStock,
  normalizeSupplierStockStatus,
} from "./stock-status";

test("unknown supplier inventory is preserved and never treated as live stock", () => {
  assert.equal(normalizeSupplierStockStatus("UNKNOWN"), "UNKNOWN");
  assert.equal(normalizeSupplierStockStatus("unexpected"), "UNKNOWN");
  assert.equal(aggregateProductStockStatus("UNKNOWN", []), "UNKNOWN");
  assert.equal(isSellableLiveStock("UNKNOWN"), false);
  assert.equal(isSellableLiveStock("PREORDER"), false);
});

test("verified variant stock can establish the aggregate state", () => {
  assert.equal(
    aggregateProductStockStatus("UNKNOWN", ["OUT_OF_STOCK", "IN_STOCK"]),
    "IN_STOCK"
  );
  assert.equal(
    aggregateProductStockStatus("UNKNOWN", ["OUT_OF_STOCK", "OUT_OF_STOCK"]),
    "OUT_OF_STOCK"
  );
});
