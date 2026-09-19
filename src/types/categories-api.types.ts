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
  // Chỉ có tác dụng với danh mục cấp 2/3 — hiện danh mục này trong mục "Hàng mới về"/
  // "Sale corner" ở mega menu của danh mục gốc chứa nó.
  showInNewArrivals?: boolean;
  showInSaleCorner?: boolean;
  // 2 ảnh "look" bookend 2 đầu mega menu — chỉ có tác dụng với danh mục GỐC (parentId null).
  // Chỉ để xem, không điều hướng.
  megaMenuLeftImageUrl?: string;
  megaMenuLeftImagePublicId?: string | null;
  megaMenuRightImageUrl?: string;
  megaMenuRightImagePublicId?: string | null;
  // Ảnh nền banner ở đầu trang danh mục trên website — áp dụng cho mọi cấp danh mục.
  bannerImageUrl?: string;
  bannerImagePublicId?: string | null;
}

export type UpdateCategoryPayload = Partial<
  Omit<
    CreateCategoryPayload,
    "image" | "megaMenuLeftImageUrl" | "megaMenuRightImageUrl" | "bannerImageUrl"
  >
> & {
  // Bỏ trống = giữ nguyên ảnh hiện có; gửi null = xoá ảnh.
  image?: string | null;
  megaMenuLeftImageUrl?: string | null;
  megaMenuRightImageUrl?: string | null;
  bannerImageUrl?: string | null;
};

export interface ReorderCategoryItem {
  id: string;
  sortOrder: number;
  parentId?: string | null;
}
