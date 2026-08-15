export function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

// Chỉ nhóm nghìn (dấu chấm), không kèm ký hiệu tiền tệ — dùng cho input tiền tệ đang gõ dở
// (CurrencyInput.tsx), khác formatPrice() ở trên vốn dùng để hiển thị giá đã chốt.
export function formatThousands(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN");
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("vi-VN");
}
