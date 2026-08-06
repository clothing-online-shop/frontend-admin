import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3002/api/cms";

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<{ onSuccess: () => void; onFailure: (err: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Nếu refresh đang chạy thất bại, request đang chờ ở đây phải bị reject —
      // trước đây chỉ có "resolve" nên khi refresh lỗi, request này treo vĩnh viễn
      // (không bao giờ resolve/reject), UI đứng loading mãi không rõ lý do.
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          onSuccess: () => resolve(apiClient(originalRequest)),
          onFailure: (err) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw error;

      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

      pendingRequests.forEach((p) => p.onSuccess());
      pendingRequests = [];

      return apiClient(originalRequest);
    } catch (refreshError) {
      pendingRequests.forEach((p) => p.onFailure(refreshError));
      pendingRequests = [];
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
