export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  imageUrl: string;
  // Cloudinary publicId song song với imageUrl — không hiển thị lên UI, chỉ để BE dọn ảnh
  // cũ trên Cloudinary khi thay/xóa ảnh.
  imagePublicId: string;
  linkUrl?: string;
  ctaLabel?: string;
  ctaLinkUrl?: string;
  sortOrder?: number;
  startDate: string;
  endDate: string;
}

export type UpdateBannerPayload = Partial<
  Omit<CreateBannerPayload, "imageUrl" | "imagePublicId" | "linkUrl">
> & {
  // Bỏ trống cả 2 = giữ ảnh hiện có; nếu gửi phải gửi kèm cả 2 (ảnh không thể xóa về rỗng).
  imageUrl?: string;
  imagePublicId?: string;
  // Bỏ trống = giữ nguyên; gửi null = xóa link đích.
  linkUrl?: string | null;
};

export interface ReorderBannerItem {
  id: string;
  sortOrder: number;
}

export interface ListBannersQuery {
  search?: string;
  page?: number;
  limit?: number;
}
