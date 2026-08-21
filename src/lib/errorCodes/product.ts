// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/product.ts.
export const ProductErrorCode = {
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
} as const;

// PRODUCT_VARIANT_NOT_FOUND, PRODUCT_VARIANT_DELETE_BLOCKED_IN_USE, PRODUCT_VARIANT_DUPLICATE
// cố ý không map — message BE chèn id/sku/size/màu động, giữ nguyên message gốc.
// PRODUCT_COLLECTION_ENDED cố ý không map — BE dùng chung 1 code cho 2 message khác nhau
// tùy hành động (gán vs gỡ), map cứng 1 câu sẽ sai ngữ cảnh cho trường hợp còn lại.
export const PRODUCT_ERROR_MESSAGE: Partial<
  Record<(typeof ProductErrorCode)[keyof typeof ProductErrorCode], string>
> = {
  [ProductErrorCode.PRODUCT_NOT_FOUND]: "Không tìm thấy sản phẩm.",
  [ProductErrorCode.PRODUCT_CATEGORY_ID_REQUIRED]: "Vui lòng chọn danh mục cho sản phẩm.",
  [ProductErrorCode.PRODUCT_NOT_IN_COLLECTION]: "Sản phẩm không thuộc bộ sưu tập này.",
  [ProductErrorCode.PRODUCT_COLLECTION_NOT_FOUND]:
    "Có bộ sưu tập không tồn tại trong danh sách gán.",
  [ProductErrorCode.PRODUCT_CATEGORY_NOT_FOUND]: "Danh mục không tồn tại.",
  [ProductErrorCode.PRODUCT_SALE_PRICE_INVALID]: "Giá khuyến mãi phải nhỏ hơn giá gốc.",
  [ProductErrorCode.PRODUCT_FEATURED_BLOCKED_NOT_ACTIVE]:
    "Chỉ có thể gắn cờ nổi bật cho sản phẩm đang mở bán.",
};
