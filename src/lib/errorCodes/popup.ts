// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/popup.ts.
export const PopupErrorCode = {
  POPUP_REORDER_NOT_FOUND: 2301,
  POPUP_NOT_FOUND: 2302,
  POPUP_START_DATE_IN_PAST: 2303,
} as const;

export const POPUP_ERROR_MESSAGE: Partial<
  Record<(typeof PopupErrorCode)[keyof typeof PopupErrorCode], string>
> = {
  [PopupErrorCode.POPUP_REORDER_NOT_FOUND]: "Có popup không tồn tại trong danh sách sắp xếp.",
  [PopupErrorCode.POPUP_NOT_FOUND]: "Không tìm thấy popup.",
  [PopupErrorCode.POPUP_START_DATE_IN_PAST]: "Ngày bắt đầu không được ở trong quá khứ.",
};
