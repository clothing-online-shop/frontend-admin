// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes.ts
// (ErrorCode) — 2 repo tách biệt, không share type được, sửa/thêm bên BE thì phải đồng bộ
// lại giá trị ở đây bằng tay.
// `enum` không dùng được ở đây vì tsconfig bật `erasableSyntaxOnly` (xem ProductStatus ở
// types/shared-types.ts) — dùng object `as const` thay thế.
export const ErrorCode = {
  // Category (1001-1099)
  CATEGORY_NAME_DUPLICATE: 1001,
  // 1002 (CATEGORY_NAME_MATCHES_ANCESTOR) cố ý bỏ trống — BE chưa từng có validation "tên
  // trùng tên tổ tiên", đây là tính năng chưa xây (không phải thiếu gán code). Trước đây FE
  // tự định nghĩa code này dù BE không bao giờ trả, đã bỏ.
  CATEGORY_DELETE_BLOCKED_HAS_CHILDREN: 1003,
  CATEGORY_SELF_PARENT: 1004,
  CATEGORY_REORDER_CYCLE: 1005,
  CATEGORY_MAX_DEPTH_EXCEEDED: 1006,
  CATEGORY_ANCESTOR_AS_PARENT: 1007,

  // Collection (1101-1199)
  COLLECTION_DELETE_BLOCKED_RUNNING: 1101,
  COLLECTION_START_DATE_IN_PAST: 1102,
  COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING: 1103,
  COLLECTION_UPDATE_BLOCKED_ENDED: 1104,
  COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED: 1105,
  COLLECTION_ASSIGN_BLOCKED_PRODUCT_INACTIVE: 1106,

  // Product (1201-1299)
  PRODUCT_NOT_IN_COLLECTION: 1204,
  PRODUCT_SALE_PRICE_INVALID: 1209,
  PRODUCT_COLLECTION_ENDED: 1212,

  // Inventory (1301-1399)
  INVENTORY_EXPORT_EXCEEDS_STOCK: 1301,
  INVENTORY_ADJUSTMENT_NO_CHANGE: 1302,

  // Auth (1401-1499)
  AUTH_INVALID_CREDENTIALS: 1401,
  AUTH_NOT_ADMIN: 1402,
  AUTH_ACCOUNT_DISABLED: 1403,
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Message FE tự kiểm soát theo từng code, dùng trong getErrorMessage() (lib/error.ts) —
// chỉ map code có message BE cố định (không chèn giá trị động như id/sku/size/màu). Code
// nào BE trả kèm chi tiết động hữu ích cho admin thì CỐ Ý bỏ qua ở đây, để getErrorMessage()
// fallback dùng thẳng message chi tiết từ BE thay vì mất thông tin hữu ích đó (ví dụ: xóa
// danh mục còn N sản phẩm, xóa biến thể đang dùng SKU nào, biến thể trùng size/màu nào —
// các trường hợp này BE không gán code, chỉ trả message).
export const ERROR_CODE_MESSAGE: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CATEGORY_NAME_DUPLICATE]: "Đã tồn tại danh mục cùng tên trong cùng danh mục cha.",
  [ErrorCode.CATEGORY_DELETE_BLOCKED_HAS_CHILDREN]:
    "Không thể xóa danh mục vì còn danh mục con bên trong.",
  [ErrorCode.CATEGORY_SELF_PARENT]: "Danh mục không thể là cha của chính nó.",
  [ErrorCode.CATEGORY_REORDER_CYCLE]:
    "Thao tác sắp xếp tạo ra vòng lặp cha-con không hợp lệ.",
  [ErrorCode.CATEGORY_ANCESTOR_AS_PARENT]:
    "Không thể đặt danh mục con làm cha của chính tổ tiên của nó.",
  [ErrorCode.COLLECTION_DELETE_BLOCKED_RUNNING]:
    "Không thể xóa bộ sưu tập đang diễn ra — đợi kết thúc hoặc sửa lại ngày kết thúc trước khi xóa.",
  [ErrorCode.COLLECTION_START_DATE_IN_PAST]: "Ngày bắt đầu không được ở trong quá khứ.",
  [ErrorCode.COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING]:
    "Bộ sưu tập đang diễn ra — không thể đổi tên hoặc ngày bắt đầu, chỉ được sửa banner/mô tả/ngày kết thúc.",
  [ErrorCode.COLLECTION_UPDATE_BLOCKED_ENDED]: "Bộ sưu tập đã kết thúc — không thể chỉnh sửa.",
  [ErrorCode.COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED]:
    "Bộ sưu tập đã kết thúc — không thể gán/gỡ sản phẩm.",
  [ErrorCode.COLLECTION_ASSIGN_BLOCKED_PRODUCT_INACTIVE]:
    "Chỉ có thể gán sản phẩm đang mở bán vào bộ sưu tập.",
  [ErrorCode.PRODUCT_NOT_IN_COLLECTION]: "Sản phẩm không thuộc bộ sưu tập này.",
  [ErrorCode.PRODUCT_SALE_PRICE_INVALID]: "Giá khuyến mãi phải nhỏ hơn giá gốc.",
  [ErrorCode.PRODUCT_COLLECTION_ENDED]:
    "Bộ sưu tập đã kết thúc — không thể gán/gỡ sản phẩm khỏi bộ sưu tập đã kết thúc.",
  [ErrorCode.INVENTORY_EXPORT_EXCEEDS_STOCK]: "Số lượng xuất vượt quá tồn kho hiện có.",
  [ErrorCode.INVENTORY_ADJUSTMENT_NO_CHANGE]:
    "Số tồn thực tế trùng với hệ thống, không có gì để điều chỉnh.",
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Email hoặc mật khẩu không đúng.",
  [ErrorCode.AUTH_NOT_ADMIN]: "Tài khoản không có quyền quản trị.",
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: "Tài khoản đã bị khóa hoặc vô hiệu hóa.",
};
