import { apiClient } from "@/lib/api/api-client";
import type { Voucher } from "@/types/shared-types";
import type {
  CreateVoucherPayload,
  ListVouchersQuery,
  UpdateVoucherPayload,
} from "@/types/vouchers-api.types";

export async function getVouchers(query: ListVouchersQuery): Promise<Voucher[]> {
  const { data } = await apiClient.get<Voucher[]>("/vouchers", { params: query });
  return data;
}

export async function getVoucher(id: string): Promise<Voucher> {
  const { data } = await apiClient.get<Voucher>(`/vouchers/${id}`);
  return data;
}

export async function createVoucher(payload: CreateVoucherPayload): Promise<Voucher> {
  const { data } = await apiClient.post<Voucher>("/vouchers", payload);
  return data;
}

export async function updateVoucher(id: string, payload: UpdateVoucherPayload): Promise<Voucher> {
  const { data } = await apiClient.patch<Voucher>(`/vouchers/${id}`, payload);
  return data;
}

export async function toggleVoucherActive(id: string): Promise<Voucher> {
  const { data } = await apiClient.patch<Voucher>(`/vouchers/${id}/toggle-active`);
  return data;
}

export async function deleteVoucher(id: string): Promise<void> {
  await apiClient.delete(`/vouchers/${id}`);
}
