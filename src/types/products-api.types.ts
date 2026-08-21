import type { ProductStatus } from "@/types/shared-types";

// Khớp PRODUCT_SORT_VALUES ở BE (list-products-query.dto.ts) — best_selling tính theo
// tổng số lượng bán 30 ngày gần nhất (chỉ đơn COMPLETED), không phải field cố định trên
// sản phẩm nên không lưu trong ProductListItem, chỉ dùng để truyền tham số sort.
export type ProductSort = "newest" | "price_asc" | "price_desc" | "best_selling";

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
  isFeatured?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface ProductVariantPayload {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  // Khối lượng (gram) — BE bắt buộc khi thêm biến thể mới (không có id), tùy chọn khi sửa
  // biến thể đã có (xem product-variant.dto.ts bên backend-cms).
  weight?: number;
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
  isFeatured?: boolean;
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
