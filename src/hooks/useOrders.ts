import { useQuery } from "@tanstack/react-query";
import { getOrdersAdmin } from "@/lib/api/orders-api";
import type { ListOrdersParams } from "@/types/orders-api.types";

const ORDERS_KEY = "orders";

export function useOrdersAdmin(params: ListOrdersParams) {
  return useQuery({
    queryKey: [ORDERS_KEY, "list", params],
    queryFn: () => getOrdersAdmin(params),
  });
}
