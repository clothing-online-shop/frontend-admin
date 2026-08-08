import type { CollectionStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái bộ sưu tập (CollectionList, bước "Bộ sưu tập"
// ở ProductForm...) — tách ra đây để không lặp lại 2 nơi.
export const COLLECTION_STATUS_LABEL: Record<CollectionStatus, string> = {
  UPCOMING: "Chưa diễn ra",
  RUNNING: "Đang chạy",
  ENDED: "Đã kết thúc",
};

export const COLLECTION_STATUS_COLOR: Record<CollectionStatus, "info" | "success" | "light"> = {
  UPCOMING: "info",
  RUNNING: "success",
  ENDED: "light",
};
