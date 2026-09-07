export interface CreatePopupPayload {
  eyebrow?: string;
  title: string;
  description?: string;
  discountCode?: string;
  imageUrl: string;
  // Cloudinary publicId song song với imageUrl — không hiển thị lên UI, chỉ để BE dọn ảnh
  // cũ trên Cloudinary khi thay/xóa ảnh.
  imagePublicId: string;
  ctaLabel: string;
  ctaLinkUrl: string;
  sortOrder?: number;
  startDate: string;
  endDate: string;
}

export type UpdatePopupPayload = Partial<
  Omit<CreatePopupPayload, "imageUrl" | "imagePublicId">
> & {
  // Bỏ trống cả 2 = giữ ảnh hiện có; nếu gửi phải gửi kèm cả 2 (ảnh không thể xóa về rỗng).
  imageUrl?: string;
  imagePublicId?: string;
};

export interface ReorderPopupItem {
  id: string;
  sortOrder: number;
}

export interface ListPopupsQuery {
  search?: string;
  page?: number;
  limit?: number;
}
