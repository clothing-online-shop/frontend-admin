import { apiClient } from "@/lib/api-client";
import type {
  PaginatedResult,
  ProductDetail,
  ProductListItem,
  ProductStatus,
} from "@/lib/shared-types";

export interface ListProductsAdminParams {
  category?: string;
  search?: string;
  brandId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface ProductVariantPayload {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  material?: string;
  careInstructions?: string;
  brandId?: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number;
  status?: ProductStatus;
  thumbnail?: string;
  images?: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants: ProductVariantPayload[];
}

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, "variants">> & {
  variants?: ProductVariantPayload[];
};

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

export async function updateVariantStock(
  productId: string,
  variantId: string,
  stockQuantity: number,
): Promise<void> {
  await apiClient.patch(`/products/${productId}/variants/${variantId}/stock`, {
    stockQuantity,
  });
}
