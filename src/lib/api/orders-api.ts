import { apiClient } from "@/lib/api/api-client";
import type { OrderDetail, OrderListItem, PaginatedResult } from "@/types/shared-types";
import type { ListOrdersParams, UpdateOrderStatusPayload } from "@/types/orders-api.types";

export async function getOrdersAdmin(
  params: ListOrdersParams = {},
): Promise<PaginatedResult<OrderListItem>> {
  const { data } = await apiClient.get<PaginatedResult<OrderListItem>>("/orders", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}

export async function getOrderDetail(id: string): Promise<OrderDetail> {
  const { data } = await apiClient.get<OrderDetail>(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<OrderDetail> {
  const { data } = await apiClient.patch<OrderDetail>(`/orders/${id}/status`, payload);
  return data;
}

// BE trả về Order thô (không kèm items/statusHistories/customer như OrderDetail) — FE chỉ
// cần biết đã gọi xong để invalidate + refetch lại GET /orders/:id đầy đủ, không dùng
// trực tiếp response này để render nên không cần khai type đầy đủ ở đây.
export async function confirmBankTransfer(id: string): Promise<void> {
  await apiClient.patch(`/orders/${id}/confirm-bank-transfer`);
}
