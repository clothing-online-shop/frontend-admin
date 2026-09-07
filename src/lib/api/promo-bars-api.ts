import { apiClient } from "@/lib/api/api-client";
import type { PromoBar, PaginatedResult } from "@/types/shared-types";
import type {
  CreatePromoBarPayload,
  ListPromoBarsQuery,
  ReorderPromoBarItem,
  UpdatePromoBarPayload,
} from "@/types/promo-bars-api.types";

export async function getPromoBars(
  query: ListPromoBarsQuery = {},
): Promise<PaginatedResult<PromoBar>> {
  const { data } = await apiClient.get<PaginatedResult<PromoBar>>("/promo-bars", {
    params: query,
  });
  return data;
}

export async function createPromoBar(payload: CreatePromoBarPayload): Promise<PromoBar> {
  const { data } = await apiClient.post<PromoBar>("/promo-bars", payload);
  return data;
}

export async function updatePromoBar(
  id: string,
  payload: UpdatePromoBarPayload,
): Promise<PromoBar> {
  const { data } = await apiClient.patch<PromoBar>(`/promo-bars/${id}`, payload);
  return data;
}

export async function deletePromoBar(id: string): Promise<void> {
  await apiClient.delete(`/promo-bars/${id}`);
}

export async function reorderPromoBars(items: ReorderPromoBarItem[]): Promise<void> {
  await apiClient.patch("/promo-bars/reorder", { items });
}
