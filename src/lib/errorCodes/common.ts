// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/common.ts —
// dùng chung nhiều module, không thuộc riêng 1 domain.
export const CommonErrorCode = {
  COMMON_IMAGE_PUBLIC_ID_MISMATCH: 1,
  COMMON_IMAGES_COUNT_MISMATCH: 2,
  COMMON_DATE_RANGE_INVALID: 3,
} as const;

// COMMON_IMAGE_PUBLIC_ID_MISMATCH cố ý không map — message BE chèn tên field động
// (image/thumbnail...), giữ nguyên message gốc để không mất thông tin field nào bị thiếu.
export const COMMON_ERROR_MESSAGE: Partial<
  Record<(typeof CommonErrorCode)[keyof typeof CommonErrorCode], string>
> = {
  [CommonErrorCode.COMMON_IMAGES_COUNT_MISMATCH]:
    "images và imagePublicIds phải có cùng số lượng phần tử.",
  [CommonErrorCode.COMMON_DATE_RANGE_INVALID]: "Ngày kết thúc phải sau ngày bắt đầu.",
};
