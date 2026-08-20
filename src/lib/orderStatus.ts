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
