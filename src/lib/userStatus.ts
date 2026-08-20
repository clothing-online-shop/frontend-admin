import type { UserStatus } from "@/types/shared-types";

// Dùng chung cho badge trạng thái khách hàng ở CustomerList.tsx/CustomerDetail.tsx — tách
// ra 1 chỗ để nhãn/màu luôn khớp, cùng cách PRODUCT_STATUS_LABEL (lib/productStatus.ts)
// đang làm.
export const USER_STATUS_LABEL: Record<
  UserStatus,
  { label: string; color: "success" | "warning" | "error" }
> = {
  ACTIVE: { label: "Đang hoạt động", color: "success" },
  INACTIVE: { label: "Ngừng hoạt động", color: "warning" },
  BANNED: { label: "Đã khóa", color: "error" },
};
