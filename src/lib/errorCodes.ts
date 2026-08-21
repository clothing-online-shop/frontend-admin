// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes.ts
// (ErrorCode) — 2 repo tách biệt, không share type được, sửa/thêm bên BE thì phải đồng bộ
// lại giá trị ở đây bằng tay.
// `enum` không dùng được ở đây vì tsconfig bật `erasableSyntaxOnly` (xem ProductStatus ở
// types/shared-types.ts) — dùng object `as const` thay thế.
// Common (shared util) 1-99 · Category 1001-1099 · Collection 1101-1199 · Product
// 1201-1299 · Inventory 1301-1399 · Auth 1401-1499 · Banner 1501-1599 · Brand 1601-1699 ·
// Location 1701-1799 · Upload 1901-1999 · User 2001-2099
export const ErrorCode = {
  // Common (1-99)
  COMMON_IMAGE_PUBLIC_ID_MISMATCH: 1,
  COMMON_IMAGES_COUNT_MISMATCH: 2,
  COMMON_DATE_RANGE_INVALID: 3,

  // Category (1001-1099)
  CATEGORY_NAME_DUPLICATE: 1001,
  // 1002 (CATEGORY_NAME_MATCHES_ANCESTOR) cố ý bỏ trống — BE chưa từng có validation "tên
  // trùng tên tổ tiên", đây là tính năng chưa xây (không phải thiếu gán code).
  CATEGORY_DELETE_BLOCKED_HAS_CHILDREN: 1003,
  CATEGORY_SELF_PARENT: 1004,
  CATEGORY_REORDER_CYCLE: 1005,
  CATEGORY_MAX_DEPTH_EXCEEDED: 1006,
  CATEGORY_ANCESTOR_AS_PARENT: 1007,
  CATEGORY_NOT_FOUND: 1008,
  CATEGORY_DELETE_BLOCKED_HAS_PRODUCTS: 1009,

  // Collection (1101-1199)
  COLLECTION_DELETE_BLOCKED_RUNNING: 1101,
  COLLECTION_START_DATE_IN_PAST: 1102,
  COLLECTION_UPDATE_FIELD_BLOCKED_RUNNING: 1103,
  COLLECTION_UPDATE_BLOCKED_ENDED: 1104,
  COLLECTION_ASSIGN_PRODUCTS_BLOCKED_ENDED: 1105,
  COLLECTION_ASSIGN_BLOCKED_PRODUCT_INACTIVE: 1106,
  COLLECTION_NOT_FOUND: 1107,
  COLLECTION_ASSIGN_PRODUCTS_NOT_FOUND: 1108,

  // Product (1201-1299)
  PRODUCT_NOT_FOUND: 1201,
  PRODUCT_CATEGORY_ID_REQUIRED: 1202,
  PRODUCT_NOT_IN_COLLECTION: 1204,
  PRODUCT_VARIANT_NOT_FOUND: 1205,
  PRODUCT_VARIANT_DELETE_BLOCKED_IN_USE: 1206,
  PRODUCT_COLLECTION_NOT_FOUND: 1207,
  PRODUCT_CATEGORY_NOT_FOUND: 1208,
  PRODUCT_SALE_PRICE_INVALID: 1209,
  PRODUCT_VARIANT_DUPLICATE: 1210,
  PRODUCT_COLLECTION_ENDED: 1212,
  PRODUCT_FEATURED_BLOCKED_NOT_ACTIVE: 1213,

  // Inventory (1301-1399)
  INVENTORY_EXPORT_EXCEEDS_STOCK: 1301,
  INVENTORY_ADJUSTMENT_NO_CHANGE: 1302,
  INVENTORY_VARIANT_NOT_FOUND: 1303,

  // Auth (1401-1499)
  AUTH_INVALID_CREDENTIALS: 1401,
  AUTH_NOT_ADMIN: 1402,
  AUTH_ACCOUNT_DISABLED: 1403,
  AUTH_REFRESH_TOKEN_INVALID: 1404,
  AUTH_REFRESH_USER_NOT_FOUND: 1405,
  AUTH_SESSION_EXPIRED: 1406,
  AUTH_FORBIDDEN_ROLE: 1407,

  // Banner (1501-1599)
  BANNER_REORDER_NOT_FOUND: 1501,
  BANNER_NOT_FOUND: 1502,

  // Brand (1601-1699)
  BRAND_NOT_FOUND: 1601,
  BRAND_DELETE_BLOCKED_HAS_PRODUCTS: 1602,

  // Location (1701-1799)
  LOCATION_PROVINCE_NOT_FOUND: 1701,
  LOCATION_DISTRICT_NOT_FOUND: 1702,

  // Upload (1901-1999)
  UPLOAD_INVALID_PUBLIC_ID: 1901,
  UPLOAD_IMAGE_FILE_REQUIRED: 1902,
  UPLOAD_VIDEO_FILE_REQUIRED: 1903,
  UPLOAD_IMAGE_INVALID_TYPE: 1904,
  UPLOAD_VIDEO_INVALID_TYPE: 1905,

  // User (2001-2099)
  USER_CUSTOMER_NOT_FOUND: 2001,
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Message FE tự kiểm soát theo từng code, dùng trong getErrorMessage() (lib/error.ts) —
// chỉ map code có message BE cố định (không chèn giá trị động như id/sku/size/màu/số
// lượng). Code nào BE trả kèm chi tiết động hữu ích (ví dụ đúng SKU đang bị chặn xóa, đúng
// size/màu bị trùng, đúng số sản phẩm còn lại) hoặc code dùng chung cho 2 message khác
// nhau tùy hành động (PRODUCT_COLLECTION_ENDED: gán vs gỡ; AUTH_REFRESH_TOKEN_INVALID: hết
// hạn vs đã thu hồi) thì CỐ Ý bỏ qua ở đây, để getErrorMessage() fallback dùng thẳng message
// từ BE thay vì mất thông tin hoặc hiển thị sai ngữ cảnh.
export const ERROR_CODE_MESSAGE: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.COMMON_IMAGES_COUNT_MISMATCH]:
    "images và imagePublicIds phải có cùng số lượng phần tử.",
  [ErrorCode.COMMON_DATE_RANGE_INVALID]: "Ngày kết thúc phải sau ngày bắt đầu.",
  [ErrorCode.CATEGORY_NAME_DUPLICATE]: "Đã tồn tại danh mục cùng tên trong cùng danh mục cha.",
  [ErrorCode.CATEGORY_DELETE_BLOCKED_HAS_CHILDREN]:
    "Không thể xóa danh mục vì còn danh mục con bên trong.",
  [ErrorCode.CATEGORY_SELF_PARENT]: "Danh mục không thể là cha của chính nó.",
  [ErrorCode.CATEGORY_REORDER_CYCLE]:
    "Thao tác sắp xếp tạo ra vòng lặp cha-con không hợp lệ.",
  [ErrorCode.CATEGORY_ANCESTOR_AS_PARENT]:
    "Không thể đặt danh mục con làm cha của chính tổ tiên của nó.",
  [ErrorCode.CATEGORY_NOT_FOUND]: "Không tìm thấy danh mục.",
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
  [ErrorCode.COLLECTION_NOT_FOUND]: "Không tìm thấy bộ sưu tập.",
  [ErrorCode.COLLECTION_ASSIGN_PRODUCTS_NOT_FOUND]:
    "Có sản phẩm không tồn tại trong danh sách gán.",
  [ErrorCode.PRODUCT_NOT_FOUND]: "Không tìm thấy sản phẩm.",
  [ErrorCode.PRODUCT_CATEGORY_ID_REQUIRED]: "Vui lòng chọn danh mục cho sản phẩm.",
  [ErrorCode.PRODUCT_NOT_IN_COLLECTION]: "Sản phẩm không thuộc bộ sưu tập này.",
  [ErrorCode.PRODUCT_COLLECTION_NOT_FOUND]: "Có bộ sưu tập không tồn tại trong danh sách gán.",
  [ErrorCode.PRODUCT_CATEGORY_NOT_FOUND]: "Danh mục không tồn tại.",
  [ErrorCode.PRODUCT_SALE_PRICE_INVALID]: "Giá khuyến mãi phải nhỏ hơn giá gốc.",
  [ErrorCode.PRODUCT_FEATURED_BLOCKED_NOT_ACTIVE]:
    "Chỉ có thể gắn cờ nổi bật cho sản phẩm đang mở bán.",
  [ErrorCode.INVENTORY_EXPORT_EXCEEDS_STOCK]: "Số lượng xuất vượt quá tồn kho hiện có.",
  [ErrorCode.INVENTORY_ADJUSTMENT_NO_CHANGE]:
    "Số tồn thực tế trùng với hệ thống, không có gì để điều chỉnh.",
  [ErrorCode.INVENTORY_VARIANT_NOT_FOUND]: "Không tìm thấy biến thể sản phẩm.",
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Email hoặc mật khẩu không đúng.",
  [ErrorCode.AUTH_NOT_ADMIN]: "Tài khoản không có quyền quản trị.",
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: "Tài khoản đã bị khóa hoặc vô hiệu hóa.",
  [ErrorCode.AUTH_REFRESH_USER_NOT_FOUND]: "Người dùng không tồn tại.",
  [ErrorCode.AUTH_SESSION_EXPIRED]:
    "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.",
  [ErrorCode.AUTH_FORBIDDEN_ROLE]: "Bạn không có quyền thực hiện thao tác này.",
  [ErrorCode.BANNER_REORDER_NOT_FOUND]: "Có banner không tồn tại trong danh sách sắp xếp.",
  [ErrorCode.BANNER_NOT_FOUND]: "Không tìm thấy banner.",
  [ErrorCode.BRAND_NOT_FOUND]: "Không tìm thấy thương hiệu.",
  [ErrorCode.LOCATION_PROVINCE_NOT_FOUND]: "Không tìm thấy tỉnh/thành phố.",
  [ErrorCode.LOCATION_DISTRICT_NOT_FOUND]: "Không tìm thấy quận/huyện.",
  [ErrorCode.UPLOAD_INVALID_PUBLIC_ID]: "publicId không hợp lệ.",
  [ErrorCode.UPLOAD_IMAGE_FILE_REQUIRED]: "Vui lòng chọn file ảnh để upload.",
  [ErrorCode.UPLOAD_VIDEO_FILE_REQUIRED]: "Vui lòng chọn file video để upload.",
  [ErrorCode.UPLOAD_IMAGE_INVALID_TYPE]: "Chỉ chấp nhận ảnh định dạng .jpg, .jpeg, .png, .webp.",
  [ErrorCode.UPLOAD_VIDEO_INVALID_TYPE]: "Chỉ chấp nhận video định dạng .mp4, .webm.",
  [ErrorCode.USER_CUSTOMER_NOT_FOUND]: "Không tìm thấy khách hàng.",
};
