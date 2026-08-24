import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBanner,
  deleteBanner,
  getBanners,
  reorderBanners,
  updateBanner,
} from "@/lib/api/banners-api";
import type {
  CreateBannerPayload,
  ListBannersQuery,
  ReorderBannerItem,
  UpdateBannerPayload,
} from "@/types/banners-api.types";

const BANNERS_KEY = ["banners"];

export function useBanners(query: ListBannersQuery = {}) {
  const { search, page, limit } = query;
  return useQuery({
    queryKey: [...BANNERS_KEY, search, page, limit],
    queryFn: () => getBanners(query),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBannerPayload) => createBanner(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANNERS_KEY }),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBannerPayload }) =>
      updateBanner(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANNERS_KEY }),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANNERS_KEY }),
  });
}

export function useReorderBanners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderBannerItem[]) => reorderBanners(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANNERS_KEY }),
  });
}
