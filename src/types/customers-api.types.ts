import type { UserStatus } from "./shared-types";

export interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateCustomerStatusPayload {
  status: UserStatus;
}
