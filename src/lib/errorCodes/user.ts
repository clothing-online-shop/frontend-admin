// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/user.ts.
export const UserErrorCode = {
  USER_CUSTOMER_NOT_FOUND: 2001,
} as const;

export const USER_ERROR_MESSAGE: Partial<
  Record<(typeof UserErrorCode)[keyof typeof UserErrorCode], string>
> = {
  [UserErrorCode.USER_CUSTOMER_NOT_FOUND]: "Không tìm thấy khách hàng.",
};
