import type { DiscountType, VoucherStatus } from "@/types/shared-types";

export interface CreateVoucherPayload {
  code: string;
  imageUrl?: string;
  // Cloudinary publicId song song với imageUrl — không hiển thị lên UI, chỉ để BE dọn ảnh
  // cũ trên Cloudinary khi thay/xóa ảnh.
  imagePublicId?: string;
  discountType: DiscountType;
  discountValue: number;
  // Chỉ áp dụng khi discountType=PERCENTAGE — BE từ chối nếu gửi kèm FIXED_AMOUNT.
  maxDiscountAmount?: number;
  minOrderValue?: number;
  startsAt: string;
  // Bỏ trống = dùng mãi mãi, không hết hạn.
  expiresAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
}

// Không có `code` — BE không cho sửa mã sau khi tạo (xem UpdateVoucherDto ở backend-cms).
export type UpdateVoucherPayload = Partial<
  Omit<CreateVoucherPayload, "code" | "imageUrl" | "imagePublicId">
> & {
  // Bỏ trống cả 2 = giữ ảnh hiện có; gửi null = gỡ ảnh; gửi mới thì phải kèm cả 2.
  imageUrl?: string | null;
  imagePublicId?: string | null;
};

export interface ListVouchersQuery {
  search?: string;
  status?: VoucherStatus;
  discountType?: DiscountType;
  page?: number;
  limit?: number;
}
