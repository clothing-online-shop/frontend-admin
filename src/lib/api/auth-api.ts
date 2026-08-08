import { apiClient } from "@/lib/api/api-client";
import type { LoginPayload, LoginResponse } from "@/types/shared-types";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}
