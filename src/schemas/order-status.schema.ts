import * as yup from "yup";
import type { OrderStatus } from "@/types/shared-types";

export const updateOrderStatusSchema = yup.object({
  status: yup
    .mixed<OrderStatus>()
    .required("Vui lòng chọn trạng thái mới."),
  note: yup.string().optional(),
});

export type UpdateOrderStatusFormValues = yup.InferType<typeof updateOrderStatusSchema>;
