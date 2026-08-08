import { ProductStatus } from "@/types/shared-types";

// Dùng chung cho badge trạng thái ở ProductList.tsx và dropdown lọc trạng thái ở
// ProductFilterBar.tsx — tách ra 1 chỗ để 2 nơi luôn khớp nhãn/màu.
export const PRODUCT_STATUS_LABEL: Record<
  ProductStatus,
  { label: string; color: "light" | "success" | "error" }
> = {
  [ProductStatus.DRAFT]: { label: "Nháp", color: "light" },
  [ProductStatus.ACTIVE]: { label: "Đang bán", color: "success" },
  [ProductStatus.INACTIVE]: { label: "Ngừng bán", color: "error" },
};
