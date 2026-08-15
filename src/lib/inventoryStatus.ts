import type { StockMovementType } from "@/types/shared-types";

// Dùng chung cho badge loại giao dịch ở InventoryHistory.tsx — tách ra 1 chỗ để nhãn/màu
// luôn khớp, cùng cách PRODUCT_STATUS_LABEL (lib/productStatus.ts) đang làm.
export const STOCK_MOVEMENT_TYPE_LABEL: Record<
  StockMovementType,
  { label: string; color: "success" | "warning" | "info" | "light" }
> = {
  IMPORT: { label: "Nhập kho", color: "success" },
  EXPORT: { label: "Xuất kho", color: "warning" },
  ADJUSTMENT: { label: "Điều chỉnh", color: "info" },
  RETURN: { label: "Trả hàng", color: "light" },
};

// Ngưỡng lấy từ config động (GET /inventory/settings), không hardcode — xem
// InventoryList.tsx truyền lowStockThreshold theo từng dòng (BE đã đính kèm sẵn trong
// response GET /inventory).
export function getStockLevelBadge(
  stockQuantity: number,
  lowStockThreshold: number,
): { label: string; color: "error" | "warning" | "success" } {
  if (stockQuantity === 0) return { label: "Hết hàng", color: "error" };
  if (stockQuantity <= lowStockThreshold) return { label: "Sắp hết", color: "warning" };
  return { label: "Còn hàng", color: "success" };
}
