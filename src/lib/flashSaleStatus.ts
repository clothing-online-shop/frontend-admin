import type { FlashSaleStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái Flash Sale (FlashSaleList, FlashSaleForm) — khớp
// đúng khuôn collectionStatus.ts/bannerStatus.ts (3 trạng thái suy ra theo thời gian).
export const FLASH_SALE_STATUS_LABEL: Record<FlashSaleStatus, string> = {
  UPCOMING: "Chưa diễn ra",
  RUNNING: "Đang diễn ra",
  ENDED: "Đã kết thúc",
};

export const FLASH_SALE_STATUS_COLOR: Record<FlashSaleStatus, "info" | "success" | "light"> = {
  UPCOMING: "info",
  RUNNING: "success",
  ENDED: "light",
};
