export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: string | null;
  image?: string;
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
