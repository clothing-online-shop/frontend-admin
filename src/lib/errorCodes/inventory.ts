// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/inventory.ts.
export const InventoryErrorCode = {
  INVENTORY_EXPORT_EXCEEDS_STOCK: 1301,
  INVENTORY_ADJUSTMENT_NO_CHANGE: 1302,
  INVENTORY_VARIANT_NOT_FOUND: 1303,
} as const;

export const INVENTORY_ERROR_MESSAGE: Partial<
  Record<(typeof InventoryErrorCode)[keyof typeof InventoryErrorCode], string>
> = {
  [InventoryErrorCode.INVENTORY_EXPORT_EXCEEDS_STOCK]:
    "Số lượng xuất vượt quá tồn kho hiện có.",
  [InventoryErrorCode.INVENTORY_ADJUSTMENT_NO_CHANGE]:
    "Số tồn thực tế trùng với hệ thống, không có gì để điều chỉnh.",
  [InventoryErrorCode.INVENTORY_VARIANT_NOT_FOUND]: "Không tìm thấy biến thể sản phẩm.",
};
