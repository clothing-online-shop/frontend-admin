export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: string | null;
  image?: string;
  // Cloudinary publicId song song với image — không hiển thị lên UI, chỉ để BE dọn ảnh
  // cũ trên Cloudinary khi thay/xóa ảnh.
  imagePublicId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<Omit<CreateCategoryPayload, "image">> & {
  // Bỏ trống = giữ nguyên ảnh hiện có; gửi null = xoá ảnh.
  image?: string | null;
};

export interface ReorderCategoryItem {
  id: string;
  sortOrder: number;
  parentId?: string | null;
}
