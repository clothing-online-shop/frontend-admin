// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/promo-bar.ts.
export const PromoBarErrorCode = {
  PROMO_BAR_REORDER_NOT_FOUND: 2501,
  PROMO_BAR_NOT_FOUND: 2502,
  PROMO_BAR_START_DATE_IN_PAST: 2503,
} as const;

export const PROMO_BAR_ERROR_MESSAGE: Partial<
  Record<(typeof PromoBarErrorCode)[keyof typeof PromoBarErrorCode], string>
> = {
  [PromoBarErrorCode.PROMO_BAR_REORDER_NOT_FOUND]:
    "Có thanh khuyến mãi không tồn tại trong danh sách sắp xếp.",
  [PromoBarErrorCode.PROMO_BAR_NOT_FOUND]: "Không tìm thấy thanh khuyến mãi.",
  [PromoBarErrorCode.PROMO_BAR_START_DATE_IN_PAST]: "Ngày bắt đầu không được ở trong quá khứ.",
};
