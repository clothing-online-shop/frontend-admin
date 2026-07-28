import { isAxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại";
}
