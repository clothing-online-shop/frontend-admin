import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBrand, deleteBrand, getBrands, updateBrand } from "@/lib/api/brands-api";
import type { CreateBrandPayload, UpdateBrandPayload } from "@/types/brands-api.types";

const BRANDS_KEY = ["brands"];

export function useBrands(search?: string) {
  return useQuery({ queryKey: [...BRANDS_KEY, search], queryFn: () => getBrands(search) });
}

// Map id -> tên, dùng để hiển thị tên thương hiệu trong bảng (ProductList.tsx,
// AssignProductsModal.tsx) — tách ra dùng chung, tránh lặp lại cùng 1 đoạn xây map.
export function useBrandNameMap(): Map<string, string> {
  const { data: brands } = useBrands();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const brand of brands ?? []) map.set(brand.id, brand.name);
    return map;
  }, [brands]);
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
