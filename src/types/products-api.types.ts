import type { ProductStatus } from "@/types/shared-types";

export interface ListProductsAdminParams {
  category?: string;
  search?: string;
  brandId?: string;
  status?: ProductStatus;
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
  imageUrl?: string;
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
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "variants" | "brandId" | "salePrice">
> & {
  variants?: ProductVariantPayload[];
  // Bỏ trống = giữ nguyên thương hiệu hiện có; gửi null = gỡ thương hiệu khỏi sản phẩm.
  brandId?: string | null;
  // Bỏ trống = giữ nguyên giá khuyến mãi hiện có; gửi null = xóa giá khuyến mãi.
  salePrice?: number | null;
};
