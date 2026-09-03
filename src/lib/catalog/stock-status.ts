import type { StockStatus } from "@/lib/types";

export function normalizeSupplierStockStatus(value: string): StockStatus {
  return ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER"].includes(value)
    ? (value as StockStatus)
    : "UNKNOWN";
}

export function aggregateProductStockStatus(
  candidateStatus: string,
  variantStatuses: Array<string | null | undefined>
): StockStatus {
  if (variantStatuses.length === 0) {
    return normalizeSupplierStockStatus(candidateStatus);
  }
  const normalized = variantStatuses.map((status) =>
    normalizeSupplierStockStatus(status ?? "UNKNOWN")
  );
  if (normalized.some((status) => status === "IN_STOCK")) return "IN_STOCK";
  if (normalized.some((status) => status === "LOW_STOCK")) return "LOW_STOCK";
  if (normalized.some((status) => status === "PREORDER")) return "PREORDER";
  if (normalized.every((status) => status === "OUT_OF_STOCK")) return "OUT_OF_STOCK";
  return normalizeSupplierStockStatus(candidateStatus);
}

export function isSellableLiveStock(value: string): boolean {
  return value === "IN_STOCK" || value === "LOW_STOCK";
}
