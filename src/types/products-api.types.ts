import type { ProductStatus } from "@/types/shared-types";

export interface ListProductsAdminParams {
  category?: string;
  // Lọc theo nhiều danh mục cùng lúc (cây checkbox 3 trạng thái ở ProductFilterBar đã tự
  // gộp phẳng id mọi cấp) — id cách nhau bởi dấu phẩy, khớp convention collectionIds/
  // size/color. Có giá trị thì BE ưu tiên dùng, bỏ qua `category`.
  categoryIds?: string;
  search?: string;
  brandId?: string;
  // Có thể truyền nhiều id cách nhau bởi dấu phẩy — khớp convention size/color ở BE.
  collectionIds?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
  // Chỉ dùng nội bộ để nạp lại sản phẩm ĐANG gán cho 1 bộ sưu tập (kể cả sản phẩm đã bị
  // xóa mềm) — không dùng cho màn danh sách/chọn sản phẩm thông thường (xem AssignProductsModal.tsx).
  includeDeleted?: boolean;
}

export interface ProductVariantPayload {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  // Bỏ trống field này = giữ nguyên ảnh hiện có; gửi null = gỡ ảnh khỏi biến thể.
  imageUrl?: string | null;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  description?: string;
  material?: string;
  careInstructions?: string;
  brandId?: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number;
  status?: ProductStatus;
  thumbnail?: string;
  // Cloudinary publicId song song với thumbnail/images — không hiển thị lên UI, chỉ để
  // BE dọn ảnh cũ trên Cloudinary khi thay/xóa ảnh.
  thumbnailPublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants: ProductVariantPayload[];
  // Gán ngay lúc tạo — sửa sản phẩm thì đi qua AssignCollectionsPayload/API riêng
  // (xem UpdateProductPayload bên dưới omit field này).
  collectionIds?: string[];
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "variants" | "brandId" | "salePrice" | "collectionIds">
> & {
  variants?: ProductVariantPayload[];
  // Bỏ trống = giữ nguyên thương hiệu hiện có; gửi null = gỡ thương hiệu khỏi sản phẩm.
  brandId?: string | null;
  // Bỏ trống = giữ nguyên giá khuyến mãi hiện có; gửi null = xóa giá khuyến mãi.
  salePrice?: number | null;
};

// Thay thế TOÀN BỘ danh sách bộ sưu tập của sản phẩm — dùng cho PUT /products/:id/collections.
export interface AssignCollectionsPayload {
  collectionIds: string[];
}
