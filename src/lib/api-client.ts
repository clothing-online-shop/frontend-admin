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
let pendingRequests: Array<() => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push(() => resolve(apiClient(originalRequest)));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw error;

      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

      pendingRequests.forEach((run) => run());
      pendingRequests = [];

      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
