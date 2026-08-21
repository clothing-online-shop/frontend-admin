// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/auth.ts.
export const AuthErrorCode = {
  AUTH_INVALID_CREDENTIALS: 1401,
  AUTH_NOT_ADMIN: 1402,
  AUTH_ACCOUNT_DISABLED: 1403,
  AUTH_REFRESH_TOKEN_INVALID: 1404,
  AUTH_REFRESH_USER_NOT_FOUND: 1405,
  AUTH_SESSION_EXPIRED: 1406,
  AUTH_FORBIDDEN_ROLE: 1407,
} as const;

// AUTH_REFRESH_TOKEN_INVALID cố ý không map — BE dùng chung 1 code cho 2 message khác nhau
// (verify JWT thất bại / không khớp token đã lưu), map cứng 1 câu sẽ sai ngữ cảnh cho
// trường hợp còn lại.
export const AUTH_ERROR_MESSAGE: Partial<
  Record<(typeof AuthErrorCode)[keyof typeof AuthErrorCode], string>
> = {
  [AuthErrorCode.AUTH_INVALID_CREDENTIALS]: "Email hoặc mật khẩu không đúng.",
  [AuthErrorCode.AUTH_NOT_ADMIN]: "Tài khoản không có quyền quản trị.",
  [AuthErrorCode.AUTH_ACCOUNT_DISABLED]: "Tài khoản đã bị khóa hoặc vô hiệu hóa.",
  [AuthErrorCode.AUTH_REFRESH_USER_NOT_FOUND]: "Người dùng không tồn tại.",
  [AuthErrorCode.AUTH_SESSION_EXPIRED]:
    "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.",
  [AuthErrorCode.AUTH_FORBIDDEN_ROLE]: "Bạn không có quyền thực hiện thao tác này.",
};
