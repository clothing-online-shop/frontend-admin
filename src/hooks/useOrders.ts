import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderDetail, getOrdersAdmin, updateOrderStatus } from "@/lib/api/orders-api";
import type { ListOrdersParams, UpdateOrderStatusPayload } from "@/types/orders-api.types";

const ORDERS_KEY = "orders";

export function useOrdersAdmin(params: ListOrdersParams) {
  return useQuery({
    queryKey: [ORDERS_KEY, "list", params],
    queryFn: () => getOrdersAdmin(params),
  });
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: [ORDERS_KEY, "detail", id],
    queryFn: () => getOrderDetail(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderStatusPayload }) =>
      updateOrderStatus(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}
