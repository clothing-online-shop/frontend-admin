import * as yup from "yup";

// noteRequired truyền từ ngoài vào (không phải field trong chính form này — trạng thái
// đích đã cố định theo nút bấm ở OrderDetail.tsx, ORDER_STATUS_ACTION[targetStatus] quyết
// định có bắt buộc lý do hay không, ví dụ Hủy đơn) nên tạo schema động qua factory thay vì
// dùng .when() trên 1 field khác trong cùng form.
export function buildUpdateOrderStatusSchema(noteRequired: boolean) {
  return yup.object({
    note: noteRequired
      ? yup.string().required("Vui lòng nhập lý do.")
      : yup.string().optional(),
  });
}

export type UpdateOrderStatusFormValues = { note?: string };
