import { apiClient } from "@/lib/api/api-client";
import type { OrderListItem, PaginatedResult } from "@/types/shared-types";
import type { ListOrdersParams } from "@/types/orders-api.types";

export async function getOrdersAdmin(
  params: ListOrdersParams = {},
): Promise<PaginatedResult<OrderListItem>> {
  const { data } = await apiClient.get<PaginatedResult<OrderListItem>>("/orders", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}
