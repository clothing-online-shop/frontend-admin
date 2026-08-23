import { PAYMENT_METHOD_LABEL } from "@/lib/orderStatus";
import Badge from "@/components/ui/badge/Badge";

interface PaymentMethodBadgeProps {
  method: string;
}

// PAYMENT_METHOD_LABEL là Record<string, ...> không đầy đủ (chỉ khớp enum PaymentProvider đã
// biết — COD/VNPAY/MOMO/STRIPE/BANK_TRANSFER), giá trị lạ thì fallback hiển thị nguyên chuỗi
// gốc (xem comment ở orderStatus.ts). Tách thành component dùng chung — trước đây OrderList.tsx
// và OrderDetail.tsx mỗi bên tự lặp lại y hệt cặp lookup + fallback này.
export default function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const badge = PAYMENT_METHOD_LABEL[method];
  if (!badge) {
    return <span className="text-sm text-gray-500 dark:text-gray-400">{method}</span>;
  }
  return <Badge color={badge.color}>{badge.label}</Badge>;
}
