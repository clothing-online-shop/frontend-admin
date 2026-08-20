import { apiClient } from "@/lib/api/api-client";
import type { Customer, CustomerDetail, PaginatedResult } from "@/types/shared-types";
import type { ListCustomersParams, UpdateCustomerStatusPayload } from "@/types/customers-api.types";

export async function getCustomers(
  params: ListCustomersParams = {},
): Promise<PaginatedResult<Customer>> {
  const { data } = await apiClient.get<PaginatedResult<Customer>>("/users", {
    params: { ...params, limit: params.limit ?? 20 },
  });
  return data;
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const { data } = await apiClient.get<CustomerDetail>(`/users/${id}`);
  return data;
}

export async function updateCustomerStatus(
  id: string,
  payload: UpdateCustomerStatusPayload,
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/users/${id}/status`, payload);
  return data;
}
