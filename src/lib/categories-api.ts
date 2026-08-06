import { apiClient } from "@/lib/api-client";
import type { CategoryNode } from "@/lib/shared-types";

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: string | null;
  image?: string | null;
  imagePublicId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface ReorderCategoryItem {
  id: string;
  sortOrder: number;
  parentId?: string | null;
}

export async function getCategoryTree(includeInactive = true): Promise<CategoryNode[]> {
  const { data } = await apiClient.get<CategoryNode[]>("/categories", {
    params: includeInactive ? { includeInactive: true } : undefined,
  });
  return data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryNode> {
  const { data } = await apiClient.post<CategoryNode>("/categories", payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<CategoryNode> {
  const { data } = await apiClient.patch<CategoryNode>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function reorderCategories(items: ReorderCategoryItem[]): Promise<void> {
  await apiClient.patch("/categories/reorder", { items });
}
