import { apiClient } from "@/lib/api-client";
import type { Brand } from "@/lib/shared-types";

export interface CreateBrandPayload {
  name: string;
  logo?: string;
  description?: string;
  origin?: string;
}

export type UpdateBrandPayload = Partial<
  Omit<CreateBrandPayload, "logo" | "description" | "origin">
> & {
  // Bỏ trống = giữ nguyên giá trị hiện có; gửi null = xoá.
  logo?: string | null;
  description?: string | null;
  origin?: string | null;
};

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
