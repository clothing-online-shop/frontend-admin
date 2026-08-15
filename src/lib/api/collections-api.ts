import { apiClient } from "@/lib/api/api-client";
import type { Collection } from "@/types/shared-types";
import type {
  AssignProductsPayload,
  CreateCollectionPayload,
  GetCollectionsParams,
  UpdateCollectionPayload,
} from "@/types/collections-api.types";

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

export async function assignCollectionProducts(
  collectionId: string,
  payload: AssignProductsPayload,
): Promise<void> {
  await apiClient.put(`/collections/${collectionId}/products`, payload);
}
