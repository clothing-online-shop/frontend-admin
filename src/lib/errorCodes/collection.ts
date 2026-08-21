// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/collection.ts.
export const CollectionErrorCode = {
  COLLECTION_DELETE_BLOCKED_RUNNING: 1101,
  COLLECTION_START_DATE_IN_PAST: 1102,
  COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING: 1103,
  COLLECTION_UPDATE_BLOCKED_ENDED: 1104,
  COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED: 1105,
  // Dùng chung cho cả gán qua collections.service.ts lẫn products.service.ts — 2 chiều
  // của cùng 1 rule.
  COLLECTION_ASSIGN_BLOCKED_PRODUCT_INACTIVE: 1106,
  COLLECTION_NOT_FOUND: 1107,
  COLLECTION_ASSIGN_PRODUCTS_NOT_FOUND: 1108,
} as const;

export const COLLECTION_ERROR_MESSAGE: Partial<
  Record<(typeof CollectionErrorCode)[keyof typeof CollectionErrorCode], string>
> = {
  [CollectionErrorCode.COLLECTION_DELETE_BLOCKED_RUNNING]:
    "Không thể xóa bộ sưu tập đang diễn ra — đợi kết thúc hoặc sửa lại ngày kết thúc trước khi xóa.",
  [CollectionErrorCode.COLLECTION_START_DATE_IN_PAST]:
    "Ngày bắt đầu không được ở trong quá khứ.",
  [CollectionErrorCode.COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING]:
    "Bộ sưu tập đang diễn ra — không thể đổi tên hoặc ngày bắt đầu, chỉ được sửa banner/mô tả/ngày kết thúc.",
  [CollectionErrorCode.COLLECTION_UPDATE_BLOCKED_ENDED]:
    "Bộ sưu tập đã kết thúc — không thể chỉnh sửa.",
  [CollectionErrorCode.COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED]:
    "Bộ sưu tập đã kết thúc — không thể gán/gỡ sản phẩm.",
  [CollectionErrorCode.COLLECTION_ASSIGN_BLOCKED_PRODUCT_INACTIVE]:
    "Chỉ có thể gán sản phẩm đang mở bán vào bộ sưu tập.",
  [CollectionErrorCode.COLLECTION_NOT_FOUND]: "Không tìm thấy bộ sưu tập.",
  [CollectionErrorCode.COLLECTION_ASSIGN_PRODUCTS_NOT_FOUND]:
    "Có sản phẩm không tồn tại trong danh sách gán.",
};
