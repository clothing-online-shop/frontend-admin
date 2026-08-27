import { apiClient } from "@/lib/api/api-client";
import type { FlashSale, PaginatedResult } from "@/types/shared-types";
import type {
  AddFlashSaleItemsPayload,
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";

export async function getFlashSales(
  params: ListFlashSalesParams = {},
): Promise<PaginatedResult<FlashSale>> {
  const { data } = await apiClient.get<PaginatedResult<FlashSale>>("/flash-sales", {
    params,
  });
  return data;
}

export async function getFlashSale(id: string): Promise<FlashSale> {
  const { data } = await apiClient.get<FlashSale>(`/flash-sales/${id}`);
  return data;
}

export async function createFlashSale(payload: CreateFlashSalePayload): Promise<FlashSale> {
  const { data } = await apiClient.post<FlashSale>("/flash-sales", payload);
  return data;
}

export async function updateFlashSale(
  id: string,
  payload: UpdateFlashSalePayload,
): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(`/flash-sales/${id}`, payload);
  return data;
}

export async function endFlashSaleNow(id: string): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(`/flash-sales/${id}/end-now`);
  return data;
}

export async function updateFlashSaleItemSoldCount(
  flashSaleId: string,
  itemId: string,
  payload: UpdateSoldCountPayload,
): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(
    `/flash-sales/${flashSaleId}/items/${itemId}/sold-count`,
    payload,
  );
  return data;
}

export async function deleteFlashSale(id: string): Promise<void> {
  await apiClient.delete(`/flash-sales/${id}`);
}

export async function addFlashSaleItems(
  id: string,
  payload: AddFlashSaleItemsPayload,
): Promise<FlashSale> {
  const { data } = await apiClient.post<FlashSale>(`/flash-sales/${id}/items`, payload);
  return data;
}
