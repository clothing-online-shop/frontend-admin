import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColor, deleteColor, getColors, updateColor } from "@/lib/api/colors-api";
import type { CreateColorPayload, UpdateColorPayload } from "@/types/colors-api.types";

const COLORS_KEY = ["colors"];

export function useColors(search?: string) {
  return useQuery({ queryKey: [...COLORS_KEY, search], queryFn: () => getColors(search) });
}

// Map tên -> hex, dùng để hiển thị swatch màu ở nơi chỉ có tên màu sẵn (vd bảng biến thể
// trong ProductList.tsx/InventoryList.tsx) — tách ra dùng chung, tránh lặp lại cùng 1 đoạn
// xây map, khớp cách useBrandNameMap() đang làm cho thương hiệu.
export function useColorHexMap(): Map<string, string> {
  const { data: colors } = useColors();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const color of colors ?? []) map.set(color.name, color.hexCode);
    return map;
  }, [colors]);
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateColorPayload) => createColor(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLORS_KEY }),
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateColorPayload }) =>
      updateColor(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLORS_KEY }),
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteColor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLORS_KEY }),
  });
}
