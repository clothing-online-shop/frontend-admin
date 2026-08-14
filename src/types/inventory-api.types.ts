import type { StockMovementType } from "@/types/shared-types";

export interface ListInventoryParams {
  search?: string;
  categoryId?: string;
  brandId?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ImportStockPayload {
  quantity: number;
  note?: string;
}

export type AdjustStockPayload =
  | { type: "EXPORT"; quantity: number; reason: string }
  | { type: "ADJUSTMENT"; actualQuantity: number; reason: string };

export interface ListStockHistoryParams {
  variantId?: string;
  productId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
