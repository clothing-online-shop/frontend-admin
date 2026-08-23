import type { VoucherStatus } from "@/types/shared-types";

// Dùng chung cho badge trạng thái + dropdown lọc ở VoucherList.tsx, cùng shape { label,
// color } như bannerStatus.ts/productStatus.ts. Chỉ 2 giá trị theo yêu cầu — chi tiết lý do
// INACTIVE (chưa tới ngày/hết hạn/hết lượt/tắt tay) xem ở các cột riêng, không cần badge
// phân biệt từng lý do.
export const VOUCHER_STATUS_LABEL: Record<
  VoucherStatus,
  { label: string; color: "success" | "light" }
> = {
  ACTIVE: { label: "Đang hoạt động", color: "success" },
  INACTIVE: { label: "Không hoạt động", color: "light" },
};
