// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/category.ts.
// 1002 (CATEGORY_NAME_MATCHES_ANCESTOR) cố ý bỏ trống — BE chưa từng có validation "tên
// trùng tên tổ tiên", đây là tính năng chưa xây, không phải thiếu gán code.
export const CategoryErrorCode = {
  CATEGORY_NAME_DUPLICATE: 1001,
  CATEGORY_DELETE_BLOCKED_HAS_CHILDREN: 1003,
  CATEGORY_SELF_PARENT: 1004,
  CATEGORY_REORDER_CYCLE: 1005,
  CATEGORY_MAX_DEPTH_EXCEEDED: 1006,
  CATEGORY_ANCESTOR_AS_PARENT: 1007,
  CATEGORY_NOT_FOUND: 1008,
  CATEGORY_DELETE_BLOCKED_HAS_PRODUCTS: 1009,
} as const;

// CATEGORY_MAX_DEPTH_EXCEEDED, CATEGORY_DELETE_BLOCKED_HAS_PRODUCTS cố ý không map — message
// BE chèn số động (độ sâu tối đa cấu hình được, số sản phẩm còn lại), giữ nguyên message gốc.
export const CATEGORY_ERROR_MESSAGE: Partial<
  Record<(typeof CategoryErrorCode)[keyof typeof CategoryErrorCode], string>
> = {
  [CategoryErrorCode.CATEGORY_NAME_DUPLICATE]:
    "Đã tồn tại danh mục cùng tên trong cùng danh mục cha.",
  [CategoryErrorCode.CATEGORY_DELETE_BLOCKED_HAS_CHILDREN]:
    "Không thể xóa danh mục vì còn danh mục con bên trong.",
  [CategoryErrorCode.CATEGORY_SELF_PARENT]: "Danh mục không thể là cha của chính nó.",
  [CategoryErrorCode.CATEGORY_REORDER_CYCLE]:
    "Thao tác sắp xếp tạo ra vòng lặp cha-con không hợp lệ.",
  [CategoryErrorCode.CATEGORY_ANCESTOR_AS_PARENT]:
    "Không thể đặt danh mục con làm cha của chính tổ tiên của nó.",
  [CategoryErrorCode.CATEGORY_NOT_FOUND]: "Không tìm thấy danh mục.",
};
