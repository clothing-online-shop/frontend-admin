import { apiClient } from "@/lib/api/api-client";
import type { Popup, PaginatedResult } from "@/types/shared-types";
import type {
  CreatePopupPayload,
  ListPopupsQuery,
  ReorderPopupItem,
  UpdatePopupPayload,
} from "@/types/popups-api.types";

export async function getPopups(query: ListPopupsQuery = {}): Promise<PaginatedResult<Popup>> {
  const { data } = await apiClient.get<PaginatedResult<Popup>>("/popups", {
    params: query,
  });
  return data;
}

export async function createPopup(payload: CreatePopupPayload): Promise<Popup> {
  const { data } = await apiClient.post<Popup>("/popups", payload);
  return data;
}

export async function updatePopup(id: string, payload: UpdatePopupPayload): Promise<Popup> {
  const { data } = await apiClient.patch<Popup>(`/popups/${id}`, payload);
  return data;
}

export async function deletePopup(id: string): Promise<void> {
  await apiClient.delete(`/popups/${id}`);
}

export async function reorderPopups(items: ReorderPopupItem[]): Promise<void> {
  await apiClient.patch("/popups/reorder", { items });
}
