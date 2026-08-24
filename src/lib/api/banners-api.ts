import { apiClient } from "@/lib/api/api-client";
import type { Banner, PaginatedResult } from "@/types/shared-types";
import type {
  CreateBannerPayload,
  ListBannersQuery,
  ReorderBannerItem,
  UpdateBannerPayload,
} from "@/types/banners-api.types";

export async function getBanners(
  query: ListBannersQuery = {},
): Promise<PaginatedResult<Banner>> {
  const { data } = await apiClient.get<PaginatedResult<Banner>>("/banners", {
    params: query,
  });
  return data;
}

export async function createBanner(payload: CreateBannerPayload): Promise<Banner> {
  const { data } = await apiClient.post<Banner>("/banners", payload);
  return data;
}

export async function updateBanner(id: string, payload: UpdateBannerPayload): Promise<Banner> {
  const { data } = await apiClient.patch<Banner>(`/banners/${id}`, payload);
  return data;
}

export async function deleteBanner(id: string): Promise<void> {
  await apiClient.delete(`/banners/${id}`);
}

export async function reorderBanners(items: ReorderBannerItem[]): Promise<void> {
  await apiClient.patch("/banners/reorder", { items });
}
