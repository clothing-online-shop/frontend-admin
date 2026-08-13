import type { BannerStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái banner — tách ra đây để không lặp lại.
export const BANNER_STATUS_LABEL: Record<BannerStatus, string> = {
  UPCOMING: "Chưa diễn ra",
  RUNNING: "Đang chạy",
  ENDED: "Đã kết thúc",
};

export const BANNER_STATUS_COLOR: Record<BannerStatus, "info" | "success" | "light"> = {
  UPCOMING: "info",
  RUNNING: "success",
  ENDED: "light",
};
