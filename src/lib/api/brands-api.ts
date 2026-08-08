import { apiClient } from "@/lib/api/api-client";
import type { Brand } from "@/types/shared-types";
import type { CreateBrandPayload, UpdateBrandPayload } from "@/types/brands-api.types";

export async function getBrands(search?: string): Promise<Brand[]> {
  const { data } = await apiClient.get<Brand[]>("/brands", {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  const { data } = await apiClient.post<Brand>("/brands", payload);
  return data;
}

export async function updateBrand(id: string, payload: UpdateBrandPayload): Promise<Brand> {
  const { data } = await apiClient.patch<Brand>(`/brands/${id}`, payload);
  return data;
}

export async function deleteBrand(id: string): Promise<void> {
  await apiClient.delete(`/brands/${id}`);
}
