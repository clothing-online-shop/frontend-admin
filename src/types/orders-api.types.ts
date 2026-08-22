import type { OrderStatus } from "@/types/shared-types";

export interface ListOrdersParams {
  status?: OrderStatus;
  paymentMethod?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
