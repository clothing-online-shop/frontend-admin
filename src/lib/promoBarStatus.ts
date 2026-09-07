import type { PromoBarStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái thanh khuyến mãi — cùng shape với
// bannerStatus.ts/inventoryStatus.ts (1 map duy nhất, không tách 2 map song song).
export const PROMO_BAR_STATUS_LABEL: Record<
  PromoBarStatus,
  { label: string; color: "info" | "success" | "light" }
> = {
  UPCOMING: { label: "Chưa diễn ra", color: "info" },
  RUNNING: { label: "Đang chạy", color: "success" },
  ENDED: { label: "Đã kết thúc", color: "light" },
};
