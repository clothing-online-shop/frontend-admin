import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResult, ProductDetail, ProductListItem } from "@/types/shared-types";
import type {
  AssignCollectionsPayload,
  CreateProductPayload,
  ListProductsAdminParams,
  UpdateProductPayload,
} from "@/types/products-api.types";

export async function getProductsAdmin(
  params: ListProductsAdminParams = {},
): Promise<PaginatedResult<ProductListItem>> {
  const { data } = await apiClient.get<PaginatedResult<ProductListItem>>("/products", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}

export async function getProductBySlugAdmin(slug: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/products/${slug}`);
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductDetail> {
  const { data } = await apiClient.post<ProductDetail>("/products", payload);
  return data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductDetail> {
  const { data } = await apiClient.patch<ProductDetail>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function assignProductCollections(
  productId: string,
  payload: AssignCollectionsPayload,
): Promise<void> {
  await apiClient.put(`/products/${productId}/collections`, payload);
}

export async function removeProductFromCollection(
  productId: string,
  collectionId: string,
): Promise<void> {
  await apiClient.delete(`/products/${productId}/collections/${collectionId}`);
}
