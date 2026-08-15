import type { BannerStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái banner — tách ra đây để không lặp lại. Cùng
// shape { label, color } gộp 1 map như productStatus.ts/inventoryStatus.ts (không tách 2
// map song song) để không thể thêm status mới mà quên cập nhật 1 trong 2 bên.
export const BANNER_STATUS_LABEL: Record<
  BannerStatus,
  { label: string; color: "info" | "success" | "light" }
> = {
  UPCOMING: { label: "Chưa diễn ra", color: "info" },
  RUNNING: { label: "Đang chạy", color: "success" },
  ENDED: { label: "Đã kết thúc", color: "light" },
};
