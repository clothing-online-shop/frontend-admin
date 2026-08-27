import { CommonErrorCode, COMMON_ERROR_MESSAGE } from "./common";
import { CategoryErrorCode, CATEGORY_ERROR_MESSAGE } from "./category";
import { CollectionErrorCode, COLLECTION_ERROR_MESSAGE } from "./collection";
import { FlashSaleErrorCode, FLASH_SALE_ERROR_MESSAGE } from "./flash-sale";
import { ProductErrorCode, PRODUCT_ERROR_MESSAGE } from "./product";
import { InventoryErrorCode, INVENTORY_ERROR_MESSAGE } from "./inventory";
import { AuthErrorCode, AUTH_ERROR_MESSAGE } from "./auth";
import { BannerErrorCode, BANNER_ERROR_MESSAGE } from "./banner";
import { BrandErrorCode, BRAND_ERROR_MESSAGE } from "./brand";
import { LocationErrorCode, LOCATION_ERROR_MESSAGE } from "./location";
import { UploadErrorCode, UPLOAD_ERROR_MESSAGE } from "./upload";
import { UserErrorCode, USER_ERROR_MESSAGE } from "./user";

// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/ — 2 repo
// tách biệt, không share type được, sửa/thêm bên BE thì phải đồng bộ lại giá trị ở đây
// bằng tay (từng domain 1 file riêng, xem category.ts/product.ts/auth.ts...).
//
// Thêm code mới cho module nào thì sửa đúng file domain đó, không sửa file này (trừ khi
// thêm hẳn 1 domain mới) — file này chỉ gộp lại thành 1 ErrorCode/ERROR_CODE_MESSAGE duy
// nhất để chỗ khác import gọn, không khai báo trực tiếp code/message nào ở đây.
export const ErrorCode = {
  ...CommonErrorCode,
  ...CategoryErrorCode,
  ...CollectionErrorCode,
  ...FlashSaleErrorCode,
  ...ProductErrorCode,
  ...InventoryErrorCode,
  ...AuthErrorCode,
  ...BannerErrorCode,
  ...BrandErrorCode,
  ...LocationErrorCode,
  ...UploadErrorCode,
  ...UserErrorCode,
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Message FE tự kiểm soát theo từng code, dùng trong getErrorMessage() (lib/error.ts) —
// chỉ map code có message BE cố định. Mỗi domain tự quyết định code nào của mình được map
// (xem comment trong từng file domain để biết code nào cố ý bỏ qua và vì sao).
export const ERROR_CODE_MESSAGE: Partial<Record<ErrorCode, string>> = {
  ...COMMON_ERROR_MESSAGE,
  ...CATEGORY_ERROR_MESSAGE,
  ...COLLECTION_ERROR_MESSAGE,
  ...FLASH_SALE_ERROR_MESSAGE,
  ...PRODUCT_ERROR_MESSAGE,
  ...INVENTORY_ERROR_MESSAGE,
  ...AUTH_ERROR_MESSAGE,
  ...BANNER_ERROR_MESSAGE,
  ...BRAND_ERROR_MESSAGE,
  ...LOCATION_ERROR_MESSAGE,
  ...UPLOAD_ERROR_MESSAGE,
  ...USER_ERROR_MESSAGE,
};
