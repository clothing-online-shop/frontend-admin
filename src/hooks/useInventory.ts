import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustStock,
  getInventory,
  getLowStockThreshold,
  getStockHistory,
  importStock,
  updateLowStockThreshold,
} from "@/lib/api/inventory-api";
import type {
  AdjustStockPayload,
  ImportStockPayload,
  ListInventoryParams,
  ListStockHistoryParams,
} from "@/types/inventory-api.types";

const INVENTORY_KEY = "inventory";
// Khớp PRODUCTS_KEY ở hooks/useProducts.ts — nhập/điều chỉnh kho đổi stockQuantity đọc
// được từ cả ProductList (cột "Tồn kho") lẫn ProductForm, thiếu vế này 2 màn đó vẫn hiện
// số cũ tới khi tự F5 (xem cùng pattern ở useCollections.ts useAssignCollectionProducts).
const PRODUCTS_KEY = "products";

export function useInventory(params: ListInventoryParams) {
  return useQuery({
    queryKey: [INVENTORY_KEY, "list", params],
    queryFn: () => getInventory(params),
  });
}

export function useLowStockThreshold() {
  return useQuery({
    queryKey: [INVENTORY_KEY, "settings"],
    queryFn: getLowStockThreshold,
  });
}

export function useUpdateLowStockThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: number) => updateLowStockThreshold(value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] }),
  });
}

export function useImportStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: ImportStockPayload }) =>
      importStock(variantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: AdjustStockPayload }) =>
      adjustStock(variantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useStockHistory(params: ListStockHistoryParams) {
  return useQuery({
    queryKey: [INVENTORY_KEY, "history", params],
    queryFn: () => getStockHistory(params),
  });
}
