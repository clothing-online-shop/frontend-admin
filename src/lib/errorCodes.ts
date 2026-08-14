// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes.ts
// (ErrorCode) — 2 repo tách biệt, không share type được, sửa/thêm bên BE thì phải đồng bộ
// lại giá trị ở đây bằng tay.
// `enum` không dùng được ở đây vì tsconfig bật `erasableSyntaxOnly` (xem ProductStatus ở
// types/shared-types.ts) — dùng object `as const` thay thế.
export const ErrorCode = {
  // Category (1001–1099)
  CATEGORY_NAME_DUPLICATE: 1001,
  CATEGORY_NAME_MATCHES_ANCESTOR: 1002,

  // Collection (1101–1199)
  COLLECTION_DELETE_BLOCKED_RUNNING: 1101,
  COLLECTION_START_DATE_IN_PAST: 1102,
  COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING: 1103,
  COLLECTION_UPDATE_BLOCKED_ENDED: 1104,
  COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED: 1105,

  // Product (1201–1299)
  PRODUCT_NOT_FOUND: 1201,
  PRODUCT_CATEGORY_ID_REQUIRED: 1202,
  PRODUCT_DELETE_BLOCKED_VARIANT_IN_USE: 1203,
  PRODUCT_NOT_IN_COLLECTION: 1204,
  PRODUCT_VARIANT_NOT_FOUND: 1205,
  PRODUCT_VARIANT_DELETE_BLOCKED_IN_USE: 1206,
  PRODUCT_COLLECTION_NOT_FOUND: 1207,
  PRODUCT_CATEGORY_NOT_FOUND: 1208,
  PRODUCT_SALE_PRICE_INVALID: 1209,
  PRODUCT_VARIANT_DUPLICATE: 1210,
  PRODUCT_IMAGES_MISALIGNED: 1211,
  PRODUCT_COLLECTION_ENDED: 1212,

  // Inventory (1301–1399)
  INVENTORY_EXPORT_EXCEEDS_STOCK: 1301,
  INVENTORY_ADJUSTMENT_NO_CHANGE: 1302,
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Message FE tự kiểm soát theo từng code, dùng trong getErrorMessage() (lib/error.ts) —
// chỉ map code có message BE cố định (không chèn giá trị động như id/sku/size/màu). Code
// nào BE trả kèm chi tiết động hữu ích cho admin (VD PRODUCT_VARIANT_DUPLICATE có đúng
// size/màu bị trùng, PRODUCT_VARIANT_DELETE_BLOCKED_IN_USE có đúng SKU) thì CỐ Ý bỏ qua ở
// đây, để getErrorMessage() fallback dùng thẳng message chi tiết từ BE thay vì mất thông
// tin hữu ích đó.
export const ERROR_CODE_MESSAGE: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CATEGORY_NAME_DUPLICATE]: "Đã tồn tại danh mục cùng tên trong cùng danh mục cha.",
  [ErrorCode.CATEGORY_NAME_MATCHES_ANCESTOR]:
    "Tên danh mục không được trùng với danh mục cha (hoặc tổ tiên) của nó.",
  [ErrorCode.COLLECTION_DELETE_BLOCKED_RUNNING]:
    "Không thể xóa bộ sưu tập đang diễn ra — đợi kết thúc hoặc sửa lại ngày kết thúc trước khi xóa.",
  [ErrorCode.COLLECTION_START_DATE_IN_PAST]: "Ngày bắt đầu không được ở trong quá khứ.",
  [ErrorCode.COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING]:
    "Bộ sưu tập đang diễn ra — không thể đổi tên hoặc ngày bắt đầu, chỉ được sửa banner/mô tả/ngày kết thúc.",
  [ErrorCode.COLLECTION_UPDATE_BLOCKED_ENDED]: "Bộ sưu tập đã kết thúc — không thể chỉnh sửa.",
  [ErrorCode.COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED]:
    "Bộ sưu tập đã kết thúc — không thể gán/gỡ sản phẩm.",
  [ErrorCode.PRODUCT_NOT_FOUND]: "Không tìm thấy sản phẩm.",
  [ErrorCode.PRODUCT_CATEGORY_ID_REQUIRED]: "Vui lòng chọn danh mục cho sản phẩm.",
  [ErrorCode.PRODUCT_DELETE_BLOCKED_VARIANT_IN_USE]:
    "Không thể xóa sản phẩm vì đã có biến thể được dùng trong đơn hàng/giỏ hàng.",
  [ErrorCode.PRODUCT_NOT_IN_COLLECTION]: "Sản phẩm không thuộc bộ sưu tập này.",
  [ErrorCode.PRODUCT_VARIANT_NOT_FOUND]: "Không tìm thấy biến thể sản phẩm.",
  [ErrorCode.PRODUCT_COLLECTION_NOT_FOUND]: "Có bộ sưu tập không tồn tại trong danh sách gán.",
  [ErrorCode.PRODUCT_CATEGORY_NOT_FOUND]: "Danh mục không tồn tại.",
  [ErrorCode.PRODUCT_SALE_PRICE_INVALID]: "Giá khuyến mãi phải nhỏ hơn giá gốc.",
  [ErrorCode.PRODUCT_IMAGES_MISALIGNED]: "Ảnh sản phẩm bị lỗi đồng bộ, vui lòng tải lại ảnh.",
  [ErrorCode.PRODUCT_COLLECTION_ENDED]:
    "Có bộ sưu tập đã kết thúc trong danh sách gán — không thể gán sản phẩm vào bộ sưu tập đã kết thúc.",
  [ErrorCode.INVENTORY_EXPORT_EXCEEDS_STOCK]: "Số lượng xuất vượt quá tồn kho hiện có.",
  [ErrorCode.INVENTORY_ADJUSTMENT_NO_CHANGE]:
    "Số tồn thực tế trùng với hệ thống, không có gì để điều chỉnh.",
};
