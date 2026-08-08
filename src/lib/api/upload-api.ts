import { apiClient } from "@/lib/api/api-client";
import type { UploadResult } from "@/types/upload-api.types";

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<UploadResult>("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteImage(publicId: string): Promise<void> {
  await apiClient.delete(`/upload/image/${encodeURIComponent(publicId)}`);
}
