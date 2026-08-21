// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/brand.ts.
export const BrandErrorCode = {
  BRAND_NOT_FOUND: 1601,
  BRAND_DELETE_BLOCKED_HAS_PRODUCTS: 1602,
} as const;

// BRAND_DELETE_BLOCKED_HAS_PRODUCTS cố ý không map — message BE chèn số sản phẩm động,
// giữ nguyên message gốc.
export const BRAND_ERROR_MESSAGE: Partial<
  Record<(typeof BrandErrorCode)[keyof typeof BrandErrorCode], string>
> = {
  [BrandErrorCode.BRAND_NOT_FOUND]: "Không tìm thấy thương hiệu.",
};
