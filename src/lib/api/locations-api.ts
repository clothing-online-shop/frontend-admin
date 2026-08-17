import { apiClient } from "@/lib/api/api-client";
import type { District, Province, SyncLocationsResult, Ward } from "@/types/shared-types";

export async function getProvinces(): Promise<Province[]> {
  const { data } = await apiClient.get<Province[]>("/locations/provinces");
  return data;
}

export async function getDistricts(provinceId: string): Promise<District[]> {
  const { data } = await apiClient.get<District[]>("/locations/districts", {
    params: { provinceId },
  });
  return data;
}

export async function getWards(districtId: string): Promise<Ward[]> {
  const { data } = await apiClient.get<Ward[]>("/locations/wards", {
    params: { districtId },
  });
  return data;
}

// Đồng bộ toàn quốc mất vài phút (BE gọi tuần tự GHN theo từng tỉnh/quận, tôn trọng rate
// limit) — không set timeout riêng, apiClient mặc định không giới hạn (xem api-client.ts).
export async function syncLocations(): Promise<SyncLocationsResult> {
  const { data } = await apiClient.post<SyncLocationsResult>("/locations/sync");
  return data;
}
