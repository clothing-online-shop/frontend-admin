import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromoBar,
  deletePromoBar,
  getPromoBars,
  reorderPromoBars,
  updatePromoBar,
} from "@/lib/api/promo-bars-api";
import type {
  CreatePromoBarPayload,
  ListPromoBarsQuery,
  ReorderPromoBarItem,
  UpdatePromoBarPayload,
} from "@/types/promo-bars-api.types";

const PROMO_BARS_KEY = ["promo-bars"];

export function usePromoBars(query: ListPromoBarsQuery = {}) {
  const { search, page, limit } = query;
  return useQuery({
    queryKey: [...PROMO_BARS_KEY, search, page, limit],
    queryFn: () => getPromoBars(query),
  });
}

export function useCreatePromoBar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromoBarPayload) => createPromoBar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_BARS_KEY }),
  });
}

export function useUpdatePromoBar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePromoBarPayload }) =>
      updatePromoBar(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_BARS_KEY }),
  });
}

export function useDeletePromoBar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromoBar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_BARS_KEY }),
  });
}

export function useReorderPromoBars() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderPromoBarItem[]) => reorderPromoBars(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_BARS_KEY }),
  });
}
