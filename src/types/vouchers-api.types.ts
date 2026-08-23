import type { DiscountType, VoucherStatus } from "@/types/shared-types";

export interface CreateVoucherPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  // Chỉ áp dụng khi discountType=PERCENTAGE — BE từ chối nếu gửi kèm FIXED_AMOUNT.
  maxDiscountAmount?: number;
  minOrderValue?: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
}

// Không có `code` — BE không cho sửa mã sau khi tạo (xem UpdateVoucherDto ở backend-cms).
export type UpdateVoucherPayload = Partial<Omit<CreateVoucherPayload, "code">>;

export interface ListVouchersQuery {
  search?: string;
  status?: VoucherStatus;
}
