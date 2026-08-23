import { DiscountType } from "@/types/shared-types";

// Dùng chung giữa cột "Loại giảm" + dropdown lọc ở VoucherList.tsx và Select ở
// VoucherForm.tsx — tách ra đây để không lặp lại (trước đó chỉ khai inline trong form).
export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: "Giảm theo %",
  [DiscountType.FIXED_AMOUNT]: "Giảm số tiền cố định",
};

export const DISCOUNT_TYPE_OPTIONS = Object.entries(DISCOUNT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);
