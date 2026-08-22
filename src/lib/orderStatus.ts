import type { OrderStatus, PaymentStatus } from "@/types/shared-types";

// Nhãn/màu cho trạng thái đơn hàng + thanh toán — dùng ở lịch sử đơn hàng trong
// CustomerDetail.tsx (module Orders thật ở OrderList.tsx vẫn là stub, dời Sprint 5). Tách
// ra đây ngay từ đầu để Sprint 5 dùng lại được luôn, không phải định nghĩa lại.
export const ORDER_STATUS_LABEL: Record<
  OrderStatus,
  { label: string; color: "success" | "warning" | "error" | "info" | "light" }
> = {
  PENDING: { label: "Chờ xác nhận", color: "warning" },
  CONFIRMED: { label: "Đã xác nhận", color: "info" },
  SHIPPING: { label: "Đang giao", color: "info" },
  COMPLETED: { label: "Hoàn tất", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "light" },
};

export const PAYMENT_STATUS_LABEL: Record<
  PaymentStatus,
  { label: string; color: "success" | "warning" | "error" | "light" }
> = {
  UNPAID: { label: "Chưa thanh toán", color: "warning" },
  PAID: { label: "Đã thanh toán", color: "success" },
  REFUNDED: { label: "Đã hoàn tiền", color: "light" },
  FAILED: { label: "Thất bại", color: "error" },
};

// Khớp enum PaymentProvider (COD/VNPAY/MOMO/STRIPE) — Order.paymentMethod ở BE lưu dạng
// string tự do (không ràng buộc enum khi đọc), nên map lookup theo string, giá trị lạ
// không khớp thì OrderList.tsx tự fallback hiển thị nguyên chuỗi gốc. Nhãn giữ nhất quán
// với paymentMethodLabel() trong email xác nhận đơn (backend-user).
export const PAYMENT_METHOD_LABEL: Record<
  string,
  { label: string; color: "success" | "warning" | "error" | "info" | "light" }
> = {
  COD: { label: "Thanh toán khi nhận hàng (COD)", color: "light" },
  VNPAY: { label: "Chuyển khoản qua VNPay", color: "info" },
  MOMO: { label: "Ví MoMo", color: "warning" },
  STRIPE: { label: "Thẻ quốc tế (Stripe)", color: "success" },
};

// Mirror đúng luật chuyển trạng thái ở backend-cms (ORDER_STATUS_TRANSITIONS trong
// orders.service.ts) — chỉ để quyết định nút thao tác nào hiện ra trên OrderDetail.tsx,
// không thay thế validate thật: BE vẫn là nguồn chặn cuối cùng (trả 400 nếu FE lỡ gửi 1
// giá trị không hợp lệ do 2 bên lệch nhau).
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

// Nhãn cho nút thao tác + dialog xác nhận theo TỪNG TRẠNG THÁI ĐÍCH (không phải trạng thái
// hiện tại) — OrderDetail.tsx tự suy ra "bước tiếp theo" (status khác CANCELLED trong
// ORDER_STATUS_TRANSITIONS[trạng thái hiện tại]) để hiện nút chính, và "Hủy đơn" nếu
// CANCELLED nằm trong danh sách đó, không cần dropdown chọn tay như trước. CANCELLED bắt
// buộc nhập lý do (noteRequired) — các bước tiến bình thường thì không.
export const ORDER_STATUS_ACTION: Partial<
  Record<OrderStatus, { buttonLabel: string; confirmTitle: string; noteRequired?: boolean }>
> = {
  CONFIRMED: { buttonLabel: "Xác nhận đơn", confirmTitle: "Xác nhận đơn hàng" },
  SHIPPING: { buttonLabel: "Bắt đầu giao", confirmTitle: "Bắt đầu giao hàng" },
  COMPLETED: { buttonLabel: "Hoàn tất đơn", confirmTitle: "Hoàn tất đơn hàng" },
  CANCELLED: { buttonLabel: "Hủy đơn", confirmTitle: "Hủy đơn hàng", noteRequired: true },
};
