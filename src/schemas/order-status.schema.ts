import * as yup from "yup";

// noteRequired truyền từ ngoài vào (không phải field trong chính form này — trạng thái
// đích đã cố định theo nút bấm ở OrderDetail.tsx, ORDER_STATUS_ACTION[targetStatus] quyết
// định có bắt buộc lý do hay không, ví dụ Hủy đơn) nên tạo schema động qua factory thay vì
// dùng .when() trên 1 field khác trong cùng form.
export function buildUpdateOrderStatusSchema(noteRequired: boolean) {
  return yup.object({
    // transform trim trước khi required() — không thì 1 chuỗi toàn khoảng trắng vẫn coi là
    // "đã nhập" ở validate client (non-empty string), trong khi BE tự trim rồi mới check
    // (xem `!dto.note?.trim()` ở orders.service.ts), khiến form pass nhưng round-trip 400.
    note: noteRequired
      ? yup
          .string()
          .transform((value: string) => value?.trim())
          .required("Vui lòng nhập lý do.")
      : yup.string().optional(),
  });
}

export type UpdateOrderStatusFormValues = { note?: string };
