import { apiClient } from "@/lib/api/api-client";
import type { Color } from "@/types/shared-types";
import type { CreateColorPayload, UpdateColorPayload } from "@/types/colors-api.types";

export async function getColors(search?: string): Promise<Color[]> {
  const { data } = await apiClient.get<Color[]>("/colors", {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function createColor(payload: CreateColorPayload): Promise<Color> {
  const { data } = await apiClient.post<Color>("/colors", payload);
  return data;
}

export async function updateColor(id: string, payload: UpdateColorPayload): Promise<Color> {
  const { data } = await apiClient.patch<Color>(`/colors/${id}`, payload);
  return data;
}

export async function deleteColor(id: string): Promise<void> {
  await apiClient.delete(`/colors/${id}`);
}
