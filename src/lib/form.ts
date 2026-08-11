// Chỉ hiện lỗi validate khi field đã đổi khác giá trị mặc định (dirty — người dùng đã
// gõ/chọn rồi, kể cả khi sau đó xoá trắng lại) hoặc form đã bấm Lưu ít nhất 1 lần
// (isSubmitted) — tránh form nhiều field bắt buộc (vd ProductForm) đỏ lừ ngay lúc vừa mở
// dù chưa ai đụng vào gì, chỉ báo đúng lúc user thực sự cần biết. Dùng dirty (không phải
// touched) vì áp dụng đồng nhất được cho mọi loại field kể cả field không có blur tự
// nhiên (RichTextEditor, ImageUploader) — RHF tự tính dirty theo mọi cách đổi giá trị
// (register, setValue, Controller onChange), không cần field nào tự wire thêm onBlur.
// isDirty nhận cả dạng mảng vì RHF trả dirtyFields của field mảng (vd thumbnail/images:
// string[]) dưới dạng (boolean | undefined)[] — mảng dù rỗng vẫn không xuất hiện trừ khi
// có phần tử đổi, nên chỉ cần Boolean() là đủ, không cần tự duyệt mảng kiểm tra từng phần tử.
export function visibleFieldError(
  message: string | undefined,
  isDirty: boolean | (boolean | undefined)[] | undefined,
  isSubmitted: boolean,
): string | undefined {
  return Boolean(isDirty) || isSubmitted ? message : undefined;
}
