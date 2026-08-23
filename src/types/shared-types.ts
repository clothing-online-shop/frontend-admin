// Types replicated locally from the response shapes of backend-cms (xem
// backend-cms/src/modules/{auth,categories,products}). Trước đây các type này nằm ở
// package dùng chung @clothing-shop/shared-types (đã bị xóa khi tách 2 backend độc lập).

// `enum` không dùng được ở đây vì tsconfig bật `erasableSyntaxOnly`.
// Lưu dạng số, khớp backend-cms/src/modules/products/product-status.enum.ts.
export const ProductStatus = {
  DRAFT: 0,
  ACTIVE: 1,
  INACTIVE: 2,
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

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PACKING: "PACKING",
  HANDED_OVER: "HANDED_OVER",
  SHIPPING: "SHIPPING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Customer {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: "CUSTOMER" | "ADMIN";
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerOrderSummary {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

export interface CustomerDetail extends Customer {
  orders: CustomerOrderSummary[];
}

// Dòng dữ liệu cho GET /orders (màn Quản lý đơn hàng, OrderList.tsx) — superset của
// CustomerOrderSummary (thêm paymentMethod + shippingAddress mà API danh sách đơn trả
// về nhưng API chi tiết khách hàng không cần) để không định nghĩa lại 7 field đã trùng.
export interface OrderListItem extends CustomerOrderSummary {
  paymentMethod: string;
  shippingAddress: string;
  customerName: string;
  // Lý do hủy (note của lần đổi trạng thái sang CANCELLED gần nhất) — null nếu đơn chưa
  // từng bị hủy.
  cancelReason: string | null;
  // Số tiền voucher đã giảm (0 nếu đơn không dùng voucher) — không đưa lên
  // CustomerOrderSummary vì GET /customers/:id (nguồn dữ liệu của summary đó) không trả field
  // này.
  discountAmount: number;
  voucherCode: string | null;
}

export interface OrderItemDetail {
  id: string;
  productVariantId: string;
  productName: string;
  variantSku: string;
  size: string;
  color: string;
  thumbnail: string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  // null = hệ thống tự ghi (vd lúc tạo đơn), khác với "chưa có ai đổi trạng thái".
  changedByName: string | null;
  createdAt: string;
}

// Dòng dữ liệu cho GET /orders/:id (màn chi tiết đơn, OrderDetail.tsx) — không kế thừa
// OrderListItem vì shape khác hẳn (không có itemCount, thay bằng items[] đầy đủ).
export interface OrderDetail {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  discountAmount: number;
  voucherCode: string | null;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; fullName: string; email: string; phone: string | null };
  items: OrderItemDetail[];
  statusHistories: OrderStatusHistoryEntry[];
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
  isDelete: boolean;
  sortOrder: number;
  parentId: string | null;
  // Số sản phẩm gán trực tiếp vào danh mục này — không cộng dồn từ danh mục con.
  productCount: number;
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
  isDelete: boolean;
  products: { id: string; name: string; slug: string; thumbnail: string | null }[];
  createdAt: string;
  updatedAt: string;
}

export const BannerStatus = {
  UPCOMING: "UPCOMING",
  RUNNING: "RUNNING",
  ENDED: "ENDED",
} as const;
export type BannerStatus = (typeof BannerStatus)[keyof typeof BannerStatus];

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  imagePublicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
  startDate: string;
  endDate: string;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
}

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

// Chỉ 2 trạng thái — ACTIVE nghĩa là dùng được ngay bây giờ (đang bật + trong thời hạn +
// chưa hết lượt), mọi lý do khác gộp chung INACTIVE (xem deriveVoucherStatus ở backend-cms).
export const VoucherStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type VoucherStatus = (typeof VoucherStatus)[keyof typeof VoucherStatus];

export interface Voucher {
  id: string;
  code: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number;
  startsAt: string;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  status: VoucherStatus;
  createdAt: string;
  updatedAt: string;
}

export const StockMovementType = {
  IMPORT: "IMPORT",
  EXPORT: "EXPORT",
  ADJUSTMENT: "ADJUSTMENT",
  RETURN: "RETURN",
} as const;
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export interface InventoryItem {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  lowStockThreshold: number;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
  variantId: string;
  sku: string;
  size: string;
  color: string;
  productId: string;
  productName: string;
  createdByName: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  thumbnail: string | null;
  thumbnailPublicId: string | null;
  basePrice: number;
  salePrice: number | null;
  brandId: string | null;
  status: ProductStatus;
  categoryId: string;
  isDelete: boolean;
  totalStock: number;
  createdAt: string;
  isFeatured: boolean;
  collections: { id: string; name: string; slug: string }[];
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stockQuantity: number;
  // null = chưa nhập (dữ liệu cũ trước khi có field này, hoặc DB cho phép null) — khớp
  // `weight Int?` ở Prisma schema (backend-cms).
  weight: number | null;
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

// Danh mục hành chính đồng bộ từ GHN (xem trang Cấu hình) — ghnId/ghnCode giữ nguyên mã
// gốc của GHN, không dùng để hiển thị, chỉ để khớp lại khi tạo đơn vận chuyển sau này.
export interface Province {
  id: string;
  ghnId: number;
  name: string;
}

export interface District {
  id: string;
  ghnId: number;
  provinceId: string;
  name: string;
}

export interface Ward {
  id: string;
  ghnCode: string;
  districtId: string;
  name: string;
}

export interface SyncLocationsResult {
  provinces: number;
  districts: number;
  wards: number;
}
