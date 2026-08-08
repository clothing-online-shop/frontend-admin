// Types replicated locally from the response shapes of backend-cms (xem
// backend-cms/src/modules/{auth,categories,products}). Trước đây các type này nằm ở
// package dùng chung @clothing-shop/shared-types (đã bị xóa khi tách 2 backend độc lập).

// `enum` không dùng được ở đây vì tsconfig bật `erasableSyntaxOnly`.
export const ProductStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: CategoryNode[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  origin: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CollectionStatus = {
  UPCOMING: "UPCOMING",
  RUNNING: "RUNNING",
  ENDED: "ENDED",
} as const;
export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

export interface Collection {
  id: string;
  name: string;
  slug: string;
  banner: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  status: CollectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  thumbnailPublicId: string | null;
  basePrice: number;
  salePrice: number | null;
  brandId: string | null;
  status: ProductStatus;
  categoryId: string;
  totalStock: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  material: string | null;
  careInstructions: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: string[];
  imagePublicIds: string[];
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string } | null;
  variants: ProductVariant[];
  reviews: ProductReview[];
  relatedProducts: ProductListItem[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
