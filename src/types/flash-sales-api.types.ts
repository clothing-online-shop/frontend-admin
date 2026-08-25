import type { FlashSaleStatus } from "@/types/shared-types";

export interface FlashSaleItemInput {
  productVariantId: string;
  salePrice: number;
  quantityLimit: number;
}

export interface CreateFlashSalePayload {
  name: string;
  startDate: string;
  endDate: string;
  items: FlashSaleItemInput[];
}

// Thay thế TOÀN BỘ danh sách items nếu gửi kèm `items` — không phải merge (khớp
// UpdateFlashSaleDto ở backend-cms). BE chặn đổi name/startDate/items khi đang RUNNING (chỉ
// cho sửa endDate), FE tự khoá field tương ứng ở form (xem Task 7), payload vẫn khai đủ kiểu
// optional để TypeScript không ép phải gửi field bị khoá.
export type UpdateFlashSalePayload = Partial<CreateFlashSalePayload>;

export interface ListFlashSalesParams {
  search?: string;
  status?: FlashSaleStatus;
  page?: number;
  limit?: number;
}

export interface UpdateSoldCountPayload {
  soldCount: number;
}
