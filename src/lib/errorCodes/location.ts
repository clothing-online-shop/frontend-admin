// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/location.ts.
export const LocationErrorCode = {
  LOCATION_PROVINCE_NOT_FOUND: 1701,
  LOCATION_DISTRICT_NOT_FOUND: 1702,
} as const;

export const LOCATION_ERROR_MESSAGE: Partial<
  Record<(typeof LocationErrorCode)[keyof typeof LocationErrorCode], string>
> = {
  [LocationErrorCode.LOCATION_PROVINCE_NOT_FOUND]: "Không tìm thấy tỉnh/thành phố.",
  [LocationErrorCode.LOCATION_DISTRICT_NOT_FOUND]: "Không tìm thấy quận/huyện.",
};
