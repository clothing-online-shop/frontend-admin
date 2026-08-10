import { isAxiosError } from "axios";
import { ERROR_CODE_MESSAGE, type ErrorCode } from "@/lib/errorCodes";

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Ưu tiên message FE tự kiểm soát theo `code` (ổn định, không phụ thuộc BE đổi chữ) —
    // chỉ áp dụng khi code có mặt trong ERROR_CODE_MESSAGE, các code chưa map (hoặc lỗi
    // không có code, vd lỗi tự động của class-validator) fallback về message thô từ BE.
    const code = error.response?.data?.code;
    const mappedMessage =
      typeof code === "number" ? ERROR_CODE_MESSAGE[code as ErrorCode] : undefined;
    if (mappedMessage) return mappedMessage;

    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại";
}
