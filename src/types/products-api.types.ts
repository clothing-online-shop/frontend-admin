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
  images?: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants: ProductVariantPayload[];
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "variants" | "brandId">
> & {
  variants?: ProductVariantPayload[];
  // Bỏ trống = giữ nguyên thương hiệu hiện có; gửi null = gỡ thương hiệu khỏi sản phẩm.
  brandId?: string | null;
};
