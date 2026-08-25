import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlashSale,
  deleteFlashSale,
  endFlashSaleNow,
  getFlashSale,
  getFlashSales,
  updateFlashSale,
  updateFlashSaleItemSoldCount,
} from "@/lib/api/flash-sales-api";
import type {
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";

const FLASH_SALES_KEY = ["flash-sales"];

export function useFlashSales(params: ListFlashSalesParams) {
  return useQuery({
    queryKey: [...FLASH_SALES_KEY, params],
    queryFn: () => getFlashSales(params),
  });
}

export function useFlashSaleDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...FLASH_SALES_KEY, "detail", id],
    queryFn: () => getFlashSale(id!),
    enabled: Boolean(id),
  });
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFlashSalePayload) => createFlashSale(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useUpdateFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFlashSalePayload }) =>
      updateFlashSale(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useEndFlashSaleNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endFlashSaleNow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useUpdateFlashSaleItemSoldCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      flashSaleId,
      itemId,
      payload,
    }: {
      flashSaleId: string;
      itemId: string;
      payload: UpdateSoldCountPayload;
    }) => updateFlashSaleItemSoldCount(flashSaleId, itemId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useDeleteFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlashSale(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}
