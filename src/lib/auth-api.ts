import { apiClient } from "@/lib/api-client";
import type { LoginPayload, LoginResponse } from "@/lib/shared-types";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}
