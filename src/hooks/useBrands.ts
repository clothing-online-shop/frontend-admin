import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
  type CreateBrandPayload,
  type UpdateBrandPayload,
} from "@/lib/brands-api";

const BRANDS_KEY = ["brands"];

export function useBrands(search?: string) {
  return useQuery({ queryKey: [...BRANDS_KEY, search], queryFn: () => getBrands(search) });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrand(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRANDS_KEY }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrandPayload }) =>
      updateBrand(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRANDS_KEY }),
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRANDS_KEY }),
  });
}
