// Slugify tối giản, chạy client-side để preview live (gõ tên -> thấy slug ngay) —
// không gọi API. Bản chính thức (xử lý trùng lặp trong DB) nằm ở backend-cms
// generateSlug(), đây chỉ cần khớp cách biến đổi ký tự để preview đúng.
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugifyPreview(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
