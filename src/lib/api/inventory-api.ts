import { apiClient } from "@/lib/api/api-client";
import type { InventoryItem, PaginatedResult, StockMovement } from "@/types/shared-types";
import type {
  AdjustStockPayload,
  ImportStockPayload,
  ListInventoryParams,
  ListStockHistoryParams,
} from "@/types/inventory-api.types";

export async function getInventory(
  params: ListInventoryParams = {},
): Promise<PaginatedResult<InventoryItem>> {
  const { data } = await apiClient.get<PaginatedResult<InventoryItem>>("/inventory", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}

export async function getLowStockThreshold(): Promise<number> {
  const { data } = await apiClient.get<{ lowStockThreshold: number }>("/inventory/settings");
  return data.lowStockThreshold;
}

export async function updateLowStockThreshold(lowStockThreshold: number): Promise<number> {
  const { data } = await apiClient.put<{ lowStockThreshold: number }>("/inventory/settings", {
    lowStockThreshold,
  });
  return data.lowStockThreshold;
}

export async function importStock(
  variantId: string,
  payload: ImportStockPayload,
): Promise<{ stockQuantity: number }> {
  const { data } = await apiClient.post<{ stockQuantity: number }>(
    `/inventory/variants/${variantId}/import`,
    payload,
  );
  return data;
}

export async function adjustStock(
  variantId: string,
  payload: AdjustStockPayload,
): Promise<{ stockQuantity: number }> {
  const { data } = await apiClient.post<{ stockQuantity: number }>(
    `/inventory/variants/${variantId}/adjust`,
    payload,
  );
  return data;
}

export async function getStockHistory(
  params: ListStockHistoryParams = {},
): Promise<PaginatedResult<StockMovement>> {
  const { data } = await apiClient.get<PaginatedResult<StockMovement>>("/inventory/history", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}
