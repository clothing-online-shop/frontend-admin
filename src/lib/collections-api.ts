import { apiClient } from "@/lib/api/api-client";
import type { Collection } from "@/types/shared-types";

export interface CreateCollectionPayload {
  name: string;
  banner?: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export type UpdateCollectionPayload = Partial<
  Omit<CreateCollectionPayload, "banner" | "description">
> & {
  // Bỏ trống = giữ nguyên giá trị hiện có; gửi null = xoá.
  banner?: string | null;
  description?: string | null;
};

export async function getCollections(search?: string): Promise<Collection[]> {
  const { data } = await apiClient.get<Collection[]>("/collections", {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function createCollection(payload: CreateCollectionPayload): Promise<Collection> {
  const { data } = await apiClient.post<Collection>("/collections", payload);
  return data;
}

export async function updateCollection(
  id: string,
  payload: UpdateCollectionPayload,
): Promise<Collection> {
  const { data } = await apiClient.patch<Collection>(`/collections/${id}`, payload);
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  await apiClient.delete(`/collections/${id}`);
}

// Thay thế TOÀN BỘ danh sách sản phẩm của bộ sưu tập — dùng cho PUT /collections/:id/products.
export interface AssignProductsPayload {
  productIds: string[];
}

export async function assignCollectionProducts(
  collectionId: string,
  payload: AssignProductsPayload,
): Promise<void> {
  await apiClient.put(`/collections/${collectionId}/products`, payload);
}
