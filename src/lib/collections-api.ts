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

export interface GetCollectionsParams {
  search?: string;
  // Chỉ dùng nội bộ để hiện đúng bộ sưu tập cũ đã xóa (vd màn xem sản phẩm) — không dùng
  // cho dropdown/checkbox chọn bộ sưu tập.
  includeDeleted?: boolean;
  // Chỉ lấy bộ sưu tập chưa diễn ra/đang diễn ra (loại ENDED) — dùng cho nơi CHỌN bộ sưu
  // tập để gán (vd bước "Bộ sưu tập" trong ProductForm).
  excludeEnded?: boolean;
}

export async function getCollections(params: GetCollectionsParams = {}): Promise<Collection[]> {
  const { data } = await apiClient.get<Collection[]>("/collections", {
    params: {
      ...(params.search ? { search: params.search } : {}),
      ...(params.includeDeleted ? { includeDeleted: true } : {}),
      ...(params.excludeEnded ? { excludeEnded: true } : {}),
    },
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
