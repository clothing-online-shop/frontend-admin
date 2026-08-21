// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/banner.ts.
export const BannerErrorCode = {
  BANNER_REORDER_NOT_FOUND: 1501,
  BANNER_NOT_FOUND: 1502,
} as const;

export const BANNER_ERROR_MESSAGE: Partial<
  Record<(typeof BannerErrorCode)[keyof typeof BannerErrorCode], string>
> = {
  [BannerErrorCode.BANNER_REORDER_NOT_FOUND]: "Có banner không tồn tại trong danh sách sắp xếp.",
  [BannerErrorCode.BANNER_NOT_FOUND]: "Không tìm thấy banner.",
};
