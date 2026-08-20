import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomer, getCustomers, updateCustomerStatus } from "@/lib/api/customers-api";
import type { ListCustomersParams, UpdateCustomerStatusPayload } from "@/types/customers-api.types";

const CUSTOMERS_KEY = "customers";

export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, "list", params],
    queryFn: () => getCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, "detail", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerStatusPayload }) =>
      updateCustomerStatus(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY, "detail", variables.id] });
    },
  });
}
