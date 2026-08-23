import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVoucher,
  deleteVoucher,
  getVouchers,
  toggleVoucherActive,
  updateVoucher,
} from "@/lib/api/vouchers-api";
import type {
  CreateVoucherPayload,
  ListVouchersQuery,
  UpdateVoucherPayload,
} from "@/types/vouchers-api.types";

const VOUCHERS_KEY = ["vouchers"];

export function useVouchers(query: ListVouchersQuery) {
  return useQuery({
    queryKey: [...VOUCHERS_KEY, query],
    queryFn: () => getVouchers(query),
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVoucherPayload) => createVoucher(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY }),
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVoucherPayload }) =>
      updateVoucher(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY }),
  });
}

export function useToggleVoucherActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleVoucherActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY }),
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVoucher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY }),
  });
}
